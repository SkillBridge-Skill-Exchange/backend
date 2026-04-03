const { asyncHandler } = require('../utils/helpers');
const { Conversation, Message, User, Notification } = require('../models');

const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    $or: [
      { user1_id: req.user._id },
      { user2_id: req.user._id },
      { 'members.user': req.user._id }
    ]
  })
    .populate('user1_id', 'name college isOnline lastSeen')
    .populate('user2_id', 'name college isOnline lastSeen')
    .populate('members.user', 'name college isOnline lastSeen') // Populate nested user objects
    .sort({ updatedAt: -1 })
    .lean();

  for (let conv of conversations) {
    const latestMessage = await Message.findOne({ conversation_id: conv._id })
      .sort({ createdAt: -1 })
      .lean();
    conv.messages = latestMessage ? [latestMessage] : [];

    // Normalize IDs to strings
    conv.id = conv._id.toString();
    conv.user1_id_str = conv.user1_id?._id?.toString() || '';
    conv.user2_id_str = conv.user2_id?._id?.toString() || '';
    conv.user1 = conv.user1_id || {};
    conv.user2 = conv.user2_id || {};
    if (conv.user1._id) conv.user1.id = conv.user1._id.toString();
    if (conv.user2._id) conv.user2.id = conv.user2._id.toString();
  }

  res.status(200).json({ success: true, data: conversations });
});

const sendMessage = asyncHandler(async (req, res) => {
  const { recipient_id, conversation_id, content, type = 'text', fileUrl = null, fileName = null } = req.body;

  let conversation;
  
  if (recipient_id) {
    const caller = await User.findById(req.user._id);
    if (caller?.blockedUsers?.includes(recipient_id)) {
      return res.status(403).json({ success: false, message: 'You have blocked this user.' });
    }
    const receiver = await User.findById(recipient_id);
    if (receiver?.blockedUsers?.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'User unavailable.' });
    }
  }

  if (conversation_id) {
    conversation = await Conversation.findById(conversation_id);
  } else {
    conversation = await Conversation.findOne({
      isGroup: false,
      $or: [
        { user1_id: req.user._id, user2_id: recipient_id },
        { user1_id: recipient_id, user2_id: req.user._id }
      ]
    });

    if (!conversation) {
      conversation = await Conversation.create({
        user1_id: req.user._id,
        user2_id: recipient_id,
        members: [
          { user: req.user._id, role: 'member' },
          { user: recipient_id, role: 'member' }
        ]
      });
    }
  }

  const message = await Message.create({
    conversation_id: conversation._id,
    sender_id: req.user._id,
    content,
    type,
    fileUrl,
    fileName,
    is_read: false,
    readBy: [req.user._id]
  });

  conversation.updatedAt = Date.now();
  await conversation.save();

  if (!conversation.isGroup && recipient_id) {
    await Notification.create({
      user_id: recipient_id,
      type: 'message',
      title: 'New Message',
      content: `You have a new message from ${req.user.name}`,
      link: `/messages`,
    });
  }

  res.status(201).json({
    success: true,
    data: {
      ...message.toObject(),
      id: message._id.toString(),
      sender_id: message.sender_id.toString(),
      conversation_id: message.conversation_id.toString(),
    }
  });
});

const createGroup = asyncHandler(async (req, res) => {
  const { name, members } = req.body; // array of user IDs
  if (!name || !members || members.length < 2) {
    return res.status(400).json({ success: false, message: 'Group name and at least 2 other members are required' });
  }

  const allMembers = [...new Set([...members, req.user._id.toString()])].map(uid => ({
    user: uid,
    role: uid === req.user._id.toString() ? 'admin' : 'member'
  }));

  const conversation = await Conversation.create({
    isGroup: true,
    groupName: name,
    members: allMembers
  });

  res.status(201).json({ success: true, data: conversation });
});

const getMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({ conversation_id: req.params.id })
    .sort({ createdAt: 1 })
    .lean();

  const formatted = messages.map(m => ({
    ...m,
    id: m._id.toString(),
    sender_id: m.sender_id.toString(),
    conversation_id: m.conversation_id.toString(),
  }));

  res.status(200).json({ success: true, data: formatted });
});

const getPresence = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select('isOnline lastSeen name').lean();
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.status(200).json({ success: true, data: user });
});

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  const fileName = req.file.originalname;
  const mimeType = req.file.mimetype;

  let type = 'file';
  if (mimeType.startsWith('image/')) type = 'image';
  else if (mimeType.startsWith('video/')) type = 'video';
  else if (mimeType.startsWith('audio/')) type = 'audio';

  res.status(200).json({
    success: true,
    data: { fileUrl, fileName, type, mimeType, size: req.file.size }
  });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  
  const unreadMessagesCount = await Message.countDocuments({
    // Needs to be in a conversation where user is a participant
    // Wait, let's just count where they are NOT the sender, AND their ID is NOT in readBy
    sender_id: { $ne: uid },
    readBy: { $ne: uid }
  });

  res.status(200).json({ success: true, count: unreadMessagesCount });
});

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  uploadFile,
  getPresence,
  createGroup,
  getUnreadCount
};
