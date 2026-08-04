-- Tabela de Metas e Sonhos dos Clientes
CREATE TABLE IF NOT EXISTS public.client_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ativar RLS
ALTER TABLE public.client_goals ENABLE ROW LEVEL SECURITY;

-- Política RLS: Clientes gerenciam apenas suas próprias metas
CREATE POLICY "Clientes gerenciam proprias metas" ON public.client_goals
  FOR ALL USING (auth.uid() = user_id);

-- Política RLS: Consultores e Admins podem visualizar metas de clientes
CREATE POLICY "Consultores visualizam metas" ON public.client_goals
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('consultant', 'admin')
  );
