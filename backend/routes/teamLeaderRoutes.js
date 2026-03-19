const express = require('express');
const router = express.Router();
const {
  getTasks,
  getOverview,
  getTeam,
  getMembers,
  createTask,
  updateTask
} = require('../controllers/teamLeaderControllers');
const { protect } = require('../middleware/auth');

// Middleware to check if user is team leader
const teamLeaderOnly = (req, res, next) => {
  if (req.user && req.user.role === 'teamleader') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Team leaders only.' });
  }
};

// Routes
router.get('/tasks', protect, teamLeaderOnly, getTasks);
router.get('/overview', protect, teamLeaderOnly, getOverview);
router.get('/team', protect, teamLeaderOnly, getTeam);
router.get('/members', protect, teamLeaderOnly, getMembers);
router.post('/create-task', protect, teamLeaderOnly, createTask);
router.put('/update-task/:id', protect, teamLeaderOnly, updateTask);

module.exports = router;