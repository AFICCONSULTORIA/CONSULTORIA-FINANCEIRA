-- Permite que consultores e admins façam update/delete/insert nas transações dos clientes (ex: para redefinir categorias)
CREATE POLICY "Consultores podem gerenciar transacoes" 
ON public.transactions 
FOR ALL 
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('consultant', 'admin')
);
