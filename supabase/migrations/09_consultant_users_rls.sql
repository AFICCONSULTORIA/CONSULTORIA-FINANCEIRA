-- Permite que consultores e admins atualizem a tabela users (ex: para redefinir o has_completed_onboarding)
CREATE POLICY "Consultores e Admins podem atualizar usuarios" 
ON public.users 
FOR UPDATE 
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('consultant', 'admin')
);
