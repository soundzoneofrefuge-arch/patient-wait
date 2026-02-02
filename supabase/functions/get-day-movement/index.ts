// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, getBrazilDateString, getBrazilTimeString } from "../_shared/utils.ts";

type AgendamentoHora = {
  hora: string;
  profissional: string;
};

type MovementResponse = {
  date: string;
  total: number;
  byHour: Record<string, number>; // "09" -> 2
  byHourProfissional: Record<string, AgendamentoHora[]>; // "15" -> [{hora: "15:00", profissional: "Jacson"}, ...]
  horaAtual: string; // "15:30"
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    let date: string | null = null;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        date = body?.date ?? null;
      } catch (_) {
        // ignore
      }
    }

    if (!date) {
      const url = new URL(req.url);
      date = url.searchParams.get("date");
    }

    const dateToUse = date ?? getBrazilDateString();
    const horaAtual = getBrazilTimeString();

    const { data, error } = await supabase
      .from("agendamentos_robustos")
      .select("HORA, STATUS, PROFISSIONAL")
      .eq("DATA", dateToUse)
      .in("STATUS", ["AGENDADO", "REAGENDADO"]);

    if (error) throw error;

    const byHour: Record<string, number> = {};
    const byHourProfissional: Record<string, AgendamentoHora[]> = {};
    
    for (const row of data ?? []) {
      const horaCompleta = String((row as any).HORA ?? "00:00:00");
      const horaKey = horaCompleta.slice(0, 2);
      const profissional = String((row as any).PROFISSIONAL ?? "");
      
      // Contagem simples por hora
      byHour[horaKey] = (byHour[horaKey] ?? 0) + 1;
      
      // Lista de profissionais por hora
      if (!byHourProfissional[horaKey]) {
        byHourProfissional[horaKey] = [];
      }
      byHourProfissional[horaKey].push({
        hora: horaCompleta.slice(0, 5), // "15:00"
        profissional: profissional,
      });
    }

    const response: MovementResponse = {
      date: dateToUse,
      total: (data?.length ?? 0),
      byHour,
      byHourProfissional,
      horaAtual,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("get_day_movement error", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
