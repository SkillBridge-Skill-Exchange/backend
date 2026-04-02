const { asyncHandler } = require('../utils/helpers');
const { Endorsement, Skill, Notification, User } = require('../models');

const endorseSkill = asyncHandler(async (req, res) => {
  const { skill_id, comment } = req.body;

  const skill = await Skill.findById(skill_id);
  if (!skill) throw new Error('Skill not found');

  if (skill.user_id.toString() === req.user._id.toString()) {
    throw new Error('You cannot endorse your own skill');
  }

  const endorsement = await Endorsement.create({
    skill_id,
    endorser_id: req.user._id,
    comment,
  });

  await Notification.create({
    user_id: skill.user_id,
    type: 'endorsement',
    title: 'New Skill Endorsement',
    content: `${req.user.name} endorsed your skill: ${skill.skill_name}`,
    link: '/profile',
  });

  res.status(201).json({ success: true, data: endorsement });
});

const getSkillEndorsements = asyncHandler(async (req, res) => {
  const endorsements = await Endorsement.find({ skill_id: req.params.skillId })
    .populate('endorser_id', 'name college')
    .sort({ createdAt: -1 })
    .lean();

  // Format for frontend: rename endorser_id to endorser
  const formatted = endorsements.map(e => ({
    ...e,
    id: e._id.toString(),
    endorser: e.endorser_id || {},
  }));

  res.status(200).json({ success: true, data: formatted });
});

module.exports = { endorseSkill, getSkillEndorsements };
