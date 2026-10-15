import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, Clock, PieChart, ShieldAlert, 
  MessageCircle, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { ProactiveAlert } from '../hooks/useConsultantAlerts';

interface ProactiveAlertsPanelProps {
  alerts: ProactiveAlert[];
  counts: {
    total: number;
    high: number;
    medium: number;
    fixedCosts: number;
    inactivity: number;
    imbalance: number;
  };
  isLoading?: boolean;
}

export const ProactiveAlertsPanel: React.FC<ProactiveAlertsPanelProps> = ({
  alerts,
  counts,
  isLoading,
}) => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<'all' | 'fixed_costs_overrun' | 'inactivity' | 'imbalance'>('all');

  const filteredAlerts = alerts.filter((a) => {
    if (filterType === 'all') return true;
    return a.type === filterType;
  });

  const getAlertIcon = (type: ProactiveAlert['type']) => {
    switch (type) {
      case 'fixed_costs_overrun':
        return <AlertTriangle size={18} color="var(--danger)" />;
      case 'inactivity':
        return <Clock size={18} color="var(--warning)" />;
      case 'imbalance':
        return <PieChart size={18} color="#3b82f6" />;
      default:
        return <ShieldAlert size={18} color="var(--brand-primary)" />;
    }
  };

  const cleanPhone = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  if (isLoading) {
    return (
      <Card style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Analisando conformidade e indicadores da carteira de clientes...
        </p>
      </Card>
    );
  }

  return (
    <Card
      style={{
        padding: '1.5rem',
        marginBottom: '2rem',
        background: counts.high > 0 ? 'rgba(239, 68, 68, 0.03)' : 'var(--bg-card)',
        borderColor: counts.high > 0 ? 'rgba(239, 68, 68, 0.25)' : 'var(--border-color)',
      }}
      className="anim-fade-up"
    >
      {/* Header do Painel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--r-md)',
              background: counts.total > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: counts.total > 0 ? 'var(--danger)' : 'var(--success)',
            }}
          >
            {counts.total > 0 ? <ShieldAlert size={20} /> : <CheckCircle2 size={20} />}
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Alertas Proativos da Carteira
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0' }}>
              {counts.total === 0
                ? 'Todos os clientes estão com orçamento em dia e carteiras equilibradas.'
                : `${counts.total} ocorrência(s) detectada(s) necessitando de acompanhamento.`}
            </p>
          </div>
        </div>

        {/* Filtros por Regra */}
        {counts.total > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterType('all')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--r-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid var(--border-color)',
                background: filterType === 'all' ? 'var(--brand-primary)' : 'var(--bg-input)',
                color: filterType === 'all' ? '#000' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Todos ({counts.total})
            </button>

            {counts.fixedCosts > 0 && (
              <button
                onClick={() => setFilterType('fixed_costs_overrun')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--r-full)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: filterType === 'fixed_costs_overrun' ? 'var(--danger)' : 'rgba(239, 68, 68, 0.08)',
                  color: filterType === 'fixed_costs_overrun' ? '#fff' : 'var(--danger)',
                  cursor: 'pointer',
                }}
              >
                Custos Fixos ({counts.fixedCosts})
              </button>
            )}

            {counts.inactivity > 0 && (
              <button
                onClick={() => setFilterType('inactivity')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--r-full)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  background: filterType === 'inactivity' ? 'var(--warning)' : 'rgba(245, 158, 11, 0.08)',
                  color: filterType === 'inactivity' ? '#000' : 'var(--warning)',
                  cursor: 'pointer',
                }}
              >
                Inatividade ({counts.inactivity})
              </button>
            )}

            {counts.imbalance > 0 && (
              <button
                onClick={() => setFilterType('imbalance')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--r-full)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  background: filterType === 'imbalance' ? '#3b82f6' : 'rgba(59, 130, 246, 0.08)',
                  color: filterType === 'imbalance' ? '#fff' : '#3b82f6',
                  cursor: 'pointer',
                }}
              >
                Carteira ({counts.imbalance})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lista de Alertas */}
      {filteredAlerts.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.85rem' }}>
          {filteredAlerts.map((alert) => {
            const rawPhone = cleanPhone(alert.clientPhone);
            const whatsappUrl = rawPhone
              ? `https://wa.me/55${rawPhone}?text=${encodeURIComponent(alert.whatsappMessage || '')}`
              : null;

            return (
              <div
                key={alert.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `4px solid ${
                    alert.type === 'fixed_costs_overrun'
                      ? 'var(--danger)'
                      : alert.type === 'inactivity'
                      ? 'var(--warning)'
                      : '#3b82f6'
                  }`,
                  borderRadius: 'var(--r-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getAlertIcon(alert.type)}
                      <strong
                        onClick={() => navigate(`/consultor/client/${alert.clientId}`)}
                        style={{
                          fontSize: '0.95rem',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          textUnderlineOffset: '2px',
                        }}
                      >
                        {alert.clientName}
                      </strong>
                    </div>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: alert.severity === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: alert.severity === 'high' ? 'var(--danger)' : 'var(--warning)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {alert.severity === 'high' ? 'Crítico' : 'Atenção'}
                    </span>
                  </div>

                  <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.35rem' }}>
                    {alert.title}
                  </h5>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem', lineHeight: 1.4 }}>
                    {alert.description}
                  </p>

                  <div
                    style={{
                      background: 'var(--bg-input)',
                      padding: '0.4rem 0.6rem',
                      borderRadius: 'var(--r-sm)',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    💡 <strong>Ação:</strong> {alert.suggestedAction}
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--r-sm)',
                        background: 'rgba(34, 197, 94, 0.12)',
                        color: 'var(--success)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        border: '1px solid rgba(34, 197, 94, 0.25)',
                      }}
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/consultor/client/${alert.clientId}`)}
                    style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    Ver Diagnóstico <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <CheckCircle2 size={32} color="var(--success)" style={{ margin: '0 auto 0.5rem' }} />
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Nenhum alerta pendente nesta categoria.
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            A carteira de clientes está em conformidade com as diretrizes do planejamento.
          </p>
        </div>
      )}
    </Card>
  );
};
