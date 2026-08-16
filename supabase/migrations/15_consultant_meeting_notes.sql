-- Criar tabela de notas de reunião e CRM do consultor
CREATE TABLE IF NOT EXISTS public.consultant_meeting_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  consultant_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  meeting_date DATE DEFAULT CURRENT_DATE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  decisions TEXT,
  next_steps TEXT,
  private_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ativar RLS
ALTER TABLE public.consultant_meeting_notes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Consultores e administradores podem gerenciar todas as notas de reunião
CREATE POLICY "Consultores podem gerenciar notas de reuniao" ON public.consultant_meeting_notes
  FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('consultant', 'admin')
  );

-- Clientes podem visualizar apenas o resumo e decisões das reuniões (sem notas privadas confidenciais do consultor)
CREATE POLICY "Clientes podem visualizar atas de reuniao" ON public.consultant_meeting_notes
  FOR SELECT USING (
    auth.uid() = client_id
  );
