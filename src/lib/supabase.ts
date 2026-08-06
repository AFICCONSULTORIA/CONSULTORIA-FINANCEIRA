import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jjizfczhilevxzunwqgj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TleVNZ3XheqNbE97NWMCOQ_WAh_ypJO';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não foram definidos no ambiente. Usando valores padrão do projeto.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

