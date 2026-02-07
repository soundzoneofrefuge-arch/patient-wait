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
    const { name, contact, date, time, senha } = body ?? {};

    if (!name || !contact || !date || !time || !senha) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: nome, contato, data, horário e senha" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('Procurando agendamento para cancelar:', { date, time });

    // Buscar o agendamento existente
    const { data: existingBooking, error: findError } = await supabase
      .from("agendamentos_robustos")
      .select("*")
      .eq("NOME", name)
      .eq("CONTATO", contact)
      .eq("DATA", date)
      .eq("HORA", time)
      .eq("senha", senha)
      .neq("STATUS", "CANCELADO")
      .maybeSingle();

    if (findError) {
      console.error('Erro ao buscar agendamento:', findError);
      throw findError;
    }

    if (!existingBooking) {
      // Buscar telefone da loja para informar
      const { data: lojaInfo, error: lojaError } = await supabase
        .from("info_loja")
        .select("phone")
        .limit(1)
        .maybeSingle();

      const phoneMessage = lojaInfo?.phone 
        ? ` Entre em contato pelo telefone ${lojaInfo.phone} para mais informações.`
        : " Entre em contato com a loja para mais informações.";

      return new Response(JSON.stringify({ 
        error: "Agendamento não encontrado com os dados informados." + phoneMessage 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('Agendamento encontrado para cancelar:', existingBooking?.id);

    // Marcar como cancelado ao invés de deletar
    const { error: updateError } = await supabase
      .from("agendamentos_robustos")
      .update({ STATUS: 'CANCELADO' })
      .eq("id", existingBooking.id);

    if (updateError) {
      console.error('Erro ao cancelar agendamento:', updateError);
      throw updateError;
    }

    console.log('Agendamento cancelado com sucesso:', existingBooking.id);

    return new Response(JSON.stringify({ 
      message: "Agendamento cancelado com sucesso",
      booking: existingBooking 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("cancel_booking error", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});