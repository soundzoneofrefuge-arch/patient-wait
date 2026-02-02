import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

type AgendamentoHora = {
  hora: string;
  profissional: string;
};

type MovementData = {
  date: string;
  total: number;
  byHour: Record<string, number>; // "09" -> 2
  byHourProfissional: Record<string, AgendamentoHora[]>; // "15" -> [{hora: "15:00", profissional: "Jacson"}, ...]
  horaAtual: string; // "15:30"
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

/* ===================== STATUS INDICATOR ===================== */

function StatusRing({
  level,
  colorClass,
  className,
}: {
  level: 0 | 1 | 2 | 3;
  colorClass: string;
  className?: string;
}) {
  const segments = [
    // 1/4 (top-right)
    "M10 10 L10 2 A8 8 0 0 1 18 10 Z",
    // 2/4 (bottom-right)
    "M10 10 L18 10 A8 8 0 0 1 10 18 Z",
    // 3/4 (bottom-left)
    "M10 10 L10 18 A8 8 0 0 1 2 10 Z",
  ] as const;

  return (
    <svg
      viewBox="0 0 20 20"
      className={cn("h-3.5 w-3.5", className)}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10" cy="10" r="8" className="fill-none stroke-border" strokeWidth="2" />
      {segments.slice(0, level).map((d) => (
        <path key={d} d={d} className={colorClass} />
      ))}
    </svg>
  );
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

// Cliente sentado na cadeira sendo atendido (com nome do barbeiro e horário acima da cabeça)
function ClienteNaCadeira({ toneClass, horario, profissional, flip }: { toneClass: string; horario?: string; profissional?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 40 70"
      className={cn("w-10 h-16 drop-shadow-sm", flip && "scale-x-[-1]")}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Nome do barbeiro e horário - sem fundo, texto branco negrito */}
      {(profissional || horario) && (
        <g transform={flip ? "scale(-1, 1) translate(-40, 0)" : ""}>
          {profissional && (
            <text x="20" y="8" textAnchor="middle" fill="#f97316" className="text-[9px] font-bold" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>{profissional}</text>
          )}
          {horario && (
            <text x="20" y="18" textAnchor="middle" fill="white" className="text-[10px] font-bold" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>{horario}</text>
          )}
        </g>
      )}
      
      {/* Cabeça */}
      <circle cx="20" cy="32" r="6" className={toneClass} />
      {/* Olhos */}
      <circle cx="18" cy="31" r="0.8" className="fill-background/80" />
      <circle cx="22" cy="31" r="0.8" className="fill-background/80" />
      
      {/* Corpo sentado na cadeira (reclinado) */}
      <path d="M14 38 L14 52 L26 52 L26 38 Q20 36 14 38" className={toneClass} />
      
      {/* Braços apoiados */}
      <rect x="10" y="40" width="4" height="8" rx="2" className={toneClass} />
      <rect x="26" y="40" width="4" height="8" rx="2" className={toneClass} />
      
      {/* Pernas esticadas */}
      <rect x="14" y="52" width="5" height="10" rx="2" className={toneClass} />
      <rect x="21" y="52" width="5" height="10" rx="2" className={toneClass} />
    </svg>
  );
}

// Barbeiro estilizado (pessoa com avental) com nome acima da cabeça
function Barber({ color, flip, nome }: { color: string; flip?: boolean; nome?: string }) {
  return (
    <svg
      viewBox="0 0 50 60"
      className={cn("w-12 h-14 drop-shadow-sm", flip && "scale-x-[-1]")}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Nome acima da cabeça - fundo laranja, texto branco */}
      {nome && (
        <g transform={flip ? "scale(-1, 1) translate(-50, 0)" : ""}>
          <rect x="2" y="0" width="46" height="14" rx="4" fill="#f97316" />
          <text x="25" y="11" textAnchor="middle" fill="white" className="text-[11px] font-bold">{nome}</text>
        </g>
      )}
      
      {/* Cabeça */}
      <circle cx="25" cy="20" r="7" className={color} />
      {/* Cabelo */}
      <path d="M19 18 Q25 14 31 18 Q29 16 25 16 Q21 16 19 18" className="fill-foreground/80" />
      {/* Rosto */}
      <circle cx="22" cy="19" r="1" className="fill-background/80" />
      <circle cx="28" cy="19" r="1" className="fill-background/80" />
      <ellipse cx="25" cy="22" rx="2" ry="1" className="fill-background/40" />
      
      {/* Corpo com avental */}
      <path d="M17 28 L17 50 Q17 54 21 54 L29 54 Q33 54 33 50 L33 28 Q29 26 25 26 Q21 26 17 28" className="fill-foreground/90" />
      {/* Avental */}
      <path d="M19 32 L19 52 L31 52 L31 32 Q25 30 19 32" className="fill-muted" />
      <rect x="23" y="34" width="4" height="6" rx="1" className="fill-muted-foreground/40" />
      
      {/* Braços */}
      <rect x="13" y="30" width="5" height="14" rx="2" className={color} />
      <rect x="32" y="30" width="5" height="14" rx="2" className={color} />
      
      {/* Pernas */}
      <rect x="19" y="54" width="5" height="6" rx="2" className="fill-secondary" />
      <rect x="26" y="54" width="5" height="6" rx="2" className="fill-secondary" />
    </svg>
  );
}

