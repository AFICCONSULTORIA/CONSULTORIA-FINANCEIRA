import React, { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { 
  Building2, ShieldCheck, TrendingUp, TrendingDown, Calendar, 
  Activity, Loader2, MessageSquare, CheckCircle2, 
  Home, Coffee, Target, Palmtree, ArrowUpRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useMonthlySummary } from '../../hooks/useTransactions';
import { DailyExpenseCalendar } from './components/DailyExpenseCalendar';
import '../../components/ui/ui.css';
import './ClientDashboard.css';

const BUCKET_CONFIG: Record<string, { color: string; icon: any; defaultLabel: string }> = {
  fixed:       { color: '#64748B', icon: Home,     defaultLabel: 'Custo Fixo' },
  comfort:     { color: '#06B6D4', icon: Coffee,   defaultLabel: 'Conforto' },
  goals:       { color: '#8B5CF6', icon: Target,   defaultLabel: 'Metas' },
  leisure:     { color: '#EC4899', icon: Palmtree, defaultLabel: 'Lazer' },
  invest:      { color: '#10B981', icon: TrendingUp, defaultLabel: 'Investimento' },
};

const BUCKET_COLORS = ['#3B82F6', '#06B6D4', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

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
        <p className="chart-tooltip__value">{payload[0].value}% da renda</p>
      </div>
    );
  }
  return null;
};

