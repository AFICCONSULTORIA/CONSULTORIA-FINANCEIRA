import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Users, FileText, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Logo } from '../../../components/ui/Logo';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import '../../../components/layout/Sidebar.css';

const SIDEBAR_LINKS = [
  { to: '/consultor', icon: Users, label: 'Meus Clientes', exact: true },
  { to: '/consultor/reports', icon: FileText, label: 'Relatórios' },
  { to: '/consultor/settings', icon: Settings, label: 'Configurações' },
];

export const ConsultantSidebar: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <Logo size={28} textSuffix="Consultor" />
        </div>
      </div>

      <nav className="sidebar__nav">
        {SIDEBAR_LINKS.map(link => {
          const Icon = link.icon;
          const isActive = link.exact ? pathname === link.to : pathname.startsWith(link.to);
          
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar__footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
        <button onClick={handleLogout} className="sidebar__link sidebar__link--danger" style={{ border: 'none', textAlign: 'left', cursor: 'pointer', background: 'transparent', flex: 1, padding: 0 }}>
          <LogOut size={20} />
          <span>Sair</span>
        </button>
        <ThemeToggle />
      </div>
    </aside>
  );
};
