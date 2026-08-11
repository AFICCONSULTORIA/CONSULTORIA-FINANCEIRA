import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Briefcase, Receipt, GraduationCap, 
  Users, PieChart, FileText, Settings, Menu 
} from 'lucide-react';
import { MobileDrawer } from './MobileDrawer';
import './BottomNav.css';

const CLIENT_NAV_ITEMS = [
  { to: '/client', label: 'Início', icon: Home, exact: true },
  { to: '/client/portfolio', label: 'Carteira', icon: Briefcase },
  { to: '/client/expenses', label: 'Lanç.', icon: Receipt },
  { to: '/client/education', label: 'Aulas 🔒', icon: GraduationCap },
];

const CONSULTANT_NAV_ITEMS = [
  { to: '/consultor', label: 'Clientes', icon: Users, exact: true },
  { to: '/consultor/portfolio', label: 'Carteira', icon: PieChart },
  { to: '/consultor/reports', label: 'Relatórios', icon: FileText },
  { to: '/consultor/settings', label: 'Config', icon: Settings },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isClientRoute = location.pathname.startsWith('/client');
  const isConsultantRoute = location.pathname.startsWith('/consultor');

  if (!isClientRoute && !isConsultantRoute) return null;

  const items = isConsultantRoute ? CONSULTANT_NAV_ITEMS : CLIENT_NAV_ITEMS;

  return (
    <>
      <nav className="bottom-nav">
        <div className="bottom-nav__inner">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
              >
                <span className="bottom-nav__icon-wrap">
                  <Icon size={20} />
                </span>
                <span className="bottom-nav__label">{item.label}</span>
              </Link>
            );
          })}

          {/* Botão "Mais" que abre todas as abas no celular */}
          <button
            type="button"
            className="bottom-nav__item bottom-nav__item--more"
            onClick={() => setIsDrawerOpen(true)}
          >
            <span className="bottom-nav__icon-wrap">
              <Menu size={20} />
            </span>
            <span className="bottom-nav__label">Mais</span>
          </button>
        </div>
      </nav>

      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};
