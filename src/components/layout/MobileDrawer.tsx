import React, { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, GraduationCap, TrendingUp, FileText, 
  Calculator, Clock, ShoppingBag, Target, Activity, 
  Users, PieChart, Settings, Shield, LogOut, X, Sparkles, Compass, CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';
import './MobileDrawer.css';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  icon: any;
  label: string;
  badge?: string;
  exact?: boolean;
}

interface NavGroup {
  sectionTitle: string;
  items: NavItem[];
}

const CLIENT_GROUPS: NavGroup[] = [
  {
    sectionTitle: 'Principal',
    items: [
      { to: '/client', icon: LayoutDashboard, label: 'Meu Painel', exact: true },
      { to: '/client/expenses', icon: ShoppingBag, label: 'Lançamentos' },
      { to: '/client/debts', icon: CreditCard, label: 'Dívidas & Crédito' },
      { to: '/client/goals', icon: Target, label: 'Metas e Sonhos' },
    ],
  },
  {
    sectionTitle: 'Estratégia & Wealth',
    items: [
      { to: '/client/the-plan', icon: Compass, label: 'O Plano', badge: 'VIP' },
      { to: '/client/portfolio', icon: TrendingUp, label: 'Carteira AFIC', badge: 'PRO' },
      { to: '/client/income-tax', icon: FileText, label: 'Imposto de Renda' },
      { to: '/client/education', icon: GraduationCap, label: 'Academia AFIC' },
    ],
  },
  {
    sectionTitle: 'Simuladores',
    items: [
      { to: '/client/calculator', icon: Calculator, label: 'Calc. de Baldes' },
      { to: '/client/time-calculator', icon: Clock, label: 'Choque de Realidade' },
      { to: '/client/simulator', icon: Activity, label: 'Simulador de Juros' },
    ],
  },
  {
    sectionTitle: 'Sistema',
    items: [
      { to: '/client/settings', icon: Settings, label: 'Configurações' },
    ],
  },
];

const CONSULTANT_GROUPS: NavGroup[] = [
  {
    sectionTitle: 'Gestão de Consultoria',
    items: [
      { to: '/consultor', icon: Users, label: 'Meus Clientes', exact: true },
      { to: '/consultor/portfolio', icon: PieChart, label: 'Carteira AFIC' },
      { to: '/consultor/reports', icon: FileText, label: 'Relatórios' },
      { to: '/consultor/settings', icon: Settings, label: 'Configurações' },
    ],
  },
];

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut, hasPortfolioAccess } = useAuth();

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
  const navGroups = isConsultantRoute || role === 'consultant' ? CONSULTANT_GROUPS : CLIENT_GROUPS;

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

        {/* Navigation Sections */}
        <div className="mobile-drawer__body">
          {navGroups.map((group) => (
            <div key={group.sectionTitle} style={{ marginBottom: '1.25rem' }}>
              <span className="mobile-drawer__section-title">
                {group.sectionTitle}
              </span>
              <nav className="mobile-drawer__nav">
                {group.items.map((link) => {
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
                        <Icon size={18} />
                      </div>
                      <span style={{ flex: 1 }}>{link.label}</span>
                      {link.badge && (
                        <span 
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--r-full)',
                            background: link.to === '/client/portfolio' && hasPortfolioAccess ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                            color: link.to === '/client/portfolio' && hasPortfolioAccess ? 'var(--brand-primary)' : 'var(--text-muted)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          {link.to === '/client/portfolio' && hasPortfolioAccess ? 'VIP' : link.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}

          {/* Link para Admin se for admin */}
          {role === 'admin' && (
            <div style={{ marginTop: '1rem' }}>
              <span className="mobile-drawer__section-title">Administração</span>
              <nav className="mobile-drawer__nav">
                <NavLink
                  to="/admin"
                  className={`mobile-drawer__link ${pathname.startsWith('/admin') ? 'mobile-drawer__link--active' : ''}`}
                  onClick={onClose}
                >
                  <div className="mobile-drawer__link-icon">
                    <Shield size={18} />
                  </div>
                  <span>Painel Admin Master</span>
                </NavLink>
              </nav>
            </div>
          )}
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
