import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import authBackground from "@/assets/auth-background.jpg";
import ContactInfo from "@/components/ContactInfo";

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
export default function Reschedule() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<LojaConfig | null>(null);
  const [oldContact, setOldContact] = useState("");
  const [senha, setSenha] = useState("");
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [professional, setProfessional] = useState<string>("");
  const [slotsByDate, setSlotsByDate] = useState<Record<string, string[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [pros, setPros] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [service, setService] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [userBookings, setUserBookings] = useState<Agendamento[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Agendamento | null>(null);
  useEffect(() => {
    document.title = "Reagendar atendimento | ÁSPERUS";
  }, []);

  // Carregar configuração
  useEffect(() => {
    (async () => {
      const {
        data,
        error
      } = await supabase.from("info_loja").select("*").limit(1).maybeSingle();
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
        const {
          data,
          error
        } = await supabase.from("info_loja").select("nome_profissionais, escolha_serviços");
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
          const { data, error } = await supabase.functions.invoke('query_bookings', {
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
  const newDateStr = useMemo(() => {
    if (!newDate) return "";
    const y = newDate.getFullYear();
    const m = String(newDate.getMonth() + 1).padStart(2, "0");
    const d = String(newDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [newDate]);
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
      
      // Evitar loop infinito - máximo 30 dias de busca
      if (i > 30) break;
    }
    
    console.log('Data Brasil hoje (Reschedule):', brazilTime);
    console.log('Datas geradas sem domingos (Reschedule):', arr);
    return arr;
  }, []);
  async function fetchSlotsFor(dStr: string) {
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("get_available_slots", {
        body: {
          date: dStr,
          professional: professional || undefined
        }
      });
      if (error) {
        console.error('Erro ao buscar slots:', error);
        throw error;
      }
      return data?.slots as string[] || [];
    } catch (err) {
      console.error('Erro na função fetchSlotsFor:', err);
      return [];
    }
  }
  async function fetchAllSlots() {
    if (!config) return;
    setLoadingSlots(true);
    try {
      const results: [string, string[]][] = await Promise.all(nextSixDates.map(async (d): Promise<[string, string[]]> => {
        try {
          const s = await fetchSlotsFor(d);
          return [d, s];
        } catch (error) {
          console.error('Erro ao buscar slots para data', d, ':', error);
          return [d, [] as string[]];
        }
      }));
      const map: Record<string, string[]> = {};
      results.forEach(([d, s]) => {
        map[d] = s;
      });
      setSlotsByDate(map);
    } catch (e: any) {
      console.error('Erro geral ao buscar slots:', e);
      toast.error("Erro ao buscar horários disponíveis.");
    } finally {
      setLoadingSlots(false);
    }
  }
  useEffect(() => {
    if (!config) return;
    fetchAllSlots();
  }, [config, professional]);
  useEffect(() => {
    if (!config) return;
    const channel = supabase.channel("reschedule-slots").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "agendamentos_robustos"
    }, () => fetchAllSlots()).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [config, professional]);
  async function handleReschedule() {
    if (!selectedBooking) {
      toast.warning("Selecione o agendamento que deseja reagendar.");
      return;
    }
    if (!selectedSlot || !selectedDateStr) {
      toast.warning("Escolha uma nova data e horário.");
      return;
    }
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("reschedule_booking", {
        body: {
          oldName: selectedBooking.NOME,
          oldContact: selectedBooking.CONTATO,
          oldDate: selectedBooking.DATA,
          oldTime: selectedBooking.HORA,
          newDate: selectedDateStr,
          newTime: selectedSlot,
          professional,
          service,
          senha: selectedBooking.senha
        }
      });
      if (error) {
        console.error('Erro na edge function reschedule_booking:', error);
        
        // Verificar se é erro de validação específico
        if (error.message?.includes("não encontrado")) {
          toast.error("Agendamento não encontrado. Verifique os dados informados.");
        } else if (error.message?.includes("Horário não disponível")) {
          toast.error("Horário não disponível para reagendamento.");
        } else {
          toast.error("Erro ao reagendar. Verifique os dados e tente novamente.");
        }
        return;
      }

      // Redirecionar para página de confirmação
      navigate("/reschedule-confirmation", {
        state: {
          oldDate: selectedBooking.DATA,
          oldTime: selectedBooking.HORA,
          newDate: selectedDateStr,
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
    }
  }
  return <div className="min-h-screen bg-cover bg-center bg-no-repeat relative" style={{
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
                        {/* Círculo indicador de seleção - posicionado na curvatura da borda */}
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

        <div className="grid gap-6 md:grid-cols-3">
          {/* Nova Data */}
          <Card className="bg-card/95 backdrop-blur-sm border-warning/20">
            <CardHeader>
              <CardTitle className="text-warning">Nova Data</CardTitle>
            </CardHeader>
            <CardContent>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal border-warning/40", !newDate && "text-muted-foreground")}>
                    <CalendarIcon />
                    {newDate ? format(newDate, "PPP", {
                    locale: ptBR
                  }) : <span>Escolha uma nova data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="single" 
                    selected={newDate} 
                    onSelect={(selectedDate) => {
                      // Verificar se é domingo antes de aceitar a seleção
                      if (selectedDate && selectedDate.getDay() === 0) {
                        return; // Não permitir seleção de domingo
                      }
                      setNewDate(selectedDate);
                      setIsDatePickerOpen(false);
                    }} 
                    initialFocus 
                    className="p-3 pointer-events-auto [&_.rdp-head]:hidden [&_.rdp-weekdays]:hidden"
                    disabled={(date) => {
                      // Obter data atual do Brasil
                      const brazilTime = new Date().toLocaleString("en-CA", {
                        timeZone: "America/Sao_Paulo",
                        year: "numeric",
                        month: "2-digit", 
                        day: "2-digit"
                      }).split('T')[0];
                      
                      const [year, month, day] = brazilTime.split('-').map(Number);
                      const today = new Date(year, month - 1, day);
                      today.setHours(0, 0, 0, 0);
                      
                      const targetDate = new Date(date);
                      targetDate.setHours(0, 0, 0, 0);
                      
                      return targetDate < today || date.getDay() === 0; // Bloquear datas passadas e domingos
                    }}
                    modifiers={{
                      disabled: (date) => date.getDay() === 0 // Desabilitar visualmente os domingos
                    }}
                    classNames={{
                      head_row: "hidden",
                      head_cell: "hidden",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

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
                  {pros.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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

        {/* Novos Horários */}
        <Card className="mt-6 bg-card/95 backdrop-blur-sm border-warning/20">
          <CardHeader>
            <CardTitle className="text-warning">Novos Horários Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            {!config ? <p className="text-sm text-muted-foreground">Carregando configurações...</p> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {nextSixDates.map(d => <div key={d} className="space-y-2">
                    <div className="text-sm font-medium mx-[5px] my-[5px] py-[5px] px-[5px] rounded-sm text-warning">
                      {(() => {
                        const [yy, mm, dd] = d.split("-").map(Number);
                        const localDate = new Date(yy, mm - 1, dd); // Interpretar como data local para evitar shift de fuso
                        return format(localDate, "PPP", { locale: ptBR });
                      })()}
                    </div>
                    {loadingSlots ? <div className="grid grid-cols-3 gap-2">
                        {Array.from({
                  length: 6
                }).map((_, i) => <div key={i} className="h-9 rounded-md bg-muted animate-pulse" />)}
                      </div> : slotsByDate[d]?.length ? <div className="flex flex-wrap gap-2">
                        {slotsByDate[d].map(s => {
                  const isSelected = selectedSlot === s && selectedDateStr === d;
                  return <Button key={s} variant={isSelected ? "default" : "secondary"} onClick={() => {
                    setSelectedSlot(s);
                    setSelectedDateStr(d);
                  }} size="sm" className={cn("mx-[4px] my-[4px] py-[4px] px-[4px] font-semibold text-base", isSelected && "bg-warning hover:bg-warning/90 text-warning-foreground")}>
                              {s}
                            </Button>;
                })}
                      </div> : <p className="text-sm text-muted-foreground">Nenhum horário disponível.</p>}
                  </div>)}
              </div>}
          </CardContent>
        </Card>

        {/* Botão reagendar */}
        <Card className="mt-6 bg-card/95 backdrop-blur-sm border-warning/20">
          <CardContent className="pt-6">
            <Button 
              onClick={handleReschedule} 
              disabled={!selectedBooking || !selectedSlot || !selectedDateStr} 
              className="w-full bg-warning hover:bg-warning/90 text-warning-foreground text-xl font-bold"
            >
              REAGENDAR
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
    </div>;
}
