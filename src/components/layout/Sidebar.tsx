import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Calculator, ShoppingBag, Target, TrendingUp, 
  LogOut, Clock, GraduationCap, FileText, Compass, Settings as SettingsIcon,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';
import './Sidebar.css';

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

const CLIENT_NAV_GROUPS: NavGroup[] = [
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
      { to: '/client/simulator', icon: TrendingUp, label: 'Simulador de Juros' },
    ],
  },
  {
    sectionTitle: 'Preferências',
    items: [
      { to: '/client/settings', icon: SettingsIcon, label: 'Configurações' },
    ],
  },
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
        {CLIENT_NAV_GROUPS.map((group) => (
          <div key={group.sectionTitle} className="sidebar__section">
            <span className="sidebar__section-title">{group.sectionTitle}</span>
            <div className="sidebar__section-items">
              {group.items.map((link) => {
                const Icon = link.icon;
                const isActive = link.exact ? pathname === link.to : pathname.startsWith(link.to);
                
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                  >
                    <Icon size={18} />
                    <span className="sidebar__link-text">{link.label}</span>
                    {link.badge && (
                      <span className={`sidebar__badge ${link.to === '/client/portfolio' && hasPortfolioAccess ? 'sidebar__badge--active' : ''}`}>
                        {link.to === '/client/portfolio' && hasPortfolioAccess ? 'VIP' : link.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <button onClick={handleLogout} className="sidebar__link sidebar__link--danger">
          <LogOut size={18} />
          <span>Sair</span>
        </button>
        <ThemeToggle />
      </div>
    </aside>
  );
};
