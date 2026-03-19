import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import VerifyAccount from './pages/VerifyAccount';
import TwoFactorAuth from './pages/TwoFactorAuth';
import AdminDashboard from './pages/AdminDashboard';
import TeamLeaderDashboard from './pages/TeamLeaderDashboard';
import MemberDashboard from './pages/MemberDashboard';
import Tools from './pages/Tools';

// ── Get user from localStorage safely ────────────────────────────────────────
const getUser = () => {
  try {
    const str = localStorage.getItem('user');
    if (!str) return null;
    const user = JSON.parse(str);
    // Must have token and role to be considered logged in
    if (!user?.token || !user?.role) return null;
    return user;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

// ── Root redirect: if logged in go to dashboard, else show login ──────────────
const RootRoute = () => {
  const user = getUser();
  if (!user) return <Login />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'teamleader') return <Navigate to="/team-leader" replace />;
  if (user.role === 'member') return <Navigate to="/member" replace />;
  return <Login />;
};

// ── Protected Route ───────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const user = getUser();

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Wrong role → redirect to correct dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const target =
      user.role === 'admin' ? '/admin' :
      user.role === 'teamleader' ? '/team-leader' :
      '/member';
    // Only redirect if not already there (prevents loop)
    if (location.pathname !== target) {
      return <Navigate to={target} replace />;
    }
  }

  console.log('✅ Access granted');
  return children;
};

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <Routes>
        {/* Root: smart redirect based on login state */}
        <Route path="/" element={<RootRoute />} />

        {/* Auth routes */}
        <Route path="/verify-account/:token" element={<VerifyAccount />} />
        <Route path="/verify-2fa" element={<TwoFactorAuth />} />

        {/* Protected routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }/>

        <Route path="/team-leader" element={
          <ProtectedRoute allowedRoles={['teamleader']}>
            <TeamLeaderDashboard />
          </ProtectedRoute>
        }/>

        <Route path="/member" element={
          <ProtectedRoute allowedRoles={['member']}>
            <MemberDashboard />
          </ProtectedRoute>
        }/>

        <Route path="/tools" element={
          <ProtectedRoute allowedRoles={['admin', 'teamleader', 'member']}>
            <Tools />
          </ProtectedRoute>
        }/>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;