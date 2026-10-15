-- ============================================================
-- MIGRATION 20: Tabela de Cache Centralizado de Cotações da B3
-- Evita rate limits na Brapi e protege contra indisponibilidade
-- ============================================================

CREATE TABLE IF NOT EXISTS public.stock_quotes_cache (
  ticker TEXT PRIMARY KEY,
  price NUMERIC NOT NULL DEFAULT 0,
  change_percent NUMERIC DEFAULT 0,
  short_name TEXT,
  raw_data JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.stock_quotes_cache ENABLE ROW LEVEL SECURITY;

-- 1. Qualquer usuário autenticado (cliente, consultor, admin) pode ler cotações em cache
CREATE POLICY "Permitir leitura de cotacoes para usuarios autenticados" 
  ON public.stock_quotes_cache
  FOR SELECT 
  TO authenticated 
  USING (true);

-- 2. Service role / Edge Functions têm controle total para atualizar e inserir cotações
CREATE POLICY "Permitir upsert de cotacoes para service_role" 
  ON public.stock_quotes_cache
  FOR ALL 
  TO service_role 
  USING (true)
  WITH CHECK (true);

-- Índice para acelerar consultas por data de atualização (busca de cotações expiradas)
CREATE INDEX IF NOT EXISTS idx_stock_quotes_cache_updated_at 
  ON public.stock_quotes_cache (updated_at);
