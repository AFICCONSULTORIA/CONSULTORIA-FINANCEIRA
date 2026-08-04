import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

const BUCKET_RATES = [
  { id: 'fixed', label: 'Custos Fixos', rate: 0.55, color: '#64748B' },
  { id: 'emergency', label: 'Reserva', rate: 0.15, color: '#06B6D4' },
  { id: 'invest', label: 'Investimentos', rate: 0.10, color: '#8B5CF6' },
  { id: 'comfort', label: 'Conforto', rate: 0.10, color: '#EC4899' },
  { id: 'leisure', label: 'Lazer', rate: 0.05, color: '#F59E0B' },
  { id: 'dreams', label: 'Sonhos', rate: 0.05, color: '#10B981' },
];

export const BucketCalculator: React.FC = () => {
  const [income, setIncome] = useState<string>('');

  const parsedIncome = parseFloat(income.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

  return (
    <Card>
      <div className="dash-card__header">
        <h3 className="dash-card__title"><Calculator size={18} /> Calculadora de Baldes</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Recebeu um valor extra? Veja como dividi-lo.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <input 
            type="text" 
            placeholder="R$ 0,00" 
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            style={{ fontSize: '1.1rem', padding: '0.75rem 1rem' }}
          />
        </div>
      </div>

      {parsedIncome > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          {BUCKET_RATES.map(b => {
            const amount = parsedIncome * b.rate;
            return (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--r-md)', borderLeft: `4px solid ${b.color}` }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{b.label} <small>({b.rate * 100}%)</small></span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </strong>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
