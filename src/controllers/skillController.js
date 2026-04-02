/**
 * Skill Controller
 * -----------------
 * CRUD operations for user skills.
 */

const { asyncHandler } = require('../utils/helpers');
const { Skill, User } = require('../models');

/**
 * @desc    Create a new skill for the authenticated user
 * @route   POST /api/skills
 * @access  Private
 */
const createSkill = asyncHandler(async (req, res) => {
  const { skill_name, category, proficiency_level, description, type } = req.body;

  const skill = await Skill.create({
    user_id: req.user._id,
    skill_name,
    category,
    proficiency_level,
    description,
    type,
  });

  res.status(201).json({
    success: true,
    message: 'Skill created successfully',
    data: skill,
  });
});

const getAllSkills = asyncHandler(async (req, res) => {
  const { category, proficiency_level, type, department, year, search } = req.query;

  // Build dynamic MongoDB filter
  const where = {};
  if (category) where.category = category;
  if (proficiency_level) where.proficiency_level = proficiency_level;
  if (type) where.type = type;
  if (search) {
    where.skill_name = { $regex: search, $options: 'i' };
  }

  // Fetch from Mongo and populate the owner object matching Sequelize behavior
  let skills = await Skill.find(where)
    .populate({
      path: 'user_id',
      select: 'name email college department year'
    })
    .sort({ createdAt: -1 })
    .lean(); // Faster to use vanilla structs
    
  // Format the output to exactly match the structure frontend expects!
  skills = skills.map(s => {
    s.id = s._id.toString();
    s.owner = s.user_id || {};
    if (s.owner._id) s.owner.id = s.owner._id.toString();
    return s;
  });

  // Handle cross-collection filtering for user attributes
  if (department || year) {
    skills = skills.filter(skill => {
      let keep = true;
      if (department && skill.owner.department !== department) keep = false;
      if (year && String(skill.owner.year) !== String(year)) keep = false;
      return keep;
    });
  }

  res.status(200).json({
    success: true,
    count: skills.length,
    data: skills,
  });
});

const getSkillById = asyncHandler(async (req, res) => {
  const skillRaw = await Skill.findById(req.params.id)
    .populate('user_id', 'name email college department year')
    .lean();

  if (!skillRaw) {
    const error = new Error('Skill not found');
    error.statusCode = 404;
    throw error;
  }

  // Format to match Sequelize API contract
  const skill = { ...skillRaw, id: skillRaw._id.toString(), owner: skillRaw.user_id };
  if (skill.owner && skill.owner._id) skill.owner.id = skill.owner._id.toString();

  res.status(200).json({
    success: true,
    data: skill,
  });
});

const deleteSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findById(req.params.id);

  if (!skill) {
    const error = new Error('Skill not found');
    error.statusCode = 404;
    throw error;
  }

  // Only the owner can delete
  if (skill.user_id.toString() !== req.user._id.toString()) {
    const error = new Error('Not authorized to delete this skill');
    error.statusCode = 403;
    throw error;
  }

  await skill.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Skill deleted successfully',
  });
});

/**
 * @desc    Update a skill (only by owner)
 * @route   PUT /api/skills/:id
 * @access  Private
 */
const updateSkill = asyncHandler(async (req, res) => {
  const { skill_name, category, proficiency_level, description, type } = req.body;
  let skill = await Skill.findById(req.params.id);

  if (!skill) {
    const error = new Error('Skill not found');
    error.statusCode = 404;
    throw error;
  }

  // Only the owner can update
  if (skill.user_id.toString() !== req.user._id.toString()) {
    const error = new Error('Not authorized to update this skill');
    error.statusCode = 403;
    throw error;
  }

  skill = await Skill.findByIdAndUpdate(
    req.params.id,
    { skill_name, category, proficiency_level, description, type },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Skill updated successfully',
    data: skill,
  });
});

module.exports = { createSkill, getAllSkills, getSkillById, deleteSkill, updateSkill };
