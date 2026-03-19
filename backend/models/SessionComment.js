const mongoose = require('mongoose');

const sessionCommentSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MeetingSession',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const SessionComment = mongoose.model('SessionComment', sessionCommentSchema);

module.exports = SessionComment;