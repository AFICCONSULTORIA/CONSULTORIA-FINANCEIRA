import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calculator, ShoppingBag, Target, TrendingUp, LogOut, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const SIDEBAR_LINKS = [
  { to: '/client', icon: LayoutDashboard, label: 'Meu Painel', exact: true },
  { to: '/client/calculator', icon: Calculator, label: 'Calc. de Baldes' },
  { to: '/client/time-calculator', icon: Clock, label: 'Choque de Realidade' },
  { to: '/client/expenses', icon: ShoppingBag, label: 'Lançamentos' },
  { to: '/client/goals', icon: Target, label: 'Metas e Sonhos' },
  { to: '/client/simulator', icon: TrendingUp, label: 'Simulador Juros' },
];

export const Sidebar: React.FC = () => {
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
          <TrendingUp size={24} color="var(--brand-primary)" />
          <span>AFIC-<strong>Client</strong></span>
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

      <div className="sidebar__footer">
        <button onClick={handleLogout} className="sidebar__link sidebar__link--danger" style={{ border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', background: 'transparent' }}>
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};
