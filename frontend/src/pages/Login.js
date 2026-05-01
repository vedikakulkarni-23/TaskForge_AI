import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Login = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });

      if (response.data.requires2FA) {
        navigate('/verify-2fa', { state: { userId: response.data.userId } });
      } else {
        localStorage.setItem('user', JSON.stringify(response.data));
        if (response.data.role === 'admin') navigate('/admin');
        else if (response.data.role === 'teamleader') navigate('/team-leader');
        else navigate('/member');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const bgMain = darkMode ? 'bg-[#191919]' : 'bg-gray-50';
  const bgCard = darkMode ? 'bg-[#252525]' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-800' : 'border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const inputBg = darkMode ? 'bg-[#191919]' : 'bg-white';
  const inputBorder = darkMode ? 'border-gray-700' : 'border-gray-300';

  return (
    <div className={`min-h-screen ${bgMain} flex items-center justify-center p-4`}>
      {/* Dark Mode Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed top-6 right-6 p-3 rounded-lg ${darkMode ? 'bg-[#252525] text-gray-400 hover:text-white border border-gray-800' : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 shadow-sm'} transition`}
        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold ${textPrimary} mb-2`}>TASKFORGE</h1>
          <p className={`${textSecondary} text-sm`}>Team Collaboration Platform</p>
        </div>

        {/* Login Card */}
        <div className={`${bgCard} rounded-lg border ${borderColor} ${darkMode ? '' : 'shadow-lg'} p-8`}>
          <h2 className={`text-2xl font-semibold ${textPrimary} mb-6`}>Sign in</h2>

          {error && (
            <div className={`mb-4 p-3 rounded-md ${darkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium ${textPrimary} mb-2`}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 ${inputBg} border ${inputBorder} rounded-md ${textPrimary} ${darkMode ? 'placeholder-gray-500 focus:border-gray-500' : 'placeholder-gray-400 focus:border-gray-400'} focus:outline-none focus:ring-1 ${darkMode ? 'focus:ring-gray-500' : 'focus:ring-gray-400'} transition`}
                placeholder="name@example.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`block text-sm font-medium ${textPrimary}`}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition`}
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 ${inputBg} border ${inputBorder} rounded-md ${textPrimary} ${darkMode ? 'placeholder-gray-500 focus:border-gray-500' : 'placeholder-gray-400 focus:border-gray-400'} focus:outline-none focus:ring-1 ${darkMode ? 'focus:ring-gray-500' : 'focus:ring-gray-400'} transition`}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-md font-medium transition ${
                darkMode
                  ? 'bg-white text-black hover:bg-gray-100'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>


          {/* Demo Credentials */}
          <div className={`mt-6 pt-6 border-t ${borderColor}`}>
            <p className={`text-xs ${textSecondary} mb-3`}>Demo Credentials:</p>
            <div className="space-y-2 text-xs">
              <div className={`${inputBg} p-2 rounded border ${borderColor}`}>
                <p className={textSecondary}>Admin: <span className={textPrimary}>admin@taskforge.com</span></p>
                <p className={textSecondary}>Password: <span className={textPrimary}>admin123</span></p>
              </div>
              <div className={`${inputBg} p-2 rounded border ${borderColor}`}>
                <p className={textSecondary}>Team Leader: <span className={textPrimary}>john@taskforge.com</span></p>
                <p className={textSecondary}>Password: <span className={textPrimary}>password123</span></p>
              </div>
            </div>
          </div>
        </div>

        <p className={`text-center text-xs ${textSecondary} mt-8`}>
          © 2024 TASKFORGE. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;