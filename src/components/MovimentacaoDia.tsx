import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

type MovementData = {
  date: string;
  total: number;
  byHour: Record<string, number>; // "09" -> 2
};

function getBrazilTimeHHMM() {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function Crewmate({
  toneClass,
  size = "md",
  variant = "standing",
}: {
  toneClass: string;
  size?: "sm" | "md";
  variant?: "standing" | "sitting";
}) {
  const dims = size === "sm" ? "w-5 h-6" : "w-6 h-7";

  return (
    <div
      className={cn(
        "relative",
        dims,
        "select-none",
        toneClass,
        variant === "sitting" ? "opacity-90" : "opacity-100"
      )}
      aria-hidden="true"
    >
      {/* Corpo */}
      <div className="absolute inset-0 rounded-[10px] bg-current shadow-sm" />

      {/* Mochila */}
      <div className="absolute right-[-10%] top-[24%] h-[46%] w-[34%] rounded-[8px] bg-current/80" />

      {/* Viseira */}
      <div className="absolute left-[20%] top-[26%] h-[30%] w-[60%] rounded-full bg-background/80 ring-1 ring-foreground/20" />
      <div className="absolute left-[28%] top-[30%] h-[10%] w-[20%] rounded-full bg-foreground/20" />

      {/* Pernas (sutil) */}
      <div className="absolute bottom-0 left-[18%] h-[18%] w-[26%] rounded-b-[10px] bg-current" />
      <div className="absolute bottom-0 right-[18%] h-[18%] w-[26%] rounded-b-[10px] bg-current" />
    </div>
  );
}

export default function MovimentacaoDia() {
  const [movement, setMovement] = useState<MovementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [horaAtual, setHoraAtual] = useState(getBrazilTimeHHMM());

  const fetchMovement = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.functions.invoke("get-day-movement", {
        body: {},
      });

      if (error) throw error;
      setMovement(data as MovementData);
    } catch (e) {
      console.error("MovimentacaoDia fetch error", e);
      setErrorMsg("Não foi possível carregar a movimentação do dia.");
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovement(true);
    const id = window.setInterval(() => fetchMovement(false), 15000);
    return () => window.clearInterval(id);
  }, [fetchMovement]);

  useEffect(() => {
    const id = window.setInterval(() => setHoraAtual(getBrazilTimeHHMM()), 1000 * 60);
    return () => window.clearInterval(id);
  }, []);

  const totalAgendamentos = movement?.total ?? 0;

  // Determinar status da barbearia (apenas volume, sem dados do cliente)
  const statusBarbearia = useMemo(() => {
    if (totalAgendamentos === 0)
      return { texto: "Tranquilo", className: "badge-success" };
    if (totalAgendamentos <= 4)
      return { texto: "Pouco movimento", className: "badge-success" };
    if (totalAgendamentos <= 8)
      return { texto: "Movimento moderado", className: "badge-warning" };
    if (totalAgendamentos <= 12)
      return { texto: "Bastante movimento", className: "badge-warning" };
    return { texto: "Muito movimentado", className: "badge-destructive" };
  }, [totalAgendamentos]);

  // Gerar horários de operação (09h às 20h)
  const horariosOperacao = useMemo(() => {
    const horas: string[] = [];
    for (let i = 9; i <= 20; i++) horas.push(String(i).padStart(2, "0"));
    return horas;
  }, []);

  const agendamentosHoje = useMemo(() => {
    const byHour = movement?.byHour ?? {};
    return Object.entries(byHour)
      .map(([hora, count]) => ({ hora, count }))
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }, [movement]);

  const maxCount = useMemo(() => {
    return Math.max(...agendamentosHoje.map((a) => a.count), 1);
  }, [agendamentosHoje]);

  const horariosPico = useMemo(() => {
    const ordenados = [...agendamentosHoje].sort((a, b) => b.count - a.count);
    return ordenados.slice(0, 3).map((h) => h.hora);
  }, [agendamentosHoje]);

  // Layout da barbearia (top view): 2 cadeiras + 2 barbeiros + clientes (genéricos)
  const clientesSentados = Math.min(totalAgendamentos, 6);
  const clientesEmMovimento = Math.max(0, Math.min(totalAgendamentos - clientesSentados, 10));

  const clienteTones = useMemo(
    () => [
      "text-warning",
      "text-primary",
      "text-success",
      "text-destructive",
      "text-foreground",
      "text-secondary-foreground",
      "text-accent-foreground",
    ],
    []
  );

  const wanderSpots = useMemo(
    () => [
      { top: "42%", left: "18%", dx: 14, dy: -10, dur: 6.2, delay: 0.1 },
      { top: "58%", left: "30%", dx: -12, dy: 10, dur: 7.0, delay: 0.6 },
      { top: "46%", left: "48%", dx: 18, dy: 8, dur: 5.6, delay: 0.2 },
      { top: "62%", left: "58%", dx: -16, dy: -8, dur: 6.8, delay: 0.9 },
      { top: "50%", left: "76%", dx: 12, dy: -12, dur: 7.4, delay: 0.4 },
      { top: "36%", left: "62%", dx: -10, dy: 14, dur: 6.4, delay: 1.1 },
      { top: "34%", left: "38%", dx: 10, dy: 12, dur: 7.6, delay: 1.3 },
      { top: "68%", left: "42%", dx: -12, dy: 12, dur: 6.0, delay: 0.8 },
      { top: "40%", left: "84%", dx: -14, dy: 10, dur: 6.6, delay: 0.5 },
      { top: "58%", left: "14%", dx: 16, dy: 8, dur: 7.2, delay: 1.0 },
    ],
    []
  );

  return (
    <Card className="bg-card/95 backdrop-blur-sm border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Movimentação do Dia
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Acompanhe a quantidade de agendamentos do dia (sem exibir dados dos clientes)
        </p>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        ) : errorMsg ? (
          <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-sm text-muted-foreground">
            {errorMsg}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Ilustração da barbearia */}
            <div className="relative rounded-lg border border-border/50 overflow-hidden min-h-[220px] grid-pattern rough-surface">
              <div className="absolute inset-0 bg-gradient-to-br from-background/0 via-background/20 to-background/40" />
              <div className="relative h-[220px] p-4">
                {/* Estações (cadeiras) */}
                <div className="absolute top-7 left-[25%] -translate-x-1/2">
                  <div className="h-14 w-14 rounded-full bg-secondary border border-border/60 shadow-sm flex items-center justify-center">
                    <div className="h-7 w-7 rounded-full bg-muted border border-border/60" />
                  </div>
                  {/* Barbeiro 1 (preto) */}
                  <div className="absolute -top-2 -left-3">
                    <div className="crew-bob">
                      <Crewmate toneClass="text-secondary" size="sm" />
                    </div>
                  </div>
                </div>

                <div className="absolute top-7 right-[25%] translate-x-1/2">
                  <div className="h-14 w-14 rounded-full bg-secondary border border-border/60 shadow-sm flex items-center justify-center">
                    <div className="h-7 w-7 rounded-full bg-muted border border-border/60" />
                  </div>
                  {/* Barbeiro 2 (branco) */}
                  <div className="absolute -top-2 -right-3">
                    <div className="crew-bob" style={{ animationDelay: "0.4s" }}>
                      <Crewmate toneClass="text-foreground" size="sm" />
                    </div>
                  </div>
                </div>

                {/* Banco corrido */}
                <div className="absolute bottom-7 left-1/2 -translate-x-1/2 w-[78%] h-5 rounded bg-secondary/70 border border-border/50" />

                {/* Clientes sentados */}
                {Array.from({ length: clientesSentados }).map((_, i) => (
                  <div
                    key={`sentado-${i}`}
                    className="absolute bottom-10"
                    style={{ left: `${18 + i * 11}%` }}
                  >
                    <div className="crew-bob" style={{ animationDelay: `${i * 0.15}s` }}>
                      <Crewmate
                        toneClass={clienteTones[i % clienteTones.length]}
                        size="sm"
                        variant="sitting"
                      />
                    </div>
                  </div>
                ))}

                {/* Clientes em movimento (Among Us andando) */}
                {Array.from({ length: clientesEmMovimento }).map((_, i) => {
                  const spot = wanderSpots[i % wanderSpots.length];
                  const tone = clienteTones[(i + clientesSentados) % clienteTones.length];

                  return (
                    <div
                      key={`movimento-${i}`}
                      className="absolute"
                      style={{ top: spot.top, left: spot.left }}
                    >
                      <div
                        className="crew-wander"
                        style={
                          {
                            "--dx": `${spot.dx}px`,
                            "--dy": `${spot.dy}px`,
                            "--dur": `${spot.dur}s`,
                            animationDelay: `${spot.delay}s`,
                          } as React.CSSProperties
                        }
                      >
                        <div className="crew-bob" style={{ animationDelay: `${spot.delay}s` }}>
                          <Crewmate toneClass={tone} size="md" />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Status */}
                <div className="absolute top-3 right-3 text-xs font-medium px-2 py-1 rounded bg-background/70 border border-border/50">
                  <span className={statusBarbearia.className}>{statusBarbearia.texto}</span>
                </div>

                {/* Total */}
                <div className="absolute bottom-3 left-3 text-xs text-muted-foreground">
                  {totalAgendamentos} {totalAgendamentos === 1 ? "agendamento" : "agendamentos"} hoje
                </div>
              </div>
            </div>

            {/* Gráfico de horários populares */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">Horários Populares</span>
                <span>{horaAtual} - Agora</span>
              </div>

              <div className="flex items-end gap-1 h-24">
                {horariosOperacao.map((hora) => {
                  const count = movement?.byHour?.[hora] ?? 0;
                  const altura = count > 0 ? Math.max(18, (count / maxCount) * 100) : 10;
                  const isPico = horariosPico.includes(hora) && count > 0;

                  return (
                    <div key={hora} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-full rounded-t transition-all duration-300",
                          isPico
                            ? "bg-destructive"
                            : count > 0
                              ? "bg-foreground"
                              : "bg-muted/40"
                        )}
                        style={{ height: `${altura}%` }}
                        title={`${hora}h: ${count} agendamento(s)`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-1 text-[10px] text-muted-foreground">
                {horariosOperacao.map((hora, i) => (
                  <div key={hora} className="flex-1 text-center">
                    {i % 2 === 0 ? `${hora}h` : ""}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-destructive rounded" />
                  <span>Horário de pico</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-foreground rounded" />
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
