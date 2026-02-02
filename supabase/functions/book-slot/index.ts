// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generatePassword, getBrazilDateTime } from '../_shared/utils.ts';
import { validateBookingData, normalizeTime } from '../_shared/validation.ts';

// Limites de segurança para inputs
const MAX_NAME_LENGTH = 100;
const MAX_CONTACT_LENGTH = 20;
const MAX_SERVICE_LENGTH = 100;
const MAX_PROFESSIONAL_LENGTH = 50;

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
    const { date, time, name, contact, professional, service } = body ?? {};

    // Validação usando utilitário compartilhado
    const validation = validateBookingData({ date, time, name, contact, professional, service });
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.errors.join(', ') }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validação de tamanho para prevenir ataques
    if (name.length > MAX_NAME_LENGTH || contact.length > MAX_CONTACT_LENGTH || 
        service.length > MAX_SERVICE_LENGTH || professional.length > MAX_PROFESSIONAL_LENGTH) {
      return new Response(JSON.stringify({ error: "Dados excedem o tamanho máximo permitido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Sanitização básica (remover caracteres perigosos)
    const sanitizedName = name.trim().slice(0, MAX_NAME_LENGTH);
    const sanitizedContact = contact.replace(/[^\d\s\-\(\)]/g, '').slice(0, MAX_CONTACT_LENGTH);
    const sanitizedProfessional = professional.trim().slice(0, MAX_PROFESSIONAL_LENGTH);
    const sanitizedService = service.trim().slice(0, MAX_SERVICE_LENGTH);
    const normalizedTime = normalizeTime(time);

    // Verificar se não é feriado
    const { data: feriado, error: feriadoErr } = await supabase
      .from("feriados")
      .select("data")
      .eq("data", date)
      .maybeSingle();
    if (feriadoErr) throw feriadoErr;
    if (feriado) {
      return new Response(JSON.stringify({ error: "Não é possível agendar para feriados." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verificar se o horário está disponível
    const { data: conflicts, error: conflictError } = await supabase
      .from("agendamentos_robustos")
      .select("id, STATUS")
      .eq("DATA", date)
      .eq("HORA", normalizedTime)
      .eq("PROFISSIONAL", sanitizedProfessional)
      .in("STATUS", ["AGENDADO", "REAGENDADO"]);

    if (conflictError) throw conflictError;

    if (conflicts && conflicts.length > 0) {
      return new Response(JSON.stringify({ 
        error: "O horário selecionado já possui agendamento. Por favor, atualize a página e escolha outro horário disponível.",
        conflictType: "OUTDATED_SCHEDULE"
      }), {
        status: 409,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Gerar senha usando utility compartilhada
    const senha = generatePassword();

    // Obter data/hora do Brasil usando utility compartilhada
    const brazilTime = getBrazilDateTime();
    
    // Criar agendamento com dados sanitizados
    const { data: booking, error: bookingError } = await supabase
      .from("agendamentos_robustos")
      .insert({
        DATA: date,
        HORA: normalizedTime,
        NOME: sanitizedName,
        CONTATO: sanitizedContact,
        PROFISSIONAL: sanitizedProfessional,
        servico: sanitizedService,
        STATUS: "AGENDADO",
        senha: senha,
        created_at: brazilTime.toISOString()
      })
      .select("*")
      .maybeSingle();

    if (bookingError) {
      console.error('Erro ao criar agendamento:', bookingError);
      throw bookingError;
    }

    console.log('Agendamento criado com sucesso:', booking);

    // Inserir ou atualizar cadastro do cliente com dados sanitizados
    try {
      const { error: cadastroError } = await supabase
        .from("cadastro")
        .upsert({
          nome: sanitizedName,
          contato: sanitizedContact,
          serviços_preferidos: sanitizedService,
          data_nascimento: '1990-01-01' // Data padrão, pode ser atualizada depois
        }, {
          onConflict: 'contato'
        });

      if (cadastroError) {
        console.error('Erro ao atualizar cadastro:', cadastroError);
        // Não bloquear o agendamento por erro no cadastro
      } else {
        console.log('Cadastro atualizado para:', contact);
      }
    } catch (cadastroErr) {
      console.error('Erro ao processar cadastro:', cadastroErr);
    }

    return new Response(JSON.stringify({ booking }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("book_slot error", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
