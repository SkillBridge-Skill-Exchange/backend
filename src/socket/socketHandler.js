/**
 * Socket.IO Handler
 * =================
 * Real-time events: messaging, typing, presence, voice/video call signaling, read receipts
 */

const jwt = require('jsonwebtoken');
const { User, Conversation, Message } = require('../models');

// In-memory maps
const onlineUsers = new Map();   // userId -> socketId
const activeCalls = new Map();   // callId -> { callerId, receiverId, type, callerName, startTime }

function initializeSocket(io) {
  // JWT auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).lean();
      if (!user) return next(new Error('User not found'));
      socket.userId = user._id.toString();
      socket.userName = user.name;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const uid = socket.userId;
    console.log(`🟢 ${socket.userName} connected (${uid})`);

    // Register online
    onlineUsers.set(uid, socket.id);
    try {
      await User.findByIdAndUpdate(uid, { isOnline: true });
    } catch (e) {}

    // Broadcast online status
    socket.broadcast.emit('user_online', { userId: uid });
    socket.emit('online_users', Array.from(onlineUsers.keys()));

    // ─── MESSAGING LOGIC ───
    socket.on('message_send', async (data, callback) => {
      try {
        const { recipientId, conversationId, content, type = 'text', fileUrl = null, fileName = null, replyTo = null } = data;

        let conversation;
        if (conversationId) {
          conversation = await Conversation.findById(conversationId);
        } else {
          // Fallback legacy checking
          conversation = await Conversation.findOne({
            isGroup: false,
            $or: [
              { user1_id: uid, user2_id: recipientId },
              { user1_id: recipientId, user2_id: uid }
            ]
          });
          if (!conversation) {
            conversation = await Conversation.create({
              user1_id: uid,
              user2_id: recipientId,
              members: [uid, recipientId]
            });
          }
        }

        const message = await Message.create({
          conversation_id: conversation._id,
          sender_id: uid,
          content: content || '',
          type,
          fileUrl,
          fileName,
          replyTo,
          is_read: false,
          readBy: [uid]
        });

        conversation.updatedAt = Date.now();
        await conversation.save();

        const msgData = {
          id: message._id.toString(),
          conversation_id: conversation._id.toString(),
          sender_id: uid,
          senderName: socket.userName,
          content: message.content,
          type: message.type,
          fileUrl: message.fileUrl,
          fileName: message.fileName,
          replyTo: message.replyTo,
          createdAt: message.createdAt,
          is_read: false,
          readBy: [uid]
        };

        // Determine all participants
        const participants = conversation.isGroup 
          ? conversation.members.map(m => (m.user ? m.user.toString() : m.toString())) 
          : [conversation.user1_id?.toString(), conversation.user2_id?.toString()].filter(Boolean);

        // Emit to all online members except sender
        participants.forEach(memberId => {
          if (memberId && memberId !== uid) {
            const recipientSocket = onlineUsers.get(memberId);
            if (recipientSocket) {
              io.to(recipientSocket).emit('message_receive', msgData);
            }
          }
        });

        if (callback) callback({ success: true, data: msgData });
      } catch (err) {
        console.error('message_send error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // ─── READ RECEIPTS ───
    socket.on('mark_as_read', async ({ conversationId, senderId }) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv) return;

        const timeNow = new Date();

        if (conv.isGroup) {
          // Group logic: Add user to readBy for all messages they didn't send
          await Message.updateMany(
            { conversation_id: conversationId, sender_id: { $ne: uid }, readBy: { $ne: uid } },
            { $addToSet: { readBy: uid }, $push: { readInfo: { user: uid, time: timeNow } }, is_read: true }
          );
          
          conv.members.forEach(m => {
            const memberId = m.user ? m.user.toString() : m.toString();
            if (memberId !== uid) {
              const socketId = onlineUsers.get(memberId);
              if (socketId) io.to(socketId).emit('messages_read', { conversationId, readerId: uid, isGroup: true, time: timeNow });
            }
          });
        } else {
          // 1-on-1 logic
          await Message.updateMany(
            { conversation_id: conversationId, sender_id: senderId, is_read: false, readBy: { $ne: uid } },
            { is_read: true, $addToSet: { readBy: uid }, $push: { readInfo: { user: uid, time: timeNow } } }
          );

          const senderSocket = onlineUsers.get(senderId);
          if (senderSocket) {
            io.to(senderSocket).emit('messages_read', { conversationId, readerId: uid, isGroup: false, time: timeNow });
          }
        }
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    });

    // ─── TYPING ───
    socket.on('typing', ({ recipientId, conversationId }) => {
      // Find recipients
      const sendTo = recipientId ? [recipientId] : [];
      // (For advanced group typing you'd fetch conversation ID)
      sendTo.forEach(peer => {
        const peerSocket = onlineUsers.get(peer);
        if (peerSocket) io.to(peerSocket).emit('user_typing', { userId: uid, conversationId });
      });
    });

    socket.on('stop_typing', ({ recipientId, conversationId }) => {
      const sendTo = recipientId ? [recipientId] : [];
      sendTo.forEach(peer => {
        const peerSocket = onlineUsers.get(peer);
        if (peerSocket) io.to(peerSocket).emit('user_stop_typing', { userId: uid, conversationId });
      });
    });

    // ─── PRESENCE ───
    socket.on('get_presence', async ({ userId }, callback) => {
      try {
        const isOnline = onlineUsers.has(userId);
        let lastSeen = null;
        if (!isOnline) {
          const u = await User.findById(userId).select('lastSeen').lean();
          lastSeen = u?.lastSeen || null;
        }
        if (callback) callback({ isOnline, lastSeen });
      } catch (e) {
        if (callback) callback({ isOnline: false, lastSeen: null });
      }
    });

    // ─── CALL SIGNALING & HISTORY (WebRTC) ───
    
    // Helper to log calls to chat
    const logCallHistory = async (callerId, receiverId, callType, callStatus, duration = null, groupId = null) => {
      try {
        let conversation;
        if (groupId) {
          conversation = await Conversation.findById(groupId);
        } else {
          conversation = await Conversation.findOne({
            isGroup: false,
            $or: [
              { user1_id: callerId, user2_id: receiverId },
              { user1_id: receiverId, user2_id: callerId }
            ]
          });
          if (!conversation) {
            conversation = await Conversation.create({ user1_id: callerId, user2_id: receiverId, members: [callerId, receiverId] });
          }
        }

        if (!conversation) return;

        const msg = await Message.create({
          conversation_id: conversation._id,
          sender_id: callerId,
          content: `${callType} call • ${callStatus}`,
          type: 'call',
          callStatus,
          callDuration: duration,
        });

        const msgData = {
          id: msg._id.toString(),
          conversation_id: conversation._id.toString(),
          sender_id: callerId,
          type: 'call',
          callStatus: msg.callStatus,
          callDuration: msg.callDuration,
          createdAt: msg.createdAt,
        };

        // Notify participants
        const participants = conversation.isGroup 
          ? conversation.members.map(m => (m.user ? m.user.toString() : m.toString())) 
          : [callerId, receiverId];

        participants.forEach(memberId => {
          const peerSocket = onlineUsers.get(memberId);
          if (peerSocket) io.to(peerSocket).emit('message_receive', msgData);
        });
      } catch (err) {
        console.error('Call logging error:', err);
      }
    };

    socket.on('call_initiate', async ({ recipientId, callType, offer, isGroup }) => {
      const callId = `${uid}-${recipientId}-${Date.now()}`;
      
      // Safety: Block Check
      const caller = await User.findById(uid);
      if (caller?.blockedUsers?.includes(recipientId)) {
        return socket.emit('call_failed', { callId, reason: 'You have blocked this user' });
      }
      const receiver = await User.findById(recipientId);
      if (!isGroup && receiver && receiver.blockedUsers?.includes(uid)) {
        return socket.emit('call_failed', { callId, reason: 'User unavailable' });
      }

      if (isGroup) {
        const conv = await Conversation.findById(recipientId);
        if (conv && conv.isGroup) {
          activeCalls.set(callId, { 
            callerId: uid, 
            receiverId: recipientId, 
            type: callType, 
            callerName: socket.userName, 
            isGroup: true, 
            members: conv.members.map(m => m.toString()), 
            answeredBy: null 
          });
          
          conv.members.forEach(m => {
            const mStr = m.user ? m.user.toString() : m.toString();
            if (mStr !== uid) {
              const recipientSocket = onlineUsers.get(mStr);
              if (recipientSocket) {
                io.to(recipientSocket).emit('incoming_call', {
                  callId,
                  callerId: uid,
                  callerName: socket.userName + " (Group)",
                  callType,
                  offer
                });
              }
            }
          });
          socket.emit('call_ringing', { callId });
          return;
        }
      }

      activeCalls.set(callId, { callerId: uid, receiverId: recipientId, type: callType, callerName: socket.userName });

      const recipientSocket = onlineUsers.get(recipientId);
      if (recipientSocket) {
        io.to(recipientSocket).emit('incoming_call', {
          callId,
          callerId: uid,
          callerName: socket.userName,
          callType,
          offer
        });
        socket.emit('call_ringing', { callId });
      } else {
        socket.emit('call_failed', { callId, reason: 'User is offline' });
        logCallHistory(uid, recipientId, callType, 'missed');
        activeCalls.delete(callId);
      }
    });

    socket.on('call_accept', ({ callId, callerId, answer }) => {
      const call = activeCalls.get(callId);
      if (call) {
        if (call.isGroup) {
          if (call.answeredBy) {
            // Someone else answered first
            socket.emit('call_failed', { callId, reason: 'Call already answered' });
            return;
          }
          call.answeredBy = uid;
          call.receiverId = uid; // Lock 1-on-1 session to answerer
          
          // Inform other members to stop ringing
          call.members.forEach(mStr => {
            if (mStr !== uid && mStr !== callerId.toString()) {
              const sock = onlineUsers.get(mStr);
              if (sock) io.to(sock).emit('call_ended', { callId, reason: 'Answered by someone else' });
            }
          });
        }

        call.startTime = Date.now(); // Start timer
        activeCalls.set(callId, call);
      }
      
      const callerSocket = onlineUsers.get(callerId);
      if (callerSocket) {
        io.to(callerSocket).emit('call_accepted', { callId, answer, acceptedBy: uid });
      }
    });

    socket.on('call_reject', ({ callId, callerId }) => {
      const call = activeCalls.get(callId);
      if (call) {
        if (call.isGroup) return; // Do not end call for everyone if one person ignores it

        logCallHistory(callerId, uid, call.type, 'declined');
        activeCalls.delete(callId);
      }
      
      const callerSocket = onlineUsers.get(callerId);
      if (callerSocket) {
        io.to(callerSocket).emit('call_rejected', { callId });
      }
    });

    socket.on('call_end', ({ callId, peerId }) => {
      const call = activeCalls.get(callId);
      if (call) {
        if (call.isGroup && !call.answeredBy) {
           // Caller abandoned group blast before anyone answered
           call.members.forEach(mStr => {
             if (mStr !== uid) {
                const sock = onlineUsers.get(mStr);
                if (sock) io.to(sock).emit('call_ended', { callId });
             }
           });
           activeCalls.delete(callId);
           return;
        }

        if (call.startTime) {
          const durationSec = Math.floor((Date.now() - call.startTime) / 1000);
          logCallHistory(call.callerId, call.receiverId, call.type, 'completed', durationSec);
        } else {
          // Ended before answering (Missed)
          logCallHistory(call.callerId, call.receiverId, call.type, 'missed');
        }
        activeCalls.delete(callId);
      }
      
      const peerSocket = onlineUsers.get(peerId);
      if (peerSocket) {
        io.to(peerSocket).emit('call_ended', { callId });
      }
    });

    socket.on('ice_candidate', ({ peerId, candidate }) => {
      const peerSocket = onlineUsers.get(peerId);
      if (peerSocket) io.to(peerSocket).emit('ice_candidate', { candidate, from: uid });
    });

    // ─── FILE SENT NOTIFICATION ───
    socket.on('file_sent', ({ recipientId, messageData }) => {
      const recipientSocket = onlineUsers.get(recipientId);
      if (recipientSocket) {
        io.to(recipientSocket).emit('message_receive', messageData);
      }
    });

    // ─── PIN / UNPIN MESSAGES ───
    socket.on('pin_message', async ({ conversationId, messageId }) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv) return;
        
        // Ensure user is part of the conversation
        if (!conv.isGroup && String(conv.user1_id) !== uid && String(conv.user2_id) !== uid) return;
        if (conv.isGroup && !conv.members.map(String).includes(uid)) return;

        conv.pinnedMessageId = messageId;
        await conv.save();

        const participants = conv.isGroup ? conv.members.map(m => (m.user ? m.user.toString() : m.toString())) : [conv.user1_id?.toString(), conv.user2_id?.toString()].filter(Boolean);
        participants.forEach(memberId => {
          const recipientSocket = onlineUsers.get(memberId);
          if (recipientSocket) {
            io.to(recipientSocket).emit('message_pinned', { conversationId, messageId });
          }
        });
      } catch (err) {
        console.error('Error pinning message:', err);
      }
    });

    socket.on('unpin_message', async ({ conversationId }) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv) return;
        
        conv.pinnedMessageId = null;
        await conv.save();

        const participants = conv.isGroup ? conv.members.map(m => m.toString()) : [conv.user1_id?.toString(), conv.user2_id?.toString()].filter(Boolean);
        participants.forEach(memberId => {
          const recipientSocket = onlineUsers.get(memberId);
          if (recipientSocket) {
            io.to(recipientSocket).emit('message_unpinned', { conversationId });
          }
        });
      } catch (err) {
        console.error('Error unpinning message:', err);
      }
    });

    // ─── STAR / UNSTAR MESSAGES ───
    socket.on('toggle_star_message', async ({ messageId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;

        const isStarred = msg.starredBy.includes(uid);
        if (isStarred) {
          msg.starredBy = msg.starredBy.filter(id => String(id) !== uid);
        } else {
          msg.starredBy.push(uid);
        }
        await msg.save();
        socket.emit('message_starred', { messageId, isStarred: !isStarred });
      } catch (err) {
        console.error('Error starring message:', err);
      }
    });

    // ─── FORWARD MESSAGES ───
    socket.on('forward_messages', async ({ messageIds, targetConversations, targetUsers }) => {
      try {
        const messagesToForward = await Message.find({ _id: { $in: messageIds } });
        if (!messagesToForward.length) return;

        // Ensure targets are resolved to conversations
        let conversationsToForwardTo = [];

        // Add already existing conversations
        if (targetConversations && targetConversations.length > 0) {
           const convs = await Conversation.find({ _id: { $in: targetConversations }});
           conversationsToForwardTo.push(...convs);
        }

        // For target users, get or create 1-on-1 conversations
        if (targetUsers && targetUsers.length > 0) {
           for (const tUserId of targetUsers) {
              let conv = await Conversation.findOne({
                isGroup: false,
                $or: [
                  { user1_id: uid, user2_id: tUserId },
                  { user1_id: tUserId, user2_id: uid }
                ]
              });
              if (!conv) {
                 conv = await Conversation.create({
                    user1_id: uid,
                    user2_id: tUserId,
                    members: [uid, tUserId]
                 });
              }
              conversationsToForwardTo.push(conv);
           }
        }

        // De-duplicate conversations
        const uniqueConvMap = new Map();
        conversationsToForwardTo.forEach(c => uniqueConvMap.set(c._id.toString(), c));
        conversationsToForwardTo = Array.from(uniqueConvMap.values());

        // Forward each message to each conversation
        for (const conv of conversationsToForwardTo) {
          for (const origMsg of messagesToForward) {
             const message = await Message.create({
                conversation_id: conv._id,
                sender_id: uid,
                content: origMsg.content,
                type: origMsg.type,
                fileUrl: origMsg.fileUrl,
                fileName: origMsg.fileName,
                is_read: false,
                readBy: [uid]
             });

             conv.updatedAt = Date.now();
             await conv.save();

             const msgData = {
                id: message._id.toString(),
                conversation_id: conv._id.toString(),
                sender_id: uid,
                senderName: socket.userName,
                content: message.content,
                type: message.type,
                fileUrl: message.fileUrl,
                fileName: message.fileName,
                createdAt: message.createdAt,
                is_read: false,
                readBy: [uid],
                isForwarded: true // Provide hint for UI if needed
             };

             const participants = conv.isGroup 
                ? conv.members.map(m => (m.user ? m.user.toString() : m.toString())) 
                : [conv.user1_id?.toString(), conv.user2_id?.toString()].filter(Boolean);

             participants.forEach(memberId => {
                const recipientSocket = onlineUsers.get(memberId);
                if (recipientSocket) {
                   io.to(recipientSocket).emit('message_receive', msgData);
                }
             });
          }
        }

      } catch (err) {
        console.error('Error forwarding messages:', err);
      }
    });

    // ─── DELETE MESSAGES ───
    socket.on('delete_message', async ({ messageId, type }) => {
      try {
        const msg = await Message.findById(messageId).populate('conversation_id');
        if (!msg) return;

        if (type === 'everyone') {
           // Can only delete for everyone if we are the sender
           if (msg.sender_id.toString() !== uid) return;
           msg.isDeletedForEveryone = true;
           await msg.save();
           
           // Broadcast to all members of the conversation
           const conv = await Conversation.findById(msg.conversation_id);
           if (!conv) return;
           conv.members.forEach(m => {
             const mId = m.user ? m.user.toString() : m.toString();
             const sock = onlineUsers.get(mId);
             if (sock) io.to(sock).emit('message_deleted', { id: messageId, type: 'everyone' });
           });
        } else if (type === 'me') {
           msg.deletedFor.push(uid);
           await msg.save();
           socket.emit('message_deleted', { id: messageId, type: 'me' });
        }
      } catch (err) {
        console.error('Error deleting message:', err);
      }
    });

    // ─── GROUP MANAGEMENT ───
    const isAdmin = (conv, userId) => {
      if (!conv.isGroup) return false;
      const mem = conv.members.find(m => String(m.user?._id || m.user) === String(userId));
      return mem?.role === 'admin';
    };

    const broadcastToGroup = (conv, event, payload, excludeSelf = false) => {
      conv.members.forEach(m => {
        const mid = String(m.user?._id || m.user);
        if (excludeSelf && mid === uid) return;
        const sock = onlineUsers.get(mid);
        if (sock) io.to(sock).emit(event, payload);
      });
    };

    const addSystemMessage = async (convId, content) => {
      const msg = await Message.create({ conversation_id: convId, sender_id: uid, content, type: 'system' });
      const msgData = {
        id: msg._id.toString(), conversation_id: convId.toString(), sender_id: uid,
        senderName: 'System', content, type: 'system', createdAt: msg.createdAt
      };
      return msgData;
    };

    socket.on('group_add_members', async ({ conversationId, memberIds }) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv || !isAdmin(conv, uid)) return;

        const newMembers = memberIds.map(id => ({ user: id, role: 'member' }));
        conv.members.push(...newMembers);
        await conv.save();

        const populated = await Conversation.findById(conversationId).populate('members.user', 'name college isOnline lastSeen');
        const sysMsg = await addSystemMessage(conversationId, `${socket.userName} added new members`);
        
        broadcastToGroup(populated, 'group_updated', { conversation: populated });
        broadcastToGroup(populated, 'message_receive', sysMsg);
      } catch (e) { console.error(e); }
    });

    socket.on('group_remove_member', async ({ conversationId, memberId }) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv || !isAdmin(conv, uid)) return;

        conv.members = conv.members.filter(m => String(m.user?._id || m.user) !== String(memberId));
        await conv.save();

        const sysMsg = await addSystemMessage(conversationId, `A member was removed`);
        
        // Inform removed user
        const removedSock = onlineUsers.get(memberId);
        if (removedSock) io.to(removedSock).emit('group_removed', { conversationId });

        const populated = await Conversation.findById(conversationId).populate('members.user', 'name college isOnline lastSeen');
        broadcastToGroup(populated, 'group_updated', { conversation: populated });
        broadcastToGroup(populated, 'message_receive', sysMsg);
      } catch (e) { console.error(e); }
    });

    socket.on('group_update_role', async ({ conversationId, memberId, role }) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv || !isAdmin(conv, uid)) return;

        const mem = conv.members.find(m => String(m.user?._id || m.user) === String(memberId));
        if (mem) mem.role = role;
        await conv.save();

        const populated = await Conversation.findById(conversationId).populate('members.user', 'name college isOnline lastSeen');
        broadcastToGroup(populated, 'group_updated', { conversation: populated });
      } catch (e) { console.error(e); }
    });

    socket.on('group_leave', async ({ conversationId }) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv) return;

        conv.members = conv.members.filter(m => String(m.user?._id || m.user) !== String(uid));
        
        // If no members left, delete or keep? Let's keep for history but it's empty.
        // If last admin leaves, promote someone else?
        if (conv.members.length > 0 && !conv.members.some(m => m.role === 'admin')) {
          conv.members[0].role = 'admin';
        }
        
        await conv.save();
        const sysMsg = await addSystemMessage(conversationId, `${socket.userName} left the group`);
        
        const populated = await Conversation.findById(conversationId).populate('members.user', 'name college isOnline lastSeen');
        broadcastToGroup(populated, 'group_updated', { conversation: populated });
        broadcastToGroup(populated, 'message_receive', sysMsg);
        socket.emit('group_left', { conversationId });
      } catch (e) { console.error(e); }
    });

    // ─── DISCONNECT ───
    socket.on('disconnect', async () => {
      console.log(`🔴 ${socket.userName} disconnected`);
      onlineUsers.delete(uid);

      try {
        await User.findByIdAndUpdate(uid, { isOnline: false, lastSeen: new Date() });
      } catch (e) {}

      // End any active calls tied to this user
      for (const [callId, call] of activeCalls) {
        if (call.callerId === uid || call.receiverId === uid) {
          const peerId = call.callerId === uid ? call.receiverId : call.callerId;
          const peerSocket = onlineUsers.get(peerId);
          if (peerSocket) {
            io.to(peerSocket).emit('call_ended', { callId, reason: 'Peer disconnected' });
          }
          
          if (call.startTime) {
            const durationSec = Math.floor((Date.now() - call.startTime) / 1000);
            logCallHistory(call.callerId, call.receiverId, call.type, 'completed', durationSec);
          } else {
            logCallHistory(call.callerId, call.receiverId, call.type, 'missed');
          }
          activeCalls.delete(callId);
        }
      }

      socket.broadcast.emit('user_offline', { userId: uid, lastSeen: new Date() });
    });
  });
}

module.exports = { initializeSocket };

