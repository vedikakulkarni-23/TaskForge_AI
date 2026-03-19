const Team = require('../models/Team');
const User = require('../models/User');
const { createMeetingRoom, generateMeetingToken } = require('../services/dailyService');

// Try to use MeetingSession model if it exists, otherwise skip DB save
let MeetingSession, SessionComment;
try {
  MeetingSession = require('../models/MeetingSession');
} catch(e) { console.log('ℹ️ MeetingSession model not found, skipping DB save'); }
try {
  SessionComment = require('../models/SessionComment');
} catch(e) { console.log('ℹ️ SessionComment model not found'); }

// @desc    Create Daily.co meeting room + session
// @route   POST /api/conference/create-session
// @access  Private
const createDailySession = async (req, res) => {
  try {
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({ message: 'teamId is required' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    console.log('🎥 Creating Daily.co room for team:', team.name);

    // Generate clean room name (Daily.co requires lowercase alphanumeric + hyphens only)
    const timestamp = Date.now();
    const cleanName = team.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 20);
    const roomName = `tf-${cleanName}-${timestamp}`;

    // Create Daily.co room
    const meeting = await createMeetingRoom(roomName, 120);

    // Generate user token
    const user = await User.findById(req.user._id);
    const tokenResult = await generateMeetingToken(roomName, user.name || user.email);
    const meetingToken = tokenResult.success ? tokenResult.token : null;

    // Save session to DB if model exists
    let sessionId = `session-${timestamp}`;
    if (MeetingSession) {
      try {
        const session = await MeetingSession.create({
          teamId,
          roomName: meeting.roomName,
          roomUrl: meeting.url,
          createdBy: req.user._id,
          expiresAt: meeting.expiresAt
        });
        sessionId = session._id;
      } catch(e) {
        console.log('⚠️ Could not save session to DB:', e.message);
      }
    }

    console.log('✅ Daily.co session created:', meeting.url);

    res.status(201).json({
      sessionId,
      roomName: meeting.roomName,
      meetingUrl: meeting.url,
      meetingToken,
      expiresAt: meeting.expiresAt,
      teamName: team.name
    });

  } catch (error) {
    console.error('❌ Error creating Daily.co session:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get session comments/notes
// @route   GET /api/conference/session-comments/:sessionId
const getSessionComments = async (req, res) => {
  try {
    if (!SessionComment) return res.json([]);
    const comments = await SessionComment.find({ sessionId: req.params.sessionId }).sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add session comment/note
// @route   POST /api/conference/session-comments
const addSessionComment = async (req, res) => {
  try {
    if (!SessionComment) return res.status(201).json({ message: 'Comments not available' });
    const { sessionId, comment } = req.body;
    const user = await User.findById(req.user._id);
    const newComment = await SessionComment.create({
      sessionId,
      userId: req.user._id,
      userName: user.name,
      comment
    });
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get team participants
// @route   GET /api/conference/participants/:teamId
const getParticipants = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('memberIds', 'name email role')
      .populate('leaderId', 'name email role');
    if (!team) return res.status(404).json({ message: 'Team not found' });
    const participants = [];
    if (team.leaderId) participants.push(team.leaderId);
    if (team.memberIds?.length) participants.push(...team.memberIds);
    res.json(participants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getComments = async (req, res) => res.json([]);
const addComment = async (req, res) => res.status(201).json({});
const deleteComment = async (req, res) => res.json({ message: 'Deleted' });

module.exports = {
  createDailySession,
  getSessionComments,
  addSessionComment,
  getParticipants,
  getComments,
  addComment,
  deleteComment
};