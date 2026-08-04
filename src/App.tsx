import { AppRoutes } from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <div className="app-container" data-theme="dark">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </div>
  );
}

export default App;
