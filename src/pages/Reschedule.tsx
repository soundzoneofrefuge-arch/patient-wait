import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import authBackground from "@/assets/auth-background.jpg";
import ContactInfo from "@/components/ContactInfo";

// Validação de contato brasileiro (8-11 dígitos numéricos)
function isValidBrazilContact(contact: string): boolean {
  const digits = contact.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 11;
}

// Validação de senha (4 dígitos)
function isValidSenha(senha: string): boolean {
  return senha.length === 4;
}

interface Agendamento {
  id: string;
  NOME: string;
  CONTATO: string;
  DATA: string;
  HORA: string;
  PROFISSIONAL: string;
  servico: string;
  STATUS: string;
  senha: string;
}

interface LojaConfig {
  opening_time?: string;
  closing_time?: string;
  slot_interval_minutes?: number;
  nome_profissionais?: string;
  escolha_serviços?: string;
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

export default function Reschedule() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<LojaConfig | null>(null);
  const [oldContact, setOldContact] = useState("");
  const [senha, setSenha] = useState("");
  const [professional, setProfessional] = useState<string>("");
  
  // OTIMIZAÇÃO: Estado para data selecionada via cards
  const [selectedDateCard, setSelectedDateCard] = useState<string | null>(null);
  const [slotsForSelectedDate, setSlotsForSelectedDate] = useState<string[]>([]);
  const [specialInfo, setSpecialInfo] = useState<SpecialInfo | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const [pros, setPros] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [service, setService] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [userBookings, setUserBookings] = useState<Agendamento[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Agendamento | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Ref para debounce do Realtime
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Verificar se pode reagendar
  const canReschedule = useMemo(() => {
    return isValidBrazilContact(oldContact) && isValidSenha(senha) && selectedBooking !== null && selectedSlot !== null && selectedDateCard !== null;
  }, [oldContact, senha, selectedBooking, selectedSlot, selectedDateCard]);

  useEffect(() => {
    document.title = "Reagendar atendimento | ÁSPERUS";
  }, []);

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

  // Carregar profissionais e serviços
  useEffect(() => {
    const loadProfissionaisEServicos = async () => {
      try {
        const { data, error } = await supabase.from("info_loja_public").select("nome_profissionais, escolha_serviços");
        if (error) {
          console.error("Erro ao carregar profissionais e serviços:", error);
          return;
        }
        const allProfissionais = data?.map((row: any) => row.nome_profissionais || "").join(";").split(/[;,\n]/).map(s => s.trim()).filter(Boolean) || [];
        const allServicos = data?.map((row: any) => row.escolha_serviços || "").join(";").split(/[;,\n]/).map(s => s.trim()).filter(Boolean) || [];
        setPros([...new Set(allProfissionais)]);
        setServices([...new Set(allServicos)]);
      } catch (err) {
        console.error("Erro ao buscar profissionais e serviços:", err);
      }
    };
    loadProfissionaisEServicos();
  }, []);

  // Buscar agendamentos do usuário quando contato e senha são preenchidos
  useEffect(() => {
    if (oldContact.length >= 10 && senha.length === 4) {
      const searchUserBookings = async () => {
        setLoadingBookings(true);
        try {
          const { data, error } = await supabase.functions.invoke('query-bookings', {
            body: { 
              contact: oldContact,
              senha
            }
          });

          if (error) {
            console.error("Erro ao buscar agendamentos:", error);
            setUserBookings([]);
            return;
          }

          setUserBookings(data?.bookings || []);
        } catch (err) {
          console.error("Erro na busca de agendamentos:", err);
          setUserBookings([]);
        } finally {
          setLoadingBookings(false);
        }
      };

      searchUserBookings();
    } else {
      setUserBookings([]);
    }
  }, [oldContact, senha]);

  // Gerar próximas 6 datas
  const nextSixDates = useMemo(() => {
    const arr: string[] = [];
    
    const brazilTime = new Date().toLocaleString("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit", 
      day: "2-digit"
    }).split('T')[0];
    
    const [year, month, day] = brazilTime.split('-').map(Number);
    const today = new Date(year, month - 1, day);
    
    let i = 0;
    while (arr.length < 6) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      
      if (targetDate.getDay() !== 0) {
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, "0");
        const d = String(targetDate.getDate()).padStart(2, "0");
        arr.push(`${y}-${m}-${d}`);
      }
      i++;
      
      if (i > 30) break;
    }
    
