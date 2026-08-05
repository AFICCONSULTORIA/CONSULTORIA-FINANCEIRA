import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const ClientLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg-app)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '4rem' }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};
