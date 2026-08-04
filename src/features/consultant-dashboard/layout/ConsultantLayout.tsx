import React from 'react';
import { Outlet } from 'react-router-dom';
import { ConsultantSidebar } from './ConsultantSidebar';

export const ConsultantLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg-app)' }}>
      <ConsultantSidebar />
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <Outlet />
      </main>
    </div>
  );
};
