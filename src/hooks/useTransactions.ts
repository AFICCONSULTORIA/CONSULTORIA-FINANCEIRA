import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export interface TransactionItem {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  payment_method?: string;
  status: 'completed' | 'pending';
  date: string; // YYYY-MM-DD
  notes?: string;
  created_at?: string;
}

export interface DayFinancialSummary {
  totalExpense: number;
  totalIncome: number;
  netBalance: number;
  items: TransactionItem[];
}

export const transactionKeys = {
  all: ['transactions'] as const,
  calendar: (userId?: string, year?: number, month?: number) => 
    ['transactions_calendar', userId, year, month] as const,
  summary: (userId?: string, year?: number, month?: number) => 
    ['transactions_summary', userId, year, month] as const,
  recent: (userId?: string, limit?: number) => 
    ['transactions_recent', userId, limit] as const,
};

/**
 * Hook para obter todas as transações de um determinado mês (usado pelo Calendário)
 */
export function useCalendarTransactions(userId?: string, year?: number, month?: number) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  const today = new Date();
  const currentYear = year !== undefined ? year : today.getFullYear();
  const currentMonth = month !== undefined ? month : today.getMonth(); // 0-11

  const pad = (n: number) => String(n).padStart(2, '0');
  const startDateStr = `${currentYear}-${pad(currentMonth + 1)}-01`;
  const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
  const endDateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(lastDay)}`;

  return useQuery({
    queryKey: transactionKeys.calendar(effectiveUserId, currentYear, currentMonth),
    enabled: Boolean(effectiveUserId),
    staleTime: 1000 * 60 * 2, // 2 minutos
    queryFn: async (): Promise<TransactionItem[]> => {
      if (!effectiveUserId) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', effectiveUserId)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date', { ascending: false });

      if (error) {
        console.error('Erro ao buscar transações do calendário:', error);
        return [];
      }

      return (data || []) as TransactionItem[];
    },
  });
}

/**
 * Hook para obter resumo mensal consolidado (Entradas, Saídas, Saldo)
 */
export function useMonthlySummary(userId?: string, year?: number, month?: number) {
  const { data: transactions = [], isLoading } = useCalendarTransactions(userId, year, month);

  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of transactions) {
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
    }
  }

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    transactionsCount: transactions.length,
    isLoading,
  };
}

/**
 * Hook para buscar as transações mais recentes (ex: 5 últimas para o feed rápido)
 */
export function useRecentTransactions(userId?: string, limit: number = 5) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  return useQuery({
    queryKey: transactionKeys.recent(effectiveUserId, limit),
    enabled: Boolean(effectiveUserId),
    staleTime: 1000 * 60 * 2,
    queryFn: async (): Promise<TransactionItem[]> => {
      if (!effectiveUserId) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erro ao buscar transações recentes:', error);
        return [];
      }

      return (data || []) as TransactionItem[];
    },
  });
}

/**
 * Hook para mutações rápidas (adicionar, excluir) com invalidação automática de cache
 */
export function useTransactionMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    queryClient.invalidateQueries({ queryKey: ['transactions_calendar'] });
    queryClient.invalidateQueries({ queryKey: ['transactions_summary'] });
    queryClient.invalidateQueries({ queryKey: ['transactions_recent'] });
  };

  const createTransaction = useMutation({
    mutationFn: async (payload: Omit<TransactionItem, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Lançamento adicionado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao criar lançamento:', err);
      toast.error('Erro ao salvar o lançamento.');
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Lançamento excluído com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao excluir lançamento:', err);
      toast.error('Erro ao excluir o lançamento.');
    },
  });

  return {
    createTransaction,
    deleteTransaction,
    invalidateAll,
  };
}
