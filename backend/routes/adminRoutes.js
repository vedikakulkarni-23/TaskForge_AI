const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  createUser,
  getUsers,
  getTeams,
  createTeam,
  updateCredits,
  resendVerification,
  assignMemberToTeam
} = require('../controllers/adminControllers');
const { protect } = require('../middleware/auth');

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
  console.log('🔐 Admin check - User role:', req.user?.role);
  if (req.user && req.user.role === 'admin') {
    console.log('✅ Admin verified');
    next();
  } else {
    console.log('❌ Access denied - not admin');
    res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};

// Routes
router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.get('/users', protect, adminOnly, getUsers);
router.get('/teams', protect, adminOnly, getTeams);
router.post('/create-user', protect, adminOnly, createUser);
router.post('/create-team', protect, adminOnly, createTeam);
router.post('/assign-member', protect, adminOnly, assignMemberToTeam);
router.put('/update-credits/:id', protect, adminOnly, updateCredits);
router.post('/resend-verification/:id', protect, adminOnly, resendVerification);

module.exports = router;