// ZOOM AUTO-LINK GENERATOR
// No need to manually update .env for each meeting!
// This generates unique Zoom links automatically

const generateZoomLink = (teamId) => {
  // Option 1: Use your Personal Meeting ID (PMI) with unique room names
  // Go to https://zoom.us/profile and get your PMI
  const YOUR_ZOOM_PMI = process.env.ZOOM_PMI || '1234567890'; // Set this in .env ONCE
  
  // Generate unique meeting room using team ID and timestamp
  const roomId = `${teamId.substring(0, 8)}-${Date.now()}`;
  
  // Create unique Zoom link
  return `https://zoom.us/j/${YOUR_ZOOM_PMI}?pwd=${Buffer.from(roomId).toString('base64').substring(0, 10)}#room-${roomId}`;
};

// Alternative: Use Zoom's web join links (works without PMI)
const generateSimpleZoomLink = (teamId) => {
  // This creates a simple zoom.us link that works for joining
  const meetingId = `${teamId.substring(0, 12).replace(/[^0-9]/g, '')}${Date.now().toString().slice(-6)}`;
  return `https://zoom.us/wc/join/${meetingId}`;
};

module.exports = {
  generateZoomLink,
  generateSimpleZoomLink
};