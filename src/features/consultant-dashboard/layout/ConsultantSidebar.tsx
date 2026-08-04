import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Users, FileText, Settings, LogOut, Briefcase } from 'lucide-react';
import '../../../components/layout/Sidebar.css';

const SIDEBAR_LINKS = [
  { to: '/consultor', icon: Users, label: 'Meus Clientes', exact: true },
  { to: '/consultor/reports', icon: FileText, label: 'Relatórios' },
  { to: '/consultor/settings', icon: Settings, label: 'Configurações' },
];

export const ConsultantSidebar: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <Briefcase size={24} color="var(--brand-primary)" />
          <span>AFIC-<strong>Consultor</strong></span>
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
        <NavLink to="/" className="sidebar__link sidebar__link--danger">
          <LogOut size={20} />
          <span>Sair</span>
        </NavLink>
      </div>
    </aside>
  );
};
