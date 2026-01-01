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
    const { id, statusFinal } = body ?? {};

    if (!id || !statusFinal) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: id e statusFinal" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const allowed = ["EFETIVADO", "NÃO EFETIVADO"];
    if (!allowed.includes(statusFinal)) {
      return new Response(JSON.stringify({ error: "statusFinal inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Se for N.E, também marca o STATUS como CANCELADO
    const updateData: any = {
      "finalização": statusFinal,
    };
    
    if (statusFinal === "NÃO EFETIVADO") {
      updateData.STATUS = "CANCELADO";
    }

    const { data: updated, error: updateError } = await supabase
      .from("agendamentos_robustos")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (updateError) {
      console.error("Erro ao atualizar finalização:", updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({ booking: updated }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("update_finalizacao error", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});