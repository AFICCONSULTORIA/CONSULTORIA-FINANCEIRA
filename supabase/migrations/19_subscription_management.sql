-- ==============================================================================
-- Migration 19: Subscription Management & Cancellation
-- Totalmente auto-contida e idempotente (cria public.users se não existir)
-- ==============================================================================

-- 1. Criar a tabela public.users se ainda não existir no projeto
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'client',
  phone TEXT,
  has_completed_onboarding BOOLEAN DEFAULT false,
  has_portfolio_access BOOLEAN DEFAULT false,
  subscription_status TEXT DEFAULT 'inactive',
  subscription_canceled_at TIMESTAMPTZ DEFAULT NULL,
  subscription_cancel_reason TEXT DEFAULT NULL,
  must_change_password BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Garantir que todas as colunas necessárias existam
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS has_portfolio_access BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_canceled_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_cancel_reason TEXT DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Sincronizar usuários de auth.users para public.users caso ainda não estejam lá
INSERT INTO public.users (id, email, full_name, role)
SELECT 
  a.id, 
  a.email, 
  COALESCE(a.raw_user_meta_data->>'full_name', a.raw_user_meta_data->>'name', split_part(a.email, '@', 1)) as full_name,
  COALESCE(a.raw_user_meta_data->>'role', 'client') as role
FROM auth.users a
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email 
WHERE public.users.email IS NULL OR public.users.email = '';

-- 4. Função auxiliar get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- 5. Sincronizar status de assinatura existente
UPDATE public.users
SET subscription_status = 'active'
WHERE has_portfolio_access = true AND (subscription_status IS NULL OR subscription_status = 'inactive');

UPDATE public.users
SET subscription_status = 'inactive'
WHERE (has_portfolio_access = false OR has_portfolio_access IS NULL) AND subscription_status IS NULL;

-- 6. Cancelamento solicitado especificamente para os clientes Vinicius e Erik
UPDATE public.users
SET 
  has_portfolio_access = false,
  subscription_status = 'cancelled',
  subscription_canceled_at = COALESCE(subscription_canceled_at, now()),
  subscription_cancel_reason = 'Cancelamento administrativo solicitado (Vinicius e Erik)'
WHERE 
  LOWER(COALESCE(full_name, '')) LIKE '%vinicius%' 
  OR LOWER(COALESCE(full_name, '')) LIKE '%erik%'
  OR LOWER(COALESCE(email, '')) LIKE '%vinicius%'
  OR LOWER(COALESCE(email, '')) LIKE '%erik%';

-- Cancelamento também nos metadados de auth.users (caso aplicável)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{has_portfolio_access}',
  'false'
)
WHERE 
  LOWER(COALESCE(email, '')) LIKE '%vinicius%' 
  OR LOWER(COALESCE(email, '')) LIKE '%erik%'
  OR LOWER(COALESCE(raw_user_meta_data->>'full_name', '')) LIKE '%vinicius%'
  OR LOWER(COALESCE(raw_user_meta_data->>'full_name', '')) LIKE '%erik%';

-- 7. Função RPC com SECURITY DEFINER para que o Administrador altere a assinatura de qualquer usuário
CREATE OR REPLACE FUNCTION public.admin_update_user_subscription(
  target_user_id UUID,
  access_status BOOLEAN,
  reason TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Verificar se quem está chamando é admin
  SELECT role INTO caller_role FROM public.users WHERE id = auth.uid();
  IF COALESCE(caller_role, '') != 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem alterar assinaturas de usuários.';
  END IF;

  IF access_status = true THEN
    UPDATE public.users
    SET 
      has_portfolio_access = true,
      subscription_status = 'active',
      subscription_cancel_reason = NULL,
      updated_at = now()
    WHERE id = target_user_id;
  ELSE
    UPDATE public.users
    SET 
      has_portfolio_access = false,
      subscription_status = 'cancelled',
      subscription_canceled_at = now(),
      subscription_cancel_reason = COALESCE(reason, 'Cancelado pelo administrador'),
      updated_at = now()
    WHERE id = target_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'has_portfolio_access', access_status,
    'message', CASE WHEN access_status THEN 'Assinatura ativada com sucesso.' ELSE 'Assinatura cancelada com sucesso.' END
  );
END;
$$;

-- 8. Função RPC com SECURITY DEFINER para que o próprio cliente cancele sua assinatura
CREATE OR REPLACE FUNCTION public.client_cancel_own_subscription(
  reason TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  UPDATE public.users
  SET 
    has_portfolio_access = false,
    subscription_status = 'cancelled',
    subscription_canceled_at = now(),
    subscription_cancel_reason = reason,
    updated_at = now()
  WHERE id = auth.uid();

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Assinatura cancelada com sucesso. Acesso às carteiras atualizado.'
  );
END;
$$;

-- 9. Atualizar a RPC admin_get_all_users() para retornar os dados de assinatura completos
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  role TEXT,
  phone TEXT,
  must_change_password BOOLEAN,
  has_portfolio_access BOOLEAN,
  subscription_status TEXT,
  subscription_canceled_at TIMESTAMPTZ,
  subscription_cancel_reason TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Validação de segurança: apenas admin
  IF COALESCE((SELECT public.get_user_role()), '') != 'admin' THEN
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
    COALESCE(u.has_portfolio_access, false) as has_portfolio_access,
    COALESCE(u.subscription_status, CASE WHEN u.has_portfolio_access = true THEN 'active' ELSE 'inactive' END) as subscription_status,
    u.subscription_canceled_at,
    u.subscription_cancel_reason,
    u.created_at
  FROM public.users u
  LEFT JOIN auth.users a ON u.id = a.id
  ORDER BY u.created_at DESC;
END;
$$;

-- 10. Conceder permissão de execução aos usuários autenticados
GRANT EXECUTE ON FUNCTION public.admin_update_user_subscription(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_cancel_own_subscription(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- 11. Políticas RLS básicas na tabela public.users caso ainda não existam
DROP POLICY IF EXISTS "Usuarios podem ver o proprio perfil" ON public.users;
CREATE POLICY "Usuarios podem ver o proprio perfil" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Clientes podem atualizar proprio perfil" ON public.users;
CREATE POLICY "Clientes podem atualizar proprio perfil" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Consultores e Admins podem ver usuarios" ON public.users;
CREATE POLICY "Consultores e Admins podem ver usuarios" ON public.users
  FOR SELECT USING (
    COALESCE(public.get_user_role(), '') IN ('consultant', 'admin')
  );

DROP POLICY IF EXISTS "Administradores podem gerenciar todos usuarios" ON public.users;
CREATE POLICY "Administradores podem gerenciar todos usuarios" ON public.users
  FOR ALL USING (
    COALESCE(public.get_user_role(), '') = 'admin'
  );
