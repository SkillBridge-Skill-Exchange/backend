const { asyncHandler } = require('../utils/helpers');
const { Conversation, Message, User, Notification } = require('../models');

const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    $or: [
      { user1_id: req.user._id },
      { user2_id: req.user._id }
    ]
  })
    .populate('user1_id', 'name')
    .populate('user2_id', 'name')
    .sort({ updatedAt: -1 })
    .lean();

  // Populate latest message
  for (let conv of conversations) {
    const latestMessage = await Message.findOne({ conversation_id: conv._id })
      .sort({ createdAt: -1 })
      .lean();
    conv.messages = latestMessage ? [latestMessage] : [];
    
    // Format for frontend identity resolution
    const u1Raw = conv.user1_id || {};
    const u2Raw = conv.user2_id || {};

    conv.id = conv._id.toString();
    conv.user1 = { id: (u1Raw._id || u1Raw).toString(), name: u1Raw.name };
    conv.user2 = { id: (u2Raw._id || u2Raw).toString(), name: u2Raw.name };
    conv.user1_id = (u1Raw._id || u1Raw).toString();
    conv.user2_id = (u2Raw._id || u2Raw).toString();
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

  res.status(201).json({ success: true, data: { ...message.toObject(), id: message._id.toString() } });
});

const getMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({ conversation_id: req.params.id })
    .sort({ createdAt: 1 })
    .lean();

  const formatted = messages.map(m => ({ ...m, id: m._id.toString() }));
  
  res.status(200).json({ success: true, data: formatted });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  // Find all conversations user is part of
  const myConvs = await Conversation.find({
    $or: [{ user1_id: req.user._id }, { user2_id: req.user._id }]
  }).select('_id');

  const convIds = myConvs.map(c => c._id);

  // Count messages in those conversations where I am NOT the sender and is_read is false
  const count = await Message.countDocuments({
    conversation_id: { $in: convIds },
    sender_id: { $ne: req.user._id },
    is_read: false
  });

  res.status(200).json({ success: true, count });
});

module.exports = { getConversations, sendMessage, getMessages, getUnreadCount };
