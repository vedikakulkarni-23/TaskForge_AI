const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');
const crypto = require('crypto');
const { sendAccountCreationEmail } = require('../services/emailService');

// Email validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTeams = await Team.countDocuments();
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'done' });
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;

    const users = await User.find()
      .select('name email role points credits isEmailVerified accountStatus')
      .sort({ createdAt: -1 })
      .limit(10);

    const teams = await Team.find()
      .populate('leaderId', 'name email points badges')
      .populate('memberIds', 'name email points badges')
      .sort({ createdAt: -1 });

    const recentTasks = await Task.find()
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalUsers,
        totalTeams,
        totalTasks,
        completedTasks,
        completionRate
      },
      users,
      teams,
      recentTasks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new user with email verification
// @route   POST /api/admin/create-user
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create user without password (will be set during verification)
    const user = await User.create({
      name,
      email,
      role: role || 'member',
      accountStatus: 'pending',
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });

    // Send verification email
    try {
      await sendAccountCreationEmail(email, name, verificationToken);
      
      res.status(201).json({
        message: 'User created successfully. Verification email sent.',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus
        }
      });
    } catch (emailError) {
      // Delete user if email fails
      await User.findByIdAndDelete(user._id);
      throw new Error('Failed to send verification email. Please check email address.');
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('name email role points credits isEmailVerified accountStatus teamId')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all teams
// @route   GET /api/admin/teams
// @access  Private/Admin
const getTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('leaderId', 'name email points badges')
      .populate('memberIds', 'name email points badges')
      .sort({ createdAt: -1 });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new team
// @route   POST /api/admin/create-team
// @access  Private/Admin
const createTeam = async (req, res) => {
  try {
    const { name, leaderId, memberIds } = req.body;

    // Verify leader exists and is a team leader
    const leader = await User.findById(leaderId);
    if (!leader || leader.role !== 'teamleader') {
      return res.status(400).json({ message: 'Invalid team leader selected' });
    }

    // Verify all members exist and are members
    const members = await User.find({ _id: { $in: memberIds } });
    const invalidMembers = members.filter(m => m.role !== 'member');
    if (invalidMembers.length > 0) {
      return res.status(400).json({ message: 'All team members must have member role' });
    }

    // Create team
    const team = await Team.create({
      name,
      leaderId,
      memberIds
    });

    // Update users with team ID
    await User.findByIdAndUpdate(leaderId, { teamId: team._id });
    await User.updateMany(
      { _id: { $in: memberIds } },
      { teamId: team._id }
    );

    const populatedTeam = await Team.findById(team._id)
      .populate('leaderId', 'name email')
      .populate('memberIds', 'name email');

    res.status(201).json(populatedTeam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user credits
// @route   PUT /api/admin/update-credits/:id
// @access  Private/Admin
const updateCredits = async (req, res) => {
  try {
    const { credits } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { credits },
      { new: true }
    ).select('name email credits');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend verification email
// @route   POST /api/admin/resend-verification/:id
// @access  Private/Admin
const resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('+emailVerificationToken +emailVerificationExpires');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    await sendAccountCreationEmail(user.email, user.name, verificationToken);

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign user to team
// @route   POST /api/admin/assign-member
// @access  Private/Admin
const assignMemberToTeam = async (req, res) => {
  try {
    const { userId, teamId } = req.body;

    console.log('📌 Assign request received:', { userId, teamId });

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User found:', user.name, user.role);

    // Verify team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    console.log('✅ Team found:', team.name);

    // Check if already in team
    if (user.role === 'teamleader' && team.leaderId && team.leaderId.toString() === userId) {
      return res.status(400).json({ message: 'User is already the team leader' });
    }

    if (team.memberIds.some(id => id.toString() === userId)) {
      return res.status(400).json({ message: 'User is already in this team' });
    }

    // Remove from old team if exists
    if (user.teamId) {
      const oldTeam = await Team.findById(user.teamId);
      if (oldTeam) {
        if (oldTeam.leaderId && oldTeam.leaderId.toString() === userId) {
          oldTeam.leaderId = null;
        }
        oldTeam.memberIds = oldTeam.memberIds.filter(id => id.toString() !== userId);
        await oldTeam.save();
        console.log('✅ Removed from old team:', oldTeam.name);
      }
    }

    // Assign to new team based on role
    if (user.role === 'teamleader') {
      team.leaderId = userId;
      console.log('✅ Assigned as team leader');
    } else if (user.role === 'member') {
      team.memberIds.push(userId);
      console.log('✅ Added to member list');
    }

    // Update user's teamId
    user.teamId = teamId;

    await team.save();
    await user.save();

    const updatedTeam = await Team.findById(teamId)
      .populate('leaderId', 'name email')
      .populate('memberIds', 'name email');

    console.log('🎉 Assignment complete!');

    res.json({ 
      message: 'User assigned to team successfully', 
      team: updatedTeam 
    });

  } catch (error) {
    console.error('❌ Assignment error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  createUser,
  getUsers,
  getTeams,
  createTeam,
  updateCredits,
  resendVerification,
  assignMemberToTeam
};