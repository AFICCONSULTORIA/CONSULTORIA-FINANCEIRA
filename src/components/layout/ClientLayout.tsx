import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const ClientLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg-app)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};
