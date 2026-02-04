import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Store, Loader2 } from "lucide-react";
import { toast } from "sonner";
import authBackground from "@/assets/auth-background.jpg";
import ConsultaAgendamentos from "@/components/ConsultaAgendamentos";
import ContactInfo from "@/components/ContactInfo";
import MovimentacaoDia from "@/components/MovimentacaoDia";

interface LojaConfig {
  name?: string;
  opening_time?: string;
  closing_time?: string;
  slot_interval_minutes?: number;
  nome_profissionais?: string;
  escolha_serviços?: string;
  instructions?: string;
}

interface SpecialInfo {
  isClosed?: boolean;
  closedMessage?: string;
  isSpecialHours?: boolean;
  specialHoursMessage?: string;
  specialHoursOpening?: string;
  specialHoursClosing?: string;
  isHoliday?: boolean;
  holiday?: { descricao: string };
}

// Validação de contato brasileiro (8-11 dígitos numéricos)
function isValidBrazilContact(contact: string): boolean {
  const digits = contact.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 11;
}

export default function Booking() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<LojaConfig | null>(null);
  const [professional, setProfessional] = useState<string>("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  
  // OTIMIZAÇÃO: Estado para data selecionada via cards (não mais busca inicial)
  const [selectedDateCard, setSelectedDateCard] = useState<string | null>(null);
  const [slotsForSelectedDate, setSlotsForSelectedDate] = useState<string[]>([]);
  const [specialInfo, setSpecialInfo] = useState<SpecialInfo | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const [booking, setBooking] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pros, setPros] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [service, setService] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  
  // Ref para debounce do Realtime
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Verificar se o formulário é válido para habilitar botão luminoso
  const isFormValid = useMemo(() => {
    return isValidBrazilContact(contact) && name.trim() !== "" && selectedSlot && selectedDateCard && professional && service;
  }, [contact, name, selectedSlot, selectedDateCard, professional, service]);

  useEffect(() => {
    if (config?.name) {
      document.title = `${config.name} | Agendamento`;
    }
  }, [config?.name]);

  // Carregar configuração
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("info_loja_public").select("*").limit(1).maybeSingle();
      if (error) {
        console.error(error);
        toast.error("Não foi possível carregar as configurações.");
        return;
      }
      setConfig(data || {});
    })();
  }, []);

  // Carregar profissionais e serviços de todas as linhas da tabela
  useEffect(() => {
    const loadProfissionaisEServicos = async () => {
      try {
        const { data, error } = await supabase.from("info_loja_public").select("nome_profissionais, escolha_serviços");
        if (error) {
          console.error("Erro ao carregar profissionais e serviços:", error);
          return;
        }

        // Combinar todos os profissionais de todas as linhas
        const allProfissionais = data?.map((row: any) => row.nome_profissionais || "").join(";").split(/[;,\n]/).map(s => s.trim()).filter(Boolean) || [];

        // Combinar todos os serviços de todas as linhas
        const allServicos = data?.map((row: any) => row.escolha_serviços || "").join(";").split(/[;,\n]/).map(s => s.trim()).filter(Boolean) || [];
        setPros([...new Set(allProfissionais)]); // Remove duplicatas
        setServices([...new Set(allServicos)]); // Remove duplicatas

        console.log("Profissionais carregados:", allProfissionais);
        console.log("Serviços carregados:", allServicos);
      } catch (err) {
        console.error("Erro ao buscar profissionais e serviços:", err);
      }
    };
    loadProfissionaisEServicos();
  }, []);

  // Obter data/hora atual do Brasil
  const brazilNow = useMemo(() => {
    const now = new Date();
    const brazilDate = now.toLocaleString("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).split('T')[0];
    
    const brazilTimeStr = now.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    });
    
    return { date: brazilDate, time: brazilTimeStr };
  }, []);

  // Verificar se o horário de funcionamento já passou para a data de hoje
  const isClosingTimePassed = useMemo(() => {
    if (!config?.closing_time) return false;
    
    // Comparar hora atual com closing_time
    const [currentHour, currentMin] = brazilNow.time.split(':').map(Number);
    const closingTime = config.closing_time.slice(0, 5); // HH:MM
    const [closingHour, closingMin] = closingTime.split(':').map(Number);
    
    const currentMinutes = currentHour * 60 + currentMin;
    const closingMinutes = closingHour * 60 + closingMin;
    
    return currentMinutes >= closingMinutes;
  }, [config?.closing_time, brazilNow.time]);

  // Gerar próximas 6 datas a partir do dia atual (Brasil timezone) - excluindo domingos
  const nextSixDates = useMemo(() => {
    const arr: string[] = [];
    
    // Usar data do Brasil já calculada
    const [year, month, day] = brazilNow.date.split('-').map(Number);
    const today = new Date(year, month - 1, day); // month é 0-indexed
    
    let i = 0;
    while (arr.length < 6) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      
      // Pular domingos (0 = domingo)
      if (targetDate.getDay() !== 0) {
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, "0");
        const d = String(targetDate.getDate()).padStart(2, "0");
        arr.push(`${y}-${m}-${d}`);
      }
      i++;
    }
    
    console.log('Data Brasil hoje:', brazilNow.date);
    console.log('Datas geradas (sem domingos):', arr);
    return arr;
  }, [brazilNow.date]);

  // OTIMIZAÇÃO: Buscar slots APENAS para uma data específica
  const fetchSlotsForDate = useCallback(async (dStr: string) => {
    if (!config?.opening_time || !config?.closing_time || !config?.slot_interval_minutes) {
      console.log('Config não carregada ainda');
      return;
    }
    
    console.log('Buscando slots para:', { date: dStr, professional });
    setLoadingSlots(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("get-available-slots", {
        body: {
          date: dStr,
          professional: professional || undefined,
          // OTIMIZAÇÃO: Enviar parâmetros de horário do frontend
          opening_time: config.opening_time,
          closing_time: config.closing_time,
          slot_interval_minutes: config.slot_interval_minutes
        }
      });
      
      if (error) {
        console.error('Erro ao buscar slots:', error);
        throw error;
      }
      
      console.log('Slots retornados para', dStr, ':', data);
      
      setSlotsForSelectedDate(data?.slots || []);
      setSpecialInfo({
        isClosed: data?.isClosed || false,
        closedMessage: data?.closedMessage || null,
        isSpecialHours: data?.isSpecialHours || false,
        specialHoursMessage: data?.specialHoursMessage || null,
        specialHoursOpening: data?.specialHoursOpening || null,
        specialHoursClosing: data?.specialHoursClosing || null,
        isHoliday: data?.isHoliday || false,
        holiday: data?.holiday || null
      });
      
    } catch (err) {
      console.error('Erro na função fetchSlotsForDate:', err);
      toast.error("Erro ao buscar horários. Tente novamente.");
      setSlotsForSelectedDate([]);
      setSpecialInfo(null);
    } finally {
      setLoadingSlots(false);
    }
  }, [config, professional]);

  // Handler para clique no card de data
  const handleDateCardClick = useCallback((dateStr: string) => {
    // Limpar seleção de horário anterior
    setSelectedSlot(null);
    setSelectedDateCard(dateStr);
    
    // Só buscar slots se profissional já estiver selecionado
    if (professional) {
      fetchSlotsForDate(dateStr);
    }
  }, [fetchSlotsForDate, professional]);

  // Buscar slots quando profissional mudar (se já há data selecionada)
  useEffect(() => {
    if (selectedDateCard && professional && config) {
      // Limpar slot selecionado pois profissional mudou
      setSelectedSlot(null);
      setSlotsForSelectedDate([]);
      fetchSlotsForDate(selectedDateCard);
    }
  }, [professional]);

  // OTIMIZAÇÃO: Realtime com debounce de 1.5s - monitora APENAS a data selecionada
  useEffect(() => {
    if (!config || !selectedDateCard) return;
    
    const channel = supabase
      .channel("booking-slots")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "agendamentos_robustos"
      }, (payload: any) => {
        // Verificar se a mudança afeta a data selecionada
        const changedDate = payload.new?.DATA || payload.old?.DATA;
        
        if (changedDate === selectedDateCard) {
          console.log('Realtime: mudança detectada na data selecionada, aplicando debounce...');
          
          // Cancelar timer anterior
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          
          // Novo timer de 1.5s
          debounceTimerRef.current = setTimeout(() => {
            console.log('Realtime: atualizando slots após debounce');
            fetchSlotsForDate(selectedDateCard);
          }, 1500);
        }
      })
      .subscribe();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [config, selectedDateCard, professional, fetchSlotsForDate]);

  // Handler para seleção de horário com validação
  const handleSlotSelect = useCallback((slot: string) => {
    // Verificar se o slot ainda está disponível
    if (!slotsForSelectedDate.includes(slot)) {
      toast.error("Este horário não está mais disponível. Escolha outro.");
      return;
    }
    setSelectedSlot(slot);
  }, [slotsForSelectedDate]);

  async function handleBook() {
    if (!name || !contact) {
      toast.warning("Preencha nome e contato.");
      return;
    }
    if (!professional) {
      toast.warning("Selecione um profissional.");
      return;
    }
    if (!service) {
      toast.warning("Selecione um serviço.");
      return;
    }
    if (!selectedSlot || !selectedDateCard) {
      toast.warning("Escolha um horário disponível.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Dados do agendamento:', {
        date: selectedDateCard,
        time: selectedSlot,
        name,
        contact,
        professional,
        service
      });
      
      const { data, error } = await supabase.functions.invoke("book-slot", {
        body: {
          date: selectedDateCard,
          time: selectedSlot,
          name,
          contact,
          professional,
          service
        }
      });
      
      if (error) {
        console.error('Erro na edge function book_slot:', error);
        throw error;
      }
      
      console.log('Agendamento criado com sucesso:', data);

      // Redirecionar para página de confirmação
      navigate("/booking-confirmation", {
        state: {
          date: selectedDateCard,
          time: selectedSlot,
          name,
          contact,
          professional,
          service,
          senha: data?.booking?.senha
        }
      });
    } catch (e: any) {
      console.error('Erro completo ao agendar:', e);
      
      // Verificar se é conflito de horário (409)
      if (e?.message?.includes("já possui agendamento") || 
          e?.context?.status === 409) {
        toast.error(
          "Este horário foi reservado por outra pessoa. Atualizando horários disponíveis...",
          { duration: 5000 }
        );
        
        // Limpar seleção
        setSelectedSlot(null);
        
        // Recarregar slots da data selecionada
        if (selectedDateCard) {
          await fetchSlotsForDate(selectedDateCard);
        }
        return;
      }
      
      // Outros erros
      const msg = e?.message || "Erro ao confirmar agendamento.";
      toast.error(msg.includes("duplicate") ? "Horário indisponível." : msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat relative" style={{
      backgroundImage: `url(${authBackground})`
    }}>
      {/* Overlay escuro para melhor legibilidade */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      <main className="container mx-auto px-6 py-8 relative z-10">
        <header className="mb-8 text-center relative">
          {/* Botões superiores com layout responsivo */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 sm:mb-8">
            <div className="flex gap-2 order-2 sm:order-1">
              <Button 
                onClick={() => navigate("/cancel")} 
                className="text-slate-50 bg-red-600 hover:bg-red-500 text-xs sm:text-sm px-3 sm:px-4"
              >
                CANCELAR
              </Button>
              <Button 
                onClick={() => navigate("/reschedule")} 
                className="bg-warning hover:bg-warning/90 text-slate-50 text-xs sm:text-sm px-3 sm:px-4"
              >
                REAGENDAR
              </Button>
            </div>
            <div className="order-1 sm:order-2 flex flex-col gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate("/auth")}
                className="text-xs sm:text-sm px-3 sm:px-4"
              >
                ACESSO ADM
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/loja")}
                className="text-xs sm:text-sm px-3 sm:px-4 border-primary/50 hover:bg-primary/10 hover:border-primary"
              >
                <Store className="h-4 w-4 mr-1" />
                LOJA
              </Button>
            </div>
          </div>
          
          {/* Título responsivo */}
          <div className="space-y-2">
            <h1 className="font-bold text-primary text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
              {config?.name || "Agendar Atendimento"}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Informe Seus Dados para Agendamento
            </p>
          </div>
        </header>

        {/* Consulta de Agendamentos + Movimentação do Dia */}
        <section
          aria-label="Consulta e movimentação"
          className="grid gap-6 md:grid-cols-2 mb-6"
        >
          <ConsultaAgendamentos />
          <MovimentacaoDia />
        </section>

        {/* OTIMIZAÇÃO: Cards de data clicáveis */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Escolha a Data</CardTitle>
            <p className="text-sm text-muted-foreground">Clique em uma data para ver os horários disponíveis</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {nextSixDates.map(d => {
                const dateObj = new Date(d + 'T12:00:00');
                const isSelected = selectedDateCard === d;
                const isToday = d === brazilNow.date;
                const isTodayAndClosed = isToday && isClosingTimePassed;
                
                return (
                  <Card
                    key={d}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50 relative overflow-hidden",
                      isSelected && "ring-2 ring-primary border-primary bg-primary/10",
                      isTodayAndClosed && "opacity-60"
                    )}
                    onClick={() => !isTodayAndClosed && handleDateCardClick(d)}
                  >
                    {/* Tarja vermelha esmaecida quando horário passou */}
                    {isTodayAndClosed && (
                      <div className="absolute inset-0 bg-destructive/30 z-10 pointer-events-none" />
                    )}
                    <CardContent className="p-3 text-center relative z-0">
                      <p className="text-xs text-muted-foreground capitalize">
                        {format(dateObj, "EEE", { locale: ptBR })}
                      </p>
                      <p className={cn(
                        "text-lg font-bold",
                        isSelected && "text-primary",
                        isTodayAndClosed && "text-muted-foreground"
                      )}>
                        {format(dateObj, "dd", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(dateObj, "MMM", { locale: ptBR })}
                      </p>
                      {isTodayAndClosed && (
                        <p className="text-[10px] text-destructive font-medium mt-1">Encerrado</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profissional */}
          <Card className={cn(professional && "ring-2 ring-primary")}>
            <CardHeader>
              <CardTitle className={cn(professional && "text-primary")}>Profissional</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={professional || undefined} onValueChange={setProfessional}>
                <SelectTrigger className={cn(professional && "bg-primary text-white border-primary [&>svg]:text-white")}>
                  <SelectValue placeholder="Selecione um profissional" />
                </SelectTrigger>
                <SelectContent>
                  {pros.map(p => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Serviço */}
          <Card className={cn(service && "ring-2 ring-primary")}>
            <CardHeader>
              <CardTitle className={cn(service && "text-primary")}>Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={service || undefined} onValueChange={setService}>
                <SelectTrigger className={cn(service && "bg-primary text-white border-primary [&>svg]:text-white")}>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Horários - Mostrar APENAS quando uma data for selecionada */}
        <Card className="mt-6">
          <CardHeader>
          <CardTitle>Horários Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDateCard || !professional ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {!selectedDateCard && !professional 
                  ? "Selecione uma data e um profissional para ver os horários"
                  : !selectedDateCard 
                    ? "Selecione uma data para ver os horários"
                    : "Selecione um profissional para ver os horários"
                }
              </p>
            ) : loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Carregando horários...</span>
              </div>
            ) : specialInfo?.isClosed ? (
              <div className="p-4 rounded-md bg-red-400 text-white text-center font-semibold">
                {specialInfo.closedMessage || "Loja Fechada"}
              </div>
            ) : specialInfo?.isHoliday ? (
              <div className="p-4 rounded-md bg-destructive/20 border border-destructive/50 text-destructive text-center">
                🎉 {specialInfo.holiday?.descricao || "Feriado"}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Alerta de Horário Especial */}
                {specialInfo?.isSpecialHours && (
                  <div className="p-3 rounded-md bg-warning/20 border border-warning/50 text-warning text-sm">
                    <span className="font-semibold">⚠️ Horário Especial: </span>
                    {specialInfo.specialHoursOpening} - {specialInfo.specialHoursClosing}
                    {specialInfo.specialHoursMessage && (
                      <span className="block mt-1">{specialInfo.specialHoursMessage}</span>
                    )}
                  </div>
                )}
                
                {/* Data selecionada */}
                <div className="text-sm font-medium text-primary">
                  {format(new Date(selectedDateCard + 'T12:00:00'), "PPP", { locale: ptBR })}
                </div>
                
                {/* Horários */}
                {slotsForSelectedDate.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {slotsForSelectedDate.map(s => {
                      const isSelected = selectedSlot === s;
                      return (
                        <Button
                          key={s}
                          variant={isSelected ? "default" : "secondary"}
                          onClick={() => handleSlotSelect(s)}
                          size="sm"
                          className="mx-[4px] my-[4px] py-[4px] px-[4px] font-semibold text-base"
                        >
                          {s}
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum horário disponível para esta data.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dados do cliente */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Seus Dados</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="mx-[12px] my-[12px] py-[12px] px-[12px]">Nome</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact" className="mx-[12px] my-[12px] py-[12px] px-[12px]">Contato</Label>
              <Input 
                id="contact" 
                value={contact} 
                onChange={e => setContact(e.target.value)} 
                placeholder="Mínimo 8 dígitos"
              />
            </div>
            <div className="md:col-span-2">
              <Button
                onClick={handleBook}
                disabled={!isFormValid || isSubmitting}
                className={cn(
                  "w-full text-xl font-bold transition-all duration-300",
                  isFormValid && !isSubmitting
                    ? "bg-warning text-white hover:bg-warning/90 shadow-[0_0_20px_rgba(245,158,11,0.6)]" 
                    : "bg-muted/50 text-muted-foreground"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    AGENDANDO...
                  </>
                ) : (
                  "AGENDAR"
                )}
              </Button>
              {!isFormValid && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Confirme e seja redirecionado(a) a confirmação de seu agendamento
                </p>
              )}
            </div>
          </CardContent>
        </Card>


        {/* Confirmação */}
        {booking && (
          <Card className="mt-6 border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <CheckCircle2 /> Agendamento confirmado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                {format(new Date(booking.DATA + 'T12:00:00'), "PPP", { locale: ptBR })} às {String(booking.HORA).slice(0, 5)}
                {booking.PROFISSIONAL ? ` com ${booking.PROFISSIONAL}` : ""}
              </p>
            </CardContent>
          </Card>
        )}
        
        <div className="max-w-2xl mx-auto mt-8">
          <ContactInfo />
        </div>
      </main>
    </div>
  );
}