export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);

  // Resumo consolidado do mês atual via TanStack Query (reativo com lançamentos reais)
  const monthlySummary = useMonthlySummary(user?.id);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [profileRes, userRes, messagesRes] = await Promise.all([
        supabase.from('financial_profiles').select('*').eq('user_id', user!.id).single(),
        supabase.from('users').select('full_name').eq('id', user!.id).single(),
        supabase.from('client_messages').select('*').eq('client_id', user!.id).eq('is_read', false).order('created_at', { ascending: false })
      ]);

      const p = profileRes.data || {
        monthly_income: 0,
        fixed_costs: 0,
        total_equity: 0,
        total_debt: 0,
        health_score: 75,
        status: 'good',
        risk_profile: 'moderado'
      };
      const userName = userRes.data?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Cliente';

      const savingRate = p.monthly_income > 0 ? (((p.monthly_income - p.fixed_costs) / p.monthly_income) * 100).toFixed(0) : 0;
      const emergencyFundMonths = p.fixed_costs > 0 ? (p.total_equity / p.fixed_costs).toFixed(1) : 0;

      // Buckets da metodologia dos 5 baldes
      let chartData;
      if (p.buckets && Array.isArray(p.buckets)) {
        chartData = p.buckets.map((b: any) => ({ name: b.label, value: b.percentage, type: b.type }));
      } else {
        chartData = [
          { name: 'Custo Fixo', value: 50, type: 'fixed' },
          { name: 'Conforto', value: 10, type: 'comfort' },
          { name: 'Metas', value: 20, type: 'goals' },
          { name: 'Lazer', value: 10, type: 'leisure' },
          { name: 'Investimento', value: 10, type: 'invest' },
        ];
      }

      setClientData({
        name: userName,
        healthScore: p.health_score !== undefined && p.health_score !== null ? p.health_score : 75,
        status: p.status || 'good',
        monthlyIncome: p.monthly_income || 0,
        totalEquity: p.total_equity || 0,
        totalDebt: p.total_debt || 0,
        fixedCosts: p.fixed_costs || 0,
        riskProfile: p.risk_profile || 'moderado',
        savingRate,
        emergencyFundMonths,
        buckets: chartData,
        isCustomBuckets: !!p.buckets,
        messages: messagesRes.data || []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  // Data atual formatada por extenso
  const currentDateFormatted = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="anim-spin" size={42} color="var(--brand-primary)" />
      </div>
    );
  }

  if (!clientData) {
    return <div className="container" style={{ padding: '2rem' }}>Erro ao carregar dados do painel.</div>;
  }

  const { 
    name, healthScore, status, monthlyIncome, totalEquity, totalDebt,
    emergencyFundMonths, riskProfile, buckets, isCustomBuckets 
  } = clientData;
  const statusInfo = statusConfig[status] || statusConfig['good'];

  // Métricas de entradas e gastos do mês
  const displayedIncome = monthlySummary.totalIncome > 0 ? monthlySummary.totalIncome : Number(monthlyIncome);
  const displayedExpense = monthlySummary.totalExpense;
  const netSavings = displayedIncome - displayedExpense;

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  };

  return (
    <div className="dashboard container">
      {/* ── Top Header Private Banking ── */}
      <header className="dashboard__header anim-fade-up">
        <div>
          <div className="dashboard__badges-row">
            <span className="dashboard__date-badge">
              <Calendar size={13} /> {currentDateFormatted}
            </span>
            <span className="dashboard__vip-badge">
              <Building2 size={12} /> Cliente Private AFIC
            </span>
          </div>

          <h1 className="dashboard__name">Olá, {name?.split(' ')[0] || 'Cliente'}</h1>
          <p className="dashboard__greeting">
            Visão executiva de patrimônio, saúde financeira e mapa mensal de gastos.
          </p>
        </div>

        <div className="dashboard__header-actions">
          <span className={`afic-badge ${statusInfo.badge}`} style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem' }}>
            <Activity size={15} /> Saúde Financeira: {statusInfo.label}
          </span>
        </div>
      </header>

      {/* ── Mensagem do Consultor (se houver recado não lido) ── */}
      {clientData.messages && clientData.messages.length > 0 && (
        <div className="dashboard__messages anim-fade-up">
          {clientData.messages.map((msg: any) => (
            <div key={msg.id} className="dashboard__message-card">
              <div className="dashboard__message-icon">
                <MessageSquare size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Orientação do seu Consultor
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(msg.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.5, margin: '0.5rem 0 0.85rem', whiteSpace: 'pre-wrap' }}>
                  {msg.message}
                </p>
                <button 
                  onClick={() => handleMarkMessageRead(msg.id)}
                  className="dashboard__message-read-btn"
                >
                  <CheckCircle2 size={16} /> Marcar como lida
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 4 Cards de Métricas Principais (Private Banking Overview) ── */}
      <div className="dashboard__stats anim-fade-up">
        {/* Card 1: Patrimônio Líquido Acumulado */}
        <div className="stat-card stat-card--brand">
          <div className="stat-card__top">
            <span className="stat-card__label">Patrimônio Acumulado</span>
            <div className="stat-card__icon-wrap stat-card__icon-wrap--brand">
              <Building2 size={20} />
            </div>
          </div>
          <div className="stat-card__value-wrap">
            <span className="stat-card__main-value gradient-text">
              {formatCurrency(Number(totalEquity))}
            </span>
          </div>
          <div className="stat-card__footer-text">
            Reserva de Emergência: <strong>{emergencyFundMonths} meses</strong> de cobertura
          </div>
        </div>

        {/* Card 2: Score de Saúde & Perfil de Risco */}
        <div className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__label">Score de Saúde</span>
            <div className="stat-card__icon-wrap stat-card__icon-wrap--health">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="stat-card__value-wrap">
            <span className="stat-card__main-value">{healthScore}</span>
            <span className="stat-card__sub-value">/100</span>
          </div>
          <div className="afic-progress" style={{ height: '7px', margin: '0.5rem 0' }}>
            <div className="afic-progress__bar" style={{ width: `${healthScore}%`, background: 'var(--grad-brand)' }} />
          </div>
          <div className="stat-card__footer-text">
            Perfil: <strong style={{ textTransform: 'capitalize' }}>{riskProfile}</strong> • {statusInfo.label}
          </div>
        </div>

        {/* Card 3: Entradas / Renda Mensal */}
        <div className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__label">Entradas do Mês</span>
            <div className="stat-card__icon-wrap stat-card__icon-wrap--income">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-card__value-wrap">
            <span className="stat-card__main-value" style={{ color: 'var(--success)' }}>
              {formatCurrency(displayedIncome)}
            </span>
          </div>
          <div className="stat-card__footer-text">
            {monthlySummary.totalIncome > 0 ? 'Entradas confirmadas no mês' : 'Renda líquida estimada'}
          </div>
        </div>

        {/* Card 4: Gastos do Mês & Saldo Líquido */}
        <div className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__label">Gastos do Mês</span>
            <div className="stat-card__icon-wrap stat-card__icon-wrap--expense">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="stat-card__value-wrap">
            <span className="stat-card__main-value" style={{ color: displayedExpense > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
              {formatCurrency(displayedExpense)}
            </span>
          </div>
          <div className="stat-card__footer-text">
            Saldo Líquido: <strong style={{ color: netSavings >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(netSavings)}</strong>
          </div>
        </div>
      </div>

      {/* ── Alerta / Atalho de Endividamento Mapeado (se houver dívidas) ── */}
      {Number(totalDebt) > 0 && (
        <div 
          className="anim-fade-up"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.08) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--r-lg)',
            padding: '1rem 1.35rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--r-md)',
              background: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <TrendingDown size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Passivos & Dívidas em Aberto: <span style={{ color: 'var(--danger)' }}>{formatCurrency(Number(totalDebt))}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Mapeamento ativo via Open Finance e contratos informados. Monitore seu plano de amortização.
              </div>
            </div>
          </div>

          <a 
            href="/client/debts" 
            className="afic-btn afic-btn--secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
          >
            Ver Mapa de Dívidas <ArrowUpRight size={14} />
          </a>
        </div>
      )}

      {/* ── Estratégia dos 5 Baldes de Orçamento (Wealth Allocation) ── */}
      <div className="dash-card anim-fade-up">
        <div className="dash-card__header">
          <div>
            <h3 className="dash-card__title">
              <TrendingUp size={20} /> 
              {isCustomBuckets ? 'Estratégia dos 5 Baldes (Personalizada pelo Consultor)' : 'Metodologia dos 5 Baldes de Orçamento'}
            </h3>
            <p className="dash-card__subtitle">
              Divisão proporcional recomendada da sua renda mensal para garantir segurança, conforto e investimentos
            </p>
          </div>
        </div>

        <div className="dashboard__buckets-layout">
          {/* Donut Chart Centralizado */}
          <div className="bucket-chart-box">
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie 
                  data={buckets} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="65%" 
                  outerRadius="92%" 
                  paddingAngle={4} 
                  dataKey="value"
                >
                  {buckets.map((_: any, i: number) => (
                    <Cell key={i} fill={BUCKET_COLORS[i % BUCKET_COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="bucket-chart-center">
              <span className="bucket-chart-center__label">Renda Mensal</span>
              <span className="bucket-chart-center__val">
                {formatCurrency(displayedIncome)}
              </span>
            </div>
          </div>

          {/* Cards dos 5 Baldes com Valores em Reais e Ícones */}
          <div className="dashboard__buckets-grid">
            {buckets.map((b: any, i: number) => {
              const allocatedVal = (displayedIncome * (b.value / 100));
              const color = BUCKET_COLORS[i % BUCKET_COLORS.length];
              const config = BUCKET_CONFIG[b.type] || { icon: ArrowUpRight };
              const IconComp = config.icon;

              return (
                <div key={b.name} className="dashboard__bucket-item">
                  <div className="dashboard__bucket-item-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div 
                        style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: 'var(--r-sm)', 
                          background: `${color}20`, 
                          color: color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <IconComp size={15} />
                      </div>
                      <span className="dashboard__bucket-name">{b.name}</span>
                    </div>

                    <span className="dashboard__bucket-pct" style={{ color }}>{b.value}%</span>
                  </div>

                  <div className="dashboard__bucket-val">
                    {formatCurrency(allocatedVal)}
                  </div>

                  {/* Barra visual de alocação */}
                  <div className="dashboard__bucket-bar-bg">
                    <div 
                      className="dashboard__bucket-bar-fill" 
                      style={{ width: `${Math.min(100, b.value * 2)}%`, background: color }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Mapa Mensal de Gastos Diários (Calendário Sincronizado aos Lançamentos) ── */}
      <DailyExpenseCalendar userId={user?.id} />
    </div>
  );
};
