import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ResetPassword = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/reset-password/${token}`, { password });
      setSuccess(true);
      // Auto redirect to login after 3 seconds
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
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
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold ${textPrimary} mb-2`}>TASKFORGE</h1>
          <p className={`${textSecondary} text-sm`}>Team Collaboration Platform</p>
        </div>

        <div className={`${bgCard} rounded-lg border ${borderColor} ${darkMode ? '' : 'shadow-lg'} p-8`}>

          {success ? (
            /* Success state */
            <div className="text-center">
              <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                <svg className={`w-7 h-7 ${darkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className={`text-xl font-semibold ${textPrimary} mb-2`}>Password reset!</h2>
              <p className={`text-sm ${textSecondary} mb-6`}>
                Your password has been updated successfully. Redirecting you to sign in...
              </p>
              <Link
                to="/"
                className={`block w-full py-2.5 text-center rounded-md font-medium text-sm transition ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
              >
                Sign in now
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="mb-6">
                <h2 className={`text-2xl font-semibold ${textPrimary} mb-1`}>Set new password</h2>
                <p className={`text-sm ${textSecondary}`}>
                  Choose a strong password for your account.
                </p>
              </div>

              {error && (
                <div className={`mb-4 p-3 rounded-md ${darkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
                  {error.includes('expired') || error.includes('invalid') || error.includes('Invalid') ? (
                    <Link to="/forgot-password" className={`text-sm underline mt-1 block ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                      Request a new reset link
                    </Link>
                  ) : null}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={`block text-sm font-medium ${textPrimary} mb-2`}>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-3 pr-12 ${inputBg} border ${inputBorder} rounded-md ${textPrimary} ${darkMode ? 'placeholder-gray-500 focus:border-gray-500' : 'placeholder-gray-400 focus:border-gray-400'} focus:outline-none focus:ring-1 ${darkMode ? 'focus:ring-gray-500' : 'focus:ring-gray-400'} transition`}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${textSecondary} hover:${textPrimary} transition`}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {password.length > 0 && password.length < 6 && (
                    <p className={`text-xs mt-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                      Too short — needs at least 6 characters
                    </p>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textPrimary} mb-2`}>
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 ${inputBg} border ${
                      confirmPassword.length > 0 && confirmPassword !== password
                        ? darkMode ? 'border-red-700' : 'border-red-400'
                        : inputBorder
                    } rounded-md ${textPrimary} ${darkMode ? 'placeholder-gray-500 focus:border-gray-500' : 'placeholder-gray-400 focus:border-gray-400'} focus:outline-none focus:ring-1 ${darkMode ? 'focus:ring-gray-500' : 'focus:ring-gray-400'} transition`}
                    placeholder="Repeat your password"
                    required
                  />
                  {confirmPassword.length > 0 && confirmPassword !== password && (
                    <p className={`text-xs mt-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                      Passwords do not match
                    </p>
                  )}
                  {confirmPassword.length > 0 && confirmPassword === password && password.length >= 6 && (
                    <p className={`text-xs mt-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      Passwords match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || password.length < 6 || password !== confirmPassword}
                  className={`w-full py-3 rounded-md font-medium transition ${
                    darkMode
                      ? 'bg-white text-black hover:bg-gray-100'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? 'Resetting...' : 'Reset password'}
                </button>
              </form>

              <div className={`mt-6 pt-6 border-t ${borderColor} text-center`}>
                <Link
                  to="/"
                  className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition`}
                >
                  Back to Sign in
                </Link>
              </div>
            </>
          )}
        </div>

        <p className={`text-center text-xs ${textSecondary} mt-8`}>
          © 2024 TASKFORGE. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;