import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
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

          {sent ? (
            /* Success state */
            <div className="text-center">
              <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                <svg className={`w-7 h-7 ${darkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className={`text-xl font-semibold ${textPrimary} mb-2`}>Check your email</h2>
              <p className={`text-sm ${textSecondary} mb-6`}>
                If an account exists for <span className={`font-medium ${textPrimary}`}>{email}</span>, 
                we've sent a password reset link. Check your inbox and spam folder.
              </p>
              <p className={`text-xs ${textSecondary} mb-6`}>
                The link expires in 1 hour.
              </p>
              <Link
                to="/"
                className={`block w-full py-2.5 text-center rounded-md font-medium text-sm transition ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
              >
                Back to Sign in
              </Link>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className={`mt-3 text-sm ${textSecondary} hover:${textPrimary} transition`}
              >
                Send to a different email
              </button>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="mb-6">
                <h2 className={`text-2xl font-semibold ${textPrimary} mb-1`}>Forgot password?</h2>
                <p className={`text-sm ${textSecondary}`}>
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

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

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-md font-medium transition ${
                    darkMode
                      ? 'bg-white text-black hover:bg-gray-100'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? 'Sending...' : 'Send reset link'}
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

export default ForgotPassword;