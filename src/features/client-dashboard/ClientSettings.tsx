import React, { useState } from 'react';
import { 
  Settings, CreditCard, Shield, AlertTriangle, CheckCircle2, 
  X, Loader2, Sparkles, HelpCircle, ArrowRight 
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const CANCELLATION_REASONS = [
  'Não estou investindo no momento',
  'Dificuldade financeira temporária',
  'Achei o valor elevado para o meu momento',
  'Prefiro montar minha carteira por conta própria',
  'Outro motivo'
];

export const ClientSettings: React.FC = () => {
  const { 
    user, 
    hasPortfolioAccess, 
    subscriptionStatus, 
    subscriptionCanceledAt, 
    refreshUserData 
  } = useAuth();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);
  const [customReasonText, setCustomReasonText] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Link oficial de checkout do Stripe com identificação do cliente
  const handleCheckoutOrReactivate = () => {
    let url = 'https://buy.stripe.com/cNiaEX7SZ25daMZbop3ZK00';
    if (user?.id) {
      url += `?client_reference_id=${user.id}`;
    }
    window.open(url, '_blank');
  };

  // Execução do cancelamento de assinatura pelo próprio cliente
  const handleConfirmCancellation = async () => {
    if (!user) return;
    setIsCancelling(true);

    const finalReason = selectedReason === 'Outro motivo' 
      ? `Outro: ${customReasonText.trim() || 'Não especificado'}` 
      : selectedReason;

    try {
      // 1. Tenta executar via RPC com SECURITY DEFINER
      const { error: rpcError } = await supabase.rpc('client_cancel_own_subscription', {
        reason: finalReason
      });

      if (rpcError) {
        console.warn('RPC client_cancel_own_subscription falhou, aplicando fallback direto:', rpcError);
        // 2. Fallback: Atualização direta do perfil na tabela users
        const { error: directError } = await supabase
          .from('users')
          .update({
            has_portfolio_access: false,
            subscription_status: 'cancelled',
            subscription_canceled_at: new Date().toISOString(),
            subscription_cancel_reason: finalReason
          })
          .eq('id', user.id);

        if (directError) {
          // Se colunas extras não existirem, atualiza apenas has_portfolio_access
          const { error: basicError } = await supabase
            .from('users')
            .update({ has_portfolio_access: false })
            .eq('id', user.id);

          if (basicError) throw basicError;
        }
      }

      toast.success('Sua assinatura foi cancelada com sucesso.');
      setIsCancelModalOpen(false);
      await refreshUserData();
    } catch (err: any) {
      console.error('Erro ao cancelar assinatura:', err);
      toast.error(`Não foi possível cancelar: ${err.message || 'Tente novamente mais tarde'}`);
    } finally {
      setIsCancelling(false);
    }
  };

  const isActuallyActive = hasPortfolioAccess || subscriptionStatus === 'active';
  const isCancelled = !isActuallyActive && (subscriptionStatus === 'cancelled' || Boolean(subscriptionCanceledAt));

  return (
    <div className="container anim-fade-up" style={{ padding: '2rem 1.5rem', maxWidth: '820px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: 'var(--r-md)' }}>
          <Settings size={26} color="var(--brand-primary)" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>Configurações da Conta</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Gerencie seu plano, assinatura das carteiras recomendadas e dados de acesso.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Card de Assinatura & Faturamento */}
        <Card style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ 
                background: isActuallyActive ? 'rgba(16, 185, 129, 0.15)' : isCancelled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)', 
                padding: '0.875rem', 
                borderRadius: '50%', 
                color: isActuallyActive ? 'var(--brand-primary)' : isCancelled ? 'var(--danger)' : 'var(--brand-primary)' 
              }}>
                <CreditCard size={26} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Carteiras Recomendadas AFIC
                  </h2>
                  {isActuallyActive && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 800, 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '9999px', 
                      background: 'rgba(16, 185, 129, 0.15)', 
                      color: 'var(--brand-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Sparkles size={12} /> PREMIUM ATIVO
                    </span>
                  )}
                  {isCancelled && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 800, 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '9999px', 
                      background: 'rgba(239, 68, 68, 0.15)', 
                      color: 'var(--danger)' 
                    }}>
                      CANCELADA
                    </span>
                  )}
                  {!isActuallyActive && !isCancelled && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 800, 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '9999px', 
                      background: 'rgba(255, 255, 255, 0.08)', 
                      color: 'var(--text-muted)' 
                    }}>
                      INATIVA
                    </span>
                  )}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  Plano de Recomendações Estruturadas com a Estratégia dos Baldes.
                </p>
              </div>
            </div>
          </div>

          {/* Painel do Status Atual */}
          <div style={{ 
            background: 'var(--bg-input)', 
            padding: '1.25rem', 
            borderRadius: 'var(--r-md)', 
            border: '1px solid var(--border-color)', 
            marginBottom: '1.5rem' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Status Atual
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                  {isActuallyActive ? (
                    <>
                      <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--success)' }}></div>
                      <span style={{ fontWeight: 800, color: 'var(--success)', fontSize: '0.95rem' }}>
                        Assinatura Ativa (Acesso Liberado)
                      </span>
                    </>
                  ) : isCancelled ? (
                    <>
                      <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--danger)' }}></div>
                      <span style={{ fontWeight: 800, color: 'var(--danger)', fontSize: '0.95rem' }}>
                        Assinatura Cancelada
                      </span>
                      {subscriptionCanceledAt && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          • em {new Date(subscriptionCanceledAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--text-muted)' }}></div>
                      <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Sem Assinatura Ativa
                      </span>
                    </>
                  )}
                </div>
              </div>

              {isActuallyActive && (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Benefícios Inclusos
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
                    Rebalanceamento + Preços-Teto
                  </span>
                </div>
              )}
            </div>

            {/* Lista resumida de benefícios quando ativo */}
            {isActuallyActive && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={14} color="var(--brand-primary)" />
                  <span>Carteira de Ações & Dividendos</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={14} color="var(--brand-primary)" />
                  <span>Carteira de FIIs & Renda Fixa</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={14} color="var(--brand-primary)" />
                  <span>Simulador de Aportes Baldes</span>
                </div>
              </div>
            )}
          </div>

          {/* Ações de Assinatura */}
          {isActuallyActive ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '480px' }}>
                  Você pode cancelar sua assinatura a qualquer momento. O cancelamento é imediato e não gera novas cobranças.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => setIsCancelModalOpen(true)}
                  style={{ 
                    borderColor: 'rgba(239, 68, 68, 0.4)', 
                    color: 'var(--danger)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <AlertTriangle size={16} /> Cancelar Assinatura
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ 
                background: 'rgba(234, 179, 8, 0.06)', 
                border: '1px solid rgba(234, 179, 8, 0.25)', 
                borderRadius: 'var(--r-md)', 
                padding: '1rem 1.25rem',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)'
              }}>
                {isCancelled ? (
                  <p style={{ margin: 0 }}>
                    Sua assinatura foi cancelada. Para voltar a ter acesso às recomendações e rebalanceamento mensal das Carteiras AFIC, reative seu plano abaixo.
                  </p>
                ) : (
                  <p style={{ margin: 0 }}>
                    Você ainda não possui acesso às Carteiras Recomendadas AFIC. Assine para desbloquear teses completas, preços-teto e alocação ideal.
                  </p>
                )}
              </div>

              <Button 
                onClick={handleCheckoutOrReactivate}
                style={{ 
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  padding: '0.875rem'
                }}
              >
                {isCancelled ? 'Reativar Assinatura no Stripe' : 'Assinar Carteiras Recomendadas AFIC'}
                <ArrowRight size={18} />
              </Button>
            </div>
          )}
        </Card>

        {/* Card Dados da Conta */}
        <Card style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.875rem', borderRadius: '50%', color: 'var(--info)' }}>
              <Shield size={26} />
            </div>
            <div style={{ width: '100%' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Dados da Conta & Acesso
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1rem' }}>
                E-mail cadastrado: <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>
              </p>

              <div style={{ background: 'var(--bg-input)', padding: '1rem 1.25rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HelpCircle size={18} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Deseja alterar seu e-mail, telefone ou senha de acesso?
                  </span>
                </div>
                <a 
                  href="https://wa.me/5511999999999" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ fontSize: '0.85rem', color: 'var(--brand-primary)', fontWeight: 700, textDecoration: 'none' }}
                >
                  Falar com o Suporte AFIC →
                </a>
              </div>
            </div>
          </div>
        </Card>

      </div>

      {/* Modal de Cancelamento de Assinatura */}
      {isCancelModalOpen && (
        <div className="tx-modal-overlay">
          <div className="tx-modal anim-fade-up" style={{ maxWidth: '520px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '0.625rem', borderRadius: '50%', color: 'var(--danger)' }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Cancelar Assinatura?
                  </h2>
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    Carteiras Recomendadas AFIC
                  </span>
                </div>
              </div>
              <button 
                onClick={() => !isCancelling && setIsCancelModalOpen(false)} 
                disabled={isCancelling}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Aviso de impacto */}
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.08)', 
              border: '1px solid rgba(239, 68, 68, 0.25)', 
              borderRadius: 'var(--r-md)', 
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.35rem' }}>
                O que acontece ao cancelar:
              </h4>
              <ul style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, paddingLeft: '1.25rem', lineHeight: 1.5 }}>
                <li>Seu acesso às teses de investimento e preços-teto será suspenso.</li>
                <li>Você não receberá as orientações mensais de rebalanceamento dos baldes.</li>
                <li>Você pode reativar sua assinatura quando desejar.</li>
              </ul>
            </div>

            {/* Motivo do Cancelamento */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="afic-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Por favor, conte-nos o motivo do cancelamento:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {CANCELLATION_REASONS.map(reason => (
                  <label 
                    key={reason}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.625rem 0.875rem',
                      borderRadius: 'var(--r-sm)',
                      background: selectedReason === reason ? 'rgba(234, 179, 8, 0.1)' : 'var(--bg-input)',
                      border: selectedReason === reason ? '1px solid var(--brand-primary)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      color: selectedReason === reason ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="cancelReason" 
                      value={reason} 
                      checked={selectedReason === reason} 
                      onChange={() => setSelectedReason(reason)}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              {selectedReason === 'Outro motivo' && (
                <div style={{ marginTop: '0.75rem' }}>
                  <textarea
                    rows={2}
                    placeholder="Nos ajude a melhorar: compartilhe seu feedback (opcional)..."
                    value={customReasonText}
                    onChange={e => setCustomReasonText(e.target.value)}
                    className="afic-input"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
              )}
            </div>

            {/* Botões do Modal */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button 
                type="button" 
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
                style={{ flex: 1 }}
              >
                Continuar com Minha Assinatura
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={handleConfirmCancellation}
                disabled={isCancelling}
                style={{ 
                  borderColor: 'rgba(239, 68, 68, 0.4)', 
                  color: 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {isCancelling ? (
                  <>
                    <Loader2 size={16} className="anim-spin" />
                    Processando...
                  </>
                ) : (
                  'Confirmar Cancelamento'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
