import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRole?: 'client' | 'consultant' | 'admin';
  requireOnboarding?: boolean;
  redirectIfOnboarded?: boolean;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  allowedRole, 
  requireOnboarding = false, 
  redirectIfOnboarded = false 
}) => {
  const { user, loading, role, hasCompletedOnboarding } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="anim-spin" size={40} color="var(--brand-primary)" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role && role !== allowedRole) {
    if (allowedRole === 'consultant' && role === 'admin') {
      // Admin tem passe livre nas telas de consultor
    } else {
      if (role === 'admin') return <Navigate to="/admin" replace />;
      if (role === 'consultant') return <Navigate to="/consultor" replace />;
      return <Navigate to="/client" replace />;
    }
  }

  if (role === 'client') {
    if (requireOnboarding && !hasCompletedOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }
    if (redirectIfOnboarded && hasCompletedOnboarding) {
      return <Navigate to="/client" replace />;
    }
  }

  return <>{children}</>;
};
