import React, { useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { MoneyInput } from '../../../components/ui/MoneyInput';

export const TimeCalculator: React.FC = () => {
  const [income, setIncome] = useState<string>('');
  const [productValue, setProductValue] = useState<string>('');
  const [workHoursPerMonth, setWorkHoursPerMonth] = useState<number>(220); // Padrão CLT

  const parsedIncome = parseFloat(income.replace(/\./g, '').replace(',', '.')) || 0;
  const parsedProduct = parseFloat(productValue.replace(/\./g, '').replace(',', '.')) || 0;

  const calculateTime = () => {
    if (parsedIncome <= 0 || parsedProduct <= 0) return null;

    const hourlyRate = parsedIncome / workHoursPerMonth;
    const totalHoursNeeded = parsedProduct / hourlyRate;

    const days = Math.floor(totalHoursNeeded / (workHoursPerMonth / 22)); // assumindo 22 dias uteis por mes
    const hours = Math.floor(totalHoursNeeded);
    const minutes = Math.round((totalHoursNeeded - hours) * 60);

    return { hourlyRate, hours, minutes, days };
  };

  const result = calculateTime();

  return (
    <Card>
      <div className="dash-card__header">
        <h3 className="dash-card__title" style={{ color: 'var(--danger)' }}><Clock size={18} /> Choque de Realidade: Calculadora de Tempo</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Descubra quantas horas da sua vida essa compra realmente custa.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label className="afic-label">Sua Renda Mensal Líquida (R$)</label>
          <div style={{ marginTop: '0.25rem' }}>
            <MoneyInput value={income} onChange={v => setIncome(v)} />
          </div>
        </div>
        <div className="afic-flex-col-mobile">
          <div style={{ flex: 1 }}>
            <label className="afic-label">Horas trabalhadas por mês</label>
            <input 
              type="number" 
              value={workHoursPerMonth}
              onChange={(e) => setWorkHoursPerMonth(Number(e.target.value))}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Padrão CLT é 220h (44h semanais)</p>
          </div>
        </div>
        <div>
          <label className="afic-label">Valor do Produto/Serviço (R$)</label>
          <div style={{ marginTop: '0.25rem' }}>
            <MoneyInput value={productValue} onChange={v => setProductValue(v)} />
          </div>
        </div>
      </div>

      {result && (
        <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <AlertTriangle size={32} color="var(--danger)" />
          </div>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            A sua hora de trabalho vale exatos <strong>{result.hourlyRate.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>.
          </p>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            Para pagar por isso, você precisará entregar:
          </p>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--danger)', fontWeight: 900, margin: '0.5rem 0' }}>
            {result.hours}h e {result.minutes}m
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            da sua vida de trabalho. ({result.days} dias inteiros de expediente!)
          </p>
          
          <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--danger)' }}>
            Ainda acha que vale a pena?
          </p>
        </div>
      )}
    </Card>
  );
};
