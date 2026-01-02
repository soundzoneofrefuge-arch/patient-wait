import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Scissors } from "lucide-react";
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

// Retorna hora atual em formato "HH:MM" para comparação
function getBrazilCurrentTime() {
  const now = new Date();
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
}

/* ===================== SVG COMPONENTS ===================== */

// Cadeira de barbearia clássica (vista lateral simplificada)
function BarberChair({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 80"
      className={cn("w-14 h-16 drop-shadow-md", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Base cromada */}
      <ellipse cx="32" cy="76" rx="18" ry="4" className="fill-muted-foreground/60" />
      <rect x="28" y="56" width="8" height="20" rx="2" className="fill-muted-foreground/80" />
      
      {/* Apoio de braço */}
      <rect x="6" y="38" width="10" height="6" rx="2" className="fill-warning/80" />
      <rect x="48" y="38" width="10" height="6" rx="2" className="fill-warning/80" />
      
      {/* Assento */}
      <rect x="10" y="42" width="44" height="14" rx="4" className="fill-destructive/90" />
      <rect x="12" y="44" width="40" height="10" rx="3" className="fill-destructive/70" />
      
      {/* Encosto */}
      <rect x="14" y="8" width="36" height="36" rx="6" className="fill-destructive/90" />
      <rect x="18" y="12" width="28" height="28" rx="4" className="fill-destructive/70" />
      
      {/* Apoio de cabeça */}
      <rect x="22" y="2" width="20" height="10" rx="4" className="fill-destructive/80" />
      
      {/* Detalhes cromados */}
      <rect x="12" y="40" width="40" height="2" rx="1" className="fill-foreground/30" />
      <circle cx="32" cy="70" r="3" className="fill-muted-foreground" />
    </svg>
  );
}

// Barbeiro estilizado (pessoa com avental)
function Barber({ color, flip }: { color: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 32 48"
      className={cn("w-8 h-10 drop-shadow-sm", flip && "scale-x-[-1]")}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cabeça */}
      <circle cx="16" cy="8" r="7" className={color} />
      {/* Cabelo */}
      <path d="M10 6 Q16 2 22 6 Q20 4 16 4 Q12 4 10 6" className="fill-foreground/80" />
      {/* Rosto */}
      <circle cx="13" cy="7" r="1" className="fill-background/80" />
      <circle cx="19" cy="7" r="1" className="fill-background/80" />
      <ellipse cx="16" cy="10" rx="2" ry="1" className="fill-background/40" />
      
      {/* Corpo com avental */}
      <path d="M8 16 L8 38 Q8 42 12 42 L20 42 Q24 42 24 38 L24 16 Q20 14 16 14 Q12 14 8 16" className="fill-foreground/90" />
      {/* Avental */}
      <path d="M10 20 L10 40 L22 40 L22 20 Q16 18 10 20" className="fill-muted" />
      <rect x="14" y="22" width="4" height="6" rx="1" className="fill-muted-foreground/40" />
      
      {/* Braços */}
      <rect x="4" y="18" width="5" height="14" rx="2" className={color} />
      <rect x="23" y="18" width="5" height="14" rx="2" className={color} />
      
      {/* Pernas */}
      <rect x="10" y="42" width="5" height="6" rx="2" className="fill-secondary" />
      <rect x="17" y="42" width="5" height="6" rx="2" className="fill-secondary" />
    </svg>
  );
}

