// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ISSO É FIXO (compatível com o ambiente do Lovable)
// A anon key pode ficar no frontend (não é segredo). Evitamos depender de VITE_*.
const SUPABASE_URL = "https://fcmakvaoosrjksvxzpom.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbWFrdmFvb3Nyamtzdnh6cG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNjgwNDQsImV4cCI6MjA4Mjg0NDA0NH0.EiUSpUSQWwKg3A-PyFpk8kZajhDxXpkAjm2k8PhzpR4";


export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
