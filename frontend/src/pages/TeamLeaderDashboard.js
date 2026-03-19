import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const TeamLeaderDashboard = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({ totalTasks: 0, inProgressTasks: 0, completedTasks: 0 });
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    deadline: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    setLoading(true);
    setError('');
    try {
      const tasksRes = await api.get('/tl/tasks');
      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);

      const overviewRes = await api.get('/tl/overview');
      setTeam(overviewRes.data.team);
      setMembers(overviewRes.data.team?.memberIds || []);
      setStats(overviewRes.data.stats || { totalTasks: 0, inProgressTasks: 0, completedTasks: 0 });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard data');
      setTasks([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    try {
      await api.post('/tl/create-task', newTask);
      setMessage({ text: 'Task created successfully!', type: 'success' });
      setNewTask({ title: '', description: '', assignedTo: '', priority: 'medium', deadline: '' });
      setShowCreateTask(false);
      fetchTeamData();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to create task', type: 'error' });
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
    'in-progress': tasks.filter(t => t.status === 'in-progress' || t.status === 'inprogress'),
    done: tasks.filter(t => t.status === 'done')
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${bgMain} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`text-4xl mb-4`}>⏳</div>
          <p className={textPrimary}>Loading dashboard...</p>
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
              onClick={fetchTeamData}
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
            <h1 className={`text-xl font-semibold ${textPrimary}`}>Team Leader Dashboard</h1>
            <p className={`text-sm ${textSecondary} mt-0.5`}>
              {team?.name || 'No Team Assigned'}
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
            <p className={`text-sm ${textSecondary} mb-1`}>Total Tasks</p>
            <p className={`text-3xl font-semibold ${textPrimary}`}>{stats.totalTasks || 0}</p>
          </div>
          <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
            <p className={`text-sm ${textSecondary} mb-1`}>In Progress</p>
            <p className={`text-3xl font-semibold ${textPrimary}`}>{stats.inProgressTasks || 0}</p>
          </div>
          <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
            <p className={`text-sm ${textSecondary} mb-1`}>Completed</p>
            <p className={`text-3xl font-semibold ${textPrimary}`}>{stats.completedTasks || 0}</p>
          </div>
          <div className={`${bgCard} border ${borderColor} rounded-lg p-6`}>
            <p className={`text-sm ${textSecondary} mb-1`}>Team Members</p>
            <p className={`text-3xl font-semibold ${textPrimary}`}>{members.length}</p>
          </div>
        </div>

        {/* Create Task Button */}
        <button
          onClick={() => setShowCreateTask(true)}
          className={`mb-6 px-4 py-2 ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'} rounded-md font-medium text-sm transition`}
        >
          Create Task
        </button>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status}>
              <h3 className={`font-semibold ${textPrimary} mb-4 capitalize flex items-center gap-2`}>
                {status === 'todo' && '📋'}
                {status === 'in-progress' && '⚡'}
                {status === 'done' && '✅'}
                {status.replace('-', ' ')} ({statusTasks.length})
              </h3>
              <div className="space-y-3">
                {statusTasks.map(task => (
                  <div key={task._id} className={`p-4 rounded-lg border ${borderColor} ${darkMode ? 'bg-[#191919]' : 'bg-gray-50'}`}>
                    <h4 className={`font-medium ${textPrimary} mb-1`}>{task.title}</h4>
                    <p className={`text-sm ${textSecondary} mb-2`}>{task.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded ${
                        task.priority === 'high' ? darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? darkMode ? 'bg-yellow-900 text-yellow-100' : 'bg-yellow-100 text-yellow-800' :
                        darkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                      {task.assignedTo && (
                        <span className={`text-xs ${textSecondary}`}>
                          {task.assignedTo.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {statusTasks.length === 0 && (
                  <div className={`text-center py-8 ${textSecondary} text-sm`}>
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
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

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${bgCard} rounded-lg border ${borderColor} max-w-md w-full p-6`}>
            <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Create New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className={`w-full px-3 py-2 ${darkMode ? 'bg-[#191919]' : 'bg-white'} border ${borderColor} rounded-md ${textPrimary} text-sm`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className={`w-full px-3 py-2 ${darkMode ? 'bg-[#191919]' : 'bg-white'} border ${borderColor} rounded-md ${textPrimary} text-sm`}
                  rows="3"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Assign To</label>
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                  className={`w-full px-3 py-2 ${darkMode ? 'bg-[#191919]' : 'bg-white'} border ${borderColor} rounded-md ${textPrimary} text-sm`}
                  required
                >
                  <option value="">Select Member</option>
                  {/* Team Leader can assign to themselves */}
                  {team?.leaderId && (
                    <option value={team.leaderId._id}>
                      {team.leaderId.name} (You - Team Leader)
                    </option>
                  )}
                  {/* Team Members */}
                  {members && members.length > 0 ? (
                    members.map(member => (
                      <option key={member._id} value={member._id}>
                        {member.name} ({member.email})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No members available</option>
                  )}
                </select>
                <p className={`text-xs ${textSecondary} mt-1`}>
                  You can assign tasks to yourself or team members
                </p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  className={`w-full px-3 py-2 ${darkMode ? 'bg-[#191919]' : 'bg-white'} border ${borderColor} rounded-md ${textPrimary} text-sm`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1`}>Deadline</label>
                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                  className={`w-full px-3 py-2 ${darkMode ? 'bg-[#191919]' : 'bg-white'} border ${borderColor} rounded-md ${textPrimary} text-sm`}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className={`flex-1 py-2 ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'} rounded-md font-medium text-sm transition`}
                >
                  Create Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
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

export default TeamLeaderDashboard;