-- 1. Função SECURITY DEFINER para obter o papel do usuário sem causar recursão infinita no RLS
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- 2. Garantir que o RLS está ativado na tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas se existirem para evitar conflitos (opcional, mas recomendado)
DROP POLICY IF EXISTS "Usuarios podem ver o proprio perfil" ON public.users;
DROP POLICY IF EXISTS "Consultores podem ver todos os usuarios" ON public.users;
DROP POLICY IF EXISTS "Consultores e Admins podem ver usuarios" ON public.users;

-- 4. Clientes podem ler seu próprio registro
CREATE POLICY "Usuarios podem ver o proprio perfil" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 5. Consultores e administradores podem ler todos os usuários
CREATE POLICY "Consultores podem ver todos os usuarios" ON public.users
  FOR SELECT USING (
    public.get_user_role() IN ('consultant', 'admin')
  );

-- 6. Garantir que consultores possam ler as tabelas relacionadas
DROP POLICY IF EXISTS "Consultores podem ver ativos" ON public.client_assets;
CREATE POLICY "Consultores podem ver ativos" ON public.client_assets
  FOR SELECT USING (
    public.get_user_role() IN ('consultant', 'admin')
  );
