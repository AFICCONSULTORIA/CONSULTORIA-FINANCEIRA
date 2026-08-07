import React from 'react';
import { Lock, TrendingUp, ShieldCheck, PieChart, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const PortfolioPaywall: React.FC = () => {
  const handleCheckout = () => {
    toast('A assinatura estará disponível em breve! Estamos ajustando os últimos detalhes.', { icon: '🚧' });
    // Integração futura com Stripe / Checkout
    // window.open('https://buy.stripe.com/test_00w28qfSsasO9AO1teabK04', '_blank');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
      minHeight: '60vh',
    }}>
      <div style={{
        background: 'rgba(234, 179, 8, 0.15)',
        padding: '1.5rem',
        borderRadius: '50%',
        marginBottom: '1.5rem',
        color: 'var(--brand-primary)',
        boxShadow: '0 0 20px rgba(234, 179, 8, 0.1)'
      }}>
        <Lock size={48} />
      </div>

      <h2 style={{
        fontSize: '2rem',
        fontWeight: 800,
        color: 'var(--text-primary)',
        marginBottom: '0.5rem'
      }}>
        Desbloqueie as Carteiras AFIC
      </h2>
      <p style={{
        fontSize: '1.125rem',
        color: 'var(--text-muted)',
        maxWidth: '600px',
        marginBottom: '2.5rem',
        lineHeight: 1.6
      }}>
        Tenha acesso exclusivo às nossas carteiras recomendadas estruturadas pela estratégia <strong>BESST</strong>. Maximize seus dividendos com segurança e rebalanceamento mensal profissional.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        width: '100%',
        maxWidth: '800px',
        marginBottom: '3rem'
      }}>
        <Card style={{ padding: '1.5rem', textAlign: 'left', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <TrendingUp color="var(--success)" size={24} style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Alta Rentabilidade</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Estratégias otimizadas para superar os principais índices do mercado financeiro.</p>
          </div>
        </Card>

        <Card style={{ padding: '1.5rem', textAlign: 'left', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <ShieldCheck color="var(--info)" size={24} style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Proteção BESST</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Foco em Bancos, Energia, Seguros, Saneamento e Telecom para segurança blindada.</p>
          </div>
        </Card>

        <Card style={{ padding: '1.5rem', textAlign: 'left', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <PieChart color="var(--brand-primary)" size={24} style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Atualizações Mensais</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Rebalanceamento mensal da alocação ideal para você nunca ficar para trás.</p>
          </div>
        </Card>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-brand)',
        borderRadius: 'var(--r-lg)',
        padding: '2.5rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: 'var(--brand-primary)' }}>
            Acesso Premium Completo
          </span>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>R$</span>
            <span style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>19,90</span>
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mês</span>
          </div>
        </div>

        <Button
          size="lg"
          onClick={handleCheckout}
          style={{
            width: '100%',
            fontSize: '1.125rem',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}
        >
          Desbloquear Carteiras <ArrowRight size={20} />
        </Button>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Pagamento 100% seguro processado via Stripe. Cancele quando quiser.
        </p>
      </div>
    </div>
  );
};
