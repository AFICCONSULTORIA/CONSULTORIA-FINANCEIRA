import React, { useState } from 'react';
import { TrendingUp, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MobileDrawer } from './MobileDrawer';
import './MobileHeader.css';

export const MobileHeader: React.FC = () => {
  const { user, role } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <header className="mobile-header">
        <div className="mobile-header__inner">
          <div className="mobile-header__brand">
            <div className="mobile-header__logo-icon">
              <TrendingUp size={18} />
            </div>
            <div className="mobile-header__title">
              AFIC <span>{role === 'consultant' ? 'Consultor' : 'Consultoria'}</span>
            </div>
          </div>

          <div className="mobile-header__user">
            <div className="mobile-header__avatar" title={user?.email || 'Usuário'}>
              {userInitial}
            </div>
            <button 
              className="mobile-header__menu-btn" 
              onClick={() => setIsDrawerOpen(true)} 
              title="Abrir todas as abas"
              aria-label="Abrir Menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};
