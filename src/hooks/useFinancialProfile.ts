import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  type BucketItem,
  BucketsConfigSchema,
  safeNormalizeBuckets,
} from '../schemas/financialSchemas';

export type { BucketItem };

export interface FinancialProfile {
  id?: string;
  user_id: string;
  monthly_income: number;
  fixed_costs: number;
  total_debt: number;
  total_equity: number;
  health_score: number | null;
  status: 'critical' | 'attention' | 'good' | 'excellent' | null;
  buckets: BucketItem[] | null;
  risk_profile: 'conservador' | 'moderado' | 'arrojado' | null;
  raw_onboarding_data?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_BUCKETS: BucketItem[] = [
  { id: 'fixed', type: 'fixed', label: 'Custo Fixo', percentage: 50, color: '#64748B', description: 'Gastos indispensáveis e manutenção de vida básica.' },
  { id: 'comfort', type: 'comfort', label: 'Conforto', percentage: 10, color: '#06B6D4', description: 'Pequenos luxos, assinaturas e conveniências diárias.' },
  { id: 'goals', type: 'goals', label: 'Metas', percentage: 20, color: '#8B5CF6', description: 'Projetos de curto e médio prazo, viagens e compras programadas.' },
  { id: 'leisure', type: 'leisure', label: 'Lazer', percentage: 10, color: '#EC4899', description: 'Experiências gastronômicas, passeios e entretenimento livre.' },
  { id: 'invest', type: 'invest', label: 'Investimento', percentage: 10, color: '#10B981', description: 'Aportes de longo prazo, previdência e liberdade financeira.' },
];

/**
 * Query Keys centralizadas para garantir invalidação preditiva e consistente do cache.
 */
export const financialKeys = {
  all: ['financial_profile'] as const,
  detail: (userId: string | undefined) => [...financialKeys.all, userId] as const,
};

/**
 * Hook customizado para obter o perfil financeiro e os 5 baldes com cache do React Query
 * e validação estrita de integridade de dados via Zod.
 */
export function useFinancialProfile(targetUserId?: string) {
  const { user } = useAuth();
  const effectiveUserId = targetUserId || user?.id;

  const query = useQuery({
    queryKey: financialKeys.detail(effectiveUserId),
    enabled: Boolean(effectiveUserId),
    queryFn: async (): Promise<FinancialProfile | null> => {
      if (!effectiveUserId) return null;

      const { data, error } = await supabase
        .from('financial_profiles')
        .select('*')
        .eq('user_id', effectiveUserId)
        .maybeSingle();

      if (error) {
        throw new Error(`Falha ao carregar perfil financeiro: ${error.message}`);
      }

      return data as FinancialProfile | null;
    },
  });

  const profile = query.data;

  // Normalização segura e validada via Zod: previne quebras com dados legados ou corrompidos
  const normalizedBuckets: BucketItem[] = safeNormalizeBuckets(profile?.buckets, DEFAULT_BUCKETS);

  // Métricas financeiras computadas automaticamente
  const monthlyIncome = profile?.monthly_income ?? 0;
  const fixedCosts = profile?.fixed_costs ?? 0;
  const totalDebt = profile?.total_debt ?? 0;
  const totalEquity = profile?.total_equity ?? 0;

  const savingRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - fixedCosts) / monthlyIncome) * 100) : 0;
  const emergencyFundMonths = fixedCosts > 0 ? Number((totalEquity / fixedCosts).toFixed(1)) : 0;
  const debtRatio = monthlyIncome > 0 ? Number(((totalDebt / monthlyIncome) * 100).toFixed(1)) : 0;

  return {
    ...query,
    profile,
    buckets: normalizedBuckets,
    hasCustomBuckets: Boolean(profile?.buckets && Array.isArray(profile.buckets) && profile.buckets.length > 0),
    metrics: {
      monthlyIncome,
      fixedCosts,
      totalDebt,
      totalEquity,
      savingRate,
      emergencyFundMonths,
      debtRatio,
      healthScore: profile?.health_score ?? 75,
      status: profile?.status ?? 'good',
    },
  };
}

/**
 * Mutation para atualizar qualquer campo do perfil financeiro com invalidação automática de cache.
 */
export function useUpdateFinancialProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: Partial<Omit<FinancialProfile, 'user_id' | 'id'>>;
    }) => {
      const { data, error } = await supabase
        .from('financial_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar perfil financeiro: ${error.message}`);
      }

      return data as FinancialProfile;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: financialKeys.detail(variables.userId) });
      queryClient.invalidateQueries({ queryKey: financialKeys.all });
    },
  });
}

/**
 * Mutation específica para salvar a configuração dos 5 baldes com validação de soma 100% via Zod.
 */
export function useUpdateBuckets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      buckets,
    }: {
      userId: string;
      buckets: BucketItem[];
    }) => {
      // Validação em tempo de execução via Zod antes de persistir no banco de dados
      const validatedBuckets = BucketsConfigSchema.parse(buckets);

      const { data, error } = await supabase
        .from('financial_profiles')
        .update({ buckets: validatedBuckets })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao salvar baldes: ${error.message}`);
      }

      return data as FinancialProfile;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: financialKeys.detail(variables.userId) });
      queryClient.invalidateQueries({ queryKey: financialKeys.all });
    },
  });
}
