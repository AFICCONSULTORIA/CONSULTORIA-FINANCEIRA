import React, { useState } from 'react';
import { ShoppingBag, Plus } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { MoneyInput } from '../../../components/ui/MoneyInput';

interface Expense {
  id: string;
  desc: string;
  amount: number;
  bucket: 'comfort' | 'leisure';
}

export const ExpenseTracker: React.FC = () => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [bucket, setBucket] = useState<'comfort'|'leisure'>('leisure');
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', desc: 'Jantar Restaurante', amount: 150, bucket: 'leisure' },
    { id: '2', desc: 'Assinatura Netflix', amount: 45, bucket: 'comfort' }
  ]);

  const handleAdd = () => {
    if (!desc || !amount) return;
    const numAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(numAmount)) return;
    
    setExpenses([{ id: Date.now().toString(), desc, amount: numAmount, bucket }, ...expenses]);
    setDesc('');
    setAmount('');
  };

  return (
    <Card>
      <div className="dash-card__header">
        <h3 className="dash-card__title"><ShoppingBag size={18} /> Lançamento Rápido</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Registre gastos dos baldes flexíveis (Conforto/Lazer).
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          placeholder="O que você comprou?" 
          value={desc} 
          onChange={e => setDesc(e.target.value)} 
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ flex: 1 }}>
            <MoneyInput 
              value={amount} 
              onChange={v => setAmount(v)}
            />
          </div>
          <select value={bucket} onChange={(e: any) => setBucket(e.target.value)} style={{ width: '130px' }}>
            <option value="leisure">Lazer</option>
            <option value="comfort">Conforto</option>
          </select>
          <Button onClick={handleAdd} size="sm"><Plus size={16} /></Button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {expenses.map(e => (
          <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--r-md)' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{e.desc}</p>
              <span style={{ fontSize: '0.75rem', color: e.bucket === 'leisure' ? '#F59E0B' : '#EC4899' }}>
                {e.bucket === 'leisure' ? 'Lazer' : 'Conforto'}
              </span>
            </div>
            <strong style={{ color: 'var(--text-primary)' }}>
              {e.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </strong>
          </div>
        ))}
      </div>
    </Card>
  );
};
