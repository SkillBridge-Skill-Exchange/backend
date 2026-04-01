const { asyncHandler } = require('../utils/helpers');
const { Conversation, Message, User, Notification } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Get user conversations
 * @route   GET /api/messages/conversations
 * @access  Private
 */
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.findAll({
    where: {
      [Op.or]: [
        { user1_id: req.user.id },
        { user2_id: req.user.id }
      ]
    },
    include: [
      { model: User, as: 'user1', attributes: ['id', 'name'] },
      { model: User, as: 'user2', attributes: ['id', 'name'] },
      { 
        model: Message, 
        as: 'messages', 
        limit: 1, 
        order: [['createdAt', 'DESC']] 
      }
    ],
    order: [['updatedAt', 'DESC']]
  });

  res.status(200).json({ success: true, data: conversations });
});

/**
 * @desc    SendMessage
 * @route   POST /api/messages
 * @access  Private
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { recipient_id, content } = req.body;

  let conversation = await Conversation.findOne({
    where: {
      [Op.or]: [
        { [Op.and]: [{ user1_id: req.user.id }, { user2_id: recipient_id }] },
        { [Op.and]: [{ user1_id: recipient_id }, { user2_id: req.user.id }] }
      ]
    }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      user1_id: req.user.id,
      user2_id: recipient_id
    });
  }

  const message = await Message.create({
    conversation_id: conversation.id,
    sender_id: req.user.id,
    content
  });

  // Notify recipient
  await Notification.create({
    user_id: recipient_id,
    type: 'message',
    title: 'New Message',
    content: `You have a new message from ${req.user.name}`,
    link: `/chat/${conversation.id}`
  });

  res.status(201).json({ success: true, data: message });
});

/**
 * @desc    Get messages in conversation
 * @route   GET /api/messages/:id
 * @access  Private
 */
const getMessages = asyncHandler(async (req, res) => {
  const messages = await Message.findAll({
    where: { conversation_id: req.params.id },
    order: [['createdAt', 'ASC']]
  });

  res.status(200).json({ success: true, data: messages });
});

module.exports = { getConversations, sendMessage, getMessages };
