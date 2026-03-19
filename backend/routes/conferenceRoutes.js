const express = require('express');
const router = express.Router();
const {
  createDailySession,
  getSessionComments,
  addSessionComment,
  getParticipants,
  getComments,
  addComment,
  deleteComment
} = require('../controllers/conferenceControllers');
const { protect } = require('../middleware/auth');

// Daily.co meeting routes
router.post('/create-session', protect, createDailySession);
router.get('/session-comments/:sessionId', protect, getSessionComments);
router.post('/session-comments', protect, addSessionComment);
router.get('/participants/:teamId', protect, getParticipants);

// Legacy
router.get('/comments/:teamId', protect, getComments);
router.post('/comments', protect, addComment);
router.delete('/comments/:id', protect, deleteComment);

module.exports = router;