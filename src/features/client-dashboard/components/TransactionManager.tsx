import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, Trash2, Edit2, TrendingUp, TrendingDown, DollarSign, 
  Calendar, X, AlertCircle, Tag, ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { MoneyInput } from '../../../components/ui/MoneyInput';
import './TransactionManager.css';

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
  payment_method: string;
  status: 'completed' | 'pending';
  date: string;
  notes?: string;
  created_at: string;
}

interface TransactionManagerProps {
  targetUserId?: string; // Se passado (ex: visão do consultor), usa esse id
  readOnly?: boolean;
}

const CATEGORIES = [
  'Custo Fixo',
  'Conforto',
  'Lazer',
  'Investimento',
  'Reserva',
  'Metas & Sonhos',
  'Alimentação',
  'Moradia',
  'Transporte',
  'Saúde',
  'Educação',
  'Salário / Renda Principal',
  'Renda Extra',
  'Outros'
];

const EXPENSE_QUICK_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Lazer',
  'Custo Fixo',
  'Conforto',
  'Investimento',
  'Outros'
];

const INCOME_QUICK_CATEGORIES = [
  'Salário / Renda Principal',
  'Renda Extra',
  'Investimentos',
  'Vendas / Freelance',
  'Rendimentos',
  'Outros'
];

const PAYMENT_METHODS = [
  'Pix',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Dinheiro',
  'Boleto',
  'Transferência'
];

