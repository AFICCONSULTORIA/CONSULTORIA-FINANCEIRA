import React, { useState } from 'react';
import { CheckCircle, Circle, ChevronDown, ChevronUp, AlertCircle, TrendingUp, Lightbulb, Calendar } from 'lucide-react';

interface Action {
  id: string;
  title: string;
  description?: string;
  category?: 'urgent' | 'organization' | 'growth';
  due_date?: string;
  status: 'pending' | 'completed';
}

interface ActionPlanWidgetProps {
  actions: Action[];
  onActionToggle: (action: Action) => void;
}

const CATEGORY_CONFIG = {
  urgent: { label: 'Prioridade Alta', color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.1)' },
  organization: { label: 'Organização', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' },
  growth: { label: 'Crescimento', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)' },
};

export const ActionPlanWidget: React.FC<ActionPlanWidgetProps> = ({ actions, onActionToggle }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const completedCount = actions.filter(a => a.status === 'completed').length;
  const totalCount = actions.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      
      {/* Progresso Geral */}
      {totalCount > 0 && (
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Progresso do Plano</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {completedCount} de {totalCount} ações concluídas
              </p>
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-primary)' }}>{progress}%</span>
          </div>
          <div className="afic-progress" style={{ height: '8px' }}>
            <div className="afic-progress__bar" style={{ width: `${progress}%`, background: 'var(--grad-brand)' }} />
          </div>
        </div>
      )}

      {/* Lista de Ações */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
        {totalCount === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-input)', borderRadius: 'var(--r-md)' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p>Seu perfil está sob análise. Em breve, seu consultor montará seu plano de ação aqui.</p>
          </div>
        ) : (
          actions.map((action) => {
            const isCompleted = action.status === 'completed';
            const isExpanded = expandedId === action.id;
            const catConfig = CATEGORY_CONFIG[action.category || 'organization'];

            return (
              <div 
                key={action.id} 
                style={{ 
                  background: 'var(--bg-card)', 
                  border: `1px solid ${isExpanded ? 'var(--brand-primary-light)' : 'var(--border-color)'}`, 
                  borderRadius: 'var(--r-md)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  boxShadow: isExpanded ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {/* Header da Ação */}
                <div 
                  onClick={() => onActionToggle(action)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '0.75rem', 
                    padding: '1rem', 
                    cursor: 'pointer',
                    background: isCompleted ? 'var(--bg-input)' : 'transparent',
                    opacity: isCompleted ? 0.7 : 1
                  }}
                >
                  <div style={{ marginTop: '0.125rem' }}>
                    {isCompleted ? (
                      <CheckCircle size={22} color="var(--success)" style={{ flexShrink: 0 }} />
                    ) : (
                      <Circle size={22} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                    )}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 700, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: catConfig.bg,
                        color: catConfig.color
                      }}>
                        {catConfig.label}
                      </span>
                      {action.due_date && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={12} /> {new Date(action.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                    
                    <span style={{ 
                      color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)', 
                      textDecoration: isCompleted ? 'line-through' : 'none',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      lineHeight: 1.4,
                      display: 'block'
                    }}>
                      {action.title}
                    </span>
                  </div>

                  {action.description && (
                    <button 
                      onClick={(e) => toggleExpand(action.id, e)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: isExpanded ? 'var(--brand-primary)' : 'var(--text-muted)', 
                        cursor: 'pointer', 
                        padding: '0.25rem',
                        alignSelf: 'center',
                        marginLeft: '0.5rem'
                      }}
                    >
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  )}
                </div>

                {/* Área Expandida: Instruções do Consultor */}
                {isExpanded && action.description && (
                  <div style={{ padding: '1rem', background: 'var(--bg-input)', borderTop: '1px solid var(--border-color)', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
                      <Lightbulb size={16} /> Como fazer:
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{action.description}</div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Regras de Ouro / Central de Apoio */}
      <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-color)', marginTop: '1rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <TrendingUp size={18} color="var(--brand-primary)" /> Regras de Ouro da Consultoria
        </h4>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--success)' }}>•</span>
            Pague a si mesmo primeiro (Invista antes de gastar).
          </li>
          <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--success)' }}>•</span>
            Registre todos os gastos semanalmente.
          </li>
          <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--success)' }}>•</span>
            Antes de comprar, espere 24h para evitar compras por impulso.
          </li>
        </ul>
      </div>

    </div>
  );
};
