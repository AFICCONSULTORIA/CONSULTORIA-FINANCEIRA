-- Tabela de Lançamentos Financeiros Diários (Transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Geral',
  payment_method TEXT DEFAULT 'Pix',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ativar RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Política RLS: Clientes possuem acesso total apenas às suas próprias transações
CREATE POLICY "Clientes gerenciam proprias transacoes" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- Política RLS: Consultores e Admins podem visualizar transações de qualquer cliente
CREATE POLICY "Consultores visualizam transacoes de clientes" ON public.transactions
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('consultant', 'admin')
  );
