import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** true quando o Supabase não está configurado — o app roda em modo demo. */
export const supabaseConfigured = Boolean(url && anonKey);

/**
 * Client do Supabase Auth no browser. Só cuida de sessão/login; os dados
 * financeiros vão pela API (/api/*) com o access_token no header.
 */
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
