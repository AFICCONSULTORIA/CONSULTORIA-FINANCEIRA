-- ==============================================================================
-- Migration 18: Admin Password Reset & Mandatory Force Password Change
-- Permite que o Administrador redefina senhas para um valor padrão (ex: Afic@123)
-- e exige que o usuário redefina sua senha pessoal no próximo login.
-- ==============================================================================

-- 1. Adicionar colunas se não existirem na tabela public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- 2. Sincronizar emails existentes de auth.users para public.users caso estejam nulos
DO $$
BEGIN
  UPDATE public.users u
  SET email = a.email
  FROM auth.users a
  WHERE u.id = a.id AND (u.email IS NULL OR u.email = '');
EXCEPTION WHEN OTHERS THEN
  -- Fallback silencioso caso haja restrição de contexto
  NULL;
END $$;

-- 3. Assegurar extensão pgcrypto para hash bcrypt de senhas
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 4. Função RPC com SECURITY DEFINER para que o Administrador redefina a senha
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
  target_user_id UUID, 
  new_password TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  caller_role TEXT;
  target_exists BOOLEAN;
BEGIN
  -- 4.1 Verificar se quem está chamando é Administrador
  SELECT role INTO caller_role FROM public.users WHERE id = auth.uid();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem redefinir senhas de usuários.';
  END IF;

  -- 4.2 Validar se o usuário alvo existe no auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = target_user_id) INTO target_exists;
  IF NOT target_exists THEN
    RAISE EXCEPTION 'Usuário não encontrado na autenticação do sistema.';
  END IF;

  -- 4.3 Criptografar a nova senha usando bcrypt no formato do Supabase GoTrue
  UPDATE auth.users
  SET 
    encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
    updated_at = now()
  WHERE id = target_user_id;

  -- 4.4 Marcar flag must_change_password = true no perfil do usuário
  UPDATE public.users
  SET 
    must_change_password = true,
    updated_at = now()
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Senha redefinida com sucesso. O usuário precisará criar uma nova senha no próximo login.'
  );
END;
$$;

-- 5. Função RPC com SECURITY DEFINER para listar todos os usuários com dados completos para o Admin
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  role TEXT,
  phone TEXT,
  must_change_password BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Validação de segurança
  IF (SELECT public.get_user_role()) != 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem acessar a listagem global.';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    COALESCE(u.email, a.email) as email,
    u.role,
    u.phone,
    COALESCE(u.must_change_password, false) as must_change_password,
    u.created_at
  FROM public.users u
  LEFT JOIN auth.users a ON u.id = a.id
  ORDER BY u.created_at DESC;
END;
$$;

-- 6. Função RPC para o próprio usuário concluir a troca de senha
CREATE OR REPLACE FUNCTION public.complete_password_reset()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  UPDATE public.users
  SET 
    must_change_password = false,
    updated_at = now()
  WHERE id = auth.uid();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 7. Conceder permissão de execução aos usuários autenticados
GRANT EXECUTE ON FUNCTION public.admin_reset_user_password(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_password_reset() TO authenticated;

-- 8. Políticas de RLS atualizadas
DROP POLICY IF EXISTS "Clientes podem atualizar proprio perfil" ON public.users;
CREATE POLICY "Clientes podem atualizar proprio perfil" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Administradores podem gerenciar todos usuarios" ON public.users;
CREATE POLICY "Administradores podem gerenciar todos usuarios" ON public.users
  FOR ALL USING (
    public.get_user_role() = 'admin'
  );
