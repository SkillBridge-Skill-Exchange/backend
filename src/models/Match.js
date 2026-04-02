const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  user1_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  user2_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  skill_match_score: {
    type: Number,
    min: 0,
    max: 1,
    default: 0,
  },
}, {
  timestamps: true,
});

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;
