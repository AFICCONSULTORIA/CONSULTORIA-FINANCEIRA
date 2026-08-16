-- 1. Adicionar coluna de telefone à tabela users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Permitir que clientes atualizem seus próprios dados (necessário para atualizar o telefone após o signUp)
DROP POLICY IF EXISTS "Clientes podem atualizar proprio perfil" ON public.users;
CREATE POLICY "Clientes podem atualizar proprio perfil" ON public.users
  FOR UPDATE USING (auth.uid() = id);
