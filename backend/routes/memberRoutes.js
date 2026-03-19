const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTeam,
  getTeamMembers,
  getLeaderboard,
  updateTask
} = require('../controllers/memberControllers');
const { protect } = require('../middleware/auth');

// Middleware to check if user is member
const memberOnly = (req, res, next) => {
  if (req.user && req.user.role === 'member') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Members only.' });
  }
};

// Routes
router.get('/tasks', protect, memberOnly, getTasks);
router.get('/team', protect, memberOnly, getTeam);
router.get('/team-members', protect, memberOnly, getTeamMembers);
router.get('/leaderboard', protect, memberOnly, getLeaderboard);
router.put('/update-task/:id', protect, memberOnly, updateTask);

module.exports = router;