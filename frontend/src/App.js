import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import VerifyAccount from './pages/VerifyAccount';
import TwoFactorAuth from './pages/TwoFactorAuth';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import TeamLeaderDashboard from './pages/TeamLeaderDashboard';
import MemberDashboard from './pages/MemberDashboard';
import Tools from './pages/Tools';

// Smart root redirect — sends logged-in users straight to their dashboard
const RootRedirect = () => {
  let user = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) user = JSON.parse(userStr);
  } catch {
    localStorage.removeItem('user');
  }

  if (user && user.token) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'teamleader') return <Navigate to="/team-leader" replace />;
    if (user.role === 'member') return <Navigate to="/member" replace />;
  }

  return <Login />;
};

// Protected Route — checks token and role
const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();

  let user = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) user = JSON.parse(userStr);
  } catch {
    localStorage.removeItem('user');
    return <Navigate to="/" replace />;
  }

  if (!user || !user.token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const targetPath =
      user.role === 'admin' ? '/admin' :
      user.role === 'teamleader' ? '/team-leader' :
      '/member';

    if (location.pathname !== targetPath) {
      return <Navigate to={targetPath} replace />;
    }
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/verify-account/:token" element={<VerifyAccount />} />
        <Route path="/verify-2fa" element={<TwoFactorAuth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team-leader"
          element={
            <ProtectedRoute allowedRoles={['teamleader']}>
              <TeamLeaderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member"
          element={
            <ProtectedRoute allowedRoles={['member']}>
              <MemberDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teamleader', 'member']}>
              <Tools />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;