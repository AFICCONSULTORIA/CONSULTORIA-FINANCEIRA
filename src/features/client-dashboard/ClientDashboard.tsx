import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { TrendingUp, Activity, Target, Loader2, X, MessageSquare, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { TransactionManager } from './components/TransactionManager';
import { ActionPlanWidget } from './components/ActionPlanWidget';
import '../../components/ui/ui.css';
import './ClientDashboard.css';

const BUCKET_COLORS = ['#64748B', '#06B6D4', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

const statusConfig: Record<string, any> = {
  excellent: { label: 'Excelente',  color: 'var(--success)', badge: 'afic-badge--success' },
  good:      { label: 'Bom',        color: '#60A5FA',        badge: 'afic-badge--info'    },
  attention: { label: 'Atenção',    color: 'var(--warning)', badge: 'afic-badge--warning' },
  critical:  { label: 'Crítico',    color: 'var(--danger)',  badge: 'afic-badge--danger'  },
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip__label">{payload[0].name}</p>
        <p className="chart-tooltip__value">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);
  const [actionToConfirm, setActionToConfirm] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [profileRes, userRes, plansRes, messagesRes] = await Promise.all([
        supabase.from('financial_profiles').select('*').eq('user_id', user!.id).single(),
        supabase.from('users').select('full_name').eq('id', user!.id).single(),
        supabase.from('action_plans').select('*').eq('user_id', user!.id).order('created_at', { ascending: true }),
        supabase.from('client_messages').select('*').eq('client_id', user!.id).eq('is_read', false).order('created_at', { ascending: false })
      ]);

      if (profileRes.data && userRes.data) {
        const p = profileRes.data;
        const savingRate = p.monthly_income > 0 ? (((p.monthly_income - p.fixed_costs) / p.monthly_income) * 100).toFixed(0) : 0;
        const emergencyFundMonths = p.fixed_costs > 0 ? (p.total_equity / p.fixed_costs).toFixed(1) : 0;

        // Se o consultor salvou buckets customizados, usamos eles
        let chartData;
        if (p.buckets && Array.isArray(p.buckets)) {
          chartData = p.buckets.map((b: any) => ({ name: b.label, value: b.percentage }));
        } else {
          chartData = [
            { name: 'Custo Fixo', value: 50 },
            { name: 'Conforto', value: 10 },
            { name: 'Metas', value: 20 },
            { name: 'Lazer', value: 10 },
            { name: 'Investimento', value: 10 },
          ];
        }

        setClientData({
          name: userRes.data.full_name,
          healthScore: p.health_score !== undefined && p.health_score !== null ? p.health_score : 75,
          status: p.status || 'good',
          monthlyIncome: p.monthly_income || 0,
          savingRate,
          emergencyFundMonths,
          buckets: chartData,
          isCustomBuckets: !!p.buckets,
          actions: plansRes.data || [],
          messages: messagesRes.data || []
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAction = async (action: any) => {
    if (action.status === 'pending') {
      setActionToConfirm(action);
    } else {
      executeToggleAction(action, 'pending');
    }
  };

  const executeToggleAction = async (action: any, forceStatus?: string) => {
    const newStatus = forceStatus || (action.status === 'pending' ? 'completed' : 'pending');
    try {
      const { error } = await supabase.from('action_plans').update({ status: newStatus }).eq('id', action.id);
      if (!error) {
        setClientData((prev: any) => ({
          ...prev,
          actions: prev.actions.map((a: any) => a.id === action.id ? { ...a, status: newStatus } : a)
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkMessageRead = async (messageId: string) => {
    try {
      const { error } = await supabase.from('client_messages').update({ is_read: true }).eq('id', messageId);
      if (!error) {
        setClientData((prev: any) => ({
          ...prev,
          messages: prev.messages.filter((m: any) => m.id !== messageId)
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="anim-spin" size={40} color="var(--brand-primary)" />
      </div>
    );
  }

  if (!clientData) {
    return <div className="container" style={{ padding: '2rem' }}>Erro ao carregar dados do painel.</div>;
  }

  const { name, healthScore, status, monthlyIncome, savingRate, emergencyFundMonths, buckets, isCustomBuckets, actions } = clientData;
  const statusInfo = statusConfig[status] || statusConfig['good'];

  return (
    <div className="dashboard container">
      <header className="dashboard__header anim-fade-up">
        <div>
          <p className="dashboard__greeting">Bem-vindo de volta 👋</p>
          <h1 className="dashboard__name">{name}</h1>
        </div>
        <span className={`afic-badge ${statusInfo.badge}`}>
          <Activity size={13} /> Saúde Financeira: {statusInfo.label}
        </span>
      </header>

      {clientData.messages && clientData.messages.length > 0 && (
        <div className="anim-fade-up" style={{ animationDelay: '30ms', marginBottom: '2rem' }}>
          {clientData.messages.map((msg: any) => (
            <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--r-lg)', border: '1px solid var(--brand-primary)', borderLeft: '4px solid var(--brand-primary)', marginBottom: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--brand-primary)', padding: '0.75rem', borderRadius: '50%' }}>
                <MessageSquare size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Nova mensagem do seu consultor</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(msg.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                <button 
                  onClick={() => handleMarkMessageRead(msg.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: 'var(--success)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  <CheckCircle2 size={18} /> Marcar como lida
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="dashboard__stats anim-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="stat-card stat-card--brand">
          <span className="afic-metric-label">Score de Saúde</span>
          <div className="stat-card__score-wrap">
            <span className="afic-metric-value gradient-text">{healthScore}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '1.5rem', fontWeight: 700 }}>/100</span>
          </div>
          <div className="afic-progress" style={{ marginTop: '0.75rem' }}>
            <div className="afic-progress__bar" style={{ width: `${healthScore}%`, background: 'var(--grad-brand)' }} />
          </div>
        </div>

        <div className="stat-card">
          <span className="afic-metric-label">Renda Mensal</span>
          <span className="afic-metric-value">
            {Number(monthlyIncome).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
          </span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Líquida mensal</p>
        </div>

        <div className="stat-card">
          <span className="afic-metric-label">Taxa de Poupança</span>
          <span className="afic-metric-value" style={{ color: 'var(--success)' }}>{savingRate}%</span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>da renda (estimativa)</p>
        </div>

        <div className="stat-card">
          <span className="afic-metric-label">Reserva de Emergência</span>
          <span className="afic-metric-value" style={{ color: Number(emergencyFundMonths) >= 3 ? 'var(--success)' : 'var(--warning)' }}>
            {emergencyFundMonths}m
          </span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Meta: 6 meses</p>
        </div>
      </div>

      <div className="dashboard__main anim-fade-up" style={{ animationDelay: '120ms' }}>
        <div className="dash-card dash-card--chart">
          <div className="dash-card__header">
            <h3 className="dash-card__title">
              <TrendingUp size={18} /> 
              {isCustomBuckets ? 'Sua Estratégia Recomendada' : 'Alocação Padrão'}
            </h3>
          </div>
          <div className="bucket-chart">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={buckets} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius="60%" outerRadius="90%" paddingAngle={3} dataKey="value">
                  {buckets.map((_: any, i: number) => <Cell key={i} fill={BUCKET_COLORS[i % BUCKET_COLORS.length]} stroke="transparent" />)}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="bucket-chart__legend">
              {buckets.map((b: any, i: number) => (
                <div key={b.name} className="bucket-legend-item">
                  <span className="bucket-legend-item__dot" style={{ background: BUCKET_COLORS[i % BUCKET_COLORS.length] }} />
                  <span>{b.name}</span>
                  <span className="bucket-legend-item__pct">{b.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard__right-col">
          <div className="dash-card" style={{ height: '100%' }}>
            <div className="dash-card__header">
              <h3 className="dash-card__title"><Target size={18} /> Plano de Ação</h3>
            </div>
            
            {actions.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Seu perfil está sob análise. Em breve, seu consultor montará seu plano de ação aqui.
              </div>
            ) : (
              <div style={{ padding: '1.25rem' }}>
                <ActionPlanWidget actions={actions} onActionToggle={handleToggleAction} />
              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* Seção de Lançamentos Diários */}
      <div className="anim-fade-up" style={{ animationDelay: '180ms' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Seus Lançamentos Financeiros
        </h2>
        <TransactionManager />
      </div>

      {/* Modal de Confirmação de Ação */}
      {actionToConfirm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            padding: '2rem',
            borderRadius: 'var(--r-lg)',
            border: '1px solid var(--border-color)',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            textAlign: 'center',
            position: 'relative'
          }}>
            <button 
              onClick={() => setActionToConfirm(null)}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
            
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}>
              <Target size={32} />
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Concluir Etapa?
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Você tem certeza que já concluiu a etapa <strong style={{ color: 'var(--text-primary)' }}>"{actionToConfirm.title}"</strong> do seu plano estratégico?
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setActionToConfirm(null)}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: 'var(--r-md)',
                  background: 'var(--bg-input)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)', cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Ainda não
              </button>
              <button 
                onClick={() => {
                  executeToggleAction(actionToConfirm, 'completed');
                  setActionToConfirm(null);
                }}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: 'var(--r-md)',
                  background: 'var(--brand-primary)', color: '#fff',
                  border: 'none', cursor: 'pointer',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(100, 100, 255, 0.3)'
                }}
              >
                Sim, concluí!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
