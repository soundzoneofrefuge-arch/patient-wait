// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, getBrazilDateTime } from '../_shared/utils.ts';

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(mins: number) {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let date: string | null = null;
  let professional: string | null = null;
  // OTIMIZAÇÃO: Receber horários do frontend para evitar query em info_loja
  let openingTimeParam: string | null = null;
  let closingTimeParam: string | null = null;
  let intervalParam: number | null = null;

  if (req.method === "POST") {
    try {
      const body = await req.json();
      date = body?.date ?? null;
      professional = body?.professional ?? null;
      // Parâmetros opcionais do frontend
      openingTimeParam = body?.opening_time ?? null;
      closingTimeParam = body?.closing_time ?? null;
      intervalParam = body?.slot_interval_minutes ?? null;
    } catch (_) {
      // ignore, fallback to query params
    }
  }

  if (!date) {
    const url = new URL(req.url);
    date = date ?? url.searchParams.get("date");
    professional = professional ?? url.searchParams.get("professional");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    if (!date) {
      return new Response(JSON.stringify({ error: "Missing date parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verificar se é domingo (0 = domingo)
    const dateObj = new Date(date + 'T12:00:00');
    if (dateObj.getDay() === 0) {
      return new Response(
        JSON.stringify({ slots: [], message: "Domingo - Não há atendimento" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // QUERY 1: Verificar horários especiais primeiro
    const { data: horarioEspecial, error: horarioEspecialErr } = await supabase
      .from("horarios_especiais")
      .select("*")
      .eq("data", date)
      .maybeSingle();
    
    if (horarioEspecialErr) {
      console.error("Erro ao buscar horário especial:", horarioEspecialErr);
    }

    // Se a loja está fechada neste dia
    if (horarioEspecial?.tipo === "fechado") {
      return new Response(
        JSON.stringify({ 
          slots: [], 
          isClosed: true,
          closedMessage: horarioEspecial.mensagem || "Loja Fechada"
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // QUERY 2: Feriados
    const { data: feriado, error: feriadoErr } = await supabase
      .from("feriados")
      .select("data, descricao")
      .eq("data", date)
      .maybeSingle();
    if (feriadoErr) throw feriadoErr;
    if (feriado) {
      return new Response(
        JSON.stringify({ slots: [], isHoliday: true, holiday: feriado }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // OTIMIZAÇÃO: Usar parâmetros do frontend se disponíveis, caso contrário requer erro
    // (o frontend SEMPRE deve enviar os parâmetros de horário)
    if (!openingTimeParam || !closingTimeParam || !intervalParam) {
      return new Response(JSON.stringify({ 
        error: "Missing required parameters: opening_time, closing_time, slot_interval_minutes" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Usar horários especiais se existir, senão usar parâmetros do frontend
    let opening: string;
    let closing: string;
    let isSpecialHours = false;
    let specialHoursMessage: string | null = null;

    if (horarioEspecial?.tipo === "horario_especial") {
      opening = typeof horarioEspecial.horario_abertura === "string" 
        ? horarioEspecial.horario_abertura 
        : String(horarioEspecial.horario_abertura);
      closing = typeof horarioEspecial.horario_fechamento === "string" 
        ? horarioEspecial.horario_fechamento 
        : String(horarioEspecial.horario_fechamento);
      isSpecialHours = true;
      specialHoursMessage = horarioEspecial.mensagem;
      console.log('Usando horário especial:', { opening, closing, message: specialHoursMessage });
    } else {
      // OTIMIZAÇÃO: Usar parâmetros recebidos do frontend (não faz query em info_loja)
      opening = openingTimeParam;
      closing = closingTimeParam;
    }

    const interval = intervalParam;

    const startM = toMinutes(opening);
    const endM = toMinutes(closing);
    const slots: string[] = [];
    for (let t = startM; t + interval <= endM; t += interval) {
      slots.push(toHHMM(t));
    }

    // QUERY 3: Agendamentos existentes (ignorar cancelados) - FILTRAR APENAS DA DATA SOLICITADA
    const { data: ags, error: agsErr } = await supabase
      .from("agendamentos_robustos")
      .select("HORA, PROFISSIONAL, STATUS")
      .eq("DATA", date)
      .in("STATUS", ["AGENDADO", "REAGENDADO"]); // Apenas status ativos

    if (agsErr) throw agsErr;

    const bookedTimes = new Set();
    
    console.log('Agendamentos encontrados para', date, ':', ags);
    console.log('Profissional filtro:', professional);
    
    (ags ?? []).forEach((a: any) => {
      const hora = typeof a.HORA === "string" ? a.HORA : String(a.HORA);
      const horaFormatada = hora.slice(0, 5); // Garantir formato HH:MM
      
      if (professional) {
        // Se profissional foi especificado, bloquear apenas se o MESMO profissional tem agendamento
        if (a.PROFISSIONAL === professional) {
          console.log(`Bloqueando horário ${horaFormatada} para profissional ${professional}`);
          bookedTimes.add(horaFormatada);
        } else {
          console.log(`Não bloqueando ${horaFormatada} - agendamento é para ${a.PROFISSIONAL}, buscando para ${professional}`);
        }
      } else {
        // Se nenhum profissional especificado, bloquear o horário para QUALQUER profissional
        console.log(`Bloqueando horário ${horaFormatada} (sem filtro de profissional)`);
        bookedTimes.add(horaFormatada);
      }
    });
    
    console.log('Horários bloqueados:', Array.from(bookedTimes));

    let available = slots.filter((s) => !bookedTimes.has(s));

    // Obter data/hora atual do Brasil usando utility compartilhada
    const brazilTime = getBrazilDateTime();
    const todayStr = brazilTime.toISOString().split('T')[0];
    
    console.log('Data de hoje (Brasil):', todayStr, 'Data solicitada:', date);
    console.log('Hora atual Brasil:', brazilTime.toTimeString().slice(0, 5));
    
    // Se a data solicitada é anterior a hoje, retornar array vazio
    if (date < todayStr) {
      console.log('Data solicitada é anterior à data de hoje, retornando array vazio');
      return new Response(
        JSON.stringify({ slots: [] }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    if (date === todayStr) {
      const currentHour = brazilTime.getHours();
      const currentMinutes = brazilTime.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinutes;
      
      // Próximo intervalo disponível
      const nextSlotTime = Math.ceil(currentTimeInMinutes / interval) * interval;
      
      available = available.filter(slot => {
        const slotMinutes = toMinutes(slot);
        return slotMinutes >= nextSlotTime;
      });
    }

    // Montar resposta com informações de horário especial
    const response: any = { slots: available };
    if (isSpecialHours) {
      response.isSpecialHours = true;
      response.specialHoursMessage = specialHoursMessage;
      response.specialHoursOpening = opening.slice(0, 5);
      response.specialHoursClosing = closing.slice(0, 5);
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e) {
    console.error("get_available_slots error", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
