import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AdminDashboard = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Modal states
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAssignMember, setShowAssignMember] = useState(false);
  const [showManageCredits, setShowManageCredits] = useState(false);
  const [showAllTeams, setShowAllTeams] = useState(false);
  
  // Form states
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'member' });
  const [newTeam, setNewTeam] = useState({ name: '', leaderId: '', memberIds: [] });
  const [assignData, setAssignData] = useState({ userId: '', teamId: '' });
  const [selectedUserForCredits, setSelectedUserForCredits] = useState('');
  const [creditsAmount, setCreditsAmount] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const dashboardRes = await api.get('/admin/dashboard');
      setStats(dashboardRes.data.stats);
      setUsers(dashboardRes.data.users);
      setTeams(dashboardRes.data.teams);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      if (error.response?.status === 403) {
        setMessage({ text: 'Access denied. Admins only.', type: 'error' });
      }
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await api.post('/admin/create-user', newUser);
      setMessage({ 
        text: `User created! Verification email sent to ${newUser.email}`, 
        type: 'success' 
      });
      setNewUser({ name: '', email: '', role: 'member' });
      setShowCreateUser(false);
      fetchDashboardData();
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || 'Failed to create user', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await api.post('/admin/create-team', newTeam);
      setMessage({ text: 'Team created successfully!', type: 'success' });
      setNewTeam({ name: '', leaderId: '', memberIds: [] });
      setShowCreateTeam(false);
      fetchDashboardData();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to create team', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMember = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await api.post('/admin/assign-member', assignData);
      setMessage({ text: 'User assigned to team successfully!', type: 'success' });
      setAssignData({ userId: '', teamId: '' });
      setShowAssignMember(false);
      fetchDashboardData();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to assign user', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredits = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await api.put(`/admin/update-credits/${selectedUserForCredits}`, { credits: creditsAmount });
      setMessage({ text: 'Credits updated successfully!', type: 'success' });
      setSelectedUserForCredits('');
      setCreditsAmount(0);
      setShowManageCredits(false);
      fetchDashboardData();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to update credits', type: 'error' });
    } finally {
      setLoading(false);
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

  const teamLeaders = users.filter(u => u.role === 'teamleader');
  const teamMembers = users.filter(u => u.role === 'member');

  return (
    <div className={`min-h-screen ${bgMain}`}>
      {/* Header */}
      <div className={`${bgCard} border-b ${borderColor}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className={`text-xl font-semibold ${textPrimary}`}>Admin Dashboard</h1>
            <p className={`text-sm ${textSecondary} mt-0.5`}>Manage users, teams, and tasks</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
            <p className={`text-sm ${textSecondary} mb-1`}>Total Users</p>
            <p className={`text-3xl font-semibold ${textPrimary}`}>{stats.totalUsers || 0}</p>
          </div>
          <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
            <p className={`text-sm ${textSecondary} mb-1`}>Total Teams</p>
            <p className={`text-3xl font-semibold ${textPrimary}`}>{stats.totalTeams || 0}</p>
          </div>
          <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
            <p className={`text-sm ${textSecondary} mb-1`}>Total Tasks</p>
            <p className={`text-3xl font-semibold ${textPrimary}`}>{stats.totalTasks || 0}</p>
          </div>
          <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
            <p className={`text-sm ${textSecondary} mb-1`}>Completion Rate</p>
            <p className={`text-3xl font-semibold ${textPrimary}`}>{stats.completionRate || 0}%</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-8">
          <button 
            onClick={() => setShowCreateUser(true)}
            className={`px-4 py-2 ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'} rounded-md font-medium text-sm transition`}
          >
            Create User
          </button>
          <button 
            onClick={() => setShowCreateTeam(true)}
            className={`px-4 py-2 ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'} rounded-md font-medium text-sm transition`}
          >
            Create Team
          </button>
          <button 
            onClick={() => setShowAssignMember(true)}
            className={`px-4 py-2 ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'} rounded-md font-medium text-sm transition`}
          >
            Assign to Team
          </button>
          <button 
            onClick={() => setShowManageCredits(true)}
            className={`px-4 py-2 ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'} rounded-md font-medium text-sm transition`}
          >
            Manage Credits
          </button>
          <button 
            onClick={() => setShowAllTeams(true)}
            className={`px-4 py-2 ${darkMode ? 'bg-[#191919] border border-gray-800 text-white hover:bg-black' : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'} rounded-md font-medium text-sm transition`}
          >
            View All Teams
          </button>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Users Table */}
          <div className={`${bgCard} border ${borderColor} rounded-lg`}>
            <div className={`px-6 py-4 border-b ${borderColor}`}>
              <h2 className={`text-lg font-semibold ${textPrimary}`}>Users</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {users && users.length > 0 ? (
                  users.slice(0, 5).map(user => (
                    <div key={user._id} className={`flex justify-between items-center p-3 rounded-md ${darkMode ? 'bg-[#191919]' : 'bg-gray-50'}`}>
                      <div>
                        <p className={`font-medium ${textPrimary}`}>{user.name}</p>
                        <p className={`text-sm ${textSecondary}`}>{user.email}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} ${textSecondary}`}>
                          {user.role}
                        </span>
                        {!user.isEmailVerified && (
                          <p className={`text-xs ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} mt-1`}>
                            ⏳ Pending verification
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-sm ${textSecondary} text-center py-4`}>No users found</p>
                )}
              </div>
            </div>
          </div>

          {/* Teams Table */}
          <div className={`${bgCard} border ${borderColor} rounded-lg`}>
            <div className={`px-6 py-4 border-b ${borderColor}`}>
              <h2 className={`text-lg font-semibold ${textPrimary}`}>Teams</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {teams && teams.length > 0 ? (
                  teams.slice(0, 5).map(team => (
                    <div key={team._id} className={`rounded-md border ${borderColor} overflow-hidden`}>
                      <div className={`flex justify-between items-center p-3 ${darkMode ? 'bg-[#191919]' : 'bg-gray-50'}`}>
                        <div className="flex-1">
                          <p className={`font-medium ${textPrimary}`}>{team.name}</p>
                          <p className={`text-sm ${textSecondary}`}>
                            {team.memberIds?.length || 0} members
                          </p>
                        </div>
                      </div>
                      
                      <div className={`px-3 py-2 ${darkMode ? 'bg-[#252525]' : 'bg-white'} border-t ${borderColor}`}>
                        {team.leaderId && (
                          <div className="mb-2">
                            <p className={`text-xs ${textSecondary} mb-1`}>Team Leader:</p>
                            <div className={`flex items-center gap-2 px-2 py-1.5 rounded ${darkMode ? 'bg-[#191919]' : 'bg-gray-50'}`}>
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                {team.leaderId.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${textPrimary}`}>{team.leaderId.name}</p>
                                <p className={`text-xs ${textSecondary}`}>{team.leaderId.email}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {team.memberIds && team.memberIds.length > 0 && (
                          <div>
                            <p className={`text-xs ${textSecondary} mb-1`}>Members:</p>
                            <div className="space-y-1">
                              {team.memberIds.slice(0, 3).map(member => (
                                <div key={member._id} className={`flex items-center gap-2 px-2 py-1.5 rounded ${darkMode ? 'bg-[#191919]' : 'bg-gray-50'}`}>
                                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                    {member.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${textPrimary} truncate`}>{member.name}</p>
                                    <p className={`text-xs ${textSecondary} truncate`}>{member.email}</p>
                                  </div>
                                  {member.points !== undefined && (
                                    <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-[#252525]' : 'bg-white'} ${textSecondary}`}>
                                      {member.points} pts
                                    </span>
                                  )}
                                </div>
                              ))}
                              {team.memberIds.length > 3 && (
                                <p className={`text-xs ${textSecondary} px-2 py-1`}>
                                  +{team.memberIds.length - 3} more members
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {(!team.memberIds || team.memberIds.length === 0) && (
                          <p className={`text-xs ${textSecondary} italic`}>No members assigned yet</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-sm ${textSecondary} text-center py-4`}>No teams found</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Team Progress Tracking */}
        <div className={`${bgCard} border ${borderColor} rounded-lg mt-8`}>
          <div className={`px-6 py-4 border-b ${borderColor}`}>
            <h2 className={`text-lg font-semibold ${textPrimary}`}>Team Progress & Performance 📊</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams && teams.length > 0 ? (
                teams.map(team => {
                  const totalMembers = (team.memberIds?.length || 0) + 1;
                  const totalPoints = [team.leaderId, ...(team.memberIds || [])].reduce((sum, member) => 
                    sum + (member?.points || 0), 0
                  );
                  const avgPoints = totalMembers > 0 ? Math.round(totalPoints / totalMembers) : 0;
                  
                  return (
                    <div key={team._id} className={`p-4 rounded-lg border ${borderColor} ${darkMode ? 'bg-[#191919]' : 'bg-gray-50'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className={`font-semibold ${textPrimary}`}>{team.name}</h3>
                          <p className={`text-xs ${textSecondary}`}>{totalMembers} members</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${textPrimary}`}>⭐ {totalPoints}</p>
                          <p className={`text-xs ${textSecondary}`}>total</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className={textSecondary}>Avg/member:</span>
                          <span className={`font-medium ${textPrimary}`}>{avgPoints} pts</span>
                        </div>
                        
                        {team.memberIds && team.memberIds.length > 0 && (
                          <div className={`mt-3 pt-3 border-t ${borderColor}`}>
                            <p className={`text-xs ${textSecondary} mb-2`}>Top Performer:</p>
                            {(() => {
                              const topMember = [team.leaderId, ...team.memberIds]
                                .filter(Boolean)
                                .sort((a, b) => (b.points || 0) - (a.points || 0))[0];
                              return topMember ? (
                                <div className="flex items-center justify-between">
                                  <span className={`text-sm ${textPrimary}`}>🏆 {topMember.name}</span>
                                  <span className={`text-sm font-semibold ${textPrimary}`}>{topMember.points || 0} pts</span>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className={`${textSecondary} text-sm col-span-full text-center py-8`}>No teams to display</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message.text && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-md ${
          message.type === 'success'
            ? darkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'
            : darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Create User Modal - NO PASSWORD FIELD */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${bgCard} rounded-lg border ${borderColor} max-w-md w-full p-6`}>
            <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className={`w-full px-3 py-2 ${darkMode ? 'bg-[#191919]' : 'bg-white'} border ${borderColor} rounded-md ${textPrimary} text-sm`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className={`w-full px-3 py-2 ${darkMode ? 'bg-[#191919]' : 'bg-white'} border ${borderColor} rounded-md ${textPrimary} text-sm`}
                  required
                />
                <p className={`text-xs ${textSecondary} mt-1`}>
                  ✉️ Verification email will be sent to this address
                </p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className={`w-full px-3 py-2 ${darkMode ? 'bg-[#191919]' : 'bg-white'} border ${borderColor} rounded-md ${textPrimary} text-sm`}
                  required
                >
                  <option value="member">Member</option>
                  <option value="teamleader">Team Leader</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={`p-3 rounded-md ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                  ℹ️ User will receive an email to verify their account and set their password.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-2 ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'} rounded-md font-medium text-sm transition disabled:opacity-50`}
                >
                  {loading ? 'Creating...' : 'Create User & Send Email'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className={`flex-1 py-2 ${darkMode ? 'bg-[#191919] border border-gray-800 text-white hover:bg-black' : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'} rounded-md font-medium text-sm transition`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${bgCard} rounded-lg border ${borderColor} max-w-md w-full p-6 max-h-[80vh] overflow-y-auto`}>
            <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Create New Team</h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Team Name</label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                  className={`w-full px-3 py-2 ${darkMode ? 'bg-[#191919]' : 'bg-white'} border ${borderColor} rounded-md ${textPrimary} text-sm`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Team Leader</label>
                <select
                  value={newTeam.leaderId}
                  onChange={(e) => setNewTeam({...newTeam, leaderId: e.target.value})}
                  className={`w-full px-3 py-2 ${darkMode ? 'bg-[#191919]' : 'bg-white'} border ${borderColor} rounded-md ${textPrimary} text-sm`}
                  required
                >
                  <option value="">Select Team Leader</option>
                  {teamLeaders.map(leader => (
                    <option key={leader._id} value={leader._id}>{leader.name} ({leader.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Team Members</label>
                <div className={`max-h-48 overflow-y-auto border ${borderColor} rounded-md p-2 ${darkMode ? 'bg-[#191919]' : 'bg-white'}`}>
                  {teamMembers.map(member => (
                    <label key={member._id} className={`flex items-center p-2 hover:${darkMode ? 'bg-[#252525]' : 'bg-gray-50'} rounded cursor-pointer`}>
                      <input
                        type="checkbox"
                        checked={newTeam.memberIds.includes(member._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTeam({...newTeam, memberIds: [...newTeam.memberIds, member._id]});
                          } else {
                            setNewTeam({...newTeam, memberIds: newTeam.memberIds.filter(id => id !== member._id)});
                          }
                        }}
                        className="mr-2"
                      />
                      <span className={`text-sm ${textPrimary}`}>{member.name} ({member.email})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-2 ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'} rounded-md font-medium text-sm transition disabled:opacity-50`}
                >
                  {loading ? 'Creating...' : 'Create Team'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateTeam(false)}
                  className={`flex-1 py-2 ${darkMode ? 'bg-[#191919] border border-gray-800 text-white hover:bg-black' : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'} rounded-md font-medium text-sm transition`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Credits Modal */}
      {showManageCredits && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${bgCard} rounded-lg border ${borderColor} max-w-md w-full p-6`}>
            <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Manage User Credits</h3>
            <form onSubmit={handleUpdateCredits} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Select User</label>
                <select
                  value={selectedUserForCredits}
                  onChange={(e) => setSelectedUserForCredits(e.target.value)}
                  className={`w-full px-3 py-2 ${darkMode ? 'bg-[#191919]' : 'bg-white'} border ${borderColor} rounded-md ${textPrimary} text-sm`}
                  required
                >
                  <option value="">Choose a user</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email}) - Current: {user.credits} credits
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1`}>New Credits Amount</label>
                <input
                  type="number"
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(parseInt(e.target.value))}
                  className={`w-full px-3 py-2 ${darkMode ? 'bg-[#191919]' : 'bg-white'} border ${borderColor} rounded-md ${textPrimary} text-sm`}
                  min="0"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-2 ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'} rounded-md font-medium text-sm transition disabled:opacity-50`}
                >
                  {loading ? 'Updating...' : 'Update Credits'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowManageCredits(false)}
                  className={`flex-1 py-2 ${darkMode ? 'bg-[#191919] border border-gray-800 text-white hover:bg-black' : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'} rounded-md font-medium text-sm transition`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View All Teams Modal */}
      {showAllTeams && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${bgCard} rounded-lg border ${borderColor} max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col`}>
            <div className={`px-6 py-4 border-b ${borderColor} flex justify-between items-center`}>
              <h3 className={`text-lg font-semibold ${textPrimary}`}>All Teams</h3>
              <button
                onClick={() => setShowAllTeams(false)}
                className={`p-1 rounded-md ${darkMode ? 'hover:bg-[#191919]' : 'hover:bg-gray-100'} transition`}
              >
                <svg className={`w-5 h-5 ${textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <div className="space-y-4">
                {teams && teams.length > 0 ? (
                  teams.map(team => (
                    <div key={team._id} className={`border ${borderColor} rounded-lg overflow-hidden`}>
                      <div className={`px-4 py-3 ${darkMode ? 'bg-[#191919]' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className={`font-semibold ${textPrimary}`}>{team.name}</h4>
                            <p className={`text-sm ${textSecondary}`}>
                              {team.memberIds?.length || 0} team members
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        {team.leaderId && (
                          <div>
                            <p className={`text-xs font-medium ${textSecondary} mb-2 uppercase`}>Team Leader</p>
                            <div className={`flex items-center gap-3 p-3 rounded-lg ${darkMode ? 'bg-[#191919]' : 'bg-gray-50'}`}>
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {team.leaderId.name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <p className={`font-medium ${textPrimary}`}>{team.leaderId.name}</p>
                                <p className={`text-sm ${textSecondary}`}>{team.leaderId.email}</p>
                              </div>
                              <span className={`text-xs px-3 py-1 rounded-full ${darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'}`}>
                                Leader
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {team.memberIds && team.memberIds.length > 0 ? (
                          <div>
                            <p className={`text-xs font-medium ${textSecondary} mb-2 uppercase`}>Team Members</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {team.memberIds.map(member => (
                                <div key={member._id} className={`flex items-center gap-3 p-3 rounded-lg ${darkMode ? 'bg-[#191919]' : 'bg-gray-50'}`}>
                                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    {member.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-medium ${textPrimary} truncate`}>{member.name}</p>
                                    <p className={`text-sm ${textSecondary} truncate`}>{member.email}</p>
                                  </div>
                                  {member.points !== undefined && (
                                    <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-[#252525]' : 'bg-white'} ${textSecondary} whitespace-nowrap`}>
                                      {member.points} pts
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className={`text-center py-6 ${textSecondary}`}>
                            <p className="text-sm italic">No members assigned to this team yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`text-center py-8 ${textSecondary}`}>
                    <p>No teams created yet</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className={`px-6 py-4 border-t ${borderColor}`}>
              <button
                onClick={() => setShowAllTeams(false)}
                className={`w-full py-2 ${darkMode ? 'bg-[#191919] border border-gray-800 text-white hover:bg-black' : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'} rounded-md font-medium text-sm transition`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Member to Team Modal */}
      {showAssignMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${bgCard} rounded-lg border ${borderColor} max-w-md w-full p-6`}>
            <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Assign User to Team</h3>
            <form onSubmit={handleAssignMember} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Select User</label>
                <select
                  value={assignData.userId}
                  onChange={(e) => setAssignData({...assignData, userId: e.target.value})}
                  className={`w-full px-3 py-2 ${darkMode ? 'bg-[#191919]' : 'bg-white'} border ${borderColor} rounded-md ${textPrimary} text-sm`}
                  required
                >
                  <option value="">Choose a user</option>
                  {users && users.length > 0 ? (
                    users
                      .filter(u => u.role !== 'admin')
                      .map(user => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email}) - {user.role}
                        </option>
                      ))
                  ) : (
                    <option value="" disabled>No users available</option>
                  )}
                </select>
                <p className={`text-xs ${textSecondary} mt-1`}>
                  Select member or team leader to assign
                </p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Select Team</label>
                <select
                  value={assignData.teamId}
                  onChange={(e) => setAssignData({...assignData, teamId: e.target.value})}
                  className={`w-full px-3 py-2 ${darkMode ? 'bg-[#191919]' : 'bg-white'} border ${borderColor} rounded-md ${textPrimary} text-sm`}
                  required
                >
                  <option value="">Choose a team</option>
                  {teams && teams.length > 0 ? (
                    teams.map(team => (
                      <option key={team._id} value={team._id}>
                        {team.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No teams available</option>
                  )}
                </select>
                <p className={`text-xs ${textSecondary} mt-1`}>
                  User will be assigned to this team
                </p>
              </div>
              <div className={`p-3 rounded-md ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                  ℹ️ If user is already in another team, they will be moved to the new team.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-2 ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'} rounded-md font-medium text-sm transition disabled:opacity-50`}
                >
                  {loading ? 'Assigning...' : 'Assign to Team'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignMember(false)}
                  className={`flex-1 py-2 ${darkMode ? 'bg-[#191919] border border-gray-800 text-white hover:bg-black' : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'} rounded-md font-medium text-sm transition`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;