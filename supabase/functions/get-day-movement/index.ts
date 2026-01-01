// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, getBrazilDateString } from "../_shared/utils.ts";

type MovementResponse = {
  date: string;
  total: number;
  byHour: Record<string, number>; // "09" -> 2
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

    const { data, error } = await supabase
      .from("agendamentos_robustos")
      .select("HORA, STATUS")
      .eq("DATA", dateToUse)
      .in("STATUS", ["AGENDADO", "REAGENDADO"]);

    if (error) throw error;

    const byHour: Record<string, number> = {};
    for (const row of data ?? []) {
      const hora = String((row as any).HORA ?? "00:00:00").slice(0, 2);
      byHour[hora] = (byHour[hora] ?? 0) + 1;
    }

    const response: MovementResponse = {
      date: dateToUse,
      total: (data?.length ?? 0),
      byHour,
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
