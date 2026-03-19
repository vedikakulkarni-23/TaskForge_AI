const Task = require('../models/Task');
const Team = require('../models/Team');
const User = require('../models/User');

// @desc    Get all tasks for team leader's team (including tasks assigned to leader)
// @route   GET /api/tl/tasks
// @access  Private/TeamLeader
const getTasks = async (req, res) => {
  try {
    const teamLeader = await User.findById(req.user._id);
    
    if (!teamLeader.teamId) {
      return res.status(404).json({ message: 'You are not assigned to any team' });
    }

    const team = await Team.findById(teamLeader.teamId);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get all tasks assigned to team members AND the team leader
    const allAssignees = [...team.memberIds, team.leaderId];
    
    const tasks = await Task.find({
      assignedTo: { $in: allAssignees }
    })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get team overview with stats
// @route   GET /api/tl/overview
// @access  Private/TeamLeader
const getOverview = async (req, res) => {
  try {
    const teamLeader = await User.findById(req.user._id);
    
    if (!teamLeader.teamId) {
      return res.status(404).json({ message: 'You are not assigned to any team' });
    }

    const team = await Team.findById(teamLeader.teamId)
      .populate('leaderId', 'name email points badges')
      .populate('memberIds', 'name email points badges');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get all tasks for team (including leader's tasks)
    const allAssignees = [...team.memberIds.map(m => m._id), team.leaderId._id];
    
    const allTasks = await Task.find({
      assignedTo: { $in: allAssignees }
    });

    const stats = {
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(t => t.status === 'done').length,
      inProgressTasks: allTasks.filter(t => t.status === 'inprogress' || t.status === 'in-progress').length,
      todoTasks: allTasks.filter(t => t.status === 'todo').length
    };

    res.json({ team, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get team leader's team info
// @route   GET /api/tl/team
// @access  Private/TeamLeader
const getTeam = async (req, res) => {
  try {
    const teamLeader = await User.findById(req.user._id);
    
    if (!teamLeader.teamId) {
      return res.status(404).json({ message: 'You are not assigned to any team' });
    }

    const team = await Team.findById(teamLeader.teamId)
      .populate('leaderId', 'name email')
      .populate('memberIds', 'name email points');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all members in team leader's team
// @route   GET /api/tl/members
// @access  Private/TeamLeader
const getMembers = async (req, res) => {
  try {
    const teamLeader = await User.findById(req.user._id);
    
    if (!teamLeader.teamId) {
      return res.status(404).json({ message: 'You are not assigned to any team' });
    }

    const team = await Team.findById(teamLeader.teamId);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const members = await User.find({
      _id: { $in: team.memberIds }
    }).select('name email points');

    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new task and assign to member or self
// @route   POST /api/tl/create-task
// @access  Private/TeamLeader
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, deadline } = req.body;

    const teamLeader = await User.findById(req.user._id);
    
    if (!teamLeader.teamId) {
      return res.status(404).json({ message: 'You are not assigned to any team' });
    }

    const team = await Team.findById(teamLeader.teamId);
    
    // Verify that assignedTo user is in the team OR is the team leader themselves
    const isTeamMember = team.memberIds.some(id => id.toString() === assignedTo);
    const isTeamLeader = team.leaderId.toString() === assignedTo;
    
    if (!isTeamMember && !isTeamLeader) {
      return res.status(400).json({ message: 'Can only assign tasks to yourself or your team members' });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      priority: priority || 'medium',
      deadline,
      status: 'todo'
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task status
// @route   PUT /api/tl/update-task/:id
// @access  Private/TeamLeader
const updateTask = async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = status;
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTasks,
  getOverview,
  getTeam,
  getMembers,
  createTask,
  updateTask
};