-- Migration: 22_open_finance_investments_and_debts.sql
-- Expansão do Open Finance: Investimentos da Carteira e Mapeamento de Dívidas/Financiamentos

-- 1. Tabela de Dívidas, Empréstimos e Financiamentos
CREATE TABLE IF NOT EXISTS public.client_debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.bank_connections(id) ON DELETE SET NULL,
  external_id TEXT, -- ID do contrato/empréstimo na Pluggy ou Open Finance
  name TEXT NOT NULL, -- Ex: Financiamento Imobiliário Caixa, Empréstimo Pessoal Nubank
  type TEXT NOT NULL DEFAULT 'outros' CHECK (type IN ('imovel', 'veiculo', 'pessoal', 'cartao', 'consignado', 'cheque_especial', 'outros')),
  total_amount NUMERIC(15, 2) DEFAULT 0, -- Valor total contratado
  outstanding_balance NUMERIC(15, 2) NOT NULL DEFAULT 0, -- Saldo devedor atual
  installment_amount NUMERIC(15, 2) DEFAULT 0, -- Valor da parcela mensal
  installments_total INTEGER DEFAULT 0, -- Total de parcelas
  installments_paid INTEGER DEFAULT 0, -- Parcelas pagas
  installments_remaining INTEGER DEFAULT 0, -- Parcelas restantes
  interest_rate NUMERIC(8, 4) DEFAULT 0, -- Taxa de juros (CET a.a.)
  institution TEXT, -- Ex: Caixa, Bradesco, Itaú, Santander, Nubank
  contract_number TEXT,
  due_date TEXT, -- Vencimento da fatura/parcela
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Deduplicação idempotente para dívidas sincronizadas
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_debts_user_external_id 
  ON public.client_debts(user_id, external_id) 
  WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_client_debts_user_id ON public.client_debts(user_id);
CREATE INDEX IF NOT EXISTS idx_client_debts_connection_id ON public.client_debts(connection_id);

-- Ativar RLS
ALTER TABLE public.client_debts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS Idempotentes
DROP POLICY IF EXISTS "Clientes gerenciam proprias dividas" ON public.client_debts;
CREATE POLICY "Clientes gerenciam proprias dividas"
  ON public.client_debts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Consultores e admins visualizam dividas de clientes" ON public.client_debts;
CREATE POLICY "Consultores e admins visualizam dividas de clientes"
  ON public.client_debts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('consultant', 'admin')
    )
  );

-- 2. Atualizar tabela client_assets para rastrear sincronizações Open Finance
ALTER TABLE public.client_assets 
  ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES public.bank_connections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Índice para deduplicação idempotente de ativos da carteira
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_assets_user_external_id
  ON public.client_assets(user_id, external_id)
  WHERE external_id IS NOT NULL;
