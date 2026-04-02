const { asyncHandler } = require('../utils/helpers');
const { Request, Skill, User } = require('../models');

const createRequest = asyncHandler(async (req, res) => {
  const { skill_id, message } = req.body;

  const skill = await Skill.findById(skill_id);
  if (!skill) {
    const error = new Error('Skill not found');
    error.statusCode = 404;
    throw error;
  }

  if (skill.user_id.toString() === req.user._id.toString()) {
    const error = new Error('You cannot request your own skill');
    error.statusCode = 400;
    throw error;
  }

  const request = await Request.create({
    requester_id: req.user._id,
    skill_id,
    message,
  });

  res.status(201).json({
    success: true,
    message: 'Request created successfully',
    data: request,
  });
});

const getRequests = asyncHandler(async (req, res) => {
  // Sent requests
  const sentRaw = await Request.find({ requester_id: req.user._id })
    .populate({ path: 'skill_id', populate: { path: 'user_id', select: 'name email' } })
    .sort({ createdAt: -1 })
    .lean();

  const sent = sentRaw.map(r => ({
    ...r,
    id: r._id.toString(),
    skill: r.skill_id ? { ...r.skill_id, id: r.skill_id._id?.toString(), owner: r.skill_id.user_id } : null,
  }));

  // Received requests: find skills owned by current user, then find requests for those skills
  const mySkills = await Skill.find({ user_id: req.user._id }).select('_id').lean();
  const mySkillIds = mySkills.map(s => s._id);

  const receivedRaw = await Request.find({ skill_id: { $in: mySkillIds } })
    .populate('requester_id', 'name email')
    .populate('skill_id')
    .sort({ createdAt: -1 })
    .lean();

  const received = receivedRaw.map(r => ({
    ...r,
    id: r._id.toString(),
    requester: r.requester_id || {},
    skill: r.skill_id ? { ...r.skill_id, id: r.skill_id._id?.toString() } : null,
  }));

  res.status(200).json({
    success: true,
    data: { sent, received },
  });
});

const updateRequestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const request = await Request.findById(req.params.id).populate('skill_id');

  if (!request) {
    const error = new Error('Request not found');
    error.statusCode = 404;
    throw error;
  }

  if (request.skill_id.user_id.toString() !== req.user._id.toString()) {
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
