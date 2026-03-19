const fetch = require('node-fetch');

// Daily.co API configuration
const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

// @desc    Create a new meeting room
// @param   {String} roomName - Unique room name
// @param   {Number} maxDuration - Meeting duration in minutes (default: 60)
const createMeetingRoom = async (roomName, maxDuration = 60) => {
  try {
    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private', // Only people with link can join
        properties: {
          max_participants: 12, // Maximum participants
          enable_chat: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + (maxDuration * 60) // Expiration time
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.info || 'Failed to create room');
    }

    const room = await response.json();
    
    return {
      success: true,
      roomName: room.name,
      url: room.url,
      meetingId: room.id,
      expiresAt: new Date(room.config.exp * 1000)
    };

  } catch (error) {
    console.error('❌ Daily.co error:', error);
    throw new Error('Failed to create meeting room');
  }
};

// @desc    Get meeting room details
// @param   {String} roomName - Room name
const getMeetingRoom = async (roomName) => {
  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error('Room not found');
    }

    const room = await response.json();
    return {
      success: true,
      roomName: room.name,
      url: room.url,
      config: room.config
    };

  } catch (error) {
    console.error('❌ Error fetching room:', error);
    return { success: false, error: error.message };
  }
};

// @desc    Delete meeting room
// @param   {String} roomName - Room name
const deleteMeetingRoom = async (roomName) => {
  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete room');
    }

    return { success: true, message: 'Room deleted successfully' };

  } catch (error) {
    console.error('❌ Error deleting room:', error);
    return { success: false, error: error.message };
  }
};

// @desc    Generate meeting token for user (optional - for extra security)
// @param   {String} roomName - Room name
// @param   {String} userName - User's name
const generateMeetingToken = async (roomName, userName) => {
  try {
    const response = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_name: userName,
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate token');
    }

    const data = await response.json();
    return { success: true, token: data.token };

  } catch (error) {
    console.error('❌ Error generating token:', error);
    return { success: false, error: error.message };
  }
};

// @desc    Create team meeting room with custom name
// @param   {String} teamName - Team name
// @param   {String} purpose - Meeting purpose
const createTeamMeeting = async (teamName, purpose = 'team-meeting') => {
  // Generate unique room name
  const timestamp = Date.now();
  const roomName = `${teamName.toLowerCase().replace(/\s+/g, '-')}-${purpose}-${timestamp}`;
  
  return await createMeetingRoom(roomName, 120); // 2 hour meeting
};

module.exports = {
  createMeetingRoom,
  getMeetingRoom,
  deleteMeetingRoom,
  generateMeetingToken,
  createTeamMeeting
};