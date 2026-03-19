const express = require('express');
const router = express.Router();
const {
  generateTask,
  getTeamInsights,
  aiPrioritizeTasks,
  generateAgenda,
  aiChat
} = require('../controllers/aiControllers');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.post('/generate-task', protect, generateTask);
router.get('/team-insights/:teamId', protect, getTeamInsights);
router.post('/prioritize-tasks', protect, aiPrioritizeTasks);
router.post('/meeting-agenda', protect, generateAgenda);
router.post('/chat', protect, aiChat);

module.exports = router;