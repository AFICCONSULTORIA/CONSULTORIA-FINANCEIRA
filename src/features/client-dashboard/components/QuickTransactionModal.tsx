import React, { useState, useEffect } from 'react';
import { X, TrendingDown, TrendingUp, Calendar, Tag, CreditCard, CheckCircle2, Clock } from 'lucide-react';
import { MoneyInput } from '../../../components/ui/MoneyInput';
import { useAuth } from '../../../context/AuthContext';
import { useTransactionMutations } from '../../../hooks/useTransactions';
import toast from 'react-hot-toast';

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string; // YYYY-MM-DD
  userId?: string;
}

const EXPENSE_CATEGORIES = [
  'Custo Fixo',
  'Alimentação',
  'Moradia',
  'Transporte',
  'Saúde',
  'Conforto',
  'Lazer',
  'Educação',
  'Investimento',
  'Metas & Sonhos',
  'Outros',
];

const INCOME_CATEGORIES = [
  'Salário / Renda Principal',
  'Renda Extra',
  'Investimentos',
  'Vendas / Freelance',
  'Rendimentos',
  'Outros',
];

const PAYMENT_METHODS = [
  'Pix',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Dinheiro',
  'Boleto',
  'Transferência',
];

const QUICK_SUGGESTIONS_EXPENSE = ['Supermercado', 'Combustível', 'Restaurante', 'Farmácia', 'Luz / Energia', 'Internet', 'Aluguel'];
const QUICK_SUGGESTIONS_INCOME = ['Salário', 'Freelance', 'Dividendos', 'Adiantamento', 'Consultoria'];

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  userId,
}) => {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;
  const { createTransaction } = useTransactionMutations();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [date, setDate] = useState(() => initialDate || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'completed' | 'pending'>('completed');
  const [notes, setNotes] = useState('');

  // Sincroniza a data inicial quando o modal abre com uma data específica
  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        setDate(initialDate);
      } else {
        setDate(new Date().toISOString().split('T')[0]);
      }
      // Limpa os outros campos
      setDescription('');
      setAmountStr('');
      setNotes('');
      setType('expense');
      setCategory(EXPENSE_CATEGORIES[0]);
      setStatus('completed');
    }
  }, [isOpen, initialDate]);

  // Atualiza a categoria padrão ao alternar o tipo
  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setCategory(newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectiveUserId) {
      toast.error('Usuário não autenticado.');
      return;
    }

    if (!description.trim()) {
      toast.error('Por favor, informe a descrição do lançamento.');
      return;
    }

    const numericAmount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Por favor, informe um valor maior que zero.');
      return;
    }

    try {
      await createTransaction.mutateAsync({
        user_id: effectiveUserId,
        type,
        description: description.trim(),
        amount: numericAmount,
        category,
        payment_method: paymentMethod,
        status,
        date,
        notes: notes.trim() || undefined,
      });

      onClose();
    } catch (err) {
      // Erro tratado pelo hook
    }
  };

  const suggestions = type === 'expense' ? QUICK_SUGGESTIONS_EXPENSE : QUICK_SUGGESTIONS_INCOME;
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--r-xl)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-surface)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Novo Lançamento
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Cadastre uma entrada ou saída no seu fluxo
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: 'var(--r-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Seletor Tipo: Despesa ou Receita */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                borderRadius: 'var(--r-md)',
                border: type === 'expense' ? '2px solid var(--danger)' : '1px solid var(--border-color)',
                background: type === 'expense' ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-input)',
                color: type === 'expense' ? 'var(--danger)' : 'var(--text-secondary)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <TrendingDown size={18} />
              Despesa (Saída)
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                borderRadius: 'var(--r-md)',
                border: type === 'income' ? '2px solid var(--success)' : '1px solid var(--border-color)',
                background: type === 'income' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-input)',
                color: type === 'income' ? 'var(--success)' : 'var(--text-secondary)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <TrendingUp size={18} />
              Receita (Entrada)
            </button>
          </div>

          {/* Valor */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Valor *
            </label>
            <MoneyInput
              value={amountStr}
              onChange={setAmountStr}
              placeholder="0,00"
              style={{ width: '100%' }}
            />
          </div>

          {/* Descrição */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Descrição *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Aluguel, Supermercado, Salário..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--r-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
              }}
            />

            {/* Sugestões rápidas */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
              {suggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setDescription(sug)}
                  style={{
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--r-full)',
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Categoria e Forma de Pagamento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                <Tag size={13} /> Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                <CreditCard size={13} /> Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Data e Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                <Calendar size={13} /> Data do Lançamento
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Status
              </label>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setStatus('completed')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    padding: '0.7rem 0.4rem',
                    borderRadius: 'var(--r-md)',
                    border: status === 'completed' ? '1px solid var(--success)' : '1px solid var(--border-color)',
                    background: status === 'completed' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-input)',
                    color: status === 'completed' ? 'var(--success)' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <CheckCircle2 size={13} /> Pago
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pending')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    padding: '0.7rem 0.4rem',
                    borderRadius: 'var(--r-md)',
                    border: status === 'pending' ? '1px solid var(--warning)' : '1px solid var(--border-color)',
                    background: status === 'pending' ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-input)',
                    color: status === 'pending' ? 'var(--warning)' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Clock size={13} /> Pendente
                </button>
              </div>
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.85rem',
                borderRadius: 'var(--r-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createTransaction.isPending}
              style={{
                flex: 2,
                padding: '0.85rem',
                borderRadius: 'var(--r-md)',
                background: type === 'expense' ? 'var(--brand-primary)' : 'var(--success)',
                border: 'none',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: createTransaction.isPending ? 'not-allowed' : 'pointer',
                opacity: createTransaction.isPending ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              }}
            >
              {createTransaction.isPending ? 'Salvando...' : 'Confirmar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
