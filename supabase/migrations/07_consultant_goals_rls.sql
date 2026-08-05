-- Permite que consultores e admins gerenciem (INSERT, UPDATE, DELETE) metas de clientes
CREATE POLICY "Consultores gerenciam metas" 
ON public.client_goals 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role IN ('consultant', 'admin')
  )
);
