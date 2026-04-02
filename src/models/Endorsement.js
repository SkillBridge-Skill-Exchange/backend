const mongoose = require('mongoose');

const endorsementSchema = new mongoose.Schema({
  skill_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true,
  },
  endorser_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  comment: String,
}, {
  timestamps: true,
});

const Endorsement = mongoose.model('Endorsement', endorsementSchema);
module.exports = Endorsement;
