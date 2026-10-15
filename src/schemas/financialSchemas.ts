import { z } from 'zod';

// ============================================================
// 1. SCHEMA DOS BALDES FINANCEIROS (METODOLOGIA DOS 5 BALDES)
// Valida a integridade do JSONB em public.financial_profiles.buckets
// ============================================================

export const BucketTypeEnum = z.enum([
  'fixed',
  'comfort',
  'goals',
  'leisure',
  'invest',
  'emergency',
  'dreams',
] as const);

export const BucketItemSchema = z.object({
  id: z.string().optional(),
  type: z.string().min(1, 'O tipo do balde é obrigatório'),
  label: z.string().min(1, 'O rótulo do balde não pode ser vazio').max(50, 'Máximo de 50 caracteres'),
  percentage: z
    .number({ message: 'O percentual deve ser um número' })
    .min(0, 'O percentual não pode ser negativo')
    .max(100, 'O percentual não pode exceder 100%'),
  color: z.string().optional(),
  description: z.string().optional(),
});

export const BucketsConfigSchema = z
  .array(BucketItemSchema)
  .min(1, 'Deve haver ao menos um balde configurado')
  .refine(
    (buckets) => {
      const sum = buckets.reduce((acc, b) => acc + (Number(b.percentage) || 0), 0);
      // Tolerância de 0.5% para eventuais arredondamentos de ponto flutuante
      return Math.abs(sum - 100) <= 0.5;
    },
    {
      message: 'A soma dos percentuais de todos os baldes deve totalizar exatamente 100%',
    }
  );

export type BucketItem = z.infer<typeof BucketItemSchema>;
export type BucketsConfig = z.infer<typeof BucketsConfigSchema>;

// ============================================================
// 2. SCHEMA DE TRANSAÇÕES BANCÁRIAS (OFX / EXTRATO)
// Garante tipagem em tempo de execução ao processar arquivos OFX
// ============================================================

export const OfxTransactionSchema = z.object({
  id: z.string().min(1, 'Identificador da transação é obrigatório'),
  type: z.enum(['income', 'expense'] as const),
  description: z
    .string()
    .min(1, 'Descrição não pode ser vazia')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  amount: z
    .number({ message: 'Valor deve ser numérico' })
    .positive('O valor da transação deve ser estritamente positivo'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato ISO AAAA-MM-DD'),
  fitid: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória').default('Outros'),
  paymentMethod: z.string().optional(),
  selected: z.boolean().default(true),
});

export const OfxBatchImportSchema = z.array(OfxTransactionSchema);

export type ValidatedOfxTransaction = z.infer<typeof OfxTransactionSchema>;

// ============================================================
// 3. SCHEMA DO PERFIL FINANCEIRO
// Valida dados de renda, custos fixos, patrimônio e saúde financeira
// ============================================================

export const FinancialProfileSchema = z.object({
  user_id: z.string().uuid('ID do usuário deve ser um UUID válido'),
  monthly_income: z.number().min(0, 'Renda mensal não pode ser negativa'),
  fixed_costs: z.number().min(0, 'Custos fixos não podem ser negativos'),
  total_debt: z.number().min(0, 'Dívida total não pode ser negativa'),
  total_equity: z.number().min(0, 'Patrimônio total não pode ser negativo'),
  health_score: z.number().min(0).max(100).nullable().optional(),
  status: z.enum(['critical', 'attention', 'good', 'excellent'] as const).nullable().optional(),
  risk_profile: z.enum(['conservador', 'moderado', 'arrojado'] as const).nullable().optional(),
  buckets: z.array(BucketItemSchema).nullable().optional(),
});

export type ValidatedFinancialProfile = z.infer<typeof FinancialProfileSchema>;

// ============================================================
// 4. FUNÇÕES UTILITÁRIAS DE HIGIENIZAÇÃO E SEGURANÇA
// ============================================================

/**
 * Normaliza e valida com segurança um array de baldes vindo do banco de dados (JSONB).
 * Se o dado estiver ausente, corrompido ou mal formatado, retorna o fallback sem quebrar a UI.
 */
export function safeNormalizeBuckets(raw: unknown, defaultFallback: BucketItem[]): BucketItem[] {
  if (!raw || !Array.isArray(raw)) return defaultFallback;

  const parsed = z.array(BucketItemSchema).safeParse(raw);
  if (parsed.success && parsed.data.length > 0) {
    return parsed.data;
  }

  console.warn('Baldes com estrutura inválida detectados pelo Zod, usando fallback padrão:', parsed);
  return defaultFallback;
}

/**
 * Valida se a soma dos percentuais de baldes fecha em 100%.
 */
export function validateBucketsSum(buckets: BucketItem[]): { isValid: boolean; sum: number; diff: number } {
  const sum = buckets.reduce((acc, b) => acc + (Number(b.percentage) || 0), 0);
  const diff = 100 - sum;
  return {
    isValid: Math.abs(diff) <= 0.01,
    sum: Number(sum.toFixed(2)),
    diff: Number(diff.toFixed(2)),
  };
}
