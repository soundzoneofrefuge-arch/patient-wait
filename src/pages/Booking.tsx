
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, CheckCircle2, Store } from "lucide-react";
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

// Validação de contato brasileiro (8-11 dígitos numéricos)
function isValidBrazilContact(contact: string): boolean {
  const digits = contact.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 11;
}

export default function Booking() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<LojaConfig | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [professional, setProfessional] = useState<string>("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [slotsByDate, setSlotsByDate] = useState<Record<string, string[]>>({});
  const [slotsByProDateFirst, setSlotsByProDateFirst] = useState<Record<string, Record<string, string[]>>>({});
  const [specialInfoByDate, setSpecialInfoByDate] = useState<Record<string, {
    isClosed?: boolean;
    closedMessage?: string;
    isSpecialHours?: boolean;
    specialHoursMessage?: string;
    specialHoursOpening?: string;
    specialHoursClosing?: string;
    isHoliday?: boolean;
    holiday?: { descricao: string };
  }>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [pros, setPros] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [service, setService] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Verificar se o formulário é válido para habilitar botão luminoso
  const isFormValid = useMemo(() => {
    return isValidBrazilContact(contact) && name.trim() !== "" && selectedSlot && selectedDateStr && professional && service;
  }, [contact, name, selectedSlot, selectedDateStr, professional, service]);

  useEffect(() => {
    document.title = "Agendar atendimento | ÁSPERUS";
  }, []);

  // Carregar configuração
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("info_loja").select("*").limit(1).maybeSingle();
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
        const { data, error } = await supabase.from("info_loja").select("nome_profissionais, escolha_serviços");
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

  const dateStr = useMemo(() => {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [date]);

  // Gerar próximas 6 datas a partir do dia atual (Brasil timezone) - excluindo domingos
  const nextSixDates = useMemo(() => {
    const arr: string[] = [];
    
    // Obter data atual do Brasil usando toLocaleString
    const brazilTime = new Date().toLocaleString("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit", 
      day: "2-digit"
    }).split('T')[0]; // Formato YYYY-MM-DD
    
    // Converter para objeto Date baseado na data local do Brasil
    const [year, month, day] = brazilTime.split('-').map(Number);
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
    
    console.log('Data Brasil hoje:', brazilTime);
    console.log('Datas geradas (sem domingos):', arr);
    return arr;
  }, []);

  async function fetchSlotsFor(dStr: string) {
    console.log('Buscando slots para:', {
      date: dStr,
      professional
    });
    try {
      const { data, error } = await supabase.functions.invoke("get-available-slots", {
        body: {
          date: dStr,
          professional: professional || undefined
        }
      });
      if (error) {
        console.error('Erro detalhado ao buscar slots:', error);
        throw error;
      }
      console.log('Slots retornados para', dStr, ':', data);
      
      // Retornar dados completos incluindo informações especiais
      return {
        slots: data?.slots as string[] || [],
        isClosed: data?.isClosed || false,
        closedMessage: data?.closedMessage || null,
        isSpecialHours: data?.isSpecialHours || false,
        specialHoursMessage: data?.specialHoursMessage || null,
        specialHoursOpening: data?.specialHoursOpening || null,
        specialHoursClosing: data?.specialHoursClosing || null,
        isHoliday: data?.isHoliday || false,
        holiday: data?.holiday || null
      };
    } catch (err) {
      console.error('Erro na função fetchSlotsFor:', err);
      return { slots: [], isClosed: false, isSpecialHours: false, isHoliday: false };
    }
  }

  async function fetchAllSlots() {
    if (!config) {
      console.log('Não buscando slots - configuração não carregada');
      return;
    }
    console.log('Iniciando busca de slots para as datas:', nextSixDates);
    console.log('Profissional selecionado:', professional);
    setLoadingSlots(true);
    try {
      const results = await Promise.all(nextSixDates.map(async (d) => {
        try {
          const result = await fetchSlotsFor(d);
          console.log(`Resultado para ${d}:`, result);
          return { date: d, ...result };
        } catch (error) {
          console.error('Erro ao buscar slots para data', d, ':', error);
          return { date: d, slots: [] as string[], isClosed: false, isSpecialHours: false, isHoliday: false };
        }
      }));
      
      const slotsMap: Record<string, string[]> = {};
      const specialInfoMap: Record<string, any> = {};
      
      results.forEach((r) => {
        slotsMap[r.date] = r.slots;
        specialInfoMap[r.date] = {
          isClosed: r.isClosed,
          closedMessage: r.closedMessage,
          isSpecialHours: r.isSpecialHours,
          specialHoursMessage: r.specialHoursMessage,
          specialHoursOpening: r.specialHoursOpening,
          specialHoursClosing: r.specialHoursClosing,
          isHoliday: r.isHoliday,
          holiday: r.holiday
        };
      });
      
      console.log('Mapa final de slots:', slotsMap);
      console.log('Mapa de informações especiais:', specialInfoMap);
      setSlotsByDate(slotsMap);
      setSpecialInfoByDate(specialInfoMap);
    } catch (e: any) {
      console.error('Erro geral ao buscar slots:', e);
      toast.error("Erro ao buscar horários disponíveis.");
    } finally {
      setLoadingSlots(false);
    }
  }

  // Função para buscar slots de um profissional específico para a primeira data
  async function fetchSlotsForProfessional(pro: string, dateStr: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.functions.invoke("get-available-slots", {
        body: {
          date: dateStr,
          professional: pro
        }
      });
      if (error) throw error;
      return data?.slots as string[] || [];
    } catch {
      return [];
    }
  }

  // Buscar slots por profissional para verificar disponibilidade (data selecionada)
  useEffect(() => {
    if (!config || pros.length === 0 || !date) return;
    
    const selectedDateStr = (() => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    })();
    
    const fetchAllProsSlots = async () => {
      const results: Record<string, string[]> = {};
      await Promise.all(pros.map(async (p) => {
        results[p] = await fetchSlotsForProfessional(p, selectedDateStr);
      }));
      setSlotsByProDateFirst(prev => ({ ...prev, [selectedDateStr]: results }));
    };
    fetchAllProsSlots();
  }, [config, pros, date]);

  // Atualização automática ao mudar data/profissional
  useEffect(() => {
    if (!config) return;
    console.log('useEffect disparado - fetchAllSlots');
    fetchAllSlots();
  }, [config, professional]);

  // Realtime para atualizar slots quando houver mudanças 
  useEffect(() => {
    if (!config) return;
    const channel = supabase.channel("booking-slots").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "agendamentos_robustos"
    }, () => fetchAllSlots()).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [config, professional]);

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
    if (!selectedSlot || !selectedDateStr) {
      toast.warning("Escolha um horário disponível.");
      return;
    }
    try {
      console.log('Dados do agendamento:', {
        date: selectedDateStr,
        time: selectedSlot,
        name,
        contact,
        professional,
        service
      });
      const { data, error } = await supabase.functions.invoke("book-slot", {
        body: {
          date: selectedDateStr,
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
          date: selectedDateStr,
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
      
      // Verificar se a resposta contém informação sobre horário já agendado
      if (e?.message?.includes("O horário selecionado já possui agendamento")) {
        toast.error("O horário selecionado já possui agendamento. Por favor, atualize a página e escolha outro horário disponível.", {
          duration: 6000
        });
        // Recarregar slots automaticamente após alguns segundos
        setTimeout(() => {
          fetchAllSlots();
        }, 2000);
      } else {
        const msg = e?.message || "Erro ao confirmar agendamento.";
        toast.error(msg.includes("duplicate") ? "Horário indisponível." : msg);
      }
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
            <h1 className="font-bold text-primary text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
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

        <div className="grid gap-6 md:grid-cols-3">
          {/* Data */}
          <Card className={cn(date && "ring-2 ring-primary")}>
            <CardHeader>
              <CardTitle className={cn(date && "text-primary")}>Data</CardTitle>
            </CardHeader>
            <CardContent>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                      date && "bg-primary text-white hover:bg-primary/90 border-primary"
                    )}
                  >
                    <CalendarIcon />
                    {date ? format(date, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="single" 
                    selected={date} 
                    onSelect={newDate => {
                      setDate(newDate);
                      setIsDatePickerOpen(false);
                    }} 
                    initialFocus 
                    className={cn("p-3 pointer-events-auto [&_.rdp-head]:hidden [&_.rdp-weekdays]:hidden")}
                    disabled={(selectedDate) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const target = new Date(selectedDate);
                      target.setHours(0, 0, 0, 0);
                      return target < today || selectedDate.getDay() === 0;
                    }}
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

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
                  {pros.map(p => {
                    // Verificar se profissional está esgotado somente quando uma data foi selecionada
                    const currentDateStr = date ? (() => {
                      const y = date.getFullYear();
                      const m = String(date.getMonth() + 1).padStart(2, "0");
                      const d = String(date.getDate()).padStart(2, "0");
                      return `${y}-${m}-${d}`;
                    })() : null;
                    
                    const proSlots = currentDateStr ? slotsByProDateFirst[currentDateStr]?.[p] : undefined;
                    const isEsgotado = currentDateStr && proSlots !== undefined && proSlots.length === 0;
                    
                    return (
                      <SelectItem key={p} value={p}>
                        {p}{isEsgotado && " - Esgotado para a data selecionada"}
                      </SelectItem>
                    );
                  })}
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

        {/* Horários */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Horários Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            {!config ? <p className="text-sm text-muted-foreground">Carregando configurações...</p> : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {nextSixDates.map(d => {
                  const specialInfo = specialInfoByDate[d];
                  const isClosed = specialInfo?.isClosed;
                  const isSpecialHours = specialInfo?.isSpecialHours;
                  const isHoliday = specialInfo?.isHoliday;
                  
                  return (
                    <div key={d} className="space-y-2">
                      <div className="text-sm font-medium mx-[5px] my-[5px] py-[5px] px-[5px] rounded-sm">
                        {format(new Date(d + 'T12:00:00'), "PPP", { locale: ptBR })}
                      </div>
                      
                      {/* Alerta de Horário Especial */}
                      {isSpecialHours && !isClosed && (
                        <div className="p-2 rounded-md bg-warning/20 border border-warning/50 text-warning text-xs">
                          <span className="font-semibold">⚠️ Horário Especial: </span>
                          {specialInfo?.specialHoursOpening} - {specialInfo?.specialHoursClosing}
                          {specialInfo?.specialHoursMessage && (
                            <span className="block mt-1">{specialInfo.specialHoursMessage}</span>
                          )}
                        </div>
                      )}
                      
                      {loadingSlots ? (
                        <div className="grid grid-cols-3 gap-2">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-9 rounded-md bg-muted animate-pulse" />
                          ))}
                        </div>
                      ) : isClosed ? (
                        /* Loja Fechada - Mensagem em vermelho claro com letras brancas */
                        <div className="p-3 rounded-md bg-red-400 text-white text-center font-semibold">
                          {specialInfo?.closedMessage || "Loja Fechada"}
                        </div>
                      ) : isHoliday ? (
                        /* Feriado */
                        <div className="p-3 rounded-md bg-destructive/20 border border-destructive/50 text-destructive text-center text-sm">
                          🎉 {specialInfo?.holiday?.descricao || "Feriado"}
                        </div>
                      ) : slotsByDate[d]?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {slotsByDate[d].map(s => {
                            const isSelected = selectedSlot === s && selectedDateStr === d;
                            return (
                              <Button
                                key={s}
                                variant={isSelected ? "default" : "secondary"}
                                onClick={() => {
                                  setSelectedSlot(s);
                                  setSelectedDateStr(d);
                                }}
                                size="sm"
                                className="mx-[4px] my-[4px] py-[4px] px-[4px] font-semibold text-base"
                              >
                                {s}
                              </Button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhum horário disponível.</p>
                      )}
                    </div>
                  );
                })}
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
              <Input id="contact" value={contact} onChange={e => setContact(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Button
                onClick={handleBook}
                disabled={!isFormValid}
                className={cn(
                  "w-full text-xl font-bold transition-all duration-300",
                  isFormValid 
                    ? "bg-warning text-white hover:bg-warning/90 shadow-[0_0_20px_rgba(245,158,11,0.6)]" 
                    : "bg-muted/50 text-muted-foreground"
                )}
              >
                AGENDAR
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
                {format(new Date(booking.DATA), "PPP", { locale: ptBR })} às {String(booking.HORA).slice(0, 5)}
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
