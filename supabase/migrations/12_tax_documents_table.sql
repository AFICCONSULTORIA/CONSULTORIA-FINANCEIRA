-- Tabela para armazenar comprovantes e deduções de Imposto de Renda (IRPF) dos clientes
CREATE TABLE IF NOT EXISTS public.tax_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('saude', 'educacao', 'pgbl', 'dependente', 'outros')),
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  provider_name VARCHAR(255),
  document_date DATE DEFAULT CURRENT_DATE,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.tax_documents ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (RLS)
CREATE POLICY "Clientes podem ver seus próprios documentos"
  ON public.tax_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clientes podem inserir seus próprios documentos"
  ON public.tax_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clientes podem atualizar seus próprios documentos"
  ON public.tax_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Clientes podem deletar seus próprios documentos"
  ON public.tax_documents FOR DELETE
  USING (auth.uid() = user_id);
