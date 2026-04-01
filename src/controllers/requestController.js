/**
 * Request Controller
 * -------------------
 * Handles skill-exchange requests between users.
 */

const { asyncHandler } = require('../utils/helpers');
const { Request, Skill, User } = require('../models');

/**
 * @desc    Create a new skill-exchange request
 * @route   POST /api/requests
 * @access  Private
 */
const createRequest = asyncHandler(async (req, res) => {
  const { skill_id, message } = req.body;

  // Verify the skill exists
  const skill = await Skill.findByPk(skill_id);
  if (!skill) {
    const error = new Error('Skill not found');
    error.statusCode = 404;
    throw error;
  }

  // Prevent requesting your own skill
  if (skill.user_id === req.user.id) {
    const error = new Error('You cannot request your own skill');
    error.statusCode = 400;
    throw error;
  }

  const request = await Request.create({
    requester_id: req.user.id,
    skill_id,
    message,
  });

  res.status(201).json({
    success: true,
    message: 'Request created successfully',
    data: request,
  });
});

/**
 * @desc    Get all requests for the authenticated user (sent & received)
 * @route   GET /api/requests
 * @access  Private
 */
const getRequests = asyncHandler(async (req, res) => {
  // Requests the user has SENT
  const sentRequests = await Request.findAll({
    where: { requester_id: req.user.id },
    include: [
      {
        model: Skill,
        as: 'skill',
        include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
      },
    ],
    order: [['created_at', 'DESC']],
  });

  // Requests the user has RECEIVED (for their skills)
  const receivedRequests = await Request.findAll({
    include: [
      {
        model: Skill,
        as: 'skill',
        where: { user_id: req.user.id },
        include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
      },
      {
        model: User,
        as: 'requester',
        attributes: ['id', 'name', 'email'],
      },
    ],
    order: [['created_at', 'DESC']],
  });

  res.status(200).json({
    success: true,
    data: {
      sent: sentRequests,
      received: receivedRequests,
    },
  });
});

/**
 * @desc    Update request status (accept/reject)
 * @route   PATCH /api/requests/:id/status
 * @access  Private (skill owner only)
 */
const updateRequestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const request = await Request.findByPk(req.params.id, {
    include: [{ model: Skill, as: 'skill' }],
  });

  if (!request) {
    const error = new Error('Request not found');
    error.statusCode = 404;
    throw error;
  }

  // Only the skill owner can accept/reject
  if (request.skill.user_id !== req.user.id) {
    const error = new Error('Not authorized to update this request');
    error.statusCode = 403;
    throw error;
  }

  request.status = status;
  await request.save();

  res.status(200).json({
    success: true,
    message: `Request ${status} successfully`,
    data: request,
  });
});

module.exports = { createRequest, getRequests, updateRequestStatus };
