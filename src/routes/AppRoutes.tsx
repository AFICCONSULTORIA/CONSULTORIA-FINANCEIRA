import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { ClientLayout } from '../components/layout/ClientLayout';
import { Home } from '../pages/Home';
import { ClientDashboard } from '../features/client-dashboard/ClientDashboard';
import { ClientOnboarding } from '../features/client-onboarding/ClientOnboarding';
import { ConsultantLayout } from '../features/consultant-dashboard/layout/ConsultantLayout';
import { ConsultantDashboard } from '../features/consultant-dashboard/ConsultantDashboard';
import { ClientDiagnostic } from '../features/consultant-dashboard/ClientDiagnostic';
import { Reports } from '../features/consultant-dashboard/Reports';
import { Settings } from '../features/consultant-dashboard/Settings';

// Ferramentas interativas
import { BucketCalculator } from '../features/client-dashboard/components/BucketCalculator';
import { ExpenseTracker } from '../features/client-dashboard/components/ExpenseTracker';
import { GoalTracker } from '../features/client-dashboard/components/GoalTracker';
import { InvestmentSimulator } from '../features/client-dashboard/components/InvestmentSimulator';
import { TimeCalculator } from '../features/client-dashboard/components/TimeCalculator';

const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const showNav = pathname === '/onboarding';
  return (
    <>
      {showNav && <Navbar />}
      <main>{children}</main>
    </>
  );
};

const ToolWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
    {children}
  </div>
);

export const AppRoutes: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<RootLayout><Home /></RootLayout>} />
      <Route path="/onboarding" element={<RootLayout><ClientOnboarding /></RootLayout>} />
      {/* ── Rotas com Sidebar do Consultor ── */}
      <Route path="/consultor" element={<ConsultantLayout />}>
        <Route index element={<ConsultantDashboard />} />
        <Route path="client/:id" element={<ClientDiagnostic />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* ── Rotas com Sidebar do Cliente ── */}
      <Route path="/client" element={<ClientLayout />}>
        <Route index element={<ClientDashboard />} />
        <Route path="calculator" element={<ToolWrapper><BucketCalculator /></ToolWrapper>} />
        <Route path="time-calculator" element={<ToolWrapper><TimeCalculator /></ToolWrapper>} />
        <Route path="expenses" element={<ToolWrapper><ExpenseTracker /></ToolWrapper>} />
        <Route path="goals" element={<ToolWrapper><GoalTracker /></ToolWrapper>} />
        <Route path="simulator" element={<ToolWrapper><InvestmentSimulator /></ToolWrapper>} />
      </Route>
      
      {/* Redirecionamento legado */}
      <Route path="/client-dashboard" element={<RootLayout><ClientDashboard /></RootLayout>} />
    </Routes>
  </BrowserRouter>
);
