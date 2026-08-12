import React from 'react';
import { Settings, CreditCard, ExternalLink, Shield } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

export const ClientSettings: React.FC = () => {
  const { user, hasPortfolioAccess } = useAuth();

  const handleManageSubscription = () => {
    // Para funcionar, o cliente precisa habilitar o Portal do Cliente no Stripe (Settings > Customer Portal)
    // E colar o link de "Customer portal" gerado pelo Stripe aqui:
    window.open('https://billing.stripe.com/p/login/test_YOUR_PORTAL_LINK_HERE', '_blank');
  };

  return (
    <div className="container anim-fade-up" style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <Settings size={28} color="var(--brand-primary)" />
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>Configurações</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Card style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(234, 179, 8, 0.15)', padding: '1rem', borderRadius: '50%', color: 'var(--brand-primary)' }}>
              <CreditCard size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Assinatura & Faturamento
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Gerencie sua assinatura das Carteiras AFIC, altere formas de pagamento ou cancele seu plano.
              </p>
            </div>
          </div>

          <div style={{ background: 'var(--bg-body)', padding: '1.25rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Status da Assinatura</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {hasPortfolioAccess ? (
                    <>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                      <span style={{ fontWeight: 700, color: 'var(--success)' }}>Ativa (Premium)</span>
                    </>
                  ) : (
                    <>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-muted)' }}></div>
                      <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Inativa</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleManageSubscription}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            Gerenciar Assinatura no Stripe <ExternalLink size={18} />
          </Button>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            Você será redirecionado para o portal seguro do Stripe.
          </p>
        </Card>

        <Card style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '1rem', borderRadius: '50%', color: '#3b82f6' }}>
              <Shield size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Dados da Conta
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                Email cadastrado: <strong>{user?.email}</strong>
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Para alterar seu email ou senha, entre em contato com o suporte técnico.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
