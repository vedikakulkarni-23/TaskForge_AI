const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB error:', err));

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teamLeaderRoutes = require('./routes/teamLeaderRoutes');
const memberRoutes = require('./routes/memberRoutes');
const aiRoutes = require('./routes/aiRoutes');
const conferenceRoutes = require('./routes/conferenceRoutes');

app.get('/', (req, res) => {
  res.send('TaskForge backend is running');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tl', teamLeaderRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/conference', conferenceRoutes);

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('🔌 Connected:', socket.id);

  socket.on('create-room', ({ roomId, userId, userName, role }) => {
    socket.join(roomId);

    rooms.set(roomId, {
      host: { socketId: socket.id, userId, userName, role },
      participants: new Map([
        [socket.id, { userId, userName, role, socketId: socket.id }]
      ]),
      lobby: new Map()
    });

    socket.emit('existing-peers', []);
    io.to(roomId).emit('room-users', Array.from(rooms.get(roomId).participants.values()));
    console.log(`🏠 Room created: ${roomId} by ${userName}`);
  });

  socket.on('join-room', ({ roomId, userId, userName, role, isGuest }) => {
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('join-error', {
        message: 'Room not found. The host may not have started the meeting yet.'
      });
      return;
    }

    if (role === 'admin' || role === 'teamleader' || role === 'member') {
      admitUser(socket, roomId, { userId, userName, role });
    } else {
      room.lobby.set(socket.id, {
        userId,
        userName,
        role: role || 'guest',
        socketId: socket.id,
        isGuest: !!isGuest
      });

      socket.join(`lobby-${roomId}`);

      io.to(room.host.socketId).emit('lobby-request', {
        socketId: socket.id,
        userName,
        userId,
        role: role || 'guest',
        isGuest: !!isGuest
      });

      socket.emit('waiting-lobby', {
        message: 'Waiting for the host to let you in...'
      });

      console.log(`🚪 ${userName} waiting in lobby for ${roomId}`);
    }
  });

  socket.on('admit-user', ({ roomId, targetSocketId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const lobbyUser = room.lobby.get(targetSocketId);
    if (!lobbyUser) return;

    room.lobby.delete(targetSocketId);
    const targetSocket = io.sockets.sockets.get(targetSocketId);

    admitUser(targetSocket, roomId, lobbyUser);
    console.log(`✅ ${lobbyUser.userName} admitted to ${roomId}`);
  });

  socket.on('deny-user', ({ roomId, targetSocketId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.lobby.get(targetSocketId);
    room.lobby.delete(targetSocketId);

    io.to(targetSocketId).emit('join-denied', {
      message: 'The host did not admit you to this meeting.'
    });

    console.log(`❌ ${user?.userName} denied from ${roomId}`);
  });

  socket.on('offer', ({ to, offer, userName }) => {
    io.to(to).emit('offer', { from: socket.id, offer, userName });
  });

  socket.on('answer', ({ to, answer }) => {
    io.to(to).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  socket.on('chat-message', ({ roomId, message, userName, userId }) => {
    io.to(roomId).emit('chat-message', {
      id: Date.now(),
      message,
      userName,
      userId,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('media-state', ({ roomId, audio, video }) => {
    socket.to(roomId).emit('peer-media-state', {
      socketId: socket.id,
      audio,
      video
    });
  });

  socket.on('screen-share', ({ roomId, sharing }) => {
    socket.to(roomId).emit('peer-screen-share', {
      socketId: socket.id,
      sharing
    });
  });

  socket.on('leave-room', ({ roomId }) => {
    handleLeave(socket, roomId);
  });

  socket.on('disconnect', () => {
    rooms.forEach((_, roomId) => {
      const room = rooms.get(roomId);
      if (room && (room.participants.has(socket.id) || room.lobby.has(socket.id))) {
        handleLeave(socket, roomId);
      }
    });
  });
});

function admitUser(socket, roomId, userInfo) {
  if (!socket) return;

  const room = rooms.get(roomId);
  if (!room) return;

  socket.join(roomId);
  socket.leave(`lobby-${roomId}`);

  room.participants.set(socket.id, {
    ...userInfo,
    socketId: socket.id
  });

  const existingPeers = [];
  room.participants.forEach((peer, sid) => {
    if (sid !== socket.id) {
      existingPeers.push({
        socketId: sid,
        userId: peer.userId,
        userName: peer.userName
      });
    }
  });

  socket.emit('existing-peers', existingPeers);
  socket.emit('join-admitted', { roomId });

  socket.to(roomId).emit('user-joined', {
    socketId: socket.id,
    userId: userInfo.userId,
    userName: userInfo.userName,
    role: userInfo.role
  });

  io.to(roomId).emit('room-users', Array.from(room.participants.values()));
}

function handleLeave(socket, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const user = room.participants.get(socket.id) || room.lobby.get(socket.id);

  room.participants.delete(socket.id);
  room.lobby.delete(socket.id);

  if (room.participants.size === 0) {
    rooms.delete(roomId);
  }

  socket.to(roomId).emit('user-left', {
    socketId: socket.id,
    userName: user?.userName
  });

  io.to(roomId).emit(
    'room-users',
    Array.from((rooms.get(roomId)?.participants || new Map()).values())
  );

  socket.leave(roomId);
  console.log(`👋 ${user?.userName} left ${roomId}`);
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`🤖 Groq AI: ${process.env.GROQ_API_KEY ? 'Enabled' : 'Not configured'}`);
  console.log('🎥 WebRTC: Enabled with lobby system');
});