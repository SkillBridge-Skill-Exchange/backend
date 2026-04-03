const mongoose = require('mongoose');
const { asyncHandler } = require('../utils/helpers');
const { Conversation, Message, User, Notification, Request, Skill } = require('../models');

const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    $or: [
      { user1_id: req.user._id },
      { user2_id: req.user._id }
    ]
  })
    .populate('user1_id', 'name college last_seen')
    .populate('user2_id', 'name college last_seen')
    .sort({ updatedAt: -1 })
    .lean();

  // Populate latest message and unread count
  for (let conv of conversations) {
    const latestMessage = await Message.findOne({ conversation_id: conv._id })
      .sort({ createdAt: -1 })
      .lean();
    conv.messages = latestMessage ? [latestMessage] : [];
    
    // Count unread messages (sender is not current user and is_read is false)
    const unreadCount = await Message.countDocuments({
      conversation_id: conv._id,
      sender_id: { $ne: req.user._id },
      is_read: false
    });
    conv.unreadCount = unreadCount;

    // Format for frontend
    conv.id = conv._id.toString();
    conv.user1 = conv.user1_id || {};
    conv.user2 = conv.user2_id || {};
  }

  res.status(200).json({ success: true, data: conversations });
});

const sendMessage = asyncHandler(async (req, res) => {
  const { recipient_id, content } = req.body;

  let conversation = await Conversation.findOne({
    $or: [
      { user1_id: req.user._id, user2_id: recipient_id },
      { user1_id: recipient_id, user2_id: req.user._id }
    ]
  });

  if (!conversation) {
    conversation = await Conversation.create({
      user1_id: req.user._id,
      user2_id: recipient_id
    });
  }

  const message = await Message.create({
    conversation_id: conversation._id,
    sender_id: req.user._id,
    content
  });
  
  // Update updated_at of conversation
  conversation.updatedAt = Date.now();
  await conversation.save();

  // Notify recipient
  await Notification.create({
    user_id: recipient_id,
    type: 'message',
    title: 'New Message',
    content: `You have a new message from ${req.user.name}`,
    link: `/messages`,
  });

  // AUTO-CONNECT: If there's an 'accepted' collaboration request, move it to 'connecting'
  try {
    // 1. Find skills owned by sender and recipient
    const mySkills = await Skill.find({ user_id: req.user._id }).select('_id').lean();
    const theirSkills = await Skill.find({ user_id: recipient_id }).select('_id').lean();
    const mySkillIds = mySkills.map(s => s._id);
    const theirSkillIds = theirSkills.map(s => s._id);

    // 2. Promote any accepted requests between these two users
    const rId = new mongoose.Types.ObjectId(recipient_id);
    await Request.updateMany(
      {
        status: 'accepted',
        $or: [
          { requester_id: req.user._id, skill_id: { $in: theirSkillIds } },
          { requester_id: rId, skill_id: { $in: mySkillIds } }
        ]
      },
      { $set: { status: 'connecting' } }
    );
  } catch (err) {
    console.error('Auto-connect failed:', err);
  }

  res.status(201).json({ success: true, data: { ...message.toObject(), id: message._id.toString() } });
});

const getMessages = asyncHandler(async (req, res) => {
  // Mark matching messages as read
  await Message.updateMany(
    { conversation_id: req.params.id, sender_id: { $ne: req.user._id }, is_read: false },
    { $set: { is_read: true } }
  );

  const messages = await Message.find({ conversation_id: req.params.id })
    .sort({ createdAt: 1 })
    .lean();

  const formatted = messages.map(m => ({ ...m, id: m._id.toString() }));
  
  res.status(200).json({ success: true, data: formatted });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    $or: [
      { user1_id: req.user._id },
      { user2_id: req.user._id }
    ]
  }).select('_id');

  const convIds = conversations.map(c => c._id);

  const count = await Message.countDocuments({
    conversation_id: { $in: convIds },
    sender_id: { $ne: req.user._id },
    is_read: false
  });

  res.status(200).json({ success: true, count });
});

module.exports = { getConversations, sendMessage, getMessages, getUnreadCount };
