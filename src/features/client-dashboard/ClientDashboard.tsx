import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { TrendingUp, Activity, Target, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
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

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Puxa perfil financeiro e nome
      const [profileRes, userRes] = await Promise.all([
        supabase.from('financial_profiles').select('*').eq('user_id', user!.id).single(),
        supabase.from('users').select('full_name').eq('id', user!.id).single()
      ]);

      if (profileRes.data && userRes.data) {
        const p = profileRes.data;
        // Cálculos básicos
        const savingRate = p.monthly_income > 0 ? (((p.monthly_income - p.fixed_costs) / p.monthly_income) * 100).toFixed(0) : 0;
        const emergencyFundMonths = p.fixed_costs > 0 ? (p.total_equity / p.fixed_costs).toFixed(1) : 0;

        // Mock buckets temporários se não houver no banco, só para a tela não ficar vazia (ideal é puxar da tabela buckets)
        const mockChartData = [
          { name: 'Custo Fixo', value: 50 },
          { name: 'Conforto', value: 10 },
          { name: 'Metas', value: 20 },
          { name: 'Lazer', value: 10 },
          { name: 'Investimento', value: 10 },
        ];

        setClientData({
          name: userRes.data.full_name,
          healthScore: p.health_score || 75,
          status: p.status || 'good',
          monthlyIncome: p.monthly_income || 0,
          savingRate,
          emergencyFundMonths,
          buckets: mockChartData, // Substituir depois por query real
          actions: [] // Substituir por tabela action_plans
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const { name, healthScore, status, monthlyIncome, savingRate, emergencyFundMonths, buckets } = clientData;
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
            {monthlyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
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
            <h3 className="dash-card__title"><TrendingUp size={18} /> Alocação Padrão</h3>
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
          <div className="dash-card">
            <div className="dash-card__header">
              <h3 className="dash-card__title"><Target size={18} /> Aguardando Consultor</h3>
            </div>
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Seu perfil está sob análise. Em breve, seu consultor montará sua estratégia de baldes personalizada e o plano de ação aqui.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
