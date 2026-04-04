const { asyncHandler } = require('../utils/helpers');
const { PortfolioProject } = require('../models');

const getMyPortfolio = asyncHandler(async (req, res) => {
  const projects = await PortfolioProject.find({ user_id: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  // Add id field for frontend compatibility
  const formatted = projects.map(p => ({ ...p, id: p._id.toString() }));
  res.status(200).json({ success: true, data: formatted });
});

const addProject = asyncHandler(async (req, res) => {
  const { title, description, project_link, github_link, image_url } = req.body;

  const project = await PortfolioProject.create({
    user_id: req.user._id,
    title,
    description,
    project_link,
    github_link,
    image_url,
  });

  res.status(201).json({ success: true, data: { ...project.toObject(), id: project._id.toString() } });
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await PortfolioProject.findOne({
    _id: req.params.id,
    user_id: req.user._id,
  });

  if (!project) throw new Error('Project not found');

  await project.deleteOne();
  res.status(200).json({ success: true, message: 'Project removed' });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await PortfolioProject.findOne({
    _id: req.params.id,
    user_id: req.user._id,
  });

  if (!project) throw new Error('Project not found');

  const { title, description, project_link, github_link, image_url } = req.body;
  if (title) project.title = title;
  if (description) project.description = description;
  if (project_link) project.project_link = project_link;
  if (github_link) project.github_link = github_link;
  if (image_url) project.image_url = image_url;

  await project.save();
  res.status(200).json({ success: true, data: { ...project.toObject(), id: project._id.toString() } });
});

module.exports = { getMyPortfolio, addProject, deleteProject, updateProject };