// Cliente sentado (pessoa simplificada) com nome do barbeiro e horário
function ClienteSentado({ toneClass, showBubble, horario, profissional }: { toneClass: string; showBubble?: boolean; horario?: string; profissional?: string }) {
  return (
    <svg
      viewBox="0 0 32 56"
      className="w-8 h-14 drop-shadow-sm"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Nome do barbeiro e horário - texto sem fundo */}
      {(showBubble || horario || profissional) && (
        <>
          {profissional && (
            <text x="16" y="6" textAnchor="middle" fill="#f97316" className="text-[7px] font-bold" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>{profissional}</text>
          )}
          {horario ? (
            <text x="16" y="14" textAnchor="middle" fill="white" className="text-[9px] font-bold" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>{horario}</text>
          ) : !profissional && (
            <>
              <circle cx="12" cy="6" r="0.8" className="fill-white/60" />
              <circle cx="16" cy="6" r="0.8" className="fill-white/60" />
              <circle cx="20" cy="6" r="0.8" className="fill-white/60" />
            </>
          )}
        </>
      )}
      {/* Cabeça */}
      <circle cx="12" cy="24" r="5" className={toneClass} />
      {/* Olhos */}
      <circle cx="10" cy="23" r="0.8" className="fill-background/80" />
      <circle cx="14" cy="23" r="0.8" className="fill-background/80" />
      
      {/* Corpo sentado */}
      <path d="M6 30 L6 40 L18 40 L18 30 Q12 28 6 30" className={toneClass} />
      
      {/* Pernas dobradas */}
      <rect x="6" y="40" width="5" height="8" rx="2" className={toneClass} />
      <rect x="13" y="40" width="5" height="8" rx="2" className={toneClass} />
    </svg>
  );
}

