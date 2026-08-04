-- Criação da tabela para o Plano de Ação Estratégico
CREATE TABLE IF NOT EXISTS public.action_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ativar RLS
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;

-- Políticas para action_plans
-- Clientes podem ver seu próprio plano de ação
CREATE POLICY "Clientes podem ver próprio plano" ON public.action_plans
  FOR SELECT USING (auth.uid() = user_id);

-- Consultores e admins podem ver, criar, atualizar e excluir planos de qualquer cliente
CREATE POLICY "Consultores podem gerenciar planos" ON public.action_plans
  FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('consultant', 'admin')
  );

-- Atualização na tabela financial_profiles para acomodar os baldes personalizados pelo consultor
-- Utilizaremos uma coluna JSONB para armazenar a configuração dos 5 baldes
ALTER TABLE public.financial_profiles ADD COLUMN IF NOT EXISTS buckets JSONB DEFAULT '[
  {"type": "fixed", "label": "Custo Fixo", "percentage": 50},
  {"type": "comfort", "label": "Conforto", "percentage": 10},
  {"type": "goals", "label": "Metas", "percentage": 20},
  {"type": "leisure", "label": "Lazer", "percentage": 10},
  {"type": "invest", "label": "Investimento", "percentage": 10}
]'::jsonb;
