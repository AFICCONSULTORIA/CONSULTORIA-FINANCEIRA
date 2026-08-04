import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, Briefcase, ArrowRight, TrendingUp, Shield, Target, ChevronRight } from 'lucide-react';
import './Home.css';

const tools = [
  {
    id: 'onboarding',
    route: '/onboarding',
    icon: ClipboardList,
    color: '#10B981',
    glow: 'rgba(16,185,129,0.25)',
    badge: 'Primeiro Passo',
    title: 'Diagnóstico Financeiro',
    description: 'Formulário guiado em 5 etapas para mapear renda, despesas, dívidas, patrimônio e sonhos.',
    cta: 'Iniciar Diagnóstico',
    delay: '0ms',
  },
  {
    id: 'client-dashboard',
    route: '/client',
    icon: LayoutDashboard,
    color: '#06B6D4',
    glow: 'rgba(6,182,212,0.25)',
    badge: 'Visão do Cliente',
    title: 'Painel Financeiro',
    description: 'Acompanhe seu score de saúde, a divisão estratégica dos baldes e o progresso das suas metas.',
    cta: 'Ver Meu Painel',
    delay: '80ms',
  },
  {
    id: 'consultor',
    route: '/consultor',
    icon: Briefcase,
    color: '#8B5CF6',
    glow: 'rgba(139,92,246,0.25)',
    badge: 'Consultores',
    title: 'Portal do Consultor',
    description: 'Gerencie sua carteira de clientes, realize diagnósticos e recomende estratégias personalizadas.',
    cta: 'Acessar Portal',
    delay: '160ms',
  },
];

const features = [
  { icon: TrendingUp, title: 'Score de Saúde', desc: 'Indicador 0-100 que mede liquidez, endividamento e taxa de poupança em tempo real.' },
  { icon: Shield,     title: 'Baldes Estratégicos', desc: '6 categorias inteligentes para alocar cada centavo da sua renda com propósito.' },
  { icon: Target,     title: 'Plano de Ação', desc: 'Tarefas priorizadas e personalizadas pelo consultor para eliminar dívidas e construir patrimônio.' },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home">

      {/* ── Hero Section ── */}
      <section className="home__hero">
        <div className="home__hero-bg" aria-hidden />

        <div className="home__hero-content container">
          <span className="home__pill anim-fade-up">
            <span className="home__pill-dot" />
            Plataforma Premium de Consultoria
          </span>

          <h1 className="home__title anim-fade-up" style={{ animationDelay: '60ms' }}>
            Transforme sua relação<br />
            com o <span className="gradient-text">dinheiro</span>
          </h1>

          <p className="home__subtitle anim-fade-up" style={{ animationDelay: '120ms' }}>
            Diagnóstico inteligente, estratégia baseada em dados e acompanhamento
            contínuo para construir o patrimônio que você merece.
          </p>

          <div className="home__hero-actions anim-fade-up" style={{ animationDelay: '180ms' }}>
            <button className="afic-btn afic-btn--primary afic-btn--lg" onClick={() => navigate('/onboarding')}>
              Começar Gratuitamente <ArrowRight size={20} />
            </button>
            <button className="afic-btn afic-btn--ghost" onClick={() => navigate('/client')}>
              Ver Demo do Painel
            </button>
          </div>
        </div>
      </section>

      {/* ── Tools Grid ── */}
      <section className="home__tools container">
        <div className="home__section-header">
          <h2 className="home__section-title">Ferramentas Disponíveis</h2>
          <p className="home__section-sub">Tudo que você precisa para dominar suas finanças em um só lugar.</p>
        </div>

        <div className="home__tools-grid">
          {tools.map(tool => {
            const Icon = tool.icon;
            return (
              <article
                key={tool.id}
                className="tool-card anim-fade-up"
                style={{ animationDelay: tool.delay, '--tool-color': tool.color, '--tool-glow': tool.glow } as React.CSSProperties}
              >
                <div className="tool-card__top">
                  <div className="tool-card__icon-wrap">
                    <Icon size={26} color={tool.color} />
                  </div>
                  <span className="tool-card__badge">{tool.badge}</span>
                </div>

                <h3 className="tool-card__title">{tool.title}</h3>
                <p className="tool-card__desc">{tool.description}</p>

                <button
                  className="tool-card__cta"
                  onClick={() => navigate(tool.route)}
                >
                  {tool.cta} <ChevronRight size={16} />
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Features Strip ── */}
      <section className="home__features container">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className="feature-item anim-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="feature-item__icon">
                <Icon size={22} color="var(--brand-primary)" />
              </div>
              <div>
                <h4 className="feature-item__title">{f.title}</h4>
                <p className="feature-item__desc">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Footer ── */}
      <footer className="home__footer">
        <p>© 2026 <strong>AFIC-Consultoria</strong>. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};