// Cliente em pé / andando com nome do barbeiro e horário
function ClienteAndando({ toneClass, walking, showBubble, horario, profissional, ghost }: { toneClass: string; walking?: boolean; showBubble?: boolean; horario?: string; profissional?: string; ghost?: boolean }) {
  return (
    <svg
      viewBox="0 0 32 64"
      className={cn("w-6 h-16 drop-shadow-sm", walking && "animate-pulse")}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Nome do barbeiro e horário - texto sem fundo - SEM efeito ghost */}
      {(showBubble || horario || profissional) && (
        <>
          {profissional && (
            <text x="17" y="6" textAnchor="middle" fill="#f97316" className="text-[6px] font-bold" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>{profissional}</text>
          )}
          {horario ? (
            <text x="17" y="14" textAnchor="middle" fill="white" className="text-[9px] font-bold" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>{horario}</text>
          ) : !profissional && (
            <>
              <circle cx="13" cy="6" r="0.8" className="fill-white/60" />
              <circle cx="17" cy="6" r="0.8" className="fill-white/60" />
              <circle cx="21" cy="6" r="0.8" className="fill-white/60" />
            </>
          )}
        </>
      )}
      {/* Corpo com efeito ghost apenas no boneco, não no texto */}
      <g style={ghost ? { opacity: 0.4, filter: "blur(0.5px)" } : {}}>
        {/* Cabeça */}
        <circle cx="12" cy="24" r="5" className={toneClass} />
        {/* Olhos */}
        <circle cx="10" cy="23" r="0.7" className="fill-background/80" />
        <circle cx="14" cy="23" r="0.7" className="fill-background/80" />
        
        {/* Corpo */}
        <path d="M7 30 L7 44 L17 44 L17 30 Q12 28 7 30" className={toneClass} />
        
        {/* Braços */}
        <rect x="3" y="32" width="4" height="10" rx="2" className={toneClass} />
        <rect x="17" y="32" width="4" height="10" rx="2" className={toneClass} />
        
        {/* Pernas */}
        <rect x="8" y="44" width="4" height="12" rx="2" className={toneClass} />
        <rect x="14" y="44" width="4" height="12" rx="2" className={toneClass} />
      </g>
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
  const [horariosPicoSemana, setHorariosPicoSemana] = useState<string[]>([]);

  // Buscar horários de pico da semana (histórico)
  const fetchHorariosPicoSemana = useCallback(async () => {
    try {
      // Calcular data de 7 dias atrás
      const hoje = new Date();
      const seteDiasAtras = new Date(hoje);
      seteDiasAtras.setDate(hoje.getDate() - 7);
      
      const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const { data, error } = await supabase
        .from('agendamentos_robustos')
        .select('HORA')
        .gte('DATA', formatDate(seteDiasAtras))
        .in('STATUS', ['AGENDADO', 'REAGENDADO', 'CONCLUÍDO']);

      if (error) throw error;

      // Contar frequência de cada horário
      const contagem: Record<string, number> = {};
      data?.forEach(item => {
        if (item.HORA) {
          const hora = item.HORA.toString().substring(0, 2);
          contagem[hora] = (contagem[hora] || 0) + 1;
        }
      });

      // Pegar os 3 horários mais frequentes da semana
      const ordenados = Object.entries(contagem)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hora]) => hora);

      setHorariosPicoSemana(ordenados);
    } catch (e) {
      console.error("Erro ao buscar horários de pico da semana:", e);
    }
  }, []);

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
    fetchHorariosPicoSemana();
    const id = window.setInterval(() => fetchMovement(false), 15000);
    return () => window.clearInterval(id);
  }, [fetchMovement, fetchHorariosPicoSemana]);

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

  const statusViz = useMemo(() => {
    const texto = statusBarbearia.texto.toLowerCase();

    if (texto.includes("muito")) {
      return { level: 3 as const, fillClass: "fill-destructive" };
    }

    if (texto.includes("moderado") || texto.includes("bastante")) {
      return { level: 2 as const, fillClass: "fill-warning" };
    }

    if (texto.includes("pouco") || texto.includes("tranquilo")) {
      return { level: 1 as const, fillClass: "fill-success" };
    }

    return { level: 0 as const, fillClass: "fill-muted-foreground" };
  }, [statusBarbearia.texto]);

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

  // Nota: horariosPico do dia foi removido - agora usamos horariosPicoSemana (baseado nos últimos 7 dias)

  // Calcular quem está sendo atendido agora (profissionais com agendamento no horário atual)
  const atendimentosAtuais = useMemo(() => {
    const byHourProfissional = movement?.byHourProfissional ?? {};
    const [horaAtualH] = horaAtualFull.split(":").map(Number);
    const horaKey = String(horaAtualH).padStart(2, "0");
    
    const agendamentosHoraAtual = byHourProfissional[horaKey] ?? [];
    
    // Mapeamento de profissionais conhecidos (para as cadeiras)
    // Cadeira ESQUERDA = João, Cadeira DIREITA = Jacson
    const profissionaisMap: Record<string, { toneClass: string; position: "left" | "right" }> = {
      "João": { toneClass: "fill-primary", position: "left" },
      "Jacson": { toneClass: "fill-warning", position: "right" },
    };
    
    // Determinar quais cadeiras estão ocupadas
    const cadeirasOcupadas: { position: "left" | "right"; horario: string; toneClass: string; profissional: string }[] = [];
    
    for (const agendamento of agendamentosHoraAtual) {
      const profNome = agendamento.profissional?.trim() || "";
      // Procurar por correspondência parcial (case insensitive)
      const profKey = Object.keys(profissionaisMap).find(
        key => profNome.toLowerCase().includes(key.toLowerCase())
      );
      
      if (profKey) {
        const profInfo = profissionaisMap[profKey];
        // Verificar se essa cadeira já não está ocupada
        if (!cadeirasOcupadas.some(c => c.position === profInfo.position)) {
          cadeirasOcupadas.push({
            position: profInfo.position,
            horario: agendamento.hora,
            toneClass: profInfo.toneClass,
            profissional: profKey,
          });
        }
      }
    }
    
    return cadeirasOcupadas;
  }, [movement, horaAtualFull]);

  // Calcular agendamentos futuros que estão ESPERANDO (não inclui os que estão sendo atendidos)
  // Separados por profissional para posicionamento no banco
  // O FANTASMA deve ser o PRÓXIMO HORÁRIO após quem está na CADEIRA (hora atual + 1)
  const agendamentosEsperandoPorProfissional = useMemo(() => {
    const byHourProfissional = movement?.byHourProfissional ?? {};
    const [horaAtualH] = horaAtualFull.split(":").map(Number);
    const proximaHora = horaAtualH + 1; // Próximo horário após a cadeira
    
    const joao: AgendamentoHora[] = [];
    const jacson: AgendamentoHora[] = [];
    const joaoFantasma: AgendamentoHora[] = [];
    const jacsonFantasma: AgendamentoHora[] = [];
    
    for (const [horaKey, agendamentos] of Object.entries(byHourProfissional)) {
      const horaNum = parseInt(horaKey, 10);
      
      for (const ag of agendamentos) {
        const profNome = ag.profissional?.trim().toLowerCase() || "";
        const isJacson = profNome.includes("jacson");
        const isJoao = profNome.includes("joão") || profNome.includes("joao");
        
        // Fantasma = próxima hora após a cadeira (horaAtualH + 1)
        if (horaNum === proximaHora) {
          if (isJacson) {
            jacsonFantasma.push(ag);
          } else {
            joaoFantasma.push(ag);
          }
        }
        // Banco = horários após o fantasma (horaAtualH + 2 em diante)
        else if (horaNum > proximaHora) {
          if (isJacson) {
            jacson.push(ag);
          } else {
            joao.push(ag);
          }
        }
      }
    }
    
    // Ordenar por horário
    joao.sort((a, b) => a.hora.localeCompare(b.hora));
    jacson.sort((a, b) => a.hora.localeCompare(b.hora));
    joaoFantasma.sort((a, b) => a.hora.localeCompare(b.hora));
    jacsonFantasma.sort((a, b) => a.hora.localeCompare(b.hora));
    
    return { joao, jacson, joaoFantasma, jacsonFantasma };
  }, [movement, horaAtualFull]);

  // Clientes para ilustração - BASEADO EM AGENDAMENTOS ESPERANDO
  // Cada lado do banco tem no máximo 2 clientes sentados
  const clientesJoaoSentados = Math.min(agendamentosEsperandoPorProfissional.joao.length, 2);
  const clientesJacsonSentados = Math.min(agendamentosEsperandoPorProfissional.jacson.length, 2);

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
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Scissors className="h-5 w-5 text-primary" />
              Movimentação do Dia
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Acompanhe a quantidade de agendamentos do dia
            </p>
          </div>
          {/* Status badge - canto superior direito do card */}
          <div className="flex items-center gap-1.5 text-xs font-semibold bg-background/70 backdrop-blur-sm rounded-full px-2.5 py-1 border border-border/30">
            <StatusRing level={statusViz.level} colorClass={statusViz.fillClass} />
            <span className={statusBarbearia.className}>{statusBarbearia.texto}</span>
          </div>
        </div>
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

                {/* Cadeiras de barbeiro com clientes sendo atendidos */}
                {/* Cadeira esquerda (Jacson) */}
                <div className="absolute top-14 left-[18%] -translate-x-1/2">
                  <BarberChair />
                  {/* Cliente na cadeira se houver agendamento */}
                  {atendimentosAtuais.find(a => a.position === "left") && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                      <div className="crew-bob">
                        <ClienteNaCadeira 
                          toneClass={atendimentosAtuais.find(a => a.position === "left")?.toneClass || "fill-muted-foreground"} 
                          horario={atendimentosAtuais.find(a => a.position === "left")?.horario}
                          profissional={atendimentosAtuais.find(a => a.position === "left")?.profissional}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Cadeira direita (João) */}
                <div className="absolute top-14 right-[18%] translate-x-1/2">
                  <BarberChair className="scale-x-[-1]" />
                  {/* Cliente na cadeira se houver agendamento */}
                  {atendimentosAtuais.find(a => a.position === "right") && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                      <div className="crew-bob" style={{ animationDelay: "0.3s" }}>
                        <ClienteNaCadeira 
                          toneClass={atendimentosAtuais.find(a => a.position === "right")?.toneClass || "fill-muted-foreground"} 
                          horario={atendimentosAtuais.find(a => a.position === "right")?.horario}
                          profissional={atendimentosAtuais.find(a => a.position === "right")?.profissional}
                          flip
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Barbeiros - só aparecem se houver cliente */}
                {/* Esquerda = João */}
                {atendimentosAtuais.find(a => a.position === "left") && (
                  <div className="absolute top-12 left-[30%]">
                    <div className="crew-bob">
                      <Barber color="fill-primary" nome="João" />
                    </div>
                  </div>
                )}
                {/* Direita = Jacson */}
                {atendimentosAtuais.find(a => a.position === "right") && (
                  <div className="absolute top-12 right-[30%]">
                    <div className="crew-bob" style={{ animationDelay: "0.5s" }}>
                      <Barber color="fill-warning" flip nome="Jacson" />
                    </div>
                  </div>
                )}

                {/* Banco de espera */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[80%]">
                  <BancoEspera />
                </div>

                {/* Clientes do João sentados no banco - LADO ESQUERDO */}
                {agendamentosEsperandoPorProfissional.joao.slice(0, clientesJoaoSentados).map((agendamento, i) => (
                  <div
                    key={`joao-sentado-${i}-${agendamento.hora}`}
                    className="absolute bottom-6"
                    style={{ left: `${15 + i * 12}%` }}
                  >
                    <div className="crew-bob" style={{ animationDelay: `${i * 0.2}s` }}>
                      <ClienteSentado 
                        toneClass="fill-primary"
                        horario={agendamento.hora}
                        profissional={agendamento.profissional}
                      />
                    </div>
                  </div>
                ))}

                {/* Clientes do Jacson sentados no banco - LADO DIREITO */}
                {agendamentosEsperandoPorProfissional.jacson.slice(0, clientesJacsonSentados).map((agendamento, i) => (
                  <div
                    key={`jacson-sentado-${i}-${agendamento.hora}`}
                    className="absolute bottom-6"
                    style={{ left: `${60 + i * 12}%` }}
                  >
                    <div className="crew-bob" style={{ animationDelay: `${i * 0.2 + 0.4}s` }}>
                      <ClienteSentado 
                        toneClass="fill-warning"
                        horario={agendamento.hora}
                        profissional={agendamento.profissional}
                      />
                    </div>
                  </div>
                ))}

                {/* Cliente fantasma do João - próximo ao barbeiro João (esquerda) */}
                {agendamentosEsperandoPorProfissional.joaoFantasma.slice(0, 1).map((agendamento, i) => (
                  <div
                    key={`joao-fantasma-${i}-${agendamento.hora}`}
                    className="absolute"
                    style={{ top: "42%", left: "8%" }}
                  >
                    <div className="crew-bob" style={{ animationDelay: "0.3s" }}>
                      <ClienteAndando 
                        toneClass="fill-primary"
                        horario={agendamento.hora}
                        profissional={agendamento.profissional}
                        ghost
                      />
                    </div>
                  </div>
                ))}

                {/* Cliente fantasma do Jacson - próximo ao barbeiro Jacson (direita) */}
                {agendamentosEsperandoPorProfissional.jacsonFantasma.slice(0, 1).map((agendamento, i) => (
                  <div
                    key={`jacson-fantasma-${i}-${agendamento.hora}`}
                    className="absolute"
                    style={{ top: "42%", right: "8%" }}
                  >
                    <div className="crew-bob" style={{ animationDelay: "0.5s" }}>
                      <ClienteAndando 
                        toneClass="fill-warning"
                        horario={agendamento.hora}
                        profissional={agendamento.profissional}
                        ghost
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráfico de horários do dia - AGORA À DIREITA */}
            <div className="space-y-3 min-h-[260px] flex flex-col">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Agendamentos do Dia
                </span>
                <span className="text-xs bg-muted/50 px-2 py-1 rounded">{horaAtual} - Agora</span>
              </div>

              <div className="flex items-end gap-1 h-32 p-2 bg-muted/20 rounded-lg border border-border/30">
                {horariosOperacao.map((hora) => {
                  const count = movement?.byHour?.[hora] ?? 0;
                  const altura = count > 0 ? Math.max(15, (count / maxCount) * 100) : 8;
                  // Horário de pico da SEMANA (vermelho)
                  const isPicoSemana = horariosPicoSemana.includes(hora) && count > 0;
                  // Horário agendado do dia (laranja)
                  const temAgendamento = count > 0;

                  return (
                    <div key={hora} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className={cn(
                        "text-[10px] font-medium",
                        isPicoSemana ? "text-white" : temAgendamento ? "text-white" : "text-muted-foreground"
                      )}>
                        {count > 0 ? count : ""}
                      </span>
                      <div
                        className={cn(
                          "w-full rounded-t-sm transition-all duration-500 relative",
                          isPicoSemana
                            ? "bg-gradient-to-t from-destructive to-destructive/80"
                            : temAgendamento
                              ? "bg-gradient-to-t from-warning to-warning/80"
                              : "bg-muted/40"
                        )}
                        style={{ height: `${altura}%` }}
                        title={`${hora}h: ${count} agendamento(s)${isPicoSemana ? ' (Pico da semana)' : ''}`}
                      >
                        {isPicoSemana && count > 0 && (
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
                  <div className="w-3 h-3 bg-gradient-to-t from-destructive to-destructive/80 rounded-sm" />
                  <span>Pico da semana</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-t from-warning to-warning/80 rounded-sm" />
                  <span>Agendado hoje</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
