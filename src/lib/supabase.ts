import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://eefnfdwmidtnycesyapr.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_lCyfBoX5m8JzQ7mldxloQA_6YN3MTqg';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const checkSupabaseConnection = async () => {
  if (!supabaseUrl) {
    console.warn('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env');
    return false;
  }
  return true;
};
