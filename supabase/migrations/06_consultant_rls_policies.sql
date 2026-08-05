-- Permite que consultores e admins atualizem a tabela financial_profiles (Health Score, Buckets, etc)
CREATE POLICY "Consultores e Admins podem atualizar perfis financeiros" 
ON public.financial_profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role IN ('consultant', 'admin')
  )
);

-- Caso precisem de permissão para ler todos os perfis também:
CREATE POLICY "Consultores e Admins podem ler todos os perfis financeiros" 
ON public.financial_profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role IN ('consultant', 'admin')
  )
);
