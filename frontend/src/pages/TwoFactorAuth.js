import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TwoFactorAuth = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [code, setCode] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId;

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    
    if (!userId) {
      navigate('/');
    }
  }, [darkMode, userId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/verify-2fa', {
        userId,
        code
      });

      localStorage.setItem('user', JSON.stringify(response.data));

      if (response.data.role === 'admin') {
        navigate('/admin');
      } else if (response.data.role === 'teamleader') {
        navigate('/team-leader');
      } else {
        navigate('/member');
      }
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.message || 'Invalid verification code', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await axios.post('/api/auth/resend-2fa', { userId });
      setMessage({ text: response.data.message, type: 'success' });
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.message || 'Failed to resend code', 
        type: 'error' 
      });
    } finally {
      setResending(false);
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
          <div className="text-6xl mb-4">🔒</div>
          <h1 className={`text-4xl font-bold ${textPrimary} mb-2`}>TASKFORGE</h1>
          <p className={`${textSecondary} text-sm`}>Two-Factor Authentication</p>
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} ${darkMode ? '' : 'shadow-lg'} p-8`}>
          <h2 className={`text-2xl font-semibold ${textPrimary} mb-2`}>Enter Verification Code</h2>
          <p className={`text-sm ${textSecondary} mb-6`}>
            We sent a 6-digit code to your email. Please enter it below to complete login.
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
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`w-full px-4 py-3 text-center text-2xl tracking-widest ${inputBg} border ${inputBorder} rounded-md ${textPrimary} focus:outline-none focus:ring-1 ${darkMode ? 'focus:ring-gray-500' : 'focus:ring-gray-400'} transition font-mono`}
                placeholder="000000"
                required
                maxLength={6}
                autoFocus
              />
              <p className={`text-xs ${textSecondary} mt-1 text-center`}>Enter the 6-digit code from your email</p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className={`w-full py-3 rounded-md font-medium transition ${
                darkMode 
                  ? 'bg-white text-black hover:bg-gray-100' 
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleResend}
              disabled={resending}
              className={`text-sm ${textSecondary} hover:${textPrimary} transition disabled:opacity-50`}
            >
              {resending ? 'Sending...' : "Didn't receive code? Resend"}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/')}
              className={`text-sm ${textSecondary} hover:${textPrimary} transition`}
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuth;