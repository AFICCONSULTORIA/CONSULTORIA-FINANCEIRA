import React, { useState } from 'react';
import { Target, ArrowUpCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export const GoalTracker: React.FC = () => {
  const [goalName] = useState('Viagem Europa');
  const [targetAmount] = useState(15000);
  const [currentAmount, setCurrentAmount] = useState(4500);
  const [deposit, setDeposit] = useState('');

  const progress = (currentAmount / targetAmount) * 100;

  const handleDeposit = () => {
    const amount = parseFloat(deposit.replace(',', '.'));
    if (!isNaN(amount) && amount > 0) {
      setCurrentAmount(c => Math.min(c + amount, targetAmount));
      setDeposit('');
    }
  };

  return (
    <Card>
      <div className="dash-card__header">
        <h3 className="dash-card__title"><Target size={18} /> Acompanhamento de Metas</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Meta Principal Ativa
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{goalName}</strong>
          <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{progress.toFixed(1)}%</span>
        </div>
        
        <div className="afic-progress" style={{ height: '10px', marginBottom: '0.75rem' }}>
          <div className="afic-progress__bar" style={{ width: `${progress}%`, background: 'var(--brand-primary)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <span>Acumulado: {currentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          <span>Meta: {targetAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          type="number" 
          placeholder="Valor do aporte (R$)" 
          value={deposit}
          onChange={e => setDeposit(e.target.value)}
          style={{ flex: 1 }}
        />
        <Button onClick={handleDeposit}><ArrowUpCircle size={16} /> Aportar</Button>
      </div>
    </Card>
  );
};
