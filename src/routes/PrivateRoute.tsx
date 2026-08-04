import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRole?: 'client' | 'consultant' | 'admin';
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRole }) => {
  const { user, loading, role } = useAuth();

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
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'consultant') return <Navigate to="/consultor" replace />;
    return <Navigate to="/client" replace />;
  }

  return <>{children}</>;
};
