const { asyncHandler } = require('../utils/helpers');
const { PortfolioProject } = require('../models');

/**
 * @desc    Get logged in user's portfolio
 * @route   GET /api/portfolio
 * @access  Private
 */
const getMyPortfolio = asyncHandler(async (req, res) => {
  const projects = await PortfolioProject.findAll({
    where: { user_id: req.user.id },
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({ success: true, data: projects });
});

/**
 * @desc    Add a project to portfolio
 * @route   POST /api/portfolio
 * @access  Private
 */
const addProject = asyncHandler(async (req, res) => {
  const { title, description, project_link, github_link, image_url } = req.body;

  const project = await PortfolioProject.create({
    user_id: req.user.id,
    title,
    description,
    project_link,
    github_link,
    image_url,
  });

  res.status(201).json({ success: true, data: project });
});

/**
 * @desc    Delete a project
 * @route   DELETE /api/portfolio/:id
 * @access  Private
 */
const deleteProject = asyncHandler(async (req, res) => {
  const project = await PortfolioProject.findOne({
    where: { id: req.params.id, user_id: req.user.id },
  });

  if (!project) throw new Error('Project not found');

  await project.destroy();
  res.status(200).json({ success: true, message: 'Project removed' });
});

module.exports = { getMyPortfolio, addProject, deleteProject };
