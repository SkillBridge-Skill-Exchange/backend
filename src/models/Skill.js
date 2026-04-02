const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  skill_name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true,
  },
  category: {
    type: String,
    default: 'General',
  },
  proficiency_level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner',
  },
  description: String,
  type: {
    type: String,
    enum: ['offer', 'request'],
    default: 'offer',
  },
}, {
  timestamps: true,
});

const Skill = mongoose.model('Skill', skillSchema);
module.exports = Skill;
