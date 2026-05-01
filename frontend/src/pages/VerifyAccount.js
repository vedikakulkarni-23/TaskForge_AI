import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const VerifyAccount = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/verify-account`, {
      token,
      password
      });

      setMessage({ text: response.data.message, type: 'success' });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.message || 'Verification failed. Link may be expired.', 
        type: 'error' 
      });
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
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed top-6 right-6 p-3 rounded-lg ${darkMode ? 'bg-[#252525] text-gray-400 hover:text-white border border-gray-800' : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 shadow-sm'} transition`}
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

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold ${textPrimary} mb-2`}>TASKFORGE</h1>
          <p className={`${textSecondary} text-sm`}>Set Your Password</p>
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} ${darkMode ? '' : 'shadow-lg'} p-8`}>
          <h2 className={`text-2xl font-semibold ${textPrimary} mb-2`}>Activate Your Account</h2>
          <p className={`text-sm ${textSecondary} mb-6`}>
            Create a secure password to complete your account setup
          </p>

          {message.text && (
            <div className={`mb-4 p-3 rounded-md ${
              message.type === 'success'
                ? darkMode ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
                : darkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${
                message.type === 'success'
                  ? darkMode ? 'text-green-400' : 'text-green-600'
                  : darkMode ? 'text-red-400' : 'text-red-600'
              }`}>{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium ${textPrimary} mb-2`}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 ${inputBg} border ${inputBorder} rounded-md ${textPrimary} ${darkMode ? 'placeholder-gray-500' : 'placeholder-gray-400'} focus:outline-none focus:ring-1 ${darkMode ? 'focus:ring-gray-500' : 'focus:ring-gray-400'} transition`}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <p className={`text-xs ${textSecondary} mt-1`}>At least 6 characters</p>
            </div>

            <div>
              <label className={`block text-sm font-medium ${textPrimary} mb-2`}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 ${inputBg} border ${inputBorder} rounded-md ${textPrimary} ${darkMode ? 'placeholder-gray-500' : 'placeholder-gray-400'} focus:outline-none focus:ring-1 ${darkMode ? 'focus:ring-gray-500' : 'focus:ring-gray-400'} transition`}
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
              {loading ? 'Activating Account...' : 'Activate Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyAccount;