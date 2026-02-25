import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: Role;
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
