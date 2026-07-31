import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Apply from './pages/Apply';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import ForgotPassword from './pages/ForgotPassword';
import './styles/global.css';

// ── Protected Route: must be logged in ──
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

// ── Admin Route: must be admin role ──
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

// ── Guest Route: redirect to home if already logged in ──
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="spinner" /></div>;
  return !user ? children : <Navigate to="/" replace />;
}

// ── App Shell ──
function AppShell() {
  const { user, logout } = useAuth();

  return (
    <>
      <Navbar user={user} onLogout={logout} />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={
          <GuestRoute><Login /></GuestRoute>
        } />

        <Route path="/register" element={
          <GuestRoute><Register /></GuestRoute>
        } />

        <Route path="/forgot-password" element={
          <GuestRoute><ForgotPassword /></GuestRoute>
        } />

        <Route path="/apply/:jobId" element={
          <PrivateRoute><Apply /></PrivateRoute>
        } />

        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />

        <Route path="/admin" element={
          <AdminRoute><Admin /></AdminRoute>
        } />

        {/* 404 fallback */}
        <Route path="*" element={
          <div className="page-wrapper">
            <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
              <h1 style={{ fontSize: 'var(--text-5xl)', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>404</h1>
              <p style={{ color: 'var(--color-text-muted)', margin: '1rem 0 2rem' }}>Page not found.</p>
              <a href="/" className="btn btn-primary">Go Home</a>
            </div>
          </div>
        } />
      </Routes>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
