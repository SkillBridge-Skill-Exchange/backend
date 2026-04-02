const mongoose = require('mongoose');

const portfolioProjectSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  project_link: {
    type: String,
    trim: true,
  },
  github_link: {
    type: String,
    trim: true,
  },
  image_url: String,
}, {
  timestamps: true,
});

const PortfolioProject = mongoose.model('PortfolioProject', portfolioProjectSchema);
module.exports = PortfolioProject;
