import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

// Gate for the authenticated app shell. Shows a brief loader while the initial
// session is resolved, then redirects to /login when there's no session.
export default function RequireAuth() {
  const session = useAuthStore((s) => s.session);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-line border-t-primary animate-spin" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}
