import { AppRoutes } from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div className="app-container">
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" toastOptions={{ style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' } }} />
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
