-- Add raw_onboarding_data column to financial_profiles to store the raw form answers
ALTER TABLE public.financial_profiles ADD COLUMN IF NOT EXISTS raw_onboarding_data JSONB;
