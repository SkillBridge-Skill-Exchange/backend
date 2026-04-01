const { asyncHandler } = require('../utils/helpers');
const { Endorsement, Skill, Notification } = require('../models');

/**
 * @desc    Endorse a peer's skill
 * @route   POST /api/endorsements
 * @access  Private
 */
const endorseSkill = asyncHandler(async (req, res) => {
  const { skill_id, comment } = req.body;

  const skill = await Skill.findByPk(skill_id);
  if (!skill) throw new Error('Skill not found');

  if (skill.user_id === req.user.id) throw new Error('You cannot endorse your own skill');

  const endorsement = await Endorsement.create({
    skill_id,
    endorser_id: req.user.id,
    comment,
  });

  // Notify the skill owner
  await Notification.create({
    user_id: skill.user_id,
    type: 'endorsement',
    title: 'New Skill Endorsement',
    content: `${req.user.name} endorsed your skill: ${skill.skill_name}`,
    link: '/profile',
  });

  res.status(201).json({ success: true, data: endorsement });
});

/**
 * @desc    Get endorsements for a specific skill
 * @route   GET /api/endorsements/:skillId
 * @access  Public
 */
const getSkillEndorsements = asyncHandler(async (req, res) => {
  const endorsements = await Endorsement.findAll({
    where: { skill_id: req.params.skillId },
    include: [{ model: require('../models').User, as: 'endorser', attributes: ['name', 'college'] }],
  });

  res.status(200).json({ success: true, data: endorsements });
});

module.exports = { endorseSkill, getSkillEndorsements };
