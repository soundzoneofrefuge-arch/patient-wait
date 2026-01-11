import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// --- CONFIGURAÇÃO GENÉRICA (CLOUD & LOCAL) ---
// Busca as chaves nas variáveis de ambiente.
// Em PRODUÇÃO: Pega do Painel da Cloudflare.
// Em DESENVOLVIMENTO: Pega do arquivo .env (se existir) ou Secrets do Lovable.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
// O Project ID muitas vezes é útil para logs ou integrações futuras
const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

// Alerta de Segurança no Console (Ajuda a debugar telas brancas)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("ERRO CRÍTICO: Variáveis do Supabase não encontradas.");
  console.error("Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão configuradas no .env ou no painel da Cloudflare.");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
