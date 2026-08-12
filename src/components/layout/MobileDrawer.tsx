import React, { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, GraduationCap, TrendingUp, FileText, 
  Calculator, Clock, ShoppingBag, Target, Activity, 
  Users, PieChart, Settings, Shield, LogOut, X, Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';
import './MobileDrawer.css';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CLIENT_LINKS = [
  { to: '/client', icon: LayoutDashboard, label: 'Meu Painel', exact: true },
  { to: '/client/education', icon: GraduationCap, label: 'Academia AFIC 🔒' },
  { to: '/client/portfolio', icon: TrendingUp, label: 'Carteira AFIC 🔒' },
  { to: '/client/income-tax', icon: FileText, label: 'Imposto de Renda 📄' },
  { to: '/client/calculator', icon: Calculator, label: 'Calc. de Baldes' },
  { to: '/client/time-calculator', icon: Clock, label: 'Choque de Realidade' },
  { to: '/client/expenses', icon: ShoppingBag, label: 'Lançamentos' },
  { to: '/client/goals', icon: Target, label: 'Metas e Sonhos' },
  { to: '/client/simulator', icon: Activity, label: 'Simulador Juros' },
  { to: '/client/settings', icon: Settings, label: 'Configurações' },
];

const CONSULTANT_LINKS = [
  { to: '/consultor', icon: Users, label: 'Meus Clientes', exact: true },
  { to: '/consultor/portfolio', icon: PieChart, label: 'Carteira AFIC' },
  { to: '/consultor/reports', icon: FileText, label: 'Relatórios' },
  { to: '/consultor/settings', icon: Settings, label: 'Configurações' },
];

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();

  // Close drawer on route change
  useEffect(() => {
    onClose();
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isConsultantRoute = pathname.startsWith('/consultor');
  const navLinks = isConsultantRoute || role === 'consultant' ? CONSULTANT_LINKS : CLIENT_LINKS;

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  const handleLogout = async () => {
    onClose();
    await signOut();
    navigate('/login');
  };

  return (
    <div className="mobile-drawer-overlay" onClick={onClose}>
      <div 
        className="mobile-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mobile-drawer__header">
          <Logo size={24} textSuffix={isConsultantRoute ? "Consultor" : "Client"} />
          <button 
            className="mobile-drawer__close-btn" 
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* User Badge */}
        <div className="mobile-drawer__user">
          <div className="mobile-drawer__avatar">
            {userInitial}
          </div>
          <div className="mobile-drawer__user-info">
            <span className="mobile-drawer__user-email">{user?.email || 'Usuário'}</span>
            <span className="mobile-drawer__user-role">
              <Sparkles size={12} /> {role === 'admin' ? 'Administrador Master' : role === 'consultant' ? 'Consultor AFIC' : 'Cliente VIP'}
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="mobile-drawer__body">
          <span className="mobile-drawer__section-title">
            Todas as Abas do Sistema ({navLinks.length})
          </span>
          <nav className="mobile-drawer__nav">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = link.exact ? pathname === link.to : pathname.startsWith(link.to);

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`mobile-drawer__link ${isActive ? 'mobile-drawer__link--active' : ''}`}
                  onClick={onClose}
                >
                  <div className="mobile-drawer__link-icon">
                    <Icon size={20} />
                  </div>
                  <span>{link.label}</span>
                </NavLink>
              );
            })}

            {/* Link para Admin se for admin */}
            {role === 'admin' && (
              <NavLink
                to="/admin"
                className={`mobile-drawer__link ${pathname.startsWith('/admin') ? 'mobile-drawer__link--active' : ''}`}
                onClick={onClose}
              >
                <div className="mobile-drawer__link-icon">
                  <Shield size={20} />
                </div>
                <span>Painel Admin Master</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Footer */}
        <div className="mobile-drawer__footer">
          <div className="mobile-drawer__footer-actions">
            <button 
              onClick={handleLogout} 
              className="mobile-drawer__logout-btn"
            >
              <LogOut size={18} />
              <span>Sair da conta</span>
            </button>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
};
