import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield } from 'lucide-react';

export const AdminRoleSwitcher: React.FC = () => {
  const { realRole, role, setMockedRole } = useAuth();

  if (realRole !== 'admin') return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      right: '20px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-brand)',
      borderRadius: 'var(--r-md)',
      padding: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 9999,
      backdropFilter: 'blur(10px)'
    }}>
      <Shield size={16} color="var(--brand-primary)" />
      <select 
        value={role || ''}
        onChange={(e) => setMockedRole?.(e.target.value as any)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-primary)',
          fontSize: '0.75rem',
          fontWeight: 700,
          outline: 'none',
          cursor: 'pointer'
        }}
      >
        <option value="admin">Admin (Real)</option>
        <option value="consultant">Visão Consultor</option>
        <option value="client">Visão Cliente</option>
      </select>
    </div>
  );
};
