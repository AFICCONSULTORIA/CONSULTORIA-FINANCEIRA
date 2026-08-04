import React, { useEffect, useState } from 'react';
import { Calculator } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { MoneyInput } from '../../../components/ui/MoneyInput';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

const DEFAULT_BUCKET_RATES = [
  { id: 'fixed', label: 'Custo Fixo', percentage: 50, color: '#64748B' },
  { id: 'comfort', label: 'Conforto', percentage: 10, color: '#EC4899' },
  { id: 'goals', label: 'Metas', percentage: 20, color: '#8B5CF6' },
  { id: 'leisure', label: 'Lazer', percentage: 10, color: '#F59E0B' },
  { id: 'invest', label: 'Investimento', percentage: 10, color: '#10B981' }
];

const COLORS = ['#64748B', '#06B6D4', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

export const BucketCalculator: React.FC = () => {
  const { user } = useAuth();
  const [income, setIncome] = useState<string>('');
  const [buckets, setBuckets] = useState<any[]>(DEFAULT_BUCKET_RATES);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase.from('financial_profiles').select('monthly_income, buckets').eq('user_id', user.id).single();
      if (data) {
        if (data.monthly_income > 0) {
          setIncome(data.monthly_income.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }
        if (data.buckets && Array.isArray(data.buckets)) {
          setBuckets(data.buckets);
        }
      }
    };
    fetchProfile();
  }, [user]);

  const parsedIncome = parseFloat(income.replace(/\./g, '').replace(',', '.')) || 0;

  return (
    <Card>
      <div className="dash-card__header">
        <h3 className="dash-card__title"><Calculator size={18} /> Calculadora de Baldes</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Simule a divisão ideal da sua Renda ou de um valor extra (Baseado no seu perfil).
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <label className="afic-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Valor a dividir (R$)</label>
          <MoneyInput 
            value={income}
            onChange={(v) => setIncome(v)}
            placeholder="0,00"
          />
        </div>
      </div>

      {parsedIncome > 0 && (
        <div className="afic-grid-2" style={{ marginTop: '1rem' }}>
          {buckets.map((b, idx) => {
            const amount = parsedIncome * (b.percentage / 100);
            const color = b.color || COLORS[idx % COLORS.length];
            return (
              <div key={b.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--r-md)', borderLeft: `4px solid ${color}` }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{b.label} <small>({b.percentage}%)</small></span>
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
