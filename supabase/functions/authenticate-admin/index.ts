// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { email, password } = body ?? {};

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email e senha são obrigatórios" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('Verificando credenciais de admin...');

    // Buscar auth_user da tabela info_loja
    const { data: lojaInfo, error: lojaError } = await supabase
      .from("info_loja")
      .select("auth_user")
      .limit(1)
      .maybeSingle();

    if (lojaError) {
      console.error('Erro ao buscar info_loja:', lojaError);
      throw lojaError;
    }

    if (!lojaInfo || lojaInfo.auth_user !== email) {
      console.log('Email não autorizado:', email);
      return new Response(JSON.stringify({ 
        error: "Credenciais inválidas",
        authenticated: false 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verificar senha usando Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (authError || !authData.user) {
      console.error('Erro na autenticação:', authError);
      return new Response(JSON.stringify({ 
        error: "Credenciais inválidas",
        authenticated: false 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('Admin autenticado com sucesso:', email);

    return new Response(JSON.stringify({ 
      authenticated: true,
      user: authData.user
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("authenticate_admin error", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
