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
    user_id: req.user.id,
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

/**
 * @desc    Get all skills (with optional filtering)
 * @route   GET /api/skills
 * @access  Public
 */
const getAllSkills = asyncHandler(async (req, res) => {
  const { category, proficiency_level, type, department, year, search } = req.query;
  const { Op } = require('sequelize');

  // Build dynamic filter for Skills
  const where = {};
  if (category) where.category = category;
  if (proficiency_level) where.proficiency_level = proficiency_level;
  if (type) where.type = type;
  if (search) {
    where.skill_name = { [Op.like]: `%${search}%` };
  }

  // Build dynamic filter for User (owner)
  const userWhere = {};
  if (department) userWhere.department = department;
  if (year) userWhere.year = year;

  const skills = await Skill.findAll({
    where,
    include: [
      {
        model: User,
        as: 'owner',
        where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
        attributes: ['id', 'name', 'email', 'college', 'department', 'year'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    success: true,
    count: skills.length,
    data: skills,
  });
});

/**
 * @desc    Get a single skill by ID
 * @route   GET /api/skills/:id
 * @access  Public
 */
const getSkillById = asyncHandler(async (req, res) => {
  const skill = await Skill.findByPk(req.params.id, {
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'email', 'college', 'department', 'year'],
      },
    ],
  });

  if (!skill) {
    const error = new Error('Skill not found');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    success: true,
    data: skill,
  });
});

/**
 * @desc    Delete a skill (only by owner)
 * @route   DELETE /api/skills/:id
 * @access  Private
 */
const deleteSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findByPk(req.params.id);

  if (!skill) {
    const error = new Error('Skill not found');
    error.statusCode = 404;
    throw error;
  }

  // Only the owner can delete their skill
  if (skill.user_id !== req.user.id) {
    const error = new Error('Not authorized to delete this skill');
    error.statusCode = 403;
    throw error;
  }

  await skill.destroy();

  res.status(200).json({
    success: true,
    message: 'Skill deleted successfully',
  });
});

module.exports = { createSkill, getAllSkills, getSkillById, deleteSkill };
