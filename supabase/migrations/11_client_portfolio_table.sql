-- Tabela de Ativos da Carteira do Cliente
CREATE TABLE IF NOT EXISTS public.client_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Ações', -- 'Ações' | 'FIIs' | 'Renda Fixa' | 'Internacional' | 'Cripto' | 'Outros'
  quantity NUMERIC(15, 4) NOT NULL DEFAULT 0,
  average_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  current_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  institution TEXT, -- Ex: XP, BTG, NuInvest, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ativar Row Level Security
ALTER TABLE public.client_assets ENABLE ROW LEVEL SECURITY;

-- Política RLS: Clientes gerenciam seus próprios ativos
CREATE POLICY "Clientes gerenciam proprios ativos" ON public.client_assets
  FOR ALL USING (auth.uid() = user_id);

-- Política RLS: Consultores e Admins podem visualizar ativos dos clientes
CREATE POLICY "Consultores visualizam ativos de clientes" ON public.client_assets
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('consultant', 'admin')
  );
