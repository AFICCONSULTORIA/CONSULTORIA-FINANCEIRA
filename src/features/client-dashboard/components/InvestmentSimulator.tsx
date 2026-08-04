import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { MoneyInput } from '../../../components/ui/MoneyInput';

export const InvestmentSimulator: React.FC = () => {
  const [monthlyContributionStr, setMonthlyContributionStr] = useState('500,00');
  const [years, setYears] = useState<number>(10);
  const [annualRate, setAnnualRate] = useState<number>(10); // 10% a.a.

  const data = useMemo(() => {
    const monthlyContribution = parseFloat(monthlyContributionStr.replace(/\./g, '').replace(',', '.')) || 0;
    const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
    const months = years * 12;
    let balance = 0;
    const arr = [];

    for (let m = 1; m <= months; m++) {
      balance = (balance + monthlyContribution) * (1 + monthlyRate);
      if (m % 12 === 0) {
        arr.push({
          year: `Ano ${m / 12}`,
          value: Math.round(balance),
          invested: monthlyContribution * m
        });
      }
    }
    return arr;
  }, [monthlyContributionStr, years, annualRate]);

  const finalValue = data.length > 0 ? data[data.length - 1].value : 0;
  const monthlyContribution = parseFloat(monthlyContributionStr.replace(/\./g, '').replace(',', '.')) || 0;
  const totalInvested = monthlyContribution * years * 12;
  const totalInterest = finalValue - totalInvested;

  return (
    <Card>
      <div className="dash-card__header">
        <h3 className="dash-card__title"><TrendingUp size={18} /> Simulador de Juros Compostos</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          O poder do tempo nos seus investimentos.
        </p>
      </div>

      <div className="afic-grid-3" style={{ marginBottom: '1.5rem' }}>
        <div>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Aporte Mensal</label>
          <div style={{ marginTop: '0.25rem' }}>
            <MoneyInput value={monthlyContributionStr} onChange={v => setMonthlyContributionStr(v)} />
          </div>
        </div>
        <div>
          <label className="afic-label">Prazo (Anos)</label>
          <input type="number" value={years} onChange={e => setYears(Number(e.target.value))} />
        </div>
        <div>
          <label className="afic-label">Taxa Anual (%)</label>
          <input type="number" value={annualRate} onChange={e => setAnnualRate(Number(e.target.value))} />
        </div>
      </div>

      <div style={{ height: '200px', marginBottom: '1.5rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip 
              contentStyle={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
            />
            <Line type="monotone" dataKey="total" name="Patrimônio Total" stroke="var(--brand-primary)" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="invested" name="Valor Investido" stroke="var(--text-muted)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--r-md)' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Investido</p>
          <strong style={{ color: 'var(--text-primary)' }}>{totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Juros Ganhos</p>
          <strong style={{ color: 'var(--success)' }}>+ {totalInterest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Patrimônio Final</p>
          <strong className="gradient-text" style={{ fontSize: '1.1rem' }}>{finalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
        </div>
      </div>
    </Card>
  );
};
