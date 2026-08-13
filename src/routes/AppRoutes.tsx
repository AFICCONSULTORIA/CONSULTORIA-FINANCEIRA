import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
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

import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { PrivateRoute } from './PrivateRoute';
import { AdminDashboard } from '../features/admin-dashboard/AdminDashboard';
import { RecommendedPortfolio } from '../features/portfolio/RecommendedPortfolio';

// Ferramentas interativas
import { BucketCalculator } from '../features/client-dashboard/components/BucketCalculator';
import { GoalTracker } from '../features/client-dashboard/components/GoalTracker';
import { InvestmentSimulator } from '../features/client-dashboard/components/InvestmentSimulator';
import { TimeCalculator } from '../features/client-dashboard/components/TimeCalculator';
import { TransactionManager } from '../features/client-dashboard/components/TransactionManager';
import { AcademyDashboard } from '../features/education/AcademyDashboard';
import { IncomeTaxDashboard } from '../features/income-tax/IncomeTaxDashboard';
import { ClientSettings } from '../features/client-dashboard/ClientSettings';

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
  <div className="container anim-fade-up" style={{ padding: '2rem var(--sp-6) 7rem' }}>
    {children}
  </div>
);

export const AppRoutes: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/apresentacao" element={<RootLayout><Home /></RootLayout>} />
      
      {/* ── Rotas de Autenticação ── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/onboarding" element={
        <PrivateRoute allowedRole="client" redirectIfOnboarded>
          <RootLayout><ClientOnboarding /></RootLayout>
        </PrivateRoute>
      } />
      
      {/* ── Rotas Protegidas do Admin ── */}
      <Route path="/admin" element={
        <PrivateRoute allowedRole="admin">
          <AdminDashboard />
        </PrivateRoute>
      } />
      
      {/* ── Rotas com Sidebar do Consultor (Protegidas) ── */}
      <Route path="/consultor" element={
        <PrivateRoute allowedRole="consultant">
          <ConsultantLayout />
        </PrivateRoute>
      }>
        <Route index element={<ConsultantDashboard />} />
        <Route path="client/:id" element={<ClientDiagnostic />} />
        <Route path="portfolio" element={<div className="container" style={{ padding: '2rem 1.5rem' }}><RecommendedPortfolio /></div>} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* ── Rotas com Sidebar do Cliente (Protegidas) ── */}
      <Route path="/client" element={
        <PrivateRoute allowedRole="client" requireOnboarding>
          <ClientLayout />
        </PrivateRoute>
      }>
        <Route index element={<ClientDashboard />} />
        <Route path="education" element={<AcademyDashboard />} />
        <Route path="income-tax" element={<IncomeTaxDashboard />} />
        <Route path="portfolio" element={<ToolWrapper><RecommendedPortfolio /></ToolWrapper>} />
        <Route path="calculator" element={<ToolWrapper><BucketCalculator /></ToolWrapper>} />
        <Route path="time-calculator" element={<ToolWrapper><TimeCalculator /></ToolWrapper>} />
        <Route path="expenses" element={<div className="container" style={{ padding: '2rem 1.5rem' }}><TransactionManager /></div>} />
        <Route path="goals" element={<ToolWrapper><GoalTracker /></ToolWrapper>} />
        <Route path="simulator" element={<ToolWrapper><InvestmentSimulator /></ToolWrapper>} />
        <Route path="settings" element={<ClientSettings />} />
      </Route>
      
      {/* Redirecionamento legado */}
      <Route path="/client-dashboard" element={<RootLayout><ClientDashboard /></RootLayout>} />
    </Routes>
  </BrowserRouter>
);