export const TransactionManager: React.FC<TransactionManagerProps> = ({ targetUserId, readOnly = false }) => {
  const { user } = useAuth();
  const effectiveUserId = targetUserId || user?.id;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startMonth, setStartMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [endMonth, setEndMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [previousBalance, setPreviousBalance] = useState<number>(0);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(false);

  // Helper to format YYYY-MM into friendly Portuguese label
  const formatMonthLabel = (yyyyMm: string, short = false) => {
    if (!yyyyMm) return '';
    const [year, month] = yyyyMm.split('-');
    const date = new Date(Number(year), Number(month) - 1, 15);
    if (short) {
      const formatted = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    const str = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handlePrevMonth = () => {
    const [sy, sm] = startMonth.split('-').map(Number);
    const [ey, em] = endMonth.split('-').map(Number);
    
    const newStart = new Date(sy, sm - 2, 1);
    const newEnd = new Date(ey, em - 2, 1);
    
    setStartMonth(`${newStart.getFullYear()}-${String(newStart.getMonth() + 1).padStart(2, '0')}`);
    setEndMonth(`${newEnd.getFullYear()}-${String(newEnd.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [sy, sm] = startMonth.split('-').map(Number);
    const [ey, em] = endMonth.split('-').map(Number);
    
    const newStart = new Date(sy, sm, 1);
    const newEnd = new Date(ey, em, 1);
    
    setStartMonth(`${newStart.getFullYear()}-${String(newStart.getMonth() + 1).padStart(2, '0')}`);
    setEndMonth(`${newEnd.getFullYear()}-${String(newEnd.getMonth() + 1).padStart(2, '0')}`);
  };

  const handlePreset = (preset: 'current' | 'last_month' | '3_months' | 'this_year') => {
    setShowCustomRange(false);
    const today = new Date();
    const currYear = today.getFullYear();
    const currMonth = today.getMonth() + 1;

    if (preset === 'current') {
      const mStr = `${currYear}-${String(currMonth).padStart(2, '0')}`;
      setStartMonth(mStr);
      setEndMonth(mStr);
    } else if (preset === 'last_month') {
      const lastMonthDate = new Date(currYear, today.getMonth() - 1, 1);
      const mStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
      setStartMonth(mStr);
      setEndMonth(mStr);
    } else if (preset === '3_months') {
      const threeMonthsAgo = new Date(currYear, today.getMonth() - 2, 1);
      setStartMonth(`${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}`);
      setEndMonth(`${currYear}-${String(currMonth).padStart(2, '0')}`);
    } else if (preset === 'this_year') {
      setStartMonth(`${currYear}-01`);
      setEndMonth(`${currYear}-12`);
    }
  };

  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const isCurrentMonthPreset = startMonth === currentMonthStr && endMonth === currentMonthStr && !showCustomRange;
  const isThisYearPreset = startMonth === `${today.getFullYear()}-01` && endMonth === `${today.getFullYear()}-12` && !showCustomRange;

  // Modal State for Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  
  // Form State
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formDesc, setFormDesc] = useState('');
  const [formAmountStr, setFormAmountStr] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formMethod, setFormMethod] = useState(PAYMENT_METHODS[0]);
  const [formStatus, setFormStatus] = useState<'completed' | 'pending'>('completed');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formInstallments, setFormInstallments] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Modal State for Delete
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Suggestions for Description (sessionStorage)
  const [recentDescriptions, setRecentDescriptions] = useState<string[]>([]);

  useEffect(() => {
    const saved = sessionStorage.getItem('recent_tx_descriptions');
    if (saved) {
      try {
        setRecentDescriptions(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (effectiveUserId) {
      fetchTransactions();
    }
  }, [effectiveUserId, startMonth, endMonth]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Filtrar pelo período selecionado
      const [startYear, startM] = startMonth.split('-');
      const startDate = `${startYear}-${startM}-01`;
      
      const [endYear, endM] = endMonth.split('-');
      const lastDay = new Date(Number(endYear), Number(endM), 0).getDate();
      const endDate = `${endYear}-${endM}-${String(lastDay).padStart(2, '0')}`;

      // 1. Buscar transações do período
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', effectiveUserId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);

      // 2. Buscar transações ANTERIORES para o saldo acumulado
      const { data: prevData, error: prevError } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', effectiveUserId)
        .lt('date', startDate);
        
      if (prevError) throw prevError;
      
      let prevBal = 0;
      if (prevData) {
        prevData.forEach(t => {
          if (t.type === 'income') prevBal += Number(t.amount);
          if (t.type === 'expense') prevBal -= Number(t.amount);
        });
      }
      setPreviousBalance(prevBal);

    } catch (err) {
      console.error('Erro ao buscar transações:', err);
      toast.error('Erro ao carregar lançamentos.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFormType = (type: 'income' | 'expense') => {
    setFormType(type);
    const defaultCat = type === 'income' ? INCOME_QUICK_CATEGORIES[0] : EXPENSE_QUICK_CATEGORIES[0];
    setFormCategory(defaultCat);
  };

  // Open modal for Create
  const handleOpenCreateModal = (initialType: 'income' | 'expense' = 'expense') => {
    setEditingTx(null);
    setFormType(initialType);
    setFormDesc('');
    setFormAmountStr('');
    setFormCategory(initialType === 'income' ? INCOME_QUICK_CATEGORIES[0] : EXPENSE_QUICK_CATEGORIES[0]);
    setFormMethod('Pix');
    setFormStatus('completed');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setFormInstallments(1);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setFormType(tx.type);
    setFormDesc(tx.description);
    setFormAmountStr(tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setFormCategory(tx.category);
    setFormMethod(tx.payment_method || 'Pix');
    setFormStatus(tx.status);
    setFormDate(tx.date);
    setFormNotes(tx.notes || '');
    setFormInstallments(1);
    setIsModalOpen(true);
  };

  // Save Transaction (Create or Update)
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDesc.trim()) {
      toast.error('Informe a descrição do lançamento.');
      return;
    }

    const numericAmount = parseFloat(formAmountStr.replace(/\./g, '').replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Informe um valor válido maior que zero.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingTx) {
        const payload = {
          user_id: effectiveUserId,
          type: formType,
          description: formDesc.trim(),
          amount: numericAmount,
          category: formCategory,
          payment_method: formMethod,
          status: formStatus,
          date: formDate,
          notes: formNotes.trim() || null
        };
        const { error } = await supabase
          .from('transactions')
          .update(payload)
          .eq('id', editingTx.id);

        if (error) throw error;
        toast.success('Lançamento atualizado com sucesso!');
      } else {
        const isCreditCard = formMethod === 'Cartão de Crédito';
        const installments = isCreditCard && formInstallments > 1 ? formInstallments : 1;
        
        const installmentAmount = installments > 1 ? (numericAmount / installments) : numericAmount;
        const payloads = [];

        for (let i = 0; i < installments; i++) {
          const baseDate = new Date(formDate);
          // Adicionar i meses à data base
          baseDate.setMonth(baseDate.getMonth() + i);
          
          const formattedDate = baseDate.toISOString().split('T')[0];
          const isFuture = i > 0;
          
          let itemDesc = formDesc.trim();
          if (installments > 1) {
            itemDesc = `${itemDesc} (${i + 1}/${installments})`;
          }

          payloads.push({
            user_id: effectiveUserId,
            type: formType,
            description: itemDesc,
            amount: installmentAmount,
            category: formCategory,
            payment_method: formMethod,
            status: isFuture ? 'pending' : formStatus,
            date: formattedDate,
            notes: formNotes.trim() || null
          });
        }

        const { error } = await supabase
          .from('transactions')
          .insert(payloads);

        if (error) throw error;
        toast.success(installments > 1 ? `${installments} parcelas lançadas com sucesso!` : 'Lançamento adicionado com sucesso!');
      }

      // Save to recent descriptions
      const desc = formDesc.trim();
      setRecentDescriptions(prev => {
        const updated = [desc, ...prev.filter(d => d !== desc)].slice(0, 10);
        sessionStorage.setItem('recent_tx_descriptions', JSON.stringify(updated));
        return updated;
      });

      setIsModalOpen(false);
      fetchTransactions();
    } catch (err) {
      console.error('Erro ao salvar lançamento:', err);
      toast.error('Erro ao salvar lançamento.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Transaction
  const handleConfirmDelete = async () => {
    if (!txToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', txToDelete.id);

      if (error) throw error;
      toast.success('Lançamento excluído.');
      setTransactions(prev => prev.filter(t => t.id !== txToDelete.id));
      setTxToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir lançamento:', err);
      toast.error('Erro ao excluir lançamento.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchCategory = t.category.toLowerCase().includes(q);
        if (!matchDesc && !matchCategory) return false;
      }
      return true;
    });
  }, [transactions, filterType, filterStatus, searchQuery]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') income += Number(t.amount);
      if (t.type === 'expense') expense += Number(t.amount);
    });
    return {
      income,
      expense,
      periodBalance: income - expense,
      totalBalance: previousBalance + income - expense
    };
  }, [filteredTransactions, previousBalance]);

  return (
    <div className="tx-manager">
      {/* Cards de Resumo Mensal */}
      <div className="tx-summary anim-fade-up">
        <div className="tx-summary__card tx-summary__card--income">
          <span className="tx-summary__label">
            <TrendingUp size={16} color="var(--success)" /> Entradas (Período)
          </span>
          <span className="tx-summary__value" style={{ color: 'var(--success)' }}>
            {totals.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>

        <div className="tx-summary__card tx-summary__card--expense">
          <span className="tx-summary__label">
            <TrendingDown size={16} color="var(--danger)" /> Saídas (Período)
          </span>
          <span className="tx-summary__value" style={{ color: 'var(--danger)' }}>
            {totals.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>

        <div className="tx-summary__card tx-summary__card--balance">
          <span className="tx-summary__label">
            <DollarSign size={16} color="var(--brand-primary)" /> Saldo Atual (Total Acumulado)
          </span>
          <span className="tx-summary__value gradient-text">
            {totals.totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
            Saldo no período: {totals.periodBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Controles */}
      <div className="tx-controls anim-fade-up" style={{ animationDelay: '50ms' }}>
        <div className="tx-controls__left">
          {/* Novo Seletor de Período Estético & Funcional */}
          <div className="tx-date-wrapper">
            <div className="tx-date-bar">
              {/* Navegador por Setas e Label */}
              <div className="tx-date-selector">
                <button type="button" className="tx-date-btn" onClick={handlePrevMonth} title="Mês Anterior">
                  <ChevronLeft size={18} />
                </button>
                <div 
                  className="tx-date-display"
                  onClick={() => setShowCustomRange(v => !v)}
                  title="Clique para abrir intervalo personalizado"
                >
                  <Calendar size={16} className="tx-date-display__icon" />
                  <span>
                    {startMonth === endMonth
                      ? formatMonthLabel(startMonth)
                      : `${formatMonthLabel(startMonth, true)} até ${formatMonthLabel(endMonth, true)}`}
                  </span>
                  <ChevronDown size={14} style={{ transform: showCustomRange ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
                <button type="button" className="tx-date-btn" onClick={handleNextMonth} title="Próximo Mês">
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Presets Rápidos */}
              <div className="tx-date-presets">
                <button 
                  type="button"
                  className={`tx-chip ${isCurrentMonthPreset ? 'tx-chip--active' : ''}`}
                  onClick={() => handlePreset('current')}
                >
                  Este Mês
                </button>
                <button 
                  type="button"
                  className={`tx-chip ${isThisYearPreset ? 'tx-chip--active' : ''}`}
                  onClick={() => handlePreset('this_year')}
                >
                  Este Ano
                </button>
                <button 
                  type="button"
                  className={`tx-chip ${showCustomRange ? 'tx-chip--active' : ''}`}
                  onClick={() => setShowCustomRange(v => !v)}
                >
                  <SlidersHorizontal size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Customizar
                </button>
              </div>
            </div>

            {/* Painel Expansível de Intervalo Customizado */}
            {showCustomRange && (
              <div className="tx-custom-date-box anim-fade-up">
                <div className="tx-custom-date-field">
                  <label className="afic-label">Mês Inicial</label>
                  <input 
                    type="month" 
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    className="tx-search-input"
                    style={{ minWidth: '140px' }}
                  />
                </div>
                <span className="tx-custom-date-separator">até</span>
                <div className="tx-custom-date-field">
                  <label className="afic-label">Mês Final</label>
                  <input 
                    type="month" 
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
                    className="tx-search-input"
                    style={{ minWidth: '140px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Busca por Texto */}
          <div style={{ position: 'relative' }}>
            <input 
              type="text"
              placeholder="Buscar lançamento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tx-search-input"
            />
          </div>

          {/* Filtros Tipo (Entrada/Saída) */}
          <div className="tx-pills">
            <button 
              className={`tx-pill-btn ${filterType === 'all' ? 'tx-pill-btn--active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              Todos
            </button>
            <button 
              className={`tx-pill-btn ${filterType === 'income' ? 'tx-pill-btn--active' : ''}`}
              onClick={() => setFilterType('income')}
            >
              Entradas
            </button>
            <button 
              className={`tx-pill-btn ${filterType === 'expense' ? 'tx-pill-btn--active' : ''}`}
              onClick={() => setFilterType('expense')}
            >
              Saídas
            </button>
          </div>

          {/* Filtros Status */}
          <div className="tx-pills">
            <button 
              className={`tx-pill-btn ${filterStatus === 'all' ? 'tx-pill-btn--active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              Qualquer Status
            </button>
            <button 
              className={`tx-pill-btn ${filterStatus === 'completed' ? 'tx-pill-btn--active' : ''}`}
              onClick={() => setFilterStatus('completed')}
            >
              Pago
            </button>
            <button 
              className={`tx-pill-btn ${filterStatus === 'pending' ? 'tx-pill-btn--active' : ''}`}
              onClick={() => setFilterStatus('pending')}
            >
              Pendente
            </button>
          </div>
        </div>

        {!readOnly && (
          <Button onClick={handleOpenCreateModal}>
            <Plus size={18} /> Novo Lançamento
          </Button>
        )}
      </div>

      {/* Lista de Transações */}
      <div className="tx-list anim-fade-up" style={{ animationDelay: '100ms' }}>
        {loading ? (
          <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Carregando seus lançamentos...
          </Card>
        ) : filteredTransactions.length === 0 ? (
          <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={36} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Nenhum lançamento encontrado para este período.
            </p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Clique em "Novo Lançamento" para registrar suas entradas ou despesas do dia!
            </p>
          </Card>
        ) : (
          filteredTransactions.map(tx => (
            <div key={tx.id} className="tx-item">
              <div className="tx-item__left">
                <div className={`tx-item__icon ${tx.type === 'income' ? 'tx-item__icon--income' : 'tx-item__icon--expense'}`}>
                  {tx.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>

                <div className="tx-item__details">
                  <span className="tx-item__desc">{tx.description}</span>
                  <div className="tx-item__meta">
                    <span>{new Date(tx.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Tag size={12} /> {tx.category}
                    </span>
                    <span>•</span>
                    <span>{tx.payment_method}</span>
                    <span>•</span>
                    {tx.status === 'completed' ? (
                      <span className="tx-item__badge-completed">Concluído</span>
                    ) : (
                      <span className="tx-item__badge-pending">Pendente</span>
                    )}
                  </div>
                  {tx.notes && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.125rem', fontStyle: 'italic' }}>
                      "{tx.notes}"
                    </p>
                  )}
                </div>
              </div>

              <div className="tx-item__right">
                <span className={`tx-item__amount ${tx.type === 'income' ? 'tx-item__amount--income' : 'tx-item__amount--expense'}`}>
                  {tx.type === 'income' ? '+' : '-'} {Number(tx.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>

                {!readOnly && (
                  <div className="tx-item__actions">
                    <button 
                      className="tx-action-btn"
                      title="Editar Lançamento"
                      onClick={() => handleOpenEditModal(tx)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="tx-action-btn tx-action-btn--delete"
                      title="Excluir Lançamento"
                      onClick={() => setTxToDelete(tx)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Cadastro / Edição */}
      {isModalOpen && (
        <div className="tx-modal-overlay">
          <div className="tx-modal anim-fade-up" style={{ borderTop: `4px solid ${formType === 'income' ? 'var(--success)' : 'var(--danger)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: 'var(--r-md)', 
                  background: formType === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: formType === 'income' ? 'var(--success)' : 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {formType === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {editingTx ? 'Editar Lançamento' : (formType === 'income' ? 'Nova Receita' : 'Nova Despesa')}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Toggle Entrada / Saída */}
              <div className="tx-type-toggle">
                <button
                  type="button"
                  className={`tx-type-btn ${formType === 'expense' ? 'tx-type-btn--expense-active' : ''}`}
                  onClick={() => handleToggleFormType('expense')}
                >
                  <TrendingDown size={18} /> Despesa (Saída)
                </button>
                <button
                  type="button"
                  className={`tx-type-btn ${formType === 'income' ? 'tx-type-btn--income-active' : ''}`}
                  onClick={() => handleToggleFormType('income')}
                >
                  <TrendingUp size={18} /> Receita (Entrada)
                </button>
              </div>

              {/* Descrição */}
              <div>
                <label className="afic-label">Descrição do Lançamento *</label>
                <input 
                  type="text"
                  placeholder={formType === 'income' ? "Ex: Salário Mensal, Rendimentos, Pix..." : "Ex: Supermercado, Aluguel, Luz..."}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="tx-search-input"
                  style={{ width: '100%' }}
                  list="desc-suggestions"
                  autoComplete="off"
                  required
                />
                <datalist id="desc-suggestions">
                  {recentDescriptions.map(desc => (
                    <option key={desc} value={desc} />
                  ))}
                </datalist>
              </div>

              {/* Valor */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="afic-label" style={{ margin: 0 }}>Valor (R$) *</label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: formType === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                    {formType === 'income' ? '+ Entrada' : '- Saída'}
                  </span>
                </div>
                <MoneyInput 
                  value={formAmountStr}
                  onChange={(v) => setFormAmountStr(v)}
                  placeholder="0,00"
                />
              </div>

              {/* Categoria com Atalhos Rápidos Dinâmicos */}
              <div>
                <label className="afic-label" style={{ marginBottom: '0.375rem', display: 'block' }}>
                  Categoria / Balde *
                </label>
                <div className="tx-category-chips">
                  {(formType === 'income' ? INCOME_QUICK_CATEGORIES : EXPENSE_QUICK_CATEGORIES).map(cat => {
                    const isSelected = formCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={`tx-chip ${isSelected ? (formType === 'income' ? 'tx-chip--income-active' : 'tx-chip--active') : ''}`}
                        onClick={() => setFormCategory(cat)}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
                <select 
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="tx-search-input"
                  style={{ width: '100%', marginTop: '0.375rem' }}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="afic-label">Forma de Pagamento</label>
                <select 
                  value={formMethod}
                  onChange={(e) => setFormMethod(e.target.value)}
                  className="tx-search-input"
                  style={{ width: '100%' }}
                >
                  {PAYMENT_METHODS.map(pm => (
                    <option key={pm} value={pm}>{pm}</option>
                  ))}
                </select>
              </div>

              {!editingTx && formMethod === 'Cartão de Crédito' && (
                <div className="anim-fade-up">
                  <label className="afic-label">Número de Parcelas</label>
                  <input 
                    type="number"
                    min="1"
                    max="72"
                    value={formInstallments}
                    onChange={(e) => setFormInstallments(Math.max(1, parseInt(e.target.value) || 1))}
                    className="tx-search-input"
                    style={{ width: '100%' }}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', lineHeight: 1.2 }}>
                    O valor total será dividido em {formInstallments}x. As próximas parcelas serão lançadas automaticamente para os meses seguintes, com status pendente.
                  </small>
                </div>
              )}

              <div className="afic-grid-2">
                {/* Data com atalhos Hoje e Ontem */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label className="afic-label" style={{ margin: 0 }}>Data</label>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button 
                        type="button" 
                        style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => setFormDate(new Date().toISOString().split('T')[0])}
                      >
                        Hoje
                      </button>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>|</span>
                      <button 
                        type="button" 
                        style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => setFormDate(new Date(Date.now() - 86400000).toISOString().split('T')[0])}
                      >
                        Ontem
                      </button>
                    </div>
                  </div>
                  <input 
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="tx-search-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="afic-label">Status</label>
                  <select 
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="tx-search-input"
                    style={{ width: '100%' }}
                  >
                    <option value="completed">{formType === 'income' ? 'Recebido' : 'Pago / Concluído'}</option>
                    <option value="pending">{formType === 'income' ? 'A Receber' : 'Pendente / Agendado'}</option>
                  </select>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="afic-label">Observações (Opcional)</label>
                <input 
                  type="text"
                  placeholder="Ex: Pagamento referente ao projeto X..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="tx-search-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)} 
                  style={{ flex: 1 }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting} 
                  style={{ 
                    flex: 2, 
                    background: formType === 'income' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'var(--grad-brand)',
                    color: formType === 'income' ? '#ffffff' : 'var(--text-on-primary)',
                    borderColor: 'transparent'
                  }}
                >
                  {submitting 
                    ? 'Salvando...' 
                    : (editingTx 
                      ? 'Salvar Alterações' 
                      : (formType === 'income' ? '+ Confirmar Receita' : '- Confirmar Despesa'))}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Modal de Confirmação de Exclusão */}
      {txToDelete && (
        <div className="tx-modal-overlay">
          <div className="tx-modal anim-fade-up" style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              <Trash2 size={28} color="var(--danger)" />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Excluir Lançamento?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Tem certeza que deseja apagar <strong>"{txToDelete.description}"</strong> de {Number(txToDelete.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}? Esta ação não pode ser desfeita.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Button variant="outline" onClick={() => setTxToDelete(null)} disabled={deleting}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmDelete} disabled={deleting} style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}>
                {deleting ? 'Excluindo...' : 'Sim, Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (Mobile) */}
      {!readOnly && (
        <button 
          className="tx-fab" 
          onClick={handleOpenCreateModal}
          aria-label="Novo Lançamento"
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
};
