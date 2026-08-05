import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Receipt, Calculator, Target, TrendingUp } from 'lucide-react';
import './BottomNav.css';

const navItems = [
  { to: '/client', label: 'Início', icon: Home },
  { to: '/client/expenses', label: 'Lançamentos', icon: Receipt },
  { to: '/calculator', label: 'Baldes', icon: Calculator },
  { to: '/goals', label: 'Metas', icon: Target },
  { to: '/simulator', label: 'Simulador', icon: TrendingUp },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();

  // Show bottom nav only on client routes (not consultant or login)
  const isClientRoute = 
    location.pathname.startsWith('/client') || 
    location.pathname === '/calculator' || 
    location.pathname === '/goals' || 
    location.pathname === '/simulator' ||
    location.pathname === '/time-calculator';

  if (!isClientRoute) return null;

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav__inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
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
      </div>
    </nav>
  );
};
