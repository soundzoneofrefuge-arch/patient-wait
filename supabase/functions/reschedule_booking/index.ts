// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generatePassword } from '../_shared/utils.ts';

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
    const { oldName, oldContact, oldDate, oldTime, newDate, newTime, professional, service, senha } = body ?? {};

    if (!oldName || !oldContact || !oldDate || !oldTime || !newDate || !newTime || !senha) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: nome, contato, data antiga, horário antigo, nova data, novo horário e senha" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('Procurando agendamento:', { oldName, oldContact, oldDate, oldTime, senha });

    // Buscar o agendamento existente
    const { data: existingBooking, error: findError } = await supabase
      .from("agendamentos_robustos")
      .select("*")
      .eq("NOME", oldName)
      .eq("CONTATO", oldContact)
      .eq("DATA", oldDate)
      .eq("HORA", oldTime)
      .eq("senha", senha)
      .neq("STATUS", "CANCELADO")
      .maybeSingle();

    if (findError) {
      console.error('Erro ao buscar agendamento:', findError);
      throw findError;
    }

    if (!existingBooking) {
      return new Response(JSON.stringify({ error: "Agendamento não encontrado com os dados informados" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('Agendamento encontrado:', existingBooking);

    // Verificar se não é feriado
    const { data: feriado, error: feriadoErr } = await supabase
      .from("feriados")
      .select("data")
      .eq("data", newDate)
      .maybeSingle();
    if (feriadoErr) throw feriadoErr;
    if (feriado) {
      return new Response(JSON.stringify({ error: "Não é possível reagendar para feriados." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verificar se o novo horário está disponível
    let conflictQuery = supabase
      .from("agendamentos_robustos")
      .select("id")
      .eq("DATA", newDate)
      .eq("HORA", newTime)
      .neq("STATUS", "CANCELADO")
      .neq("id", existingBooking.id); // Excluir o próprio agendamento

    if (professional || existingBooking.PROFISSIONAL) {
      conflictQuery = conflictQuery.eq("PROFISSIONAL", professional || existingBooking.PROFISSIONAL);
    }

    const { data: conflicts, error: conflictError } = await conflictQuery;
    if (conflictError) throw conflictError;

    if (conflicts && conflicts.length > 0) {
      return new Response(JSON.stringify({ error: "Horário não disponível para reagendamento" }), {
        status: 409,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Gerar nova senha usando utility compartilhada
    const novaSenha = generatePassword();

    // Atualizar o agendamento
    const updatePayload: any = {
      DATA: newDate,
      HORA: newTime,
      STATUS: "REAGENDADO",
      senha: novaSenha
    };

    if (professional) updatePayload.PROFISSIONAL = professional;
    if (service) updatePayload.servico = service;

    const { data: updatedBooking, error: updateError } = await supabase
      .from("agendamentos_robustos")
      .update(updatePayload)
      .eq("id", existingBooking.id)
      .select("*")
      .maybeSingle();

    if (updateError) {
      console.error('Erro ao atualizar agendamento:', updateError);
      throw updateError;
    }

    console.log('Agendamento reagendado com sucesso:', updatedBooking);

    return new Response(JSON.stringify({ booking: updatedBooking }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("reschedule_booking error", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
