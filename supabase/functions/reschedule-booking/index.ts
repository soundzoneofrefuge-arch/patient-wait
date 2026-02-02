// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generatePassword } from '../_shared/utils.ts';
import { isValidDate, isValidTime, isNonEmptyString, normalizeTime } from '../_shared/validation.ts';

// Limites de segurança para inputs
const MAX_NAME_LENGTH = 100;
const MAX_CONTACT_LENGTH = 20;
const MAX_SERVICE_LENGTH = 100;
const MAX_PROFESSIONAL_LENGTH = 50;
const MAX_SENHA_LENGTH = 10;

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

    // Validação de campos obrigatórios
    const errors: string[] = [];
    if (!isNonEmptyString(oldName)) errors.push('Nome antigo é obrigatório');
    if (!isNonEmptyString(oldContact)) errors.push('Contato antigo é obrigatório');
    if (!isValidDate(oldDate)) errors.push('Data antiga inválida');
    if (!isValidTime(oldTime)) errors.push('Horário antigo inválido');
    if (!isValidDate(newDate)) errors.push('Nova data inválida');
    if (!isValidTime(newTime)) errors.push('Novo horário inválido');
    if (!isNonEmptyString(senha)) errors.push('Senha é obrigatória');

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: errors.join(', ') }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validação de tamanho
    if (oldName.length > MAX_NAME_LENGTH || oldContact.length > MAX_CONTACT_LENGTH || senha.length > MAX_SENHA_LENGTH) {
      return new Response(JSON.stringify({ error: "Dados excedem o tamanho máximo permitido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Sanitização
    const sanitizedOldName = oldName.trim().slice(0, MAX_NAME_LENGTH);
    const sanitizedOldContact = oldContact.replace(/[^\d\s\-\(\)]/g, '').slice(0, MAX_CONTACT_LENGTH);
    const sanitizedSenha = senha.trim().slice(0, MAX_SENHA_LENGTH);
    const normalizedOldTime = normalizeTime(oldTime);
    const normalizedNewTime = normalizeTime(newTime);
    const sanitizedProfessional = professional ? professional.trim().slice(0, MAX_PROFESSIONAL_LENGTH) : undefined;
    const sanitizedService = service ? service.trim().slice(0, MAX_SERVICE_LENGTH) : undefined;

    console.log('Procurando agendamento:', { oldName: sanitizedOldName, oldContact: sanitizedOldContact, oldDate, oldTime: normalizedOldTime });

    // Buscar o agendamento existente com dados sanitizados
    const { data: existingBooking, error: findError } = await supabase
      .from("agendamentos_robustos")
      .select("*")
      .eq("NOME", sanitizedOldName)
      .eq("CONTATO", sanitizedOldContact)
      .eq("DATA", oldDate)
      .eq("HORA", normalizedOldTime)
      .eq("senha", sanitizedSenha)
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
      .eq("HORA", normalizedNewTime)
      .neq("STATUS", "CANCELADO")
      .neq("id", existingBooking.id); // Excluir o próprio agendamento

    if (sanitizedProfessional || existingBooking.PROFISSIONAL) {
      conflictQuery = conflictQuery.eq("PROFISSIONAL", sanitizedProfessional || existingBooking.PROFISSIONAL);
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

    // Atualizar o agendamento com dados sanitizados
    const updatePayload: any = {
      DATA: newDate,
      HORA: normalizedNewTime,
      STATUS: "REAGENDADO",
      senha: novaSenha
    };

    if (sanitizedProfessional) updatePayload.PROFISSIONAL = sanitizedProfessional;
    if (sanitizedService) updatePayload.servico = sanitizedService;

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
