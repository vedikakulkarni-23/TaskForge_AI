const { 
  generateTaskDescription, 
  generateTeamInsights,
  prioritizeTasks,
  generateMeetingAgenda,
  chatWithAI
} = require('../services/groqService');
const Task = require('../models/Task');
const Team = require('../models/Team');

// @desc    Generate AI task description
// @route   POST /api/ai/generate-task
// @access  Private
const generateTask = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    console.log('🤖 AI generating task for:', title);

    const result = await generateTaskDescription(title);

    if (!result.success) {
      return res.status(500).json({ 
        message: 'AI generation failed',
        fallback: result.fallback 
      });
    }

    res.json({
      success: true,
      task: result.data
    });

  } catch (error) {
    console.error('❌ Error in AI task generation:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get AI team insights
// @route   GET /api/ai/team-insights/:teamId
// @access  Private/TeamLeader
const getTeamInsights = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId).populate('memberIds leaderId');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get all team tasks
    const allAssignees = [...team.memberIds.map(m => m._id), team.leaderId._id];
    const tasks = await Task.find({ assignedTo: { $in: allAssignees } });

    const teamStats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'done').length,
      inProgressTasks: tasks.filter(t => t.status === 'inprogress').length,
      teamMembers: team.memberIds.length + 1,
      avgPoints: Math.round(
        ([...team.memberIds, team.leaderId].reduce((sum, m) => sum + (m.points || 0), 0)) / 
        (team.memberIds.length + 1)
      )
    };

    console.log('🤖 Generating team insights...');

    const result = await generateTeamInsights(teamStats);

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to generate insights' });
    }

    res.json({
      success: true,
      stats: teamStats,
      insights: result.insights
    });

  } catch (error) {
    console.error('❌ Error generating insights:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    AI task prioritization
// @route   POST /api/ai/prioritize-tasks
// @access  Private
const aiPrioritizeTasks = async (req, res) => {
  try {
    const { taskIds } = req.body;

    const tasks = await Task.find({ _id: { $in: taskIds } });

    if (tasks.length === 0) {
      return res.status(400).json({ message: 'No tasks found' });
    }

    console.log('🤖 AI prioritizing', tasks.length, 'tasks...');

    const result = await prioritizeTasks(tasks);

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to prioritize tasks' });
    }

    res.json({
      success: true,
      prioritization: result.data
    });

  } catch (error) {
    console.error('❌ Error prioritizing tasks:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate meeting agenda
// @route   POST /api/ai/meeting-agenda
// @access  Private/TeamLeader
const generateAgenda = async (req, res) => {
  try {
    const { purpose, attendees } = req.body;

    if (!purpose) {
      return res.status(400).json({ message: 'Meeting purpose is required' });
    }

    console.log('🤖 Generating meeting agenda for:', purpose);

    const result = await generateMeetingAgenda(purpose, attendees || []);

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to generate agenda' });
    }

    res.json({
      success: true,
      agenda: result.agenda
    });

  } catch (error) {
    console.error('❌ Error generating agenda:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Chat with AI assistant
// @route   POST /api/ai/chat
// @access  Private
const aiChat = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    console.log('🤖 AI chat:', message.substring(0, 50) + '...');

    const result = await chatWithAI(message, history || []);

    res.json({
      success: result.success,
      response: result.response
    });

  } catch (error) {
    console.error('❌ Error in AI chat:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateTask,
  getTeamInsights,
  aiPrioritizeTasks,
  generateAgenda,
  aiChat
};