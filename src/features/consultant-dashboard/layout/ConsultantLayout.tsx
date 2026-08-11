import React from 'react';
import { Outlet } from 'react-router-dom';
import { ConsultantSidebar } from './ConsultantSidebar';
import { MobileHeader } from '../../../components/layout/MobileHeader';
import { BottomNav } from '../../../components/layout/BottomNav';

export const ConsultantLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--bg-app)' }}>
      <MobileHeader />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <ConsultantSidebar />
        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '5.5rem' }}>
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
};
