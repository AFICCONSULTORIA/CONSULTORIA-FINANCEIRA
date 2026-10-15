-- Migration: 21_open_finance_integration.sql
-- Tabela para gerenciar conexões seguras de Open Finance (Pluggy / Belvo)

CREATE TABLE IF NOT EXISTS public.bank_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'pluggy',
  item_id TEXT NOT NULL, -- ID do Item/Conexão no agregador de Open Finance
  institution_id TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  institution_color TEXT DEFAULT '#EAB308',
  institution_logo TEXT,
  account_type TEXT DEFAULT 'checking', -- checking, credit_card, savings
  account_number TEXT,
  balance NUMERIC(15, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'UPDATED' CHECK (status IN ('UPDATING', 'UPDATED', 'WAITING_USER_INPUT', 'LOGIN_ERROR', 'OUTDATED', 'DISCONNECTED')),
  consent_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '365 days'),
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Adicionar colunas de rastreio de Open Finance na tabela transactions se ainda não existirem
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES public.bank_connections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Índice para deduplicação automática idempotente
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_user_external_id 
  ON public.transactions(user_id, external_id) 
  WHERE external_id IS NOT NULL;

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_bank_connections_user_id ON public.bank_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_connections_item_id ON public.bank_connections(item_id);

-- Ativar RLS
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS (Idempotentes)
DROP POLICY IF EXISTS "Clientes gerenciam suas proprias conexoes bancarias" ON public.bank_connections;
CREATE POLICY "Clientes gerenciam suas proprias conexoes bancarias"
  ON public.bank_connections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Consultores e admins visualizam conexoes bancarias de clientes" ON public.bank_connections;
CREATE POLICY "Consultores e admins visualizam conexoes bancarias de clientes"
  ON public.bank_connections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('consultant', 'admin')
    )
  );