// Cliente sentado (pessoa simplificada) com balão de conversa
function ClienteSentado({ toneClass, showBubble }: { toneClass: string; showBubble?: boolean }) {
  return (
    <svg
      viewBox="0 0 32 40"
      className="w-8 h-10 drop-shadow-sm"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Balão de conversa */}
      {showBubble && (
        <>
          <ellipse cx="24" cy="6" rx="6" ry="4" className="fill-background/90" />
          <path d="M20 8 L18 12 L22 9 Z" className="fill-background/90" />
          <circle cx="22" cy="6" r="0.8" className="fill-muted-foreground/60" />
          <circle cx="24" cy="6" r="0.8" className="fill-muted-foreground/60" />
          <circle cx="26" cy="6" r="0.8" className="fill-muted-foreground/60" />
        </>
      )}
      {/* Cabeça */}
      <circle cx="12" cy="14" r="5" className={toneClass} />
      {/* Olhos */}
      <circle cx="10" cy="13" r="0.8" className="fill-background/80" />
      <circle cx="14" cy="13" r="0.8" className="fill-background/80" />
      
      {/* Corpo sentado */}
      <path d="M6 20 L6 30 L18 30 L18 20 Q12 18 6 20" className={toneClass} />
      
      {/* Pernas dobradas */}
      <rect x="6" y="30" width="5" height="8" rx="2" className={toneClass} />
      <rect x="13" y="30" width="5" height="8" rx="2" className={toneClass} />
    </svg>
  );
}

// Cliente em pé / andando com balão de conversa
function ClienteAndando({ toneClass, walking, showBubble }: { toneClass: string; walking?: boolean; showBubble?: boolean }) {
  return (
    <svg
      viewBox="0 0 32 48"
      className={cn("w-6 h-10 drop-shadow-sm", walking && "animate-pulse")}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Balão de conversa */}
      {showBubble && (
        <>
          <ellipse cx="24" cy="6" rx="6" ry="4" className="fill-background/90" />
          <path d="M20 8 L18 12 L22 9 Z" className="fill-background/90" />
          <circle cx="22" cy="6" r="0.8" className="fill-muted-foreground/60" />
          <circle cx="24" cy="6" r="0.8" className="fill-muted-foreground/60" />
          <circle cx="26" cy="6" r="0.8" className="fill-muted-foreground/60" />
        </>
      )}
      {/* Cabeça */}
      <circle cx="12" cy="14" r="5" className={toneClass} />
      {/* Olhos */}
      <circle cx="10" cy="13" r="0.7" className="fill-background/80" />
      <circle cx="14" cy="13" r="0.7" className="fill-background/80" />
      
      {/* Corpo */}
      <path d="M7 20 L7 34 L17 34 L17 20 Q12 18 7 20" className={toneClass} />
      
      {/* Braços */}
      <rect x="3" y="22" width="4" height="10" rx="2" className={toneClass} />
      <rect x="17" y="22" width="4" height="10" rx="2" className={toneClass} />
      
      {/* Pernas */}
      <rect x="8" y="34" width="4" height="12" rx="2" className={toneClass} />
      <rect x="14" y="34" width="4" height="12" rx="2" className={toneClass} />
    </svg>
  );
}

// Banco de espera (estilo couro)
function BancoEspera() {
  return (
    <svg
      viewBox="0 0 200 40"
      className="w-full h-8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pernas */}
      <rect x="15" y="28" width="6" height="12" rx="1" className="fill-muted-foreground/70" />
      <rect x="55" y="28" width="6" height="12" rx="1" className="fill-muted-foreground/70" />
      <rect x="95" y="28" width="6" height="12" rx="1" className="fill-muted-foreground/70" />
      <rect x="140" y="28" width="6" height="12" rx="1" className="fill-muted-foreground/70" />
      <rect x="180" y="28" width="6" height="12" rx="1" className="fill-muted-foreground/70" />
      
      {/* Assento */}
      <rect x="5" y="18" width="190" height="14" rx="4" className="fill-secondary" />
      <rect x="8" y="20" width="184" height="10" rx="3" className="fill-secondary/80" />
      
      {/* Encosto */}
      <rect x="5" y="4" width="190" height="16" rx="4" className="fill-secondary" />
      <rect x="10" y="6" width="180" height="12" rx="3" className="fill-secondary/70" />
      
      {/* Costuras decorativas */}
      <line x1="50" y1="8" x2="50" y2="16" className="stroke-border" strokeWidth="1" />
      <line x1="100" y1="8" x2="100" y2="16" className="stroke-border" strokeWidth="1" />
      <line x1="150" y1="8" x2="150" y2="16" className="stroke-border" strokeWidth="1" />
    </svg>
  );
}

