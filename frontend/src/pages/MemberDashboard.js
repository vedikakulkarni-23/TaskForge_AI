import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const MemberDashboard = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [user, setUser] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        fetchTasks(),
        fetchTeam(),
        fetchLeaderboard()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get('/member/tasks');
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    }
  };

  const fetchTeam = async () => {
    try {
      const response = await api.get('/member/team');
      setTeam(response.data);
      
      const membersResponse = await api.get('/member/team-members');
      setTeamMembers(Array.isArray(membersResponse.data) ? membersResponse.data : []);
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/member/leaderboard');
      setLeaderboard(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/member/update-task/${taskId}`, { status: newStatus });
      await fetchAllData(); // Refresh all data including points
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const bgMain = darkMode ? 'bg-[#191919]' : 'bg-gray-50';
  const bgCard = darkMode ? 'bg-[#252525]' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-800' : 'border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    inprogress: tasks.filter(t => t.status === 'inprogress' || t.status === 'in-progress'),
    done: tasks.filter(t => t.status === 'done')
  };

  const getBadgeIcon = (badge) => {
    if (badge === 'Rising Star') return '⭐';
    if (badge === 'Task Master') return '🏆';
    if (badge === 'Team Player') return '🤝';
    return '🎖️';
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${bgMain} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className={textPrimary}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${bgMain} flex items-center justify-center`}>
        <div className={`${bgCard} p-8 rounded-lg border ${borderColor} max-w-md text-center`}>
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className={`text-lg font-semibold ${textPrimary} mb-2`}>Error Loading Dashboard</h2>
          <p className={`${textSecondary} mb-4`}>{error}</p>
          <div className="flex gap-3">
            <button
              onClick={fetchAllData}
              className={`flex-1 px-4 py-2 ${darkMode ? 'bg-white text-black' : 'bg-gray-900 text-white'} rounded-md`}
            >
              Retry
            </button>
            <button
              onClick={handleLogout}
              className={`flex-1 px-4 py-2 ${darkMode ? 'bg-[#191919] border border-gray-800 text-white' : 'bg-white border text-gray-900'} rounded-md`}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgMain}`}>
      {/* Header */}
      <div className={`${bgCard} border-b ${borderColor}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className={`text-xl font-semibold ${textPrimary}`}>Member Dashboard</h1>
            <p className={`text-sm ${textSecondary} mt-0.5`}>
              {team?.name || 'No Team Assigned'}
              {team?.leaderId && (
                <> • Led by <span className="font-medium">{team.leaderId.name}</span></>
              )}
              {' • '}{user?.points || 0} points
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-md ${darkMode ? 'bg-[#191919] text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900'} transition`}
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => navigate('/tools')}
              className={`px-4 py-2 ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'} rounded-md font-medium text-sm transition`}
            >
              Tools
            </button>
            <button
              onClick={handleLogout}
              className={`px-4 py-2 rounded-md font-medium text-sm transition ${darkMode ? 'bg-[#191919] text-white border border-gray-800 hover:bg-black' : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'}`}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Team Info with Leader */}
            {team && (
              <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
                <h2 className={`text-lg font-semibold ${textPrimary} mb-4`}>Team Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#191919]' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${textSecondary} mb-2`}>Team Name</p>
                    <p className={`text-xl font-semibold ${textPrimary}`}>{team.name}</p>
                  </div>
                  {team.leaderId && (
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                      <p className={`text-sm ${textSecondary} mb-2`}>👨‍💼 Team Leader</p>
                      <p className={`text-lg font-semibold ${textPrimary}`}>{team.leaderId.name}</p>
                      <p className={`text-xs ${textSecondary} mt-1`}>{team.leaderId.email}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Points & Badges */}
            <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
              <h2 className={`text-lg font-semibold ${textPrimary} mb-4`}>Your Progress</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#191919]' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${textSecondary} mb-1`}>Total Points</p>
                  <p className={`text-3xl font-bold ${textPrimary}`}>⭐ {user?.points || 0}</p>
                </div>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#191919]' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${textSecondary} mb-1`}>Badges Earned</p>
                  <div className="flex gap-1 mt-2">
                    {user?.badges && user.badges.length > 0 ? (
                      user.badges.map((badge, idx) => (
                        <span key={idx} title={badge} className="text-2xl">
                          {getBadgeIcon(badge)}
                        </span>
                      ))
                    ) : (
                      <p className={`text-sm ${textSecondary}`}>No badges yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Task Board */}
            <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
              <h2 className={`text-lg font-semibold ${textPrimary} mb-4`}>My Tasks</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                  <div key={status}>
                    <h3 className={`font-medium ${textPrimary} mb-3 capitalize flex items-center gap-2`}>
                      {status === 'todo' && '📋 To Do'}
                      {status === 'inprogress' && '⚡ In Progress'}
                      {status === 'done' && '✅ Done'}
                      <span className={`text-xs ${textSecondary}`}>({statusTasks.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {statusTasks.map(task => (
                        <div
                          key={task._id}
                          className={`p-3 rounded-lg border ${borderColor} ${darkMode ? 'bg-[#191919]' : 'bg-gray-50'}`}
                        >
                          <h4 className={`font-medium ${textPrimary} text-sm mb-1`}>{task.title}</h4>
                          <p className={`text-xs ${textSecondary} mb-2`}>{task.description}</p>
                          <div className="flex gap-1">
                            {status !== 'done' && (
                              <>
                                {status === 'todo' && (
                                  <button
                                    onClick={() => handleUpdateStatus(task._id, 'inprogress')}
                                    className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-blue-900 text-blue-100 hover:bg-blue-800' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                                  >
                                    Start
                                  </button>
                                )}
                                {status === 'inprogress' && (
                                  <button
                                    onClick={() => handleUpdateStatus(task._id, 'done')}
                                    className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-green-900 text-green-100 hover:bg-green-800' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                                  >
                                    Complete
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      {statusTasks.length === 0 && (
                        <p className={`text-center py-4 text-xs ${textSecondary}`}>No tasks</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Activity */}
            <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
              <h2 className={`text-lg font-semibold ${textPrimary} mb-4`}>Team Activity</h2>
              <div className="space-y-3">
                {teamMembers && teamMembers.length > 0 ? (
                  teamMembers.map(member => {
                    const isLeader = team?.leaderId?._id === member._id;
                    const isCurrentUser = member._id === user?.userId;
                    
                    return (
                      <div 
                        key={member._id} 
                        className={`p-3 rounded-lg ${
                          isCurrentUser 
                            ? 'ring-2 ring-blue-500' 
                            : isLeader
                              ? darkMode ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'
                              : darkMode ? 'bg-[#191919]' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium ${textPrimary}`}>
                                {member.name}
                                {isLeader && ' 👨‍💼'}
                              </p>
                              {isLeader && (
                                <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-200 text-purple-900'}`}>
                                  Team Leader
                                </span>
                              )}
                            </div>
                            <p className={`text-xs ${textSecondary}`}>
                              {member.tasks?.length || 0} tasks • {member.points || 0} points
                            </p>
                          </div>
                          {member.badges && member.badges.length > 0 && (
                            <div className="flex gap-1">
                              {member.badges.slice(0, 3).map((badge, idx) => (
                                <span key={idx} className="text-lg">{getBadgeIcon(badge)}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className={`text-center py-4 ${textSecondary}`}>No team members</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Leaderboard */}
          <div className="space-y-6">
            <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
              <h2 className={`text-lg font-semibold ${textPrimary} mb-4`}>🏆 Team Leaderboard</h2>
              <div className="space-y-3">
                {leaderboard && leaderboard.length > 0 ? (
                  leaderboard.map((member, index) => (
                    <div
                      key={member._id}
                      className={`p-3 rounded-lg ${member._id === user?.userId ? darkMode ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200' : darkMode ? 'bg-[#191919]' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {index === 0 && '🥇'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                            {index > 2 && `#${index + 1}`}
                          </span>
                          <div>
                            <p className={`font-medium ${textPrimary}`}>
                              {member.name}
                              {member._id === user?.userId && ' (You)'}
                            </p>
                            <p className={`text-xs ${textSecondary}`}>{member.points} points</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-center py-4 ${textSecondary}`}>No leaderboard data</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;