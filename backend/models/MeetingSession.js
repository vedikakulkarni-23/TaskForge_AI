const mongoose = require('mongoose');

const meetingSessionSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  roomUrl: {
    type: String,
    required: true
  },
  startedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const MeetingSession = mongoose.model('MeetingSession', meetingSessionSchema);

module.exports = MeetingSession;