// Espelho de barbearia
function Espelho() {
  return (
    <svg viewBox="0 0 40 60" className="w-10 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="36" height="56" rx="4" className="fill-muted-foreground/40" />
      <rect x="4" y="4" width="32" height="52" rx="3" className="fill-background/20" />
      <rect x="6" y="6" width="28" height="48" rx="2" className="fill-foreground/5" />
      {/* Reflexo */}
      <path d="M8 10 L14 10 L10 20 L8 20 Z" className="fill-foreground/10" />
    </svg>
  );
}

// Poste de barbearia (barber pole) - vermelho, branco e azul
function BarberPole() {
  return (
    <svg viewBox="0 0 16 50" className="w-4 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Moldura */}
      <rect x="2" y="0" width="12" height="50" rx="2" className="fill-muted-foreground/40" />
      {/* Fundo branco */}
      <rect x="3" y="2" width="10" height="46" rx="1" fill="white" />
      {/* Listras vermelhas */}
      <path d="M3 6 L13 2 L13 6 L3 10 Z" fill="#dc2626" />
      <path d="M3 18 L13 14 L13 18 L3 22 Z" fill="#dc2626" />
      <path d="M3 30 L13 26 L13 30 L3 34 Z" fill="#dc2626" />
      <path d="M3 42 L13 38 L13 42 L3 46 Z" fill="#dc2626" />
      {/* Listras azuis */}
      <path d="M3 10 L13 6 L13 10 L3 14 Z" fill="#2563eb" />
      <path d="M3 22 L13 18 L13 22 L3 26 Z" fill="#2563eb" />
      <path d="M3 34 L13 30 L13 34 L3 38 Z" fill="#2563eb" />
      <path d="M3 46 L13 42 L13 46 L3 48 Z" fill="#2563eb" />
      {/* Tampa superior e inferior */}
      <rect x="1" y="0" width="14" height="3" rx="1" className="fill-muted-foreground/60" />
      <rect x="1" y="47" width="14" height="3" rx="1" className="fill-muted-foreground/60" />
    </svg>
  );
}

/* ===================== MAIN COMPONENT ===================== */

