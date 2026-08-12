import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calculator, ShoppingBag, Target, TrendingUp, LogOut, Clock, GraduationCap, FileText, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';
import './Sidebar.css';

const SIDEBAR_LINKS = [
  { to: '/client', icon: LayoutDashboard, label: 'Meu Painel', exact: true },
  { to: '/client/education', icon: GraduationCap, label: 'Academia AFIC 🔒' },
  { to: '/client/portfolio', icon: TrendingUp, label: 'Carteira AFIC 🔒' },
  { to: '/client/income-tax', icon: FileText, label: 'Imposto de Renda 📄' },
  { to: '/client/calculator', icon: Calculator, label: 'Calc. de Baldes' },
  { to: '/client/time-calculator', icon: Clock, label: 'Choque de Realidade' },
  { to: '/client/expenses', icon: ShoppingBag, label: 'Lançamentos' },
  { to: '/client/goals', icon: Target, label: 'Metas e Sonhos' },
  { to: '/client/simulator', icon: TrendingUp, label: 'Simulador Juros' },
  { to: '/client/settings', icon: SettingsIcon, label: 'Configurações' },
];

export const Sidebar: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { signOut, hasPortfolioAccess } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <Logo size={28} textSuffix="Client" />
        </div>
      </div>

      <nav className="sidebar__nav">
        {SIDEBAR_LINKS.map(link => {
          const Icon = link.icon;
          const isActive = link.exact ? pathname === link.to : pathname.startsWith(link.to);
          
          let label = link.label;
          if (link.to === '/client/portfolio' && hasPortfolioAccess) {
            label = 'Carteira AFIC';
          }
          
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            >
              <Icon size={20} />
              <span>{label}</span>
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
