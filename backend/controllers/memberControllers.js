const Task = require('../models/Task');
const User = require('../models/User');
const Team = require('../models/Team');

// @desc    Get member's tasks
// @route   GET /api/member/tasks
// @access  Private/Member
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('assignedTo', 'name email points')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    console.log(`Found ${tasks.length} tasks for user ${req.user._id}`);
    console.log('Task statuses:', tasks.map(t => ({ title: t.title, status: t.status })));

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get member's team info
// @route   GET /api/member/team
// @access  Private/Member
const getTeam = async (req, res) => {
  try {
    const member = await User.findById(req.user._id);
    
    if (!member.teamId) {
      return res.status(404).json({ message: 'You are not assigned to any team' });
    }

    const team = await Team.findById(member.teamId)
      .populate('leaderId', 'name email points badges')
      .populate('memberIds', 'name email points badges');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all team members (including leader)
// @route   GET /api/member/team-members
// @access  Private/Member
const getTeamMembers = async (req, res) => {
  try {
    const member = await User.findById(req.user._id);
    
    if (!member.teamId) {
      return res.status(404).json({ message: 'You are not assigned to any team' });
    }

    const team = await Team.findById(member.teamId);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get all team members including leader
    const allMemberIds = [team.leaderId, ...team.memberIds];
    
    const teamMembers = await User.find({
      _id: { $in: allMemberIds }
    }).select('name email points badges role');

    res.json(teamMembers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get team leaderboard
// @route   GET /api/member/leaderboard
// @access  Private/Member
const getLeaderboard = async (req, res) => {
  try {
    const member = await User.findById(req.user._id);
    
    if (!member.teamId) {
      return res.status(404).json({ message: 'You are not assigned to any team' });
    }

    const team = await Team.findById(member.teamId);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get all team members including leader, sorted by points
    const allMemberIds = [team.leaderId, ...team.memberIds];
    
    const leaderboard = await User.find({
      _id: { $in: allMemberIds }
    })
      .select('name email points badges')
      .sort({ points: -1 });

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task status (with points reward)
// @route   PUT /api/member/update-task/:id
// @access  Private/Member
const updateTask = async (req, res) => {
  try {
    const { status } = req.body;
    console.log(`Updating task ${req.params.id} to status: ${status}`);
    
    const task = await Task.findById(req.params.id);

    if (!task) {
      console.log('Task not found:', req.params.id);
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('Current task status:', task.status);
    console.log('Task assigned to:', task.assignedTo.toString());
    console.log('Current user:', req.user._id.toString());

    // Verify task belongs to user
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      console.log('Authorization failed - task does not belong to user');
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const oldStatus = task.status;
    task.status = status;
    await task.save();
    
    console.log(`Task status updated from ${oldStatus} to ${status}`);

    // Award points based on status change
    const user = await User.findById(req.user._id);
    let pointsAwarded = 0;
    
    // Starting a task: +5 points
    if (oldStatus === 'todo' && (status === 'in-progress' || status === 'inprogress')) {
      user.points = (user.points || 0) + 5;
      pointsAwarded = 5;
      console.log('Awarded 5 points for starting task');
    }
    
    // Completing a task: +10 points (total +15 with start bonus)
    if ((oldStatus === 'in-progress' || oldStatus === 'inprogress') && status === 'done') {
      user.points = (user.points || 0) + 10;
      pointsAwarded = 10;
      console.log('Awarded 10 points for completing task');
      
      // Award badges based on completed tasks count
      const completedTasks = await Task.countDocuments({
        assignedTo: user._id,
        status: 'done'
      });
      
      console.log(`User has completed ${completedTasks} tasks total`);
      
      if (completedTasks === 5 && !user.badges.includes('Rising Star')) {
        user.badges.push('Rising Star');
        console.log('Awarded Rising Star badge!');
      }
      if (completedTasks === 10 && !user.badges.includes('Task Master')) {
        user.badges.push('Task Master');
        console.log('Awarded Task Master badge!');
      }
      if (completedTasks === 20 && !user.badges.includes('Team Player')) {
        user.badges.push('Team Player');
        console.log('Awarded Team Player badge!');
      }
    }
    
    await user.save();
    console.log(`User total points: ${user.points}`);

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email points badges')
      .populate('assignedBy', 'name email');

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTasks,
  getTeam,
  getTeamMembers,
  getLeaderboard,
  updateTask
};