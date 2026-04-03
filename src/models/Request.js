const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requester_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  skill_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true,
  },
  message: String,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'connecting', 'completed'], // Added 'connecting' and 'completed'
    default: 'pending',
  },
}, {
  timestamps: true,
});

const Request = mongoose.model('Request', requestSchema);
module.exports = Request;
