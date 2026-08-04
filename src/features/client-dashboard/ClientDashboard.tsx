import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { mockClient } from '../../services/mockData';
import { TrendingUp, AlertTriangle, CheckCircle, Activity, Target, ListChecks } from 'lucide-react';
import '../../components/ui/ui.css';
import './ClientDashboard.css';

const BUCKET_COLORS = ['#64748B', '#06B6D4', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

const statusConfig = {
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
  const { name, financialData: data } = mockClient;
  const health = data.healthScore;
  const status = statusConfig[health.status];
  const chartData = data.buckets.map(b => ({ name: b.label, value: b.percentage }));

  const scoreAngle = (health.score / 100) * 180;

  return (
    <div className="dashboard container">
      {/* ── Header ── */}
      <header className="dashboard__header anim-fade-up">
        <div>
          <p className="dashboard__greeting">Bem-vindo de volta 👋</p>
          <h1 className="dashboard__name">{name}</h1>
        </div>
        <span className={`afic-badge ${status.badge}`}>
          <Activity size={13} /> Saúde Financeira: {status.label}
        </span>
      </header>

      {/* ── Stats Row ── */}
      <div className="dashboard__stats anim-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="stat-card stat-card--brand">
          <span className="afic-metric-label">Score de Saúde</span>
          <div className="stat-card__score-wrap">
            <span className="afic-metric-value gradient-text">{health.score}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '1.5rem', fontWeight: 700 }}>/100</span>
          </div>
          <div className="afic-progress" style={{ marginTop: '0.75rem' }}>
            <div className="afic-progress__bar" style={{ width: `${health.score}%`, background: 'var(--grad-brand)' }} />
          </div>
        </div>

        <div className="stat-card">
          <span className="afic-metric-label">Renda Mensal</span>
          <span className="afic-metric-value">
            {data.monthlyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
          </span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Líquida mensal</p>
        </div>

        <div className="stat-card">
          <span className="afic-metric-label">Taxa de Poupança</span>
          <span className="afic-metric-value" style={{ color: 'var(--success)' }}>{health.metrics.savingRate}%</span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>da renda sendo poupada</p>
        </div>

        <div className="stat-card">
          <span className="afic-metric-label">Reserva de Emergência</span>
          <span className="afic-metric-value" style={{ color: health.metrics.emergencyFundMonths >= 3 ? 'var(--success)' : 'var(--warning)' }}>
            {health.metrics.emergencyFundMonths}m
          </span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Meta: 6 meses</p>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="dashboard__main anim-fade-up" style={{ animationDelay: '120ms' }}>

        {/* Bucket Chart */}
        <div className="dash-card dash-card--chart">
          <div className="dash-card__header">
            <h3 className="dash-card__title"><TrendingUp size={18} /> Alocação dos Baldes</h3>
          </div>
          <div className="bucket-chart">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="100%" startAngle={180} endAngle={0}
                  innerRadius="60%" outerRadius="90%" paddingAngle={3} dataKey="value">
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={BUCKET_COLORS[i]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="bucket-chart__legend">
              {data.buckets.map((b, i) => (
                <div key={b.type} className="bucket-legend-item">
                  <span className="bucket-legend-item__dot" style={{ background: BUCKET_COLORS[i] }} />
                  <span>{b.label}</span>
                  <span className="bucket-legend-item__pct">{b.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard__right-col">
          {/* Buckets bars */}
          <div className="dash-card">
            <div className="dash-card__header">
              <h3 className="dash-card__title"><Target size={18} /> Progresso dos Baldes</h3>
            </div>
            <div className="buckets-list">
              {data.buckets.map((b, i) => (
                <div key={b.type} className="bucket-row">
                  <div className="bucket-row__info">
                    <div className="bucket-row__dot" style={{ background: BUCKET_COLORS[i] }} />
                    <span className="bucket-row__label">{b.label}</span>
                    <span className="bucket-row__amount">
                      {b.currentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="afic-progress">
                    <div className="afic-progress__bar" style={{ width: `${b.percentage}%`, background: BUCKET_COLORS[i] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Plan */}
          <div className="dash-card">
            <div className="dash-card__header">
              <h3 className="dash-card__title"><ListChecks size={18} /> Plano de Ação</h3>
            </div>
            <div className="actions-list">
              {data.actionPlan.map(item => (
                <div key={item.id} className={`action-item action-item--${item.status}`}>
                  <div className="action-item__icon">
                    {item.status === 'completed'
                      ? <CheckCircle size={16} color="var(--success)" />
                      : <AlertTriangle size={16} color="var(--warning)" />
                    }
                  </div>
                  <div>
                    <p className="action-item__title">{item.title}</p>
                    <p className="action-item__desc">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