    console.log('Data Brasil hoje (Reschedule):', brazilTime);
    console.log('Datas geradas sem domingos (Reschedule):', arr);
    return arr;
  }, []);

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
    setSelectedSlot(null);
    setSelectedDateCard(dateStr);
    fetchSlotsForDate(dateStr);
  }, [fetchSlotsForDate]);

  // Rebuscar slots quando profissional mudar
  useEffect(() => {
    if (selectedDateCard && config) {
      setSelectedSlot(null);
      fetchSlotsForDate(selectedDateCard);
    }
  }, [professional]);

  // OTIMIZAÇÃO: Realtime com debounce de 1.5s
  useEffect(() => {
    if (!config || !selectedDateCard) return;
    
    const channel = supabase
      .channel("reschedule-slots")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "agendamentos_robustos"
      }, (payload: any) => {
        const changedDate = payload.new?.DATA || payload.old?.DATA;
        
        if (changedDate === selectedDateCard) {
          console.log('Realtime: mudança detectada na data selecionada, aplicando debounce...');
          
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          
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

  // Handler para seleção de horário
  const handleSlotSelect = useCallback((slot: string) => {
    if (!slotsForSelectedDate.includes(slot)) {
      toast.error("Este horário não está mais disponível. Escolha outro.");
      return;
    }
    setSelectedSlot(slot);
  }, [slotsForSelectedDate]);

  async function handleReschedule() {
    if (!selectedBooking) {
      toast.warning("Selecione o agendamento que deseja reagendar.");
      return;
    }
    if (!selectedSlot || !selectedDateCard) {
      toast.warning("Escolha uma nova data e horário.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("reschedule-booking", {
        body: {
          oldName: selectedBooking.NOME,
          oldContact: selectedBooking.CONTATO,
          oldDate: selectedBooking.DATA,
          oldTime: selectedBooking.HORA,
          newDate: selectedDateCard,
          newTime: selectedSlot,
          professional,
          service,
          senha: selectedBooking.senha
        }
      });
      
      if (error) {
        console.error('Erro na edge function reschedule_booking:', error);
        
        // Verificar se é conflito de horário
        if (error.message?.includes("já possui agendamento") || 
            error.context?.status === 409) {
          toast.error(
            "Este horário foi reservado por outra pessoa. Atualizando horários disponíveis...",
            { duration: 5000 }
          );
          setSelectedSlot(null);
          if (selectedDateCard) {
            await fetchSlotsForDate(selectedDateCard);
          }
          return;
        }
        
        if (error.message?.includes("não encontrado")) {
          toast.error("Agendamento não encontrado. Verifique os dados informados.");
        } else if (error.message?.includes("Horário não disponível")) {
          toast.error("Horário não disponível para reagendamento.");
        } else {
          toast.error("Erro ao reagendar. Verifique os dados e tente novamente.");
        }
        return;
      }

      navigate("/reschedule-confirmation", {
        state: {
          oldDate: selectedBooking.DATA,
          oldTime: selectedBooking.HORA,
          newDate: selectedDateCard,
          newTime: selectedSlot,
          contact: selectedBooking.CONTATO,
          professional,
          service,
          senha: data?.booking?.senha
        }
      });
    } catch (e: any) {
      console.error('Erro completo ao reagendar:', e);
      toast.error("Erro ao reagendar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat relative" style={{
      backgroundImage: `url(${authBackground})`
    }}>
      <div className="absolute inset-0 bg-black/50"></div>
      
      <main className="container mx-auto px-6 py-8 relative z-10">
        <header className="mb-8 text-center relative">
          <Button variant="outline" className="md:absolute md:top-0 md:left-0 flex items-center gap-2 mb-4 md:mb-0" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-warning">Reagendar Atendimento</h1>
          <p className="text-muted-foreground">Informe os dados do agendamento atual e escolha nova data/horário</p>
        </header>

        {/* Buscar agendamentos */}
        <Card className="mb-6 bg-card/95 backdrop-blur-sm border-warning/20">
          <CardHeader>
            <Alert className="mb-3 border-yellow-500/50 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-500">
                Atenção! Agendamentos passados não poderão ser consultados
              </AlertDescription>
            </Alert>
            <CardTitle className="text-warning">Buscar Agendamentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="oldContact">Contato (Telefone)</Label>
                <Input 
                  id="oldContact" 
                  value={oldContact} 
                  onChange={e => setOldContact(e.target.value)} 
                  placeholder="Digite um número de telefone válido para buscar agendamentos" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha (4 dígitos)</Label>
                <Input 
                  id="senha" 
                  placeholder="Digite os 4 dígitos" 
                  className="border-warning/40" 
                  maxLength={4}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agendamentos encontrados */}
        {oldContact && senha.length === 4 && (
          <Card className="mb-6 bg-card/95 backdrop-blur-sm border-warning/20">
            <CardHeader>
              <CardTitle className="text-warning">Seus Agendamentos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecione o agendamento que deseja reagendar
              </p>
            </CardHeader>
            <CardContent>
              {loadingBookings ? (
                <p className="text-sm text-muted-foreground">Buscando agendamentos...</p>
              ) : userBookings.length > 0 ? (
                <div className="grid gap-3">
                  {userBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className={cn(
                         "p-4 border rounded-lg cursor-pointer transition-colors relative",
                         selectedBooking?.id === booking.id
                           ? "border-warning bg-warning/10"
                           : "border-border hover:border-warning/50"
                      )}
                       onClick={() => setSelectedBooking(booking)}
                     >
                        {selectedBooking?.id === booking.id && (
                          <div className="absolute left-2 top-2 w-3 h-3 bg-warning rounded-full"></div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm ml-6">
                         <div>
                           <span className="font-medium text-warning">Nome:</span>
                           <p>{booking.NOME}</p>
                         </div>
                         <div>
                           <span className="font-medium text-warning">Data:</span>
                           <p>{format(new Date(booking.DATA + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}</p>
                         </div>
                         <div>
                           <span className="font-medium text-warning">Horário:</span>
                           <p>{booking.HORA.slice(0, 5)}</p>
                         </div>
                        <div>
                          <span className="font-medium text-warning">Profissional:</span>
                          <p>{booking.PROFISSIONAL || "Não especificado"}</p>
                        </div>
                      </div>
                      {booking.servico && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium text-warning">Serviço:</span>
                          <p>{booking.servico}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {oldContact ? "Nenhum agendamento futuro encontrado para este contato." : "Digite seu contato para buscar agendamentos."}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* OTIMIZAÇÃO: Cards de data clicáveis */}
        <Card className="mb-6 bg-card/95 backdrop-blur-sm border-warning/20">
          <CardHeader>
            <CardTitle className="text-warning">Escolha a Nova Data</CardTitle>
            <p className="text-sm text-muted-foreground">Clique em uma data para ver os horários disponíveis</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {nextSixDates.map(d => {
                const dateObj = new Date(d + 'T12:00:00');
                const isSelected = selectedDateCard === d;
                
                return (
                  <Card
                    key={d}
                    className={cn(
                      "cursor-pointer transition-all hover:border-warning/50",
                      isSelected && "ring-2 ring-warning border-warning bg-warning/10"
                    )}
                    onClick={() => handleDateCardClick(d)}
                  >
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground capitalize">
                        {format(dateObj, "EEE", { locale: ptBR })}
                      </p>
                      <p className={cn(
                        "text-lg font-bold",
                        isSelected && "text-warning"
                      )}>
                        {format(dateObj, "dd", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(dateObj, "MMM", { locale: ptBR })}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profissional */}
          <Card className="bg-card/95 backdrop-blur-sm border-warning/20">
            <CardHeader>
              <CardTitle className="text-warning">Profissional</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={professional || undefined} onValueChange={setProfessional}>
                <SelectTrigger className="border-warning/40">
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
          <Card className="bg-card/95 backdrop-blur-sm border-warning/20">
            <CardHeader>
              <CardTitle className="text-warning">Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={service || undefined} onValueChange={setService}>
                <SelectTrigger className="border-warning/40">
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
        <Card className="mt-6 bg-card/95 backdrop-blur-sm border-warning/20">
          <CardHeader>
            <CardTitle className="text-warning">Novos Horários Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDateCard ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Selecione uma data acima para ver os horários disponíveis
              </p>
            ) : loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-warning" />
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
                <div className="text-sm font-medium text-warning">
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
                          className={cn(
                            "mx-[4px] my-[4px] py-[4px] px-[4px] font-semibold text-base",
                            isSelected && "bg-warning hover:bg-warning/90 text-warning-foreground"
                          )}
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

        {/* Botão reagendar */}
        <Card className="mt-6 bg-card/95 backdrop-blur-sm border-warning/20">
          <CardContent className="pt-6">
            <Button 
              onClick={handleReschedule} 
              disabled={!canReschedule || isSubmitting} 
              className={cn(
                "w-full text-xl font-bold transition-all duration-300",
                canReschedule && !isSubmitting
                  ? "bg-warning text-white hover:bg-warning/90 shadow-[0_0_20px_rgba(245,158,11,0.6)]" 
                  : "bg-muted/50 text-muted-foreground"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  REAGENDANDO...
                </>
              ) : (
                "REAGENDAR"
              )}
            </Button>
            {!selectedBooking && oldContact && userBookings.length > 0 && (
              <p className="mt-2 text-sm text-muted-foreground text-center">
                Selecione um agendamento para reagendar
              </p>
            )}
            {!selectedSlot && selectedBooking && (
              <p className="mt-2 text-sm text-muted-foreground text-center">
                Escolha uma nova data e horário
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-8">
          <ContactInfo />
        </div>
      </main>
    </div>
  );
}
