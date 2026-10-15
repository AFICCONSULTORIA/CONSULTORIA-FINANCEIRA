import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, Trash2, Edit2, TrendingUp, TrendingDown, 
  Calendar, X, AlertCircle, Tag, ChevronLeft, ChevronRight,
  Search, RotateCcw, CheckCircle2, Clock, Check,
  Layers,
  Wallet, Utensils, Car, Home, HeartPulse, Gamepad2, PiggyBank,
  Sparkles, GraduationCap, Briefcase, Coins, LayoutList, Table,
  Landmark, Zap
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import { MoneyInput } from '../../../components/ui/MoneyInput';
import { OfxImporterModal } from './OfxImporterModal';
import { OpenFinanceModal } from './OpenFinanceModal';
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
  targetUserId?: string;
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
  'Transferência',
  'Extrato Bancário',
  'Outros'
];

export const getLocalDateISO = (d: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const normalizeText = (text: string) => {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Alimentação': { bg: 'rgba(249, 115, 22, 0.12)', text: '#FB923C', dot: '#F97316' },
  'Transporte': { bg: 'rgba(6, 182, 212, 0.12)', text: '#22D3EE', dot: '#06B6D4' },
  'Moradia': { bg: 'rgba(59, 130, 246, 0.12)', text: '#60A5FA', dot: '#3B82F6' },
  'Custo Fixo': { bg: 'rgba(99, 102, 241, 0.12)', text: '#818CF8', dot: '#6366F1' },
  'Saúde': { bg: 'rgba(244, 63, 94, 0.12)', text: '#FB7185', dot: '#F43F5E' },
  'Lazer': { bg: 'rgba(168, 85, 247, 0.12)', text: '#C084FC', dot: '#A855F7' },
  'Investimento': { bg: 'rgba(234, 179, 8, 0.12)', text: '#FACC15', dot: '#EAB308' },
  'Reserva': { bg: 'rgba(20, 184, 166, 0.12)', text: '#2DD4BF', dot: '#14B8A6' },
  'Metas & Sonhos': { bg: 'rgba(236, 72, 153, 0.12)', text: '#F472B6', dot: '#EC4899' },
  'Educação': { bg: 'rgba(14, 165, 233, 0.12)', text: '#38BDF8', dot: '#0EA5E9' },
  'Conforto': { bg: 'rgba(139, 92, 246, 0.12)', text: '#A78BFA', dot: '#8B5CF6' },
  'Salário / Renda Principal': { bg: 'rgba(16, 185, 129, 0.12)', text: '#34D399', dot: '#10B981' },
  'Renda Extra': { bg: 'rgba(20, 184, 166, 0.12)', text: '#2DD4BF', dot: '#14B8A6' },
  'Outros': { bg: 'rgba(148, 163, 184, 0.12)', text: '#94A3B8', dot: '#64748B' },
};

const getCategoryBadgeStyle = (category: string) => {
  return CATEGORY_COLORS[category] || { bg: 'rgba(148, 163, 184, 0.12)', text: '#94A3B8', dot: '#64748B' };
};

const getCategoryIcon = (category: string, size = 16) => {
  switch (category) {
    case 'Alimentação': return <Utensils size={size} />;
    case 'Transporte': return <Car size={size} />;
    case 'Moradia': return <Home size={size} />;
    case 'Custo Fixo': return <Layers size={size} />;
    case 'Saúde': return <HeartPulse size={size} />;
    case 'Lazer': return <Gamepad2 size={size} />;
    case 'Investimento': return <TrendingUp size={size} />;
    case 'Reserva': return <PiggyBank size={size} />;
    case 'Metas & Sonhos': return <Sparkles size={size} />;
    case 'Educação': return <GraduationCap size={size} />;
    case 'Salário / Renda Principal': return <Briefcase size={size} />;
    case 'Renda Extra': return <Coins size={size} />;
    default: return <Tag size={size} />;
  }
};

export const TransactionManager: React.FC<TransactionManagerProps> = ({ targetUserId, readOnly = false }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const effectiveUserId = targetUserId || user?.id;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Modo de visualização: Linha do Tempo (Feed) vs Tabela Executiva
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  // Filtros de Data
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());
  const [previousBalance, setPreviousBalance] = useState<number>(0);

  // Filtros de busca e segmentação
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'value_desc' | 'value_asc'>('date_desc');

  // Modais de Criação e Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOfxModalOpen, setIsOfxModalOpen] = useState(false);
  const [isOpenFinanceModalOpen, setIsOpenFinanceModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Form State
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formDesc, setFormDesc] = useState('');
  const [formAmountStr, setFormAmountStr] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  // Datas locais de referência (sem desvio de fuso horário UTC)
  const todayISO = useMemo(() => getLocalDateISO(new Date()), []);
  const yesterdayISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateISO(d);
  }, []);

  const [formMethod, setFormMethod] = useState(PAYMENT_METHODS[0]);
  const [formStatus, setFormStatus] = useState<'completed' | 'pending'>('completed');
  const [formDate, setFormDate] = useState(() => getLocalDateISO());
  const [formNotes, setFormNotes] = useState('');
  const [formInstallments, setFormInstallments] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Modais de Exclusão
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Ações em Massa (Bulk)
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [bulkDeleteConfirmModal, setBulkDeleteConfirmModal] = useState<boolean>(false);
  const [deletingBulk, setDeletingBulk] = useState(false);

  // Sugestões de descrição
  const [recentDescriptions, setRecentDescriptions] = useState<string[]>([]);

  useEffect(() => {
    const saved = sessionStorage.getItem('recent_tx_descriptions');
    if (saved) {
      try {
        setRecentDescriptions(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveRecentDescription = (desc: string) => {
    const trimmed = desc.trim();
    if (!trimmed) return;
    setRecentDescriptions(prev => {
      const next = [trimmed, ...prev.filter(d => d.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
      sessionStorage.setItem('recent_tx_descriptions', JSON.stringify(next));
      return next;
    });
  };

  // Cálculo de Início e Fim do Mês selecionado
  const { monthStart, monthEnd, monthLabel, isCurrentMonth } = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const end = new Date(year, month + 1, 0);

    const pad = (n: number) => String(n).padStart(2, '0');
    const startStr = `${year}-${pad(month + 1)}-01`;
    const endStr = `${year}-${pad(month + 1)}-${pad(end.getDate())}`;

    const label = currentMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);

    const now = new Date();
    const isCurr = now.getFullYear() === year && now.getMonth() === month;

    return {
      monthStart: startStr,
      monthEnd: endStr,
      monthLabel: formattedLabel,
      isCurrentMonth: isCurr,
    };
  }, [currentMonthDate]);

  // Navegação de Meses
  const handlePrevMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedTxIds([]);
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedTxIds([]);
  };

  const handleGoToCurrentMonth = () => {
    setCurrentMonthDate(new Date());
    setSelectedTxIds([]);
  };

  // Invalidação centralizada do TanStack Query
  const invalidateAllQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions_calendar'] });
    queryClient.invalidateQueries({ queryKey: ['transactions_summary'] });
    queryClient.invalidateQueries({ queryKey: ['transactions_recent'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  // Carregar Lançamentos do Banco
  const fetchTransactions = async () => {
    if (!effectiveUserId) return;
    setLoading(true);

    try {
      // 1. Busca transações do mês selecionado
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', effectiveUserId)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);

      // 2. Saldo anterior acumulado antes do mês corrente
      const { data: prevData, error: prevError } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', effectiveUserId)
        .lt('date', monthStart);

      if (!prevError && prevData) {
        let prevSum = 0;
        prevData.forEach(t => {
          if (t.type === 'income') prevSum += Number(t.amount);
          if (t.type === 'expense') prevSum -= Number(t.amount);
        });
        setPreviousBalance(prevSum);
      }
    } catch (err: any) {
      console.error('Erro ao buscar transações:', err);
      toast.error('Não foi possível carregar os lançamentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [effectiveUserId, monthStart, monthEnd]);

  // Alternância rápida de status em 1 toque (Pago ↔ Pendente)
  const handleToggleStatusQuick = async (tx: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;

    const newStatus: 'completed' | 'pending' = tx.status === 'completed' ? 'pending' : 'completed';

    // Atualização otimista imediata na UI
    setTransactions(prev =>
      prev.map(item => (item.id === tx.id ? { ...item, status: newStatus } : item))
    );

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', tx.id);

      if (error) throw error;

      toast.success(newStatus === 'completed' ? 'Marcado como Pago!' : 'Marcado como Pendente!', {
        duration: 2000,
      });

      invalidateAllQueries();
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      toast.error('Erro ao alternar status do lançamento.');
      fetchTransactions();
    }
  };

  // Ações em massa: Marcar status
  const handleBulkChangeStatus = async (status: 'completed' | 'pending') => {
    if (selectedTxIds.length === 0 || readOnly) return;

    setTransactions(prev =>
      prev.map(item => (selectedTxIds.includes(item.id) ? { ...item, status } : item))
    );

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status })
        .in('id', selectedTxIds);

      if (error) throw error;

      toast.success(`${selectedTxIds.length} lançamentos alterados para ${status === 'completed' ? 'Pago' : 'Pendente'}!`);
      invalidateAllQueries();
      setSelectedTxIds([]);
    } catch (err: any) {
      console.error('Erro ao alterar em massa:', err);
      toast.error('Erro ao processar alteração em massa.');
      fetchTransactions();
    }
  };

  // Abrir Modal de Criação
  const handleOpenCreateModal = (type: 'income' | 'expense' = 'expense') => {
    setEditingTx(null);
    setFormType(type);
    setFormDesc('');
    setFormAmountStr('');
    setFormCategory(type === 'income' ? INCOME_QUICK_CATEGORIES[0] : EXPENSE_QUICK_CATEGORIES[0]);
    setFormMethod(PAYMENT_METHODS[0]);
    setFormStatus('completed');
    setFormDate(todayISO);
    setFormNotes('');
    setFormInstallments(1);
    setIsModalOpen(true);
  };

  // Abrir Modal de Edição
  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setFormType(tx.type);
    setFormDesc(tx.description);
    setFormAmountStr(tx.amount.toString().replace('.', ','));
    setFormCategory(tx.category || CATEGORIES[0]);
    setFormMethod(tx.payment_method || PAYMENT_METHODS[0]);
    setFormStatus(tx.status);
    setFormDate(tx.date);
    setFormNotes(tx.notes || '');
    setFormInstallments(1);
    setIsModalOpen(true);
  };

  const handleToggleFormType = (type: 'income' | 'expense') => {
    setFormType(type);
    setFormCategory(type === 'income' ? INCOME_QUICK_CATEGORIES[0] : EXPENSE_QUICK_CATEGORIES[0]);
  };

  // Salvar Lançamento (Criar ou Editar)
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveUserId) return;

    const cleanAmount = parseFloat(formAmountStr.replace(/\./g, '').replace(',', '.'));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      toast.error('Por favor, informe um valor monetário válido maior que zero.');
      return;
    }

    if (!formDesc.trim()) {
      toast.error('Informe a descrição do lançamento.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingTx) {
        // Edição
        const { error } = await supabase
          .from('transactions')
          .update({
            type: formType,
            description: formDesc.trim(),
            amount: cleanAmount,
            category: formCategory,
            payment_method: formMethod,
            status: formStatus,
            date: formDate,
            notes: formNotes.trim() || null
          })
          .eq('id', editingTx.id);

        if (error) throw error;
        toast.success('Lançamento atualizado com sucesso!');
      } else {
        // Criação (com suporte a parcelamento em cartão de crédito)
        saveRecentDescription(formDesc);

        if (formInstallments > 1 && formMethod === 'Cartão de Crédito') {
          const installmentAmount = +(cleanAmount / formInstallments).toFixed(2);
          const [y, m, d] = formDate.split('-').map(Number);
          const batch = [];

          for (let i = 0; i < formInstallments; i++) {
            const installmentDate = new Date(y, m - 1 + i, d);
            const pad = (n: number) => String(n).padStart(2, '0');
            const dateStr = `${installmentDate.getFullYear()}-${pad(installmentDate.getMonth() + 1)}-${pad(installmentDate.getDate())}`;

            batch.push({
              user_id: effectiveUserId,
              type: formType,
              description: `${formDesc.trim()} (${i + 1}/${formInstallments})`,
              amount: installmentAmount,
              category: formCategory,
              payment_method: formMethod,
              status: i === 0 ? formStatus : 'pending',
              date: dateStr,
              notes: formNotes.trim() ? `${formNotes.trim()} [Parcela ${i + 1}/${formInstallments}]` : `Parcela ${i + 1} de ${formInstallments}`
            });
          }

          const { error } = await supabase.from('transactions').insert(batch);
          if (error) throw error;
          toast.success(`${formInstallments} parcelas cadastradas com sucesso!`);
        } else {
          const { error } = await supabase.from('transactions').insert({
            user_id: effectiveUserId,
            type: formType,
            description: formDesc.trim(),
            amount: cleanAmount,
            category: formCategory,
            payment_method: formMethod,
            status: formStatus,
            date: formDate,
            notes: formNotes.trim() || null
          });

          if (error) throw error;
          toast.success('Lançamento cadastrado com sucesso!');
        }
      }

      setIsModalOpen(false);
      invalidateAllQueries();
      fetchTransactions();
    } catch (err: any) {
      console.error('Erro ao salvar lançamento:', err);
      toast.error('Erro ao salvar. Verifique os dados e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Exclusão individual
  const handleConfirmDelete = async () => {
    if (!txToDelete) return;
    setDeleting(true);

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', txToDelete.id);

      if (error) throw error;

      toast.success('Lançamento excluído com sucesso!');
      setTxToDelete(null);
      setSelectedTxIds(prev => prev.filter(id => id !== txToDelete.id));
      invalidateAllQueries();
      fetchTransactions();
    } catch (err: any) {
      console.error('Erro ao excluir:', err);
      toast.error('Não foi possível excluir o lançamento.');
    } finally {
      setDeleting(false);
    }
  };

  // Exclusão em Massa
  const handleConfirmBulkDelete = async () => {
    if (selectedTxIds.length === 0) return;
    setDeletingBulk(true);

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', selectedTxIds);

      if (error) throw error;

      toast.success(`${selectedTxIds.length} lançamentos excluídos!`);
      setSelectedTxIds([]);
      setBulkDeleteConfirmModal(false);
      invalidateAllQueries();
      fetchTransactions();
    } catch (err: any) {
      console.error('Erro ao excluir em massa:', err);
      toast.error('Erro ao excluir múltiplos lançamentos.');
    } finally {
      setDeletingBulk(false);
    }
  };

  // Filtragem e Ordenação em Memória
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (filterPaymentMethod !== 'all' && t.payment_method !== filterPaymentMethod) return false;

      if (searchQuery.trim()) {
        const q = normalizeText(searchQuery);
        const desc = normalizeText(t.description);
        const cat = normalizeText(t.category);
        const pm = normalizeText(t.payment_method);
        const amtStr = t.amount.toString();
        const amtBr = t.amount.toLocaleString('pt-BR');

        if (!desc.includes(q) && !cat.includes(q) && !pm.includes(q) && !amtStr.includes(q) && !amtBr.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
      if (sortBy === 'value_desc') return Number(b.amount) - Number(a.amount);
      if (sortBy === 'value_asc') return Number(a.amount) - Number(b.amount);
      return 0;
    });
  }, [transactions, filterType, filterStatus, filterCategory, filterPaymentMethod, searchQuery, sortBy]);

  // Contadores por Categoria para a régua de filtros
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(t => {
      const c = t.category || 'Outros';
      map[c] = (map[c] || 0) + 1;
    });
    return map;
  }, [transactions]);

  // Agrupamento por Data para a Linha do Tempo
  const groupedTransactions = useMemo(() => {
    const groups: {
      date: string;
      isToday: boolean;
      isYesterday: boolean;
      displayDate: string;
      items: Transaction[];
      dayBalance: number;
    }[] = [];

    const map: Record<string, { date: string; isToday: boolean; isYesterday: boolean; displayDate: string; items: Transaction[]; dayBalance: number }> = {};

    const todayStr = todayISO;
    const yesterdayStr = yesterdayISO;

    for (const tx of filteredTransactions) {
      const d = tx.date;
      if (!map[d]) {
        const [y, m, day] = d.split('-').map(Number);
        const dateObj = new Date(y, m - 1, day);

        const isToday = d === todayStr;
        const isYesterday = d === yesterdayStr;
        const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
        const dateFormatted = dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
        const weekdayCapitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);

        map[d] = {
          date: d,
          isToday,
          isYesterday,
          displayDate: `${dateFormatted} • ${weekdayCapitalized}`,
          items: [],
          dayBalance: 0
        };
      }

      map[d].items.push(tx);
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') map[d].dayBalance += amt;
      else map[d].dayBalance -= amt;
    }

    const distinctDates = Array.from(new Set(filteredTransactions.map(t => t.date)));
    for (const d of distinctDates) {
      if (map[d]) {
        groups.push({
          date: d,
          isToday: map[d].isToday,
          isYesterday: map[d].isYesterday,
          displayDate: map[d].displayDate,
          items: map[d].items,
          dayBalance: map[d].dayBalance
        });
      }
    }

    return groups;
  }, [filteredTransactions]);

  // Totais do Período
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    filteredTransactions.forEach(t => {
      if (t.type === 'income') {
        income += Number(t.amount);
        incomeCount++;
      }
      if (t.type === 'expense') {
        expense += Number(t.amount);
        expenseCount++;
      }
    });

    return {
      income,
      expense,
      incomeCount,
      expenseCount,
      periodBalance: income - expense,
      totalBalance: previousBalance + income - expense,
      count: filteredTransactions.length
    };
  }, [filteredTransactions, previousBalance]);

  // Métricas do Fluxo e Termômetro de Poupança
  const flowMetrics = useMemo(() => {
    const income = totals.income;
    const expense = totals.expense;
    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
    const spentPct = income > 0 ? Math.min(100, Math.round((expense / income) * 100)) : (expense > 0 ? 100 : 0);
    const isSurplus = income >= expense;
    return { savingsRate, spentPct, isSurplus };
  }, [totals]);

  // Soma dos itens selecionados para a barra flutuante
  const selectedTotalAmount = useMemo(() => {
    return transactions
      .filter(t => selectedTxIds.includes(t.id))
      .reduce((acc, t) => acc + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
  }, [transactions, selectedTxIds]);

  const hasActiveFilters = filterType !== 'all' || filterStatus !== 'all' || filterCategory !== 'all' || filterPaymentMethod !== 'all' || searchQuery.trim() !== '';

  const clearAllFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
    setFilterCategory('all');
    setFilterPaymentMethod('all');
    setSearchQuery('');
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="tx-manager">
      {/* ── 1. Hero Command Bar & Ações Rápidas ── */}
      <div className="tx-hero-header anim-fade-up">
        <div className="tx-hero-header__left">
          <div className="tx-hero-badge">
            <Wallet size={14} className="tx-hero-badge__icon" />
            <span>Extrato & Conciliação Inteligente</span>
          </div>
          <h1 className="tx-hero-title">Lançamentos Financeiros</h1>
          <p className="tx-hero-subtitle">
            Acompanhe suas receitas, controle gastos e concilie extratos bancários com facilidade
          </p>
        </div>

        {!readOnly && (
          <div className="tx-hero-actions">
            <button 
              type="button"
              className="tx-btn-ghost-open-finance" 
              onClick={() => setIsOpenFinanceModalOpen(true)}
              title="Conectar contas bancárias via Open Finance (Sincronização Automática)"
            >
              <Zap size={16} />
              <span>Open Finance</span>
              <span className="tx-pill-badge-auto">Auto</span>
            </button>

            <button 
              type="button"
              className="tx-btn-ghost-ofx" 
              onClick={() => setIsOfxModalOpen(true)}
              title="Importar extrato bancário .OFX"
            >
              <Landmark size={17} />
              <span>Importar Extrato OFX</span>
            </button>

            <button 
              type="button"
              className="tx-btn-primary-add" 
              onClick={() => handleOpenCreateModal('expense')}
            >
              <Plus size={18} />
              <span>Novo Lançamento</span>
            </button>
          </div>
        )}
      </div>

      {/* ── 2. Régua de Navegação de Mês & Atalhos ── */}
      <div className="tx-month-strip anim-fade-up">
        <div className="tx-month-controls">
          <button 
            type="button" 
            className="tx-nav-pill-btn" 
            onClick={handlePrevMonth} 
            title="Mês Anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="tx-month-current-badge">
            <Calendar size={16} className="tx-month-icon-gold" />
            <span>{monthLabel}</span>
          </div>

          <button 
            type="button" 
            className="tx-nav-pill-btn" 
            onClick={handleNextMonth} 
            title="Próximo Mês"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="tx-month-quick-jumps">
          {!isCurrentMonth && (
            <button 
              type="button" 
              className="tx-jump-pill tx-jump-pill--today" 
              onClick={handleGoToCurrentMonth}
            >
              Ir para Mês Atual
            </button>
          )}
          <span className="tx-month-stats-pill">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'lançamento' : 'lançamentos'} no período
          </span>
        </div>
      </div>

      {/* ── 3. Bento Grid Executivo de Métricas ── */}
      <div className="tx-bento-grid anim-fade-up">
        {/* Card Principal: Saldo do Período */}
        <div className="tx-bento-card tx-bento-card--hero">
          <div className="tx-bento-top">
            <span className="tx-bento-label">Saldo do Período</span>
            <div className={`tx-bento-tag ${totals.periodBalance >= 0 ? 'tx-bento-tag--pos' : 'tx-bento-tag--neg'}`}>
              {totals.periodBalance >= 0 ? 'Superávit' : 'Déficit'}
            </div>
          </div>
          <div className={`tx-bento-val ${totals.periodBalance >= 0 ? 'tx-bento-val--pos' : 'tx-bento-val--neg'}`}>
            {formatCurrency(totals.periodBalance)}
          </div>
          <div className="tx-bento-foot">
            Saldo acumulado em caixa: <strong>{formatCurrency(totals.totalBalance)}</strong>
          </div>
        </div>

        {/* Card Entradas */}
        <div className="tx-bento-card tx-bento-card--income">
          <div className="tx-bento-top">
            <span className="tx-bento-label">Entradas (Receitas)</span>
            <div className="tx-bento-icon-box tx-bento-icon-box--income">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="tx-bento-val tx-bento-val--income">
            {formatCurrency(totals.income)}
          </div>
          <div className="tx-bento-foot">
            {totals.incomeCount} {totals.incomeCount === 1 ? 'recebimento registrado' : 'recebimentos registrados'}
          </div>
        </div>

        {/* Card Saídas */}
        <div className="tx-bento-card tx-bento-card--expense">
          <div className="tx-bento-top">
            <span className="tx-bento-label">Saídas (Despesas)</span>
            <div className="tx-bento-icon-box tx-bento-icon-box--expense">
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="tx-bento-val tx-bento-val--expense">
            {formatCurrency(totals.expense)}
          </div>
          <div className="tx-bento-foot">
            {totals.expenseCount} {totals.expenseCount === 1 ? 'pagamento realizado' : 'pagamentos realizados'}
          </div>
        </div>

        {/* Card Termômetro de Poupança */}
        <div className="tx-bento-card tx-bento-card--gauge">
          <div className="tx-bento-top">
            <span className="tx-bento-label">Taxa de Poupança / Margem</span>
            <span className="tx-bento-metric-badge">
              {flowMetrics.savingsRate > 0 ? `+${flowMetrics.savingsRate}%` : `${flowMetrics.savingsRate}%`}
            </span>
          </div>

          <div className="tx-gauge-bar-track">
            <div 
              className="tx-gauge-bar-spent" 
              style={{ width: `${flowMetrics.spentPct}%` }}
              title={`Comprometido: ${flowMetrics.spentPct}%`}
            />
            {flowMetrics.savingsRate > 0 && (
              <div 
                className="tx-gauge-bar-saved" 
                style={{ width: `${flowMetrics.savingsRate}%` }}
                title={`Retido: ${flowMetrics.savingsRate}%`}
              />
            )}
          </div>

          <div className="tx-bento-foot">
            {flowMetrics.isSurplus 
              ? `Você está retendo ${flowMetrics.savingsRate}% da sua renda líquida.`
              : `Atenção: Os gastos ultrapassaram suas receitas este mês.`}
          </div>
        </div>
      </div>

      {/* ── 4. Barra Unificada de Controles, Busca & Alternador de Visualização ── */}
      <div className="tx-control-panel anim-fade-up">
        <div className="tx-control-row-top">
          {/* Campo de Busca Rápida */}
          <div className="tx-unified-search">
            <Search size={16} className="tx-unified-search__icon" />
            <input 
              type="text"
              placeholder="Buscar por descrição, valor (ex: 150), categoria ou forma de pagamento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tx-unified-search__input"
            />
            {searchQuery && (
              <button className="tx-unified-search__clear" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Alternador de Modo de Visualização (Timeline vs Tabela) */}
          <div className="tx-view-mode-toggle">
            <button
              type="button"
              className={`tx-view-btn ${viewMode === 'timeline' ? 'tx-view-btn--active' : ''}`}
              onClick={() => setViewMode('timeline')}
              title="Visualização em Linha do Tempo agrupada por dia"
            >
              <LayoutList size={15} />
              <span>Linha do Tempo</span>
            </button>
            <button
              type="button"
              className={`tx-view-btn ${viewMode === 'table' ? 'tx-view-btn--active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Visualização em Tabela Detalhada"
            >
              <Table size={15} />
              <span>Tabela</span>
            </button>
          </div>
        </div>

        {/* Linha de Filtros Rápidos (Tipo, Status, Ordenação) */}
        <div className="tx-control-row-filters">
          {/* Segmented de Tipo */}
          <div className="tx-segmented-group">
            <button 
              type="button"
              className={`tx-seg-btn ${filterType === 'all' ? 'tx-seg-btn--active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              Todos
            </button>
            <button 
              type="button"
              className={`tx-seg-btn ${filterType === 'income' ? 'tx-seg-btn--income-active' : ''}`}
              onClick={() => setFilterType('income')}
            >
              <TrendingUp size={13} /> Entradas
            </button>
            <button 
              type="button"
              className={`tx-seg-btn ${filterType === 'expense' ? 'tx-seg-btn--expense-active' : ''}`}
              onClick={() => setFilterType('expense')}
            >
              <TrendingDown size={13} /> Saídas
            </button>
          </div>

          {/* Segmented de Status */}
          <div className="tx-segmented-group">
            <button 
              type="button"
              className={`tx-seg-btn ${filterStatus === 'all' ? 'tx-seg-btn--active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              Status: Todos
            </button>
            <button 
              type="button"
              className={`tx-seg-btn ${filterStatus === 'completed' ? 'tx-seg-btn--active' : ''}`}
              onClick={() => setFilterStatus('completed')}
            >
              <Check size={13} /> Pagos
            </button>
            <button 
              type="button"
              className={`tx-seg-btn ${filterStatus === 'pending' ? 'tx-seg-btn--active' : ''}`}
              onClick={() => setFilterStatus('pending')}
            >
              <Clock size={13} /> Pendentes
            </button>
          </div>

          {/* Ordenação */}
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="tx-dropdown-select"
          >
            <option value="date_desc">Mais Recentes</option>
            <option value="date_asc">Mais Antigos</option>
            <option value="value_desc">Maior Valor</option>
            <option value="value_asc">Menor Valor</option>
          </select>

          {hasActiveFilters && (
            <button type="button" className="tx-btn-clear-filters" onClick={clearAllFilters}>
              <RotateCcw size={13} /> Limpar Filtros
            </button>
          )}
        </div>

        {/* Régua de Chips de Categorias com Ícones e Contadores */}
        <div className="tx-category-chips-carousel">
          <button
            type="button"
            className={`tx-carousel-chip ${filterCategory === 'all' ? 'tx-carousel-chip--active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            <Tag size={13} />
            <span>Todas as Categorias</span>
            <span className="tx-chip-count">{transactions.length}</span>
          </button>

          {CATEGORIES.map(cat => {
            const count = categoryCounts[cat] || 0;
            if (count === 0 && filterCategory !== cat) return null; // Esconde categorias vazias para não poluir
            const style = getCategoryBadgeStyle(cat);
            const isActive = filterCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                className={`tx-carousel-chip ${isActive ? 'tx-carousel-chip--active' : ''}`}
                onClick={() => setFilterCategory(cat)}
              >
                <span className="tx-carousel-chip-icon" style={{ color: style.dot }}>
                  {getCategoryIcon(cat, 13)}
                </span>
                <span>{cat}</span>
                <span className="tx-chip-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. Barra Flutuante de Ações em Massa (Bulk Actions Dock) ── */}
      {selectedTxIds.length > 0 && !readOnly && (
        <div className="tx-floating-dock anim-fade-up">
          <div className="tx-dock-left">
            <CheckCircle2 size={18} className="tx-dock-icon-gold" />
            <span>
              <strong>{selectedTxIds.length}</strong> {selectedTxIds.length === 1 ? 'item selecionado' : 'itens selecionados'}
            </span>
            <span className="tx-dock-separator">•</span>
            <span className="tx-dock-amount">
              Total: {formatCurrency(Math.abs(selectedTotalAmount))}
            </span>
          </div>

          <div className="tx-dock-actions">
            <button 
              type="button" 
              className="tx-dock-btn" 
              onClick={() => handleBulkChangeStatus('completed')}
              title="Marcar todos como pagos"
            >
              <Check size={14} /> Marcar como Pago
            </button>

            <button 
              type="button" 
              className="tx-dock-btn" 
              onClick={() => handleBulkChangeStatus('pending')}
              title="Marcar todos como pendentes"
            >
              <Clock size={14} /> Marcar como Pendente
            </button>

            <button 
              type="button" 
              className="tx-dock-btn tx-dock-btn--danger" 
              onClick={() => setBulkDeleteConfirmModal(true)}
            >
              <Trash2 size={14} /> Excluir ({selectedTxIds.length})
            </button>

            <button 
              type="button" 
              className="tx-dock-btn tx-dock-btn--ghost" 
              onClick={() => setSelectedTxIds([])}
            >
              Desmarcar
            </button>
          </div>
        </div>
      )}

      {/* ── 6. Feed de Lançamentos (Linha do Tempo ou Tabela) ── */}
      <div className="tx-feed-container anim-fade-up">
        {loading ? (
          <div className="tx-empty-state">
            <div className="afic-spinner" />
            <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>Carregando seus lançamentos...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="tx-empty-state">
            <div className="tx-empty-state__icon-box">
              <AlertCircle size={32} />
            </div>
            <h3 className="tx-empty-state__title">Nenhum lançamento encontrado</h3>
            <p className="tx-empty-state__desc">
              {hasActiveFilters 
                ? 'Nenhum lançamento corresponde aos filtros ativos. Tente limpar os filtros ou navegar para outro mês.'
                : 'Você ainda não registrou entradas ou saídas neste período.'}
            </p>
            {hasActiveFilters ? (
              <Button onClick={clearAllFilters} variant="outline" style={{ marginTop: '1rem' }}>
                <RotateCcw size={15} /> Limpar Todos os Filtros
              </Button>
            ) : !readOnly && (
              <Button onClick={() => handleOpenCreateModal()} style={{ marginTop: '1rem' }}>
                <Plus size={16} /> Criar Primeiro Lançamento
              </Button>
            )}
          </div>
        ) : viewMode === 'timeline' ? (
          /* MODO LINHA DO TEMPO */
          <div className="tx-timeline-feed">
            {groupedTransactions.map((group) => (
              <div 
                key={group.date} 
                className={`tx-day-section ${group.isToday ? 'tx-day-section--today' : ''} ${group.isYesterday ? 'tx-day-section--yesterday' : ''}`}
              >
                {/* Cabeçalho do Dia */}
                <div className={`tx-day-anchor ${group.isToday ? 'tx-day-anchor--today' : ''} ${group.isYesterday ? 'tx-day-anchor--yesterday' : ''}`}>
                  <div className="tx-day-anchor__left">
                    {group.isToday && <span className="tx-day-badge tx-day-badge--today">Hoje</span>}
                    {group.isYesterday && <span className="tx-day-badge tx-day-badge--yesterday">Ontem</span>}
                    <span className="tx-day-anchor__date">{group.displayDate}</span>
                    <span className="tx-day-anchor__count">({group.items.length})</span>
                  </div>
                  <div className={`tx-day-anchor__total ${group.dayBalance >= 0 ? 'tx-day-anchor__total--pos' : 'tx-day-anchor__total--neg'}`}>
                    Total do dia: {formatCurrency(group.dayBalance)}
                  </div>
                </div>

                {/* Lista de Cards do Dia */}
                <div className="tx-day-card-list">
                  {group.items.map((tx) => {
                    const isSelected = selectedTxIds.includes(tx.id);
                    const isIncome = tx.type === 'income';
                    const catStyle = getCategoryBadgeStyle(tx.category);

                    return (
                      <div 
                        key={tx.id} 
                        className={`tx-modern-card ${isSelected ? 'tx-modern-card--selected' : ''}`}
                        onClick={() => !readOnly && handleOpenEditModal(tx)}
                      >
                        <div className="tx-modern-card__left">
                          {!readOnly && (
                            <input 
                              type="checkbox"
                              className="tx-modern-checkbox"
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTxIds(prev => [...prev, tx.id]);
                                } else {
                                  setSelectedTxIds(prev => prev.filter(id => id !== tx.id));
                                }
                              }}
                            />
                          )}

                          {/* Ícone Contextual com Glow Suave */}
                          <div 
                            className="tx-modern-icon-box"
                            style={{ backgroundColor: catStyle.bg, color: catStyle.dot, borderColor: `${catStyle.dot}33` }}
                          >
                            {getCategoryIcon(tx.category, 18)}
                          </div>

                          <div className="tx-modern-info">
                            <span className="tx-modern-desc">{tx.description}</span>
                            <div className="tx-modern-meta-tags">
                              <span 
                                className="tx-modern-cat-tag"
                                style={{ backgroundColor: catStyle.bg, color: catStyle.text, borderColor: `${catStyle.dot}33` }}
                              >
                                <span className="tx-modern-dot" style={{ backgroundColor: catStyle.dot }} />
                                {tx.category || 'Geral'}
                              </span>

                              {tx.payment_method && (
                                <span className="tx-modern-method-tag">
                                  {tx.payment_method}
                                </span>
                              )}

                              {tx.notes?.includes('Open Finance') ? (
                                <span className="tx-modern-of-pill" title={tx.notes}>
                                  <Zap size={10} /> Open Finance
                                </span>
                              ) : tx.notes ? (
                                <span className="tx-modern-notes" title={tx.notes}>
                                  "{tx.notes}"
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="tx-modern-card__right" onClick={(e) => e.stopPropagation()}>
                          {/* 1-Click Status Pill */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleStatusQuick(tx, e)}
                            className={`tx-status-pill ${tx.status === 'completed' ? 'tx-status-pill--paid' : 'tx-status-pill--pending'}`}
                            title="Clique para alternar entre Pago e Pendente com 1 toque"
                          >
                            {tx.status === 'completed' ? (
                              <>
                                <Check size={12} /> Pago
                              </>
                            ) : (
                              <>
                                <Clock size={12} /> Pendente
                              </>
                            )}
                          </button>

                          {/* Valor em Destaque */}
                          <span className={`tx-modern-amount ${isIncome ? 'tx-modern-amount--income' : 'tx-modern-amount--expense'}`}>
                            {isIncome ? '+' : '-'} {formatCurrency(Number(tx.amount))}
                          </span>

                          {/* Botões de Ações Rápidas */}
                          {!readOnly && (
                            <div className="tx-modern-hover-actions">
                              <button 
                                type="button"
                                className="tx-icon-action-btn" 
                                title="Editar"
                                onClick={() => handleOpenEditModal(tx)}
                              >
                                <Edit2 size={15} />
                              </button>
                              <button 
                                type="button"
                                className="tx-icon-action-btn tx-icon-action-btn--delete" 
                                title="Excluir"
                                onClick={() => setTxToDelete(tx)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* MODO TABELA DETALHADA */
          <div className="tx-table-view-wrap">
            <table className="tx-dense-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="tx-modern-checkbox"
                      checked={selectedTxIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedTxIds(filteredTransactions.map(t => t.id));
                        else setSelectedTxIds([]);
                      }}
                    />
                  </th>
                  <th style={{ width: '105px' }}>Data</th>
                  <th>Descrição</th>
                  <th style={{ width: '180px' }}>Categoria</th>
                  <th style={{ width: '140px' }}>Método</th>
                  <th style={{ width: '110px' }}>Status</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Valor</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const isSelected = selectedTxIds.includes(tx.id);
                  const isIncome = tx.type === 'income';
                  const catStyle = getCategoryBadgeStyle(tx.category);

                  return (
                    <tr key={tx.id} className={isSelected ? 'tx-dense-tr--selected' : ''}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className="tx-modern-checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedTxIds(prev => [...prev, tx.id]);
                            else setSelectedTxIds(prev => prev.filter(id => id !== tx.id));
                          }}
                        />
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                        {tx.date ? tx.date.split('-').reverse().join('/') : '-'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <span>{tx.description}</span>
                          {tx.notes?.includes('Open Finance') && (
                            <span className="tx-modern-of-pill">
                              <Zap size={10} /> Open Finance
                            </span>
                          )}
                        </div>
                        {tx.notes && !tx.notes.includes('Open Finance') && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            "{tx.notes}"
                          </div>
                        )}
                      </td>
                      <td>
                        <span 
                          className="tx-modern-cat-tag"
                          style={{ backgroundColor: catStyle.bg, color: catStyle.text, borderColor: `${catStyle.dot}33` }}
                        >
                          <span className="tx-modern-dot" style={{ backgroundColor: catStyle.dot }} />
                          {tx.category || 'Geral'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {tx.payment_method || '—'}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatusQuick(tx, e)}
                          className={`tx-status-pill ${tx.status === 'completed' ? 'tx-status-pill--paid' : 'tx-status-pill--pending'}`}
                        >
                          {tx.status === 'completed' ? 'Pago' : 'Pendente'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span className={`tx-modern-amount ${isIncome ? 'tx-modern-amount--income' : 'tx-modern-amount--expense'}`}>
                          {isIncome ? '+' : '-'} {formatCurrency(Number(tx.amount))}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button 
                            type="button" 
                            className="tx-icon-action-btn"
                            onClick={() => handleOpenEditModal(tx)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            type="button" 
                            className="tx-icon-action-btn tx-icon-action-btn--delete"
                            onClick={() => setTxToDelete(tx)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 7. Modal Redesenhado de Cadastro e Edição ── */}
      {isModalOpen && (
        <div className="tx-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="tx-modal-dialog anim-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="tx-modal-dialog__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className={`tx-modal-type-icon ${formType === 'income' ? 'tx-modal-type-icon--income' : 'tx-modal-type-icon--expense'}`}>
                  {formType === 'income' ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
                </div>
                <div>
                  <h3 className="tx-modal-dialog__title">
                    {editingTx ? 'Editar Lançamento' : (formType === 'income' ? 'Nova Entrada (Receita)' : 'Nova Saída (Despesa)')}
                  </h3>
                  <span className="tx-modal-dialog__sub">
                    {editingTx ? 'Atualize as informações desta movimentação' : 'Cadastre sua movimentação com inteligência financeira'}
                  </span>
                </div>
              </div>

              <button className="tx-modal-dialog__close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="tx-modal-dialog__form">
              {/* Seletor Tipo: Despesa vs Receita */}
              <div className="tx-modal-type-selector">
                <button
                  type="button"
                  className={`tx-type-choice-btn ${formType === 'expense' ? 'tx-type-choice-btn--expense-active' : ''}`}
                  onClick={() => handleToggleFormType('expense')}
                >
                  <TrendingDown size={17} /> Despesa (Saída)
                </button>
                <button
                  type="button"
                  className={`tx-type-choice-btn ${formType === 'income' ? 'tx-type-choice-btn--income-active' : ''}`}
                  onClick={() => handleToggleFormType('income')}
                >
                  <TrendingUp size={17} /> Receita (Entrada)
                </button>
              </div>

              {/* Valor em Destaque */}
              <div className="tx-form-row">
                <label className="tx-field-label">Valor do Lançamento *</label>
                <div className="tx-money-input-container">
                  <MoneyInput 
                    value={formAmountStr}
                    onChange={(v) => setFormAmountStr(v)}
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="tx-form-row">
                <label className="tx-field-label">Descrição *</label>
                <input 
                  type="text"
                  placeholder={formType === 'income' ? "Ex: Salário, Rendimentos, Pix recebido..." : "Ex: Supermercado, Aluguel, Combustível, Restaurante..."}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="tx-field-input"
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

              {/* Categorias Rápidas em Chips */}
              <div className="tx-form-row">
                <label className="tx-field-label">Categoria</label>
                <div className="tx-modal-chips-grid">
                  {(formType === 'income' ? INCOME_QUICK_CATEGORIES : EXPENSE_QUICK_CATEGORIES).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      className={`tx-modal-chip-btn ${formCategory === cat ? 'tx-modal-chip-btn--active' : ''}`}
                      onClick={() => setFormCategory(cat)}
                    >
                      {getCategoryIcon(cat, 14)}
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Forma de Pagamento e Data */}
              <div className="tx-form-grid-2">
                <div className="tx-form-row">
                  <label className="tx-field-label">Forma de Pagamento</label>
                  <select 
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value)}
                    className="tx-field-input"
                  >
                    {PAYMENT_METHODS.map(pm => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>

                <div className="tx-form-row">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label className="tx-field-label" style={{ margin: 0 }}>Data</label>
                    <div className="tx-date-shortcuts">
                      <button 
                        type="button" 
                        className={`tx-date-pill-btn ${formDate === todayISO ? 'tx-date-pill-btn--today-active' : ''}`}
                        onClick={() => setFormDate(todayISO)}
                      >
                        Hoje
                      </button>
                      <button 
                        type="button" 
                        className={`tx-date-pill-btn ${formDate === yesterdayISO ? 'tx-date-pill-btn--yesterday-active' : ''}`}
                        onClick={() => setFormDate(yesterdayISO)}
                      >
                        Ontem
                      </button>
                    </div>
                  </div>
                  <input 
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="tx-field-input"
                    required
                  />
                </div>
              </div>

              {/* Parcelas se for Cartão de Crédito */}
              {!editingTx && formMethod === 'Cartão de Crédito' && (
                <div className="tx-form-row anim-fade-up">
                  <label className="tx-field-label">Número de Parcelas</label>
                  <input 
                    type="number"
                    min="1"
                    max="72"
                    value={formInstallments}
                    onChange={(e) => setFormInstallments(Math.max(1, parseInt(e.target.value) || 1))}
                    className="tx-field-input"
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    O valor total será parcelado automaticamente em {formInstallments} meses consecutivos.
                  </small>
                </div>
              )}

              {/* Status do Pagamento */}
              <div className="tx-form-row">
                <label className="tx-field-label">Status do Pagamento</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setFormStatus('completed')}
                    className={`tx-modal-status-choice ${formStatus === 'completed' ? 'tx-modal-status-choice--paid' : ''}`}
                  >
                    <CheckCircle2 size={16} /> {formType === 'income' ? 'Recebido' : 'Pago'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('pending')}
                    className={`tx-modal-status-choice ${formStatus === 'pending' ? 'tx-modal-status-choice--pending' : ''}`}
                  >
                    <Clock size={16} /> Pendente
                  </button>
                </div>
              </div>

              {/* Observações */}
              <div className="tx-form-row">
                <label className="tx-field-label">Observações (Opcional)</label>
                <input 
                  type="text"
                  placeholder="Ex: Almoço de negócios, fatura cartão Itaú..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="tx-field-input"
                />
              </div>

              {/* Rodapé de Ações */}
              <div className="tx-modal-dialog__footer">
                <button 
                  type="button" 
                  className="tx-modal-btn-cancel" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className={`tx-modal-btn-submit ${formType === 'income' ? 'tx-modal-btn-submit--income' : ''}`}
                >
                  {submitting 
                    ? 'Salvando...' 
                    : (editingTx 
                      ? 'Salvar Alterações' 
                      : (formType === 'income' ? '+ Confirmar Receita' : '- Confirmar Despesa'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 8. Modal de Exclusão Individual ── */}
      {txToDelete && (
        <div className="tx-modal-overlay" onClick={() => setTxToDelete(null)}>
          <div className="tx-modal-dialog tx-modal-dialog--confirm anim-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="tx-confirm-icon-box">
              <Trash2 size={26} />
            </div>

            <h3 className="tx-confirm-title">Excluir Lançamento?</h3>
            <p className="tx-confirm-desc">
              Tem certeza que deseja apagar <strong>"{txToDelete.description}"</strong> no valor de {formatCurrency(Number(txToDelete.amount))}?
            </p>

            <div className="tx-confirm-actions">
              <button className="tx-modal-btn-cancel" onClick={() => setTxToDelete(null)} disabled={deleting}>
                Cancelar
              </button>
              <button className="tx-confirm-danger-btn" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. Modal de Exclusão em Massa ── */}
      {bulkDeleteConfirmModal && (
        <div className="tx-modal-overlay" onClick={() => setBulkDeleteConfirmModal(false)}>
          <div className="tx-modal-dialog tx-modal-dialog--confirm anim-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="tx-confirm-icon-box">
              <Trash2 size={26} />
            </div>

            <h3 className="tx-confirm-title">Excluir {selectedTxIds.length} Lançamentos?</h3>
            <p className="tx-confirm-desc">
              Tem certeza que deseja excluir os <strong>{selectedTxIds.length}</strong> itens selecionados? Esta ação não pode ser desfeita.
            </p>

            <div className="tx-confirm-actions">
              <button className="tx-modal-btn-cancel" onClick={() => setBulkDeleteConfirmModal(false)} disabled={deletingBulk}>
                Cancelar
              </button>
              <button className="tx-confirm-danger-btn" onClick={handleConfirmBulkDelete} disabled={deletingBulk}>
                {deletingBulk ? 'Excluindo...' : 'Sim, Excluir Todos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 10. Modal de Importação de Extrato OFX ── */}
      {effectiveUserId && (
        <OfxImporterModal
          userId={effectiveUserId}
          isOpen={isOfxModalOpen}
          onClose={() => setIsOfxModalOpen(false)}
          onSuccess={() => fetchTransactions()}
        />
      )}

      {/* ── 11. Modal de Open Finance (Bancos Conectados) ── */}
      {effectiveUserId && (
        <OpenFinanceModal
          userId={effectiveUserId}
          isOpen={isOpenFinanceModalOpen}
          onClose={() => setIsOpenFinanceModalOpen(false)}
          onSuccess={() => fetchTransactions()}
        />
      )}
    </div>
  );
};