export default function MovimentacaoDia() {
  const [movement, setMovement] = useState<MovementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [horaAtual, setHoraAtual] = useState(getBrazilTimeHHMM());
  const [horaAtualFull, setHoraAtualFull] = useState(getBrazilCurrentTime());

  const fetchMovement = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.functions.invoke("get-day-movement", {
        body: {},
      });

      if (error) throw error;
      console.log("MovimentacaoDia data:", data);
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
    const id = window.setInterval(() => {
      setHoraAtual(getBrazilTimeHHMM());
      setHoraAtualFull(getBrazilCurrentTime());
    }, 1000 * 30); // Atualiza a cada 30s
    return () => window.clearInterval(id);
  }, []);

  const totalAgendamentos = movement?.total ?? 0;

  // Calcular agendamentos futuros (que ainda não passaram)
  const agendamentosFuturos = useMemo(() => {
    const byHour = movement?.byHour ?? {};
    const [horaAtualH, minutoAtualM] = horaAtualFull.split(":").map(Number);
    const horaAtualMinutos = horaAtualH * 60 + minutoAtualM;
    
    let count = 0;
    for (const [hora, quantidade] of Object.entries(byHour)) {
      const horaNum = parseInt(hora, 10);
      // Considerar que cada hora começa em :00 e termina em :59
      // Se o agendamento é para 11:00, ele já passou se agora é 11:01 ou mais
      const horaEmMinutos = horaNum * 60;
      if (horaEmMinutos > horaAtualMinutos) {
        count += quantidade;
      } else if (horaEmMinutos === Math.floor(horaAtualMinutos / 60) * 60 && minutoAtualM < 30) {
        // Na mesma hora, mas antes de :30, ainda conta os agendamentos dessa hora
        count += quantidade;
      }
    }
    return count;
  }, [movement, horaAtualFull]);

  const statusBarbearia = useMemo(() => {
    if (agendamentosFuturos === 0)
      return { texto: "Tranquilo", className: "text-success" };
    if (agendamentosFuturos <= 4)
      return { texto: "Pouco movimento", className: "text-success" };
    if (agendamentosFuturos <= 8)
      return { texto: "Movimento moderado", className: "text-warning" };
    if (agendamentosFuturos <= 12)
      return { texto: "Bastante movimento", className: "text-warning" };
    return { texto: "Muito movimentado", className: "text-destructive" };
  }, [agendamentosFuturos]);

  // Horários de operação (09h às 20h)
  const horariosOperacao = useMemo(() => {
    const horas: string[] = [];
    for (let i = 9; i <= 20; i++) horas.push(String(i).padStart(2, "0"));
    return horas;
  }, []);

  // Processar byHour para gráfico
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

  // Clientes para ilustração - BASEADO EM AGENDAMENTOS FUTUROS
  const clientesSentados = Math.min(agendamentosFuturos, 4);
  const clientesEmPe = Math.max(0, Math.min(agendamentosFuturos - clientesSentados, 6));

  const clienteTones = useMemo(
    () => [
      "fill-warning",
      "fill-primary",
      "fill-success",
      "fill-destructive",
      "fill-foreground",
      "fill-muted-foreground",
    ],
    []
  );

  const wanderSpots = useMemo(
    () => [
      { top: "35%", left: "15%", dx: 12, dy: -8, dur: 5.5, delay: 0 },
      { top: "45%", left: "75%", dx: -10, dy: 6, dur: 6.2, delay: 0.3 },
      { top: "50%", left: "45%", dx: 8, dy: -10, dur: 5.8, delay: 0.6 },
      { top: "38%", left: "60%", dx: -12, dy: 8, dur: 6.5, delay: 0.9 },
      { top: "55%", left: "25%", dx: 10, dy: 10, dur: 5.2, delay: 1.2 },
      { top: "42%", left: "85%", dx: -8, dy: -6, dur: 6.0, delay: 1.5 },
    ],
    []
  );

  return (
    <Card className="bg-card/95 backdrop-blur-sm border-primary/20 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Scissors className="h-5 w-5 text-primary" />
          Movimentação do Dia
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Acompanhe a quantidade de agendamentos do dia
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
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Ilustração da barbearia - AGORA À ESQUERDA */}
            <div className="relative">
              <div className="rounded-xl border border-border/30 overflow-hidden min-h-[260px] bg-gradient-to-br from-secondary/40 via-background to-secondary/20 relative">
                {/* Status badge - canto superior direito DENTRO do quadro */}
                <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 text-xs font-semibold bg-background/70 backdrop-blur-sm rounded-full px-2 py-1">
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5">
                    <circle cx="8" cy="8" r="7" fill="transparent" stroke="currentColor" strokeWidth="1" className="text-border" />
                    <path d="M8 1 A7 7 0 0 1 15 8 L8 8 Z" className="fill-success" />
                  </svg>
                  <span className={statusBarbearia.className}>{statusBarbearia.texto}</span>
                </div>
                {/* Parede de fundo com textura */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-muted/50 to-transparent" />
                </div>
                
                {/* Chão */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-muted/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-muted-foreground/20" />

                {/* Número de agendamentos futuros no chão - em perspectiva */}
                <div 
                  className="absolute left-1/2 bottom-20 -translate-x-1/2 text-5xl font-bold text-warning select-none pointer-events-none z-10"
                  style={{
                    transform: "translateX(-50%) perspective(200px) rotateX(50deg) scaleY(1.3)",
                    textShadow: "2px 4px 8px rgba(0,0,0,0.5)",
                    opacity: 0.9,
                  }}
                >
                  {agendamentosFuturos}
                </div>

                {/* Decoração - Barber Poles */}
                <div className="absolute top-4 left-3">
                  <BarberPole />
                </div>
                <div className="absolute top-4 right-3">
                  <BarberPole />
                </div>

                {/* Espelhos */}
                <div className="absolute top-2 left-[22%]">
                  <Espelho />
                </div>
                <div className="absolute top-2 right-[22%]">
                  <Espelho />
                </div>

                {/* Cadeiras de barbeiro */}
                <div className="absolute top-14 left-[18%] -translate-x-1/2">
                  <BarberChair />
                </div>
                <div className="absolute top-14 right-[18%] translate-x-1/2">
                  <BarberChair className="scale-x-[-1]" />
                </div>

                {/* Barbeiros */}
                <div className="absolute top-16 left-[30%]">
                  <div className="crew-bob">
                    <Barber color="fill-warning" />
                  </div>
                </div>
                <div className="absolute top-16 right-[30%]">
                  <div className="crew-bob" style={{ animationDelay: "0.5s" }}>
                    <Barber color="fill-primary" flip />
                  </div>
                </div>

                {/* Banco de espera */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[80%]">
                  <BancoEspera />
                </div>

                {/* Clientes sentados no banco */}
                {Array.from({ length: clientesSentados }).map((_, i) => (
                  <div
                    key={`sentado-${i}`}
                    className="absolute bottom-8"
                    style={{ left: `${18 + i * 18}%` }}
                  >
                    <div className="crew-bob" style={{ animationDelay: `${i * 0.2}s` }}>
                      <ClienteSentado toneClass={clienteTones[i % clienteTones.length]} showBubble={i % 2 === 0} />
                    </div>
                  </div>
                ))}

                {/* Clientes em pé / andando */}
                {Array.from({ length: clientesEmPe }).map((_, i) => {
                  const spot = wanderSpots[i % wanderSpots.length];
                  const tone = clienteTones[(i + clientesSentados) % clienteTones.length];

                  return (
                    <div
                      key={`pe-${i}`}
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
                          } as CSSProperties
                        }
                      >
                        <div className="crew-bob" style={{ animationDelay: `${spot.delay}s` }}>
                          <ClienteAndando toneClass={tone} walking showBubble={i % 3 === 0} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gráfico de horários populares - AGORA À DIREITA */}
            <div className="space-y-3 min-h-[260px] flex flex-col">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Horários Populares
                </span>
                <span className="text-xs bg-muted/50 px-2 py-1 rounded">{horaAtual} - Agora</span>
              </div>

              <div className="flex items-end gap-1 h-32 p-2 bg-muted/20 rounded-lg border border-border/30">
                {horariosOperacao.map((hora) => {
                  const count = movement?.byHour?.[hora] ?? 0;
                  const altura = count > 0 ? Math.max(15, (count / maxCount) * 100) : 8;
                  const isPico = horariosPico.includes(hora) && count > 0;

                  return (
                    <div key={hora} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {count > 0 ? count : ""}
                      </span>
                      <div
                        className={cn(
                          "w-full rounded-t-sm transition-all duration-500 relative",
                          isPico
                            ? "bg-gradient-to-t from-destructive to-destructive/70"
                            : count > 0
                              ? "bg-gradient-to-t from-primary to-primary/70"
                              : "bg-muted/40"
                        )}
                        style={{ height: `${altura}%` }}
                        title={`${hora}h: ${count} agendamento(s)`}
                      >
                        {isPico && count > 0 && (
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-1 text-[10px] text-muted-foreground px-2">
                {horariosOperacao.map((hora) => (
                  <div key={hora} className="flex-1 text-center font-medium">
                    {hora}h
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-6 text-xs text-muted-foreground pt-3 border-t border-border/30 mt-auto">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-t from-destructive to-destructive/70 rounded-sm" />
                  <span>Horário de pico</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-t from-primary to-primary/70 rounded-sm" />
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
