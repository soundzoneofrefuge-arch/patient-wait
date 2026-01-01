import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface AgendamentoCount {
  hora: string;
  count: number;
}

export default function MovimentacaoDia() {
  const [agendamentosHoje, setAgendamentosHoje] = useState<AgendamentoCount[]>([]);
  const [totalAgendamentos, setTotalAgendamentos] = useState(0);
  const [loading, setLoading] = useState(true);

  // Obter data de hoje no fuso horário do Brasil (formato YYYY-MM-DD)
  const hoje = useMemo(() => {
    const now = new Date();
    const brazilFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return brazilFormatter.format(now); // Retorna "2026-01-01"
  }, []);

  useEffect(() => {
    const fetchAgendamentosHoje = async () => {
      try {
        const { data, error } = await supabase
          .from("agendamentos_robustos")
          .select("HORA")
          .eq("DATA", hoje)
          .in("STATUS", ["AGENDADO", "REAGENDADO"]);

        if (error) {
          console.error("Erro ao buscar agendamentos:", error);
          return;
        }

        // Agrupar por hora
        const horasMap: Record<string, number> = {};
        data?.forEach((ag) => {
          const hora = ag.HORA?.slice(0, 2) || "00";
          horasMap[hora] = (horasMap[hora] || 0) + 1;
        });

        // Converter para array ordenado
        const agrupados = Object.entries(horasMap)
          .map(([hora, count]) => ({ hora, count }))
          .sort((a, b) => a.hora.localeCompare(b.hora));

        setAgendamentosHoje(agrupados);
        setTotalAgendamentos(data?.length || 0);
      } catch (err) {
        console.error("Erro:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgendamentosHoje();

    // Realtime updates
    const channel = supabase
      .channel("movimentacao-dia")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "agendamentos_robustos"
      }, () => fetchAgendamentosHoje())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hoje]);

  // Determinar horários de pico (os 3 maiores)
  const horariosOrdenados = useMemo(() => {
    return [...agendamentosHoje].sort((a, b) => b.count - a.count);
  }, [agendamentosHoje]);

  const horariosPico = useMemo(() => {
    return horariosOrdenados.slice(0, 3).map(h => h.hora);
  }, [horariosOrdenados]);

  // Gerar horários de funcionamento (9h às 20h)
  const horariosOperacao = useMemo(() => {
    const horas = [];
    for (let i = 9; i <= 20; i++) {
      horas.push(String(i).padStart(2, "0"));
    }
    return horas;
  }, []);

  // Obter contagem máxima para normalizar barras
  const maxCount = useMemo(() => {
    return Math.max(...agendamentosHoje.map(a => a.count), 1);
  }, [agendamentosHoje]);

  // Determinar status da barbearia
  const statusBarbearia = useMemo(() => {
    if (totalAgendamentos === 0) return { texto: "Tranquilo", cor: "text-green-400" };
    if (totalAgendamentos <= 4) return { texto: "Pouco movimento", cor: "text-green-400" };
    if (totalAgendamentos <= 8) return { texto: "Movimento moderado", cor: "text-yellow-400" };
    if (totalAgendamentos <= 12) return { texto: "Bastante movimento", cor: "text-orange-400" };
    return { texto: "Muito movimentado", cor: "text-red-400" };
  }, [totalAgendamentos]);

  // Hora atual do Brasil
  const horaAtual = useMemo(() => {
    const now = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit"
    });
    return now;
  }, []);

  // Cores dos clientes na ilustração
  const coresClientes = ["#f97316", "#22c55e", "#3b82f6", "#ec4899", "#a855f7", "#eab308", "#06b6d4"];

  return (
    <Card className="bg-card/95 backdrop-blur-sm border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Movimentação do Dia
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Veja como está a barbearia agora
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Ilustração da barbearia */}
            <div className="relative bg-muted/30 rounded-lg p-4 min-h-[200px] overflow-hidden">
              {/* Chão */}
              <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-muted/40" />
              
              {/* Cadeiras de barbeiro (vista superior) */}
              <div className="absolute top-8 left-1/4 transform -translate-x-1/2">
                <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-zinc-700" />
                </div>
                {/* Barbeiro 1 */}
                <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-zinc-200 border border-zinc-400" />
              </div>
              
              <div className="absolute top-8 right-1/4 transform translate-x-1/2">
                <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-zinc-700" />
                </div>
                {/* Barbeiro 2 */}
                <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-zinc-200 border border-zinc-400" />
              </div>

              {/* Banco de espera (retângulo inferior) */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-3/4 h-4 bg-zinc-700 rounded" />

              {/* Clientes sentados no banco (baseado no número de agendamentos) */}
              {Array.from({ length: Math.min(totalAgendamentos, 6) }).map((_, i) => (
                <div
                  key={`sentado-${i}`}
                  className="absolute bottom-8 w-3 h-3 rounded-full animate-pulse"
                  style={{
                    backgroundColor: coresClientes[i % coresClientes.length],
                    left: `${20 + i * 12}%`,
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              ))}

              {/* Clientes em movimento (extras acima de 6) */}
              {Array.from({ length: Math.max(0, Math.min(totalAgendamentos - 6, 4)) }).map((_, i) => (
                <div
                  key={`movimento-${i}`}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: coresClientes[(i + 6) % coresClientes.length],
                    top: `${40 + (i % 2) * 20}%`,
                    left: `${30 + i * 15}%`,
                    animation: `pulse 2s ease-in-out infinite`,
                    animationDelay: `${i * 0.3}s`
                  }}
                />
              ))}

              {/* Status */}
              <div className="absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded bg-background/80">
                <span className={statusBarbearia.cor}>{statusBarbearia.texto}</span>
              </div>

              {/* Total de agendamentos */}
              <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
                {totalAgendamentos} {totalAgendamentos === 1 ? "cliente esperado" : "clientes esperados"} hoje
              </div>
            </div>

            {/* Gráfico de horários populares */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">Horários Populares</span>
                <span>{horaAtual} - Agora</span>
              </div>

              {/* Barras de horário */}
              <div className="flex items-end gap-1 h-24">
                {horariosOperacao.map((hora) => {
                  const agendamento = agendamentosHoje.find(a => a.hora === hora);
                  const count = agendamento?.count || 0;
                  const altura = count > 0 ? Math.max(20, (count / maxCount) * 100) : 10;
                  const isPico = horariosPico.includes(hora) && count > 0;
                  
                  return (
                    <div
                      key={hora}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className={`w-full rounded-t transition-all duration-300 ${
                          isPico ? "bg-red-500" : count > 0 ? "bg-white" : "bg-muted/40"
                        }`}
                        style={{ height: `${altura}%` }}
                        title={`${hora}h: ${count} agendamento(s)`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Labels de hora */}
              <div className="flex gap-1 text-[10px] text-muted-foreground">
                {horariosOperacao.map((hora, i) => (
                  <div key={hora} className="flex-1 text-center">
                    {i % 2 === 0 ? `${hora}h` : ""}
                  </div>
                ))}
              </div>

              {/* Legenda */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded" />
                  <span>Horário de pico</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-white rounded" />
                  <span>Normal</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
