-- Adicionando colunas de detalhamento e categorização no action_plans
ALTER TABLE public.action_plans 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'organization', -- 'urgent', 'organization', 'growth'
ADD COLUMN IF NOT EXISTS due_date DATE;
