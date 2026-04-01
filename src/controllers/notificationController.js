const { asyncHandler } = require('../utils/helpers');
const { Notification } = require('../models');

/**
 * @desc    Get user's notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.findAll({
    where: { user_id: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: 20
  });

  res.status(200).json({ success: true, data: notifications });
});

/**
 * @desc    Mark as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    where: { id: req.params.id, user_id: req.user.id }
  });

  if (!notification) throw new Error('Notification not found');

  notification.is_read = true;
  await notification.save();

  res.status(200).json({ success: true, data: notification });
});

module.exports = { getMyNotifications, markAsRead };
