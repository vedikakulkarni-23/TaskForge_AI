import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

const AVATAR_COLORS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
];
const getColor = (name='') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const getInitials = (name='') => name.trim().split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)||'??';
const formatTime = (iso) => new Date(iso).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});

// ── Video Tile ────────────────────────────────────────────────────────────────
const VideoTile = ({ stream, userName, isLocal, audioOn, videoOn, isScreenShare, isLarge }) => {
  const videoRef = useRef(null);
  useEffect(() => { if (videoRef.current && stream) videoRef.current.srcObject = stream; }, [stream]);
  return (
    <div style={{ position:'relative', background:'#0f0f1a', borderRadius: isLarge?16:12, overflow:'hidden', aspectRatio:'16/9', display:'flex', alignItems:'center', justifyContent:'center', border: isLocal?'2px solid rgba(99,102,241,0.5)':'1px solid rgba(255,255,255,0.06)', boxShadow: isLocal?'0 0 0 1px rgba(99,102,241,0.3),0 8px 32px rgba(0,0,0,0.4)':'0 4px 16px rgba(0,0,0,0.3)', transition:'all 0.2s' }}>
      {stream && videoOn
        ? <video ref={videoRef} autoPlay playsInline muted={isLocal} style={{ width:'100%', height:'100%', objectFit: isScreenShare?'contain':'cover', background:'#000' }}/>
        : <div style={{ width:isLarge?72:48, height:isLarge?72:48, borderRadius:'50%', background:getColor(userName), display:'flex', alignItems:'center', justifyContent:'center', fontSize:isLarge?28:18, fontWeight:700, color:'#fff' }}>{getInitials(userName)}</div>
      }
      <div style={{ position:'absolute', bottom:8, left:8, display:'flex', alignItems:'center', gap:6, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', borderRadius:8, padding:'4px 10px', border:'1px solid rgba(255,255,255,0.1)' }}>
        {isLocal && <span style={{color:'#818cf8',fontSize:10,fontWeight:700,fontFamily:'monospace'}}>YOU</span>}
        {!isLocal && <span style={{color:'#f1f5f9',fontSize:11,fontWeight:500}}>{userName}</span>}
        {!audioOn && <span style={{fontSize:11}}>🔇</span>}
        {isScreenShare && <span style={{fontSize:10,color:'#34d399',fontWeight:700}}>SCREEN</span>}
      </div>
    </div>
  );
};

// ── Control Button ────────────────────────────────────────────────────────────
const CtrlBtn = ({ onClick, active, danger, icon, label, badge }) => (
  <button onClick={onClick} title={label} style={{ position:'relative', width:52, height:52, borderRadius:'50%', background: danger?(active?'rgba(239,68,68,0.2)':'#ef4444'): active?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.08)', border: danger?(active?'1.5px solid #ef4444':'none'): active?'1.5px solid rgba(99,102,241,0.6)':'1.5px solid rgba(255,255,255,0.12)', color: danger&&!active?'#fff': active&&!danger?'#818cf8':'#cbd5e1', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', backdropFilter:'blur(8px)' }}>
    {icon}
    {badge>0 && <span style={{ position:'absolute', top:-2, right:-2, background:'#ef4444', color:'#fff', fontSize:10, fontWeight:700, width:18, height:18, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #0f0f1a' }}>{badge}</span>}
  </button>
);

// ── Main Component ────────────────────────────────────────────────────────────
const VideoConference = () => {
  const [user, setUser] = useState(null);
  const [allTeams, setAllTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Screen states: 'pre' | 'lobby' | 'meeting'
  const [screen, setScreen] = useState('pre');
  const [roomId, setRoomId] = useState('');
  const [joinMode, setJoinMode] = useState(''); // 'create' | 'join' | 'link'
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [lobbyMessage, setLobbyMessage] = useState('');

  // Lobby requests (for host)
  const [lobbyRequests, setLobbyRequests] = useState([]); // [{socketId, userName, role, isGuest}]

  // Meeting state
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [peers, setPeers] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [unread, setUnread] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user')||'{}');
    setUser(userData);
    if (userData.role === 'admin') loadAllTeams(userData);
    else if (userData.role === 'teamleader') loadAllTeams(userData);
    else loadMemberTeam(userData);

    // Check if joining via link
    const params = new URLSearchParams(window.location.search);
    const linkRoom = params.get('room');
    if (linkRoom) {
      setRoomId(linkRoom);
      setJoinMode('link');
    }

    return () => cleanup();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior:'smooth' });
    if (showChat) setUnread(0);
  }, [chatMessages, showChat]);

  useEffect(() => {
    if (screen === 'meeting') {
      timerRef.current = setInterval(() => setElapsed(e=>e+1), 1000);
    } else { clearInterval(timerRef.current); setElapsed(0); }
    return () => clearInterval(timerRef.current);
  }, [screen]);

  const fmtElapsed = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const loadAllTeams = async (userData) => {
    try {
      const endpoint = userData.role === 'admin' ? '/api/admin/teams' : '/api/tl/team';
      if (userData.role === 'admin') {
        const res = await axios.get(endpoint, { headers:{ Authorization:`Bearer ${userData.token}` } });
        setAllTeams(res.data);
        if (res.data.length > 0) setSelectedTeam(res.data[0]);
      } else {
        const res = await axios.get(endpoint, { headers:{ Authorization:`Bearer ${userData.token}` } });
        const team = res.data;
        setAllTeams([team]);
        setSelectedTeam(team);
      }
    } catch(e) { console.error(e); }
  };

  const loadMemberTeam = async (userData) => {
    try {
      const res = await axios.get('/api/member/my-team', { headers:{ Authorization:`Bearer ${userData.token}` } });
      setAllTeams([res.data]);
      setSelectedTeam(res.data);
    } catch(e) {
      if (userData.teamId) setSelectedTeam({ _id: userData.teamId, name: 'Your Team' });
    }
  };

  const cleanup = useCallback(() => {
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t=>t.stop()); localStreamRef.current=null; }
    if (screenStreamRef.current) { screenStreamRef.current.getTracks().forEach(t=>t.stop()); screenStreamRef.current=null; }
    if (socketRef.current) { socketRef.current.disconnect(); socketRef.current=null; }
    setPeers({}); setLocalStream(null); setScreenStream(null);
  }, []);

  const createPeerConnection = useCallback((remoteSocketId, isInitiator, remoteUserName) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[remoteSocketId] = pc;
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    }
    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) socketRef.current.emit('ice-candidate', { to:remoteSocketId, candidate:e.candidate });
    };
    pc.ontrack = (e) => {
      const [remoteStream] = e.streams;
      setPeers(prev => ({ ...prev, [remoteSocketId]: { ...prev[remoteSocketId], stream:remoteStream, userName:remoteUserName, audioOn:true, videoOn:true } }));
    };
    pc.onconnectionstatechange = () => {
      if (['failed','disconnected','closed'].includes(pc.connectionState)) {
        pc.close(); delete peerConnectionsRef.current[remoteSocketId];
        setPeers(prev => { const n={...prev}; delete n[remoteSocketId]; return n; });
      }
    };
    if (isInitiator) {
      pc.createOffer().then(o=>pc.setLocalDescription(o)).then(()=>{
        socketRef.current?.emit('offer',{ to:remoteSocketId, offer:pc.localDescription, from:socketRef.current.id, userName:user?.name });
      }).catch(console.error);
    }
    return pc;
  }, [user]);

  const initSocket = useCallback((userData) => {
    const socket = io(process.env.REACT_APP_BACKEND_URL||'http://localhost:5000', { transports:['websocket'] });
    socketRef.current = socket;

    socket.on('room-created', () => console.log('✅ Room created'));
    socket.on('join-admitted', () => { setScreen('meeting'); setLobbyMessage(''); });
    socket.on('waiting-lobby', ({ message }) => { setScreen('lobby'); setLobbyMessage(message); });
    socket.on('join-error', ({ message }) => { setError(message); setLoading(false); setScreen('pre'); cleanup(); });
    socket.on('join-denied', ({ message }) => { setError(message); setLoading(false); setScreen('pre'); cleanup(); });

    // Lobby requests (host sees these)
    socket.on('lobby-request', (request) => {
      setLobbyRequests(prev => [...prev, request]);
    });

    socket.on('existing-peers', (eps) => {
      eps.forEach(({ socketId, userName:n }) => {
        setPeers(prev => ({ ...prev, [socketId]:{ userName:n, stream:null, audioOn:true, videoOn:true } }));
        createPeerConnection(socketId, true, n);
      });
      setScreen('meeting');
    });

    socket.on('user-joined', ({ socketId, userName:n }) => {
      setPeers(prev => ({ ...prev, [socketId]:{ userName:n, stream:null, audioOn:true, videoOn:true } }));
      createPeerConnection(socketId, false, n);
      setChatMessages(prev=>[...prev,{ id:Date.now(), system:true, message:`${n} joined` }]);
    });

    socket.on('offer', async ({ from, offer, userName:n }) => {
      let pc = peerConnectionsRef.current[from];
      if (!pc) { setPeers(prev=>({...prev,[from]:{userName:n,stream:null,audioOn:true,videoOn:true}})); pc=createPeerConnection(from,false,n); }
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer',{ to:from, answer:pc.localDescription });
    });
    socket.on('answer', async ({ from, answer }) => {
      const pc = peerConnectionsRef.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });
    socket.on('ice-candidate', async ({ from, candidate }) => {
      const pc = peerConnectionsRef.current[from];
      if (pc && candidate) { try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch(e){} }
    });
    socket.on('user-left', ({ socketId, userName:n }) => {
      if (peerConnectionsRef.current[socketId]) { peerConnectionsRef.current[socketId].close(); delete peerConnectionsRef.current[socketId]; }
      setPeers(prev => { const nx={...prev}; delete nx[socketId]; return nx; });
      setChatMessages(prev=>[...prev,{ id:Date.now(), system:true, message:`${n} left` }]);
    });
    socket.on('room-users', (users) => setParticipants(users));
    socket.on('chat-message', (msg) => {
      setChatMessages(prev=>[...prev,msg]);
      if (!showChat) setUnread(prev=>prev+1);
    });
    socket.on('peer-media-state', ({ socketId, audio, video }) => {
      setPeers(prev => prev[socketId]?{ ...prev,[socketId]:{ ...prev[socketId],audioOn:audio,videoOn:video } }:prev);
    });
    socket.on('peer-screen-share', ({ socketId, sharing }) => {
      setPeers(prev => prev[socketId]?{ ...prev,[socketId]:{ ...prev[socketId],screenSharing:sharing } }:prev);
    });

    return socket;
  }, [createPeerConnection, showChat, cleanup]);

  const getLocalStream = async () => {
    try { return await navigator.mediaDevices.getUserMedia({ video:true, audio:true }); }
    catch(e) {
      try { return await navigator.mediaDevices.getUserMedia({ video:false, audio:true }); }
      catch(e2) { throw new Error('Camera/mic permission denied. Please allow access in browser settings.'); }
    }
  };

  // ── Create room (host) ──
  const handleCreateRoom = async () => {
    if (!selectedTeam) { setError('Please select a team.'); return; }
    setLoading(true); setError('');
    try {
      const userData = JSON.parse(localStorage.getItem('user')||'{}');
      const stream = await getLocalStream();
      localStreamRef.current = stream;
      setLocalStream(stream);

      const today = new Date().toISOString().slice(0,10).replace(/-/g,'');
      const room = `tf-${selectedTeam._id}-${today}`;
      setRoomId(room);

      // Generate share link
      const link = `${window.location.origin}${window.location.pathname}?room=${room}`;
      setShareLink(link);

      const socket = initSocket(userData);
      socket.on('connect', () => {
        socket.emit('create-room', { roomId:room, userId:userData._id, userName:userData.name, role:userData.role });
        setScreen('meeting');
        setLoading(false);
      });
    } catch(err) { setError(err.message); setLoading(false); cleanup(); }
  };

  // ── Join existing room ──
  const handleJoinRoom = async (asGuest = false, guestName = '') => {
    if (!roomId.trim()) { setError('Please enter a room ID or use a link.'); return; }
    setLoading(true); setError('');
    try {
      const userData = JSON.parse(localStorage.getItem('user')||'{}');
      const stream = await getLocalStream();
      localStreamRef.current = stream;
      setLocalStream(stream);

      const socket = initSocket(userData);
      socket.on('connect', () => {
        socket.emit('join-room', {
          roomId: roomId.trim(),
          userId: asGuest ? `guest-${Date.now()}` : userData._id,
          userName: asGuest ? guestName : userData.name,
          role: asGuest ? 'guest' : userData.role,
          isGuest: asGuest
        });
        setLoading(false);
      });
    } catch(err) { setError(err.message); setLoading(false); cleanup(); }
  };

  const handleAdmit = (targetSocketId) => {
    socketRef.current?.emit('admit-user', { roomId, targetSocketId });
    setLobbyRequests(prev => prev.filter(r => r.socketId !== targetSocketId));
  };

  const handleDeny = (targetSocketId) => {
    socketRef.current?.emit('deny-user', { roomId, targetSocketId });
    setLobbyRequests(prev => prev.filter(r => r.socketId !== targetSocketId));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => { setLinkCopied(true); setTimeout(()=>setLinkCopied(false),2000); });
  };

  const leaveMeeting = () => {
    socketRef.current?.emit('leave-room', { roomId });
    cleanup(); setScreen('pre'); setChatMessages([]); setParticipants([]);
    setUnread(0); setShowChat(false); setLobbyRequests([]);
    setShareLink(''); setRoomId(''); setScreenSharing(false);
  };

  const toggleAudio = () => {
    if (!localStreamRef.current) return;
    const next = !audioOn;
    localStreamRef.current.getAudioTracks().forEach(t=>{ t.enabled=next; });
    setAudioOn(next);
    socketRef.current?.emit('media-state',{ roomId, audio:next, video:videoOn });
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const next = !videoOn;
    localStreamRef.current.getVideoTracks().forEach(t=>{ t.enabled=next; });
    setVideoOn(next);
    socketRef.current?.emit('media-state',{ roomId, audio:audioOn, video:next });
  };

  const toggleScreenShare = async () => {
    try {
      if (!screenSharing) {
        const sStream = await navigator.mediaDevices.getDisplayMedia({ video:true });
        const sTrack = sStream.getVideoTracks()[0];
        screenStreamRef.current = sStream;
        setScreenStream(sStream);
        Object.values(peerConnectionsRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s=>s.track?.kind==='video');
          if (sender) sender.replaceTrack(sTrack);
        });
        sTrack.onended = () => stopScreenShare();
        setScreenSharing(true);
        socketRef.current?.emit('screen-share',{ roomId, sharing:true });
      } else { stopScreenShare(); }
    } catch(e) { console.error(e); }
  };

  const stopScreenShare = async () => {
    try {
      if (screenStreamRef.current) { screenStreamRef.current.getTracks().forEach(t=>t.stop()); screenStreamRef.current=null; }
      setScreenStream(null);
      const camStream = await navigator.mediaDevices.getUserMedia({ video:true });
      const camTrack = camStream.getVideoTracks()[0];
      Object.values(peerConnectionsRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s=>s.track?.kind==='video');
        if (sender) sender.replaceTrack(camTrack);
      });
      const audioTracks = localStreamRef.current?.getAudioTracks()||[];
      const newStream = new MediaStream([camTrack,...audioTracks]);
      localStreamRef.current = newStream; setLocalStream(newStream);
      setScreenSharing(false);
      socketRef.current?.emit('screen-share',{ roomId, sharing:false });
    } catch(e) { console.error(e); }
  };

  const sendChat = () => {
    if (!chatInput.trim()||!socketRef.current) return;
    socketRef.current.emit('chat-message',{ roomId, message:chatInput, userName:user?.name, userId:user?._id });
    setChatInput('');
  };

  const isHost = true; // All users can create rooms
  const peerList = Object.entries(peers);
  const totalTiles = 1 + peerList.length;
  const gridCols = totalTiles===1?1: totalTiles<=2?2: totalTiles<=4?2: totalTiles<=6?3:4;

  // ─────────────────────────────────────────────────────────────────────────
  // PRE-MEETING SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'pre') return (
    <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 4px 24px rgba(0,0,0,0.08)', overflow:'hidden' }}>
      <div style={{ padding:'20px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#0f172a' }}>🎥 Video Conference</h2>
          <p style={{ margin:'2px 0 0', fontSize:12, color:'#6366f1', fontWeight:600 }}>Secure WebRTC — No third-party needed</p>
        </div>
      </div>

      {error && (
        <div style={{ margin:'16px 24px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 16px', color:'#dc2626', fontSize:13 }}>
          ⚠️ {error} <button onClick={()=>setError('')} style={{ marginLeft:8, background:'none', border:'none', color:'#dc2626', cursor:'pointer' }}>✕</button>
        </div>
      )}

      <div style={{ padding:'32px 24px' }}>

        {/* Join via link (auto-detected) */}
        {joinMode === 'link' && (
          <div style={{ maxWidth:480, margin:'0 auto' }}>
            <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:12, padding:'16px 20px', marginBottom:24, display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:24 }}>🔗</span>
              <div>
                <div style={{ fontWeight:700, color:'#0369a1', fontSize:14 }}>You were invited to a meeting</div>
                <div style={{ color:'#0284c7', fontSize:12, marginTop:2, fontFamily:'monospace' }}>Room: {roomId}</div>
              </div>
            </div>
            <button onClick={() => handleJoinRoom(false)} disabled={loading} style={btnStyle('#6366f1')}>
              {loading ? '⏳ Connecting...' : '🚀 Join Meeting'}
            </button>
            <button onClick={() => { setJoinMode(''); setRoomId(''); }} style={{ ...btnStyle('#64748b'), marginTop:10 }}>
              ← Back
            </button>
          </div>
        )}

        {/* Default: choose action */}
        {joinMode === '' && (
          <div style={{ maxWidth:520, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:32 }}>
              <div style={{ width:80, height:80, borderRadius:24, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, margin:'0 auto 16px', boxShadow:'0 12px 40px rgba(99,102,241,0.35)' }}>🎥</div>
              <h3 style={{ margin:'0 0 8px', fontSize:26, fontWeight:800, color:'#0f172a' }}>Start or Join a Meeting</h3>
              <p style={{ margin:0, color:'#64748b', fontSize:14 }}>Secure video calls for your team</p>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              {/* Create room (host) */}
              {isHost && (
                <div onClick={() => setJoinMode('create')} style={cardStyle}>
                  <div style={{ fontSize:36, marginBottom:10 }}>🏠</div>
                  <div style={{ fontWeight:700, color:'#0f172a', fontSize:15, marginBottom:4 }}>Create Room</div>
                  <div style={{ color:'#64748b', fontSize:12, lineHeight:1.5 }}>Start a new meeting for your team. Share the link with others.</div>
                  <div style={{ marginTop:12, fontSize:11, color:'#6366f1', fontWeight:600 }}>Admin / Team Leader only</div>
                </div>
              )}
              {/* Join room */}
              <div onClick={() => setJoinMode('join')} style={{...cardStyle, gridColumn: isHost?'auto':'1 / -1'}}>
                <div style={{ fontSize:36, marginBottom:10 }}>🚪</div>
                <div style={{ fontWeight:700, color:'#0f172a', fontSize:15, marginBottom:4 }}>Join Room</div>
                <div style={{ color:'#64748b', fontSize:12, lineHeight:1.5 }}>Enter a room ID to join an existing meeting.</div>
                <div style={{ marginTop:12, fontSize:11, color:'#10b981', fontWeight:600 }}>All team members</div>
              </div>
            </div>
          </div>
        )}

        {/* Create room flow */}
        {joinMode === 'create' && (
          <div style={{ maxWidth:480, margin:'0 auto' }}>
            <h3 style={{ margin:'0 0 20px', fontSize:20, fontWeight:700, color:'#0f172a' }}>🏠 Create Meeting Room</h3>

            {allTeams.length > 1 && (
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, color:'#64748b', fontWeight:600, display:'block', marginBottom:6 }}>SELECT TEAM</label>
                <select value={selectedTeam?._id||''} onChange={e => setSelectedTeam(allTeams.find(t=>t._id===e.target.value))}
                  style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'10px 14px', fontSize:14, color:'#0f172a', outline:'none', background:'#fff' }}>
                  {allTeams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
            )}

            {selectedTeam && (
              <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 16px', marginBottom:20, border:'1px solid #e2e8f0' }}>
                <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>Room will be created for:</div>
                <div style={{ fontWeight:700, color:'#0f172a', fontSize:15 }}>👥 {selectedTeam.name}</div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>Members need your approval to join</div>
              </div>
            )}

            <button onClick={handleCreateRoom} disabled={loading} style={btnStyle('#6366f1')}>
              {loading ? '⏳ Creating...' : '🚀 Create & Start Meeting'}
            </button>
            <button onClick={() => setJoinMode('')} style={{ ...btnStyle('#64748b'), marginTop:10 }}>← Back</button>
          </div>
        )}

        {/* Join room flow */}
        {joinMode === 'join' && (
          <div style={{ maxWidth:480, margin:'0 auto' }}>
            <h3 style={{ margin:'0 0 20px', fontSize:20, fontWeight:700, color:'#0f172a' }}>🚪 Join Meeting</h3>
            <label style={{ fontSize:12, color:'#64748b', fontWeight:600, display:'block', marginBottom:6 }}>ROOM ID</label>
            <input value={roomId} onChange={e=>setRoomId(e.target.value)} placeholder="Enter room ID (e.g. tf-abc123-20260318)"
              style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'12px 14px', fontSize:14, color:'#0f172a', outline:'none', boxSizing:'border-box', marginBottom:16 }}/>
            <button onClick={() => handleJoinRoom(false)} disabled={loading||!roomId.trim()} style={btnStyle('#6366f1')}>
              {loading ? '⏳ Joining...' : '🚀 Join Meeting'}
            </button>
            <button onClick={() => setJoinMode('')} style={{ ...btnStyle('#64748b'), marginTop:10 }}>← Back</button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // LOBBY WAITING SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (screen === 'lobby') return (
    <div style={{ background:'#080812', borderRadius:16, overflow:'hidden', minHeight:400, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', padding:40 }}>
      <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, marginBottom:24, animation:'pulse 2s infinite' }}>⏳</div>
      <h3 style={{ color:'#f1f5f9', fontSize:22, fontWeight:700, margin:'0 0 8px' }}>Waiting in Lobby</h3>
      <p style={{ color:'#64748b', fontSize:14, margin:'0 0 32px', textAlign:'center', maxWidth:320 }}>{lobbyMessage || 'The host will admit you shortly...'}</p>
      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        {[0,1,2].map(i=>(
          <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:'#6366f1', animation:`bounce 1.4s ease-in-out ${i*0.16}s infinite` }}/>
        ))}
      </div>
      <button onClick={() => { cleanup(); setScreen('pre'); setLobbyMessage(''); }} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', color:'#94a3b8', borderRadius:10, padding:'10px 24px', fontSize:14, cursor:'pointer' }}>
        Cancel
      </button>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      `}</style>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MEETING SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background:'#080812', borderRadius:16, overflow:'hidden', position:'relative', height:'88vh', display:'flex', flexDirection:'column' }}>

      {/* Lobby admission requests toast (host only) */}
      {isHost && lobbyRequests.length > 0 && (
        <div style={{ position:'absolute', top:64, right:16, zIndex:50, display:'flex', flexDirection:'column', gap:10 }}>
          {lobbyRequests.map(req => (
            <div key={req.socketId} style={{ background:'rgba(15,15,26,0.98)', border:'1px solid rgba(99,102,241,0.4)', borderRadius:14, padding:'14px 16px', backdropFilter:'blur(16px)', boxShadow:'0 8px 32px rgba(0,0,0,0.5)', minWidth:280 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:getColor(req.userName), display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#fff' }}>{getInitials(req.userName)}</div>
                <div>
                  <div style={{ color:'#f1f5f9', fontSize:14, fontWeight:600 }}>{req.userName}</div>
                  <div style={{ color:'#64748b', fontSize:11 }}>{req.isGuest ? '👤 Guest' : `${req.role}`} wants to join</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => handleAdmit(req.socketId)} style={{ flex:1, background:'linear-gradient(135deg,#10b981,#059669)', border:'none', borderRadius:8, padding:'8px 0', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>✅ Admit</button>
                <button onClick={() => handleDeny(req.socketId)} style={{ flex:1, background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:8, padding:'8px 0', color:'#ef4444', fontSize:13, fontWeight:700, cursor:'pointer' }}>❌ Deny</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top bar */}
      <div style={{ background:'rgba(15,15,26,0.95)', backdropFilter:'blur(12px)', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#ef4444', boxShadow:'0 0 8px #ef4444', animation:'pulse 2s infinite' }}/>
          <span style={{ color:'#f1f5f9', fontSize:14, fontWeight:700 }}>TASKFORGE</span>
          <span style={{ color:'#475569' }}>•</span>
          <span style={{ color:'#818cf8', fontSize:13, fontWeight:600 }}>{selectedTeam?.name || 'Meeting'}</span>
          <span style={{ background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc', fontSize:11, fontWeight:700, fontFamily:'monospace', padding:'3px 10px', borderRadius:6 }}>{fmtElapsed(elapsed)}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {screenSharing && (
            <span style={{ background:'rgba(52,211,153,0.15)', border:'1px solid rgba(52,211,153,0.3)', color:'#34d399', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:6 }}>● SHARING</span>
          )}
          {/* Share link button */}
          {isHost && shareLink && (
            <button onClick={copyLink} style={{ background: linkCopied?'rgba(16,185,129,0.2)':'rgba(99,102,241,0.15)', border:`1px solid ${linkCopied?'rgba(16,185,129,0.4)':'rgba(99,102,241,0.3)'}`, color: linkCopied?'#34d399':'#a5b4fc', fontSize:12, fontWeight:600, padding:'5px 14px', borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
              {linkCopied ? '✅ Copied!' : '🔗 Copy Invite Link'}
            </button>
          )}
          <span style={{ color:'#64748b', fontSize:12 }}>{participants.length} participant{participants.length!==1?'s':''}</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', position:'relative' }}>
        <div style={{ flex:1, padding:16, overflow:'auto' }}>
          {screenSharing && screenStream ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12, height:'100%' }}>
              <div style={{ flex:1, minHeight:0 }}>
                <VideoTile stream={screenStream} userName={`${user?.name} (Screen)`} isLocal={true} audioOn={audioOn} videoOn={true} isScreenShare={true} isLarge={true}/>
              </div>
              <div style={{ display:'flex', gap:10, height:120, flexShrink:0 }}>
                <div style={{ width:160, flexShrink:0 }}><VideoTile stream={localStream} userName={user?.name} isLocal={true} audioOn={audioOn} videoOn={videoOn}/></div>
                {peerList.map(([sid,peer]) => (
                  <div key={sid} style={{ width:160, flexShrink:0 }}><VideoTile stream={peer.stream} userName={peer.userName} audioOn={peer.audioOn} videoOn={peer.videoOn}/></div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:`repeat(${gridCols},1fr)`, gap:12, height:'100%', alignContent:'start' }}>
              <VideoTile stream={localStream} userName={user?.name} isLocal={true} audioOn={audioOn} videoOn={videoOn} isLarge={totalTiles===1}/>
              {peerList.map(([sid,peer]) => (
                <VideoTile key={sid} stream={peer.stream} userName={peer.userName} audioOn={peer.audioOn} videoOn={peer.videoOn} isScreenShare={peer.screenSharing}/>
              ))}
            </div>
          )}
        </div>

        {/* Chat panel */}
        {showChat && (
          <div style={{ width:300, background:'#0f0f1a', borderLeft:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ color:'#f1f5f9', fontSize:14, fontWeight:700 }}>💬 Chat</span>
              <button onClick={() => setShowChat(false)} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:16 }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8 }}>
              {chatMessages.length===0 && <div style={{ textAlign:'center', color:'#475569', fontSize:12, marginTop:40 }}>No messages yet</div>}
              {chatMessages.map((msg,i) => (
                msg.system
                  ? <div key={i} style={{ textAlign:'center', color:'#475569', fontSize:11, fontStyle:'italic', padding:'4px 0' }}>{msg.message}</div>
                  : (
                    <div key={i} style={{ display:'flex', flexDirection:'column', alignItems: msg.userId===user?._id?'flex-end':'flex-start' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                        <span style={{ fontSize:10, color:'#64748b', fontWeight:600 }}>{msg.userId===user?._id?'You':msg.userName}</span>
                        <span style={{ fontSize:9, color:'#334155' }}>{formatTime(msg.timestamp)}</span>
                      </div>
                      <div style={{ background: msg.userId===user?._id?'linear-gradient(135deg,#6366f1,#8b5cf6)':'rgba(255,255,255,0.07)', color:'#f1f5f9', fontSize:13, padding:'8px 12px', borderRadius: msg.userId===user?._id?'12px 12px 4px 12px':'12px 12px 12px 4px', maxWidth:220, wordBreak:'break-word', lineHeight:1.4, border: msg.userId===user?._id?'none':'1px solid rgba(255,255,255,0.08)' }}>{msg.message}</div>
                    </div>
                  )
              ))}
              <div ref={chatEndRef}/>
            </div>
            <div style={{ padding:12, borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:8 }}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&sendChat()} placeholder="Send a message..."
                style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#f1f5f9', outline:'none' }}/>
              <button onClick={sendChat} style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:10, padding:'10px 14px', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>Send</button>
            </div>
          </div>
        )}

        {/* Participants panel */}
        {showParticipants && (
          <div style={{ width:240, background:'#0f0f1a', borderLeft:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ color:'#f1f5f9', fontSize:14, fontWeight:700 }}>👥 Participants ({participants.length})</span>
              <button onClick={() => setShowParticipants(false)} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:16 }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8 }}>
              {participants.map((p,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'rgba(255,255,255,0.04)', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:getColor(p.userName), display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff' }}>{getInitials(p.userName)}</div>
                  <div>
                    <div style={{ color:'#f1f5f9', fontSize:13, fontWeight:600 }}>{p.userName}</div>
                    <div style={{ color:'#64748b', fontSize:11, textTransform:'capitalize' }}>{p.role}{p.role==='admin'||p.role==='teamleader'?' 👑':''}</div>
                  </div>
                </div>
              ))}
              {/* Pending lobby */}
              {isHost && lobbyRequests.length > 0 && (
                <>
                  <div style={{ color:'#f59e0b', fontSize:11, fontWeight:700, padding:'8px 4px 4px', borderTop:'1px solid rgba(255,255,255,0.06)', marginTop:4 }}>⏳ WAITING ({lobbyRequests.length})</div>
                  {lobbyRequests.map((r,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', background:'rgba(245,158,11,0.08)', borderRadius:10, border:'1px solid rgba(245,158,11,0.2)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:getColor(r.userName), display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff' }}>{getInitials(r.userName)}</div>
                        <div style={{ color:'#fcd34d', fontSize:12 }}>{r.userName}</div>
                      </div>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={()=>handleAdmit(r.socketId)} style={{ background:'#10b981', border:'none', borderRadius:6, padding:'3px 8px', color:'#fff', fontSize:11, cursor:'pointer' }}>✓</button>
                        <button onClick={()=>handleDeny(r.socketId)} style={{ background:'#ef4444', border:'none', borderRadius:6, padding:'3px 8px', color:'#fff', fontSize:11, cursor:'pointer' }}>✗</button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ background:'rgba(10,10,20,0.97)', backdropFilter:'blur(16px)', borderTop:'1px solid rgba(255,255,255,0.06)', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'center', gap:10, flexShrink:0 }}>
        <CtrlBtn onClick={toggleAudio} active={!audioOn} icon={audioOn?'🎙️':'🔇'} label={audioOn?'Mute':'Unmute'}/>
        <CtrlBtn onClick={toggleVideo} active={!videoOn} icon={videoOn?'📹':'📷'} label={videoOn?'Stop Video':'Start Video'}/>
        <CtrlBtn onClick={toggleScreenShare} active={screenSharing} icon="🖥️" label={screenSharing?'Stop Sharing':'Share Screen'}/>
        <div style={{ width:1, height:32, background:'rgba(255,255,255,0.1)', margin:'0 4px' }}/>
        <CtrlBtn onClick={() => { setShowChat(!showChat); setShowParticipants(false); if(!showChat) setUnread(0); }} active={showChat} icon="💬" label="Chat" badge={unread}/>
        <CtrlBtn onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }} active={showParticipants} icon="👥" label="Participants" badge={isHost?lobbyRequests.length:0}/>
        <div style={{ width:1, height:32, background:'rgba(255,255,255,0.1)', margin:'0 4px' }}/>
        <CtrlBtn onClick={leaveMeeting} danger={true} icon="📵" label="Leave Meeting"/>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
      `}</style>
    </div>
  );
};

// ── Style helpers ─────────────────────────────────────────────────────────────
const btnStyle = (bg) => ({
  width:'100%', background:bg, border:'none', borderRadius:12,
  padding:'14px 0', fontSize:16, fontWeight:700, color:'#fff',
  cursor:'pointer', boxSizing:'border-box', display:'block',
  boxShadow: bg==='#6366f1'?'0 4px 20px rgba(99,102,241,0.4)':'none',
});

const cardStyle = {
  background:'#f8fafc', borderRadius:14, padding:'20px 16px',
  cursor:'pointer', border:'1.5px solid #e2e8f0', textAlign:'center',
  transition:'all 0.15s',
  ':hover':{ borderColor:'#6366f1' }
};

export default VideoConference;