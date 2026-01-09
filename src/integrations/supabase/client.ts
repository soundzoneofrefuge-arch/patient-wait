// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuração Dinâmica (Profissional)
// Agora o código busca as chaves nas Variáveis de Ambiente (Cloudflare ou .env)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Verificação de segurança: Avisa no console se esquecer de configurar
if (!SUPABASE_URL || !VITE_SUPABASE_PUBLISHABLE_KEY) {
  console.error("ERRO CRÍTICO: As chaves do Supabase não foram encontradas. Verifique o .env ou o painel da Cloudflare.");
}

export const supabase = createClient<Database>(SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
