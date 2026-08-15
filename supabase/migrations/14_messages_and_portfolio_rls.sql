-- Criar tabela de mensagens do consultor para o cliente
CREATE TABLE IF NOT EXISTS public.client_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  consultant_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ativar RLS para a tabela de mensagens
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para client_messages
CREATE POLICY "Clientes veem suas mensagens" ON public.client_messages
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Clientes podem marcar mensagens como lidas" ON public.client_messages
  FOR UPDATE USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Consultores podem gerenciar mensagens" ON public.client_messages
  FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('consultant', 'admin')
  );

-- Novas políticas para client_assets (Carteira Personalizada)
-- Remover ou adicionar políticas complementares para permitir que o consultor altere a carteira

CREATE POLICY "Consultores podem inserir ativos" ON public.client_assets
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('consultant', 'admin')
  );

CREATE POLICY "Consultores podem atualizar ativos" ON public.client_assets
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('consultant', 'admin')
  );

CREATE POLICY "Consultores podem deletar ativos" ON public.client_assets
  FOR DELETE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('consultant', 'admin')
  );
