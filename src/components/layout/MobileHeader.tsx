import React from 'react';
import { TrendingUp, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './MobileHeader.css';

export const MobileHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <header className="mobile-header">
      <div className="mobile-header__inner">
        <div className="mobile-header__brand">
          <div className="mobile-header__logo-icon">
            <TrendingUp size={18} />
          </div>
          <div className="mobile-header__title">
            AFIC <span>Consultoria</span>
          </div>
        </div>

        <div className="mobile-header__user">
          <div className="mobile-header__avatar" title={user?.email || 'Usuário'}>
            {userInitial}
          </div>
          <button 
            className="mobile-header__logout" 
            onClick={signOut} 
            title="Sair da conta"
            aria-label="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
