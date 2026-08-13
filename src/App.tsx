import { AppRoutes } from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { AdminRoleSwitcher } from './components/ui/AdminRoleSwitcher';
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <div className="app-container">
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <AdminRoleSwitcher />
          <Toaster position="top-right" toastOptions={{ style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' } }} />
          <Analytics />
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
