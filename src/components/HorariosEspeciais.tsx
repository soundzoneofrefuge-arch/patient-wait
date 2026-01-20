import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock, Store, Trash2, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";

interface HorarioEspecial {
  id: string;
  data: string;
  tipo: "horario_especial" | "fechado";
  mensagem: string | null;
  horario_abertura: string | null;
  horario_fechamento: string | null;
}

export function HorariosEspeciais() {
  const [horarios, setHorarios] = useState<HorarioEspecial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tipo, setTipo] = useState<"horario_especial" | "fechado">("horario_especial");
  const [mensagem, setMensagem] = useState("");
  const [horarioAbertura, setHorarioAbertura] = useState("09:00");
  const [horarioFechamento, setHorarioFechamento] = useState("18:00");

  useEffect(() => {
    fetchHorarios();
  }, []);

  async function fetchHorarios() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("horarios_especiais")
        .select("*")
        .order("data", { ascending: true });
      
      if (error) throw error;
      setHorarios((data || []) as HorarioEspecial[]);
    } catch (error) {
      console.error("Erro ao carregar horários especiais:", error);
      toast.error("Erro ao carregar horários especiais");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!date) {
      toast.warning("Selecione uma data");
      return;
    }

    const dateStr = format(date, "yyyy-MM-dd");
    
    // Verificar se já existe horário para esta data
    const existing = horarios.find(h => h.data === dateStr);
    if (existing) {
      toast.warning("Já existe uma configuração para esta data. Delete-a primeiro.");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        data: dateStr,
        tipo,
        mensagem: mensagem || null
      };

      if (tipo === "horario_especial") {
        payload.horario_abertura = horarioAbertura;
        payload.horario_fechamento = horarioFechamento;
      }

      const { error } = await supabase
        .from("horarios_especiais")
        .insert(payload);

      if (error) throw error;

      toast.success(tipo === "fechado" 
        ? "Fechamento registrado com sucesso!" 
        : "Horário especial salvo com sucesso!");
      
      // Reset form
      setDate(undefined);
      setMensagem("");
      setHorarioAbertura("09:00");
      setHorarioFechamento("18:00");
      setTipo("horario_especial");
      
      fetchHorarios();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar: " + (error?.message || "Tente novamente"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from("horarios_especiais")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Configuração removida com sucesso!");
      fetchHorarios();
    } catch (error: any) {
      console.error("Erro ao deletar:", error);
      toast.error("Erro ao remover: " + (error?.message || "Tente novamente"));
    }
  }

  const formatTime = (time: string | null) => {
    if (!time) return "";
    return time.slice(0, 5);
  };

  return (
    <Card className="border-warning/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warning">
          <Clock className="h-5 w-5" />
          Horários Especiais / Fechamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-4">
          <h3 className="font-semibold text-lg">Adicionar Nova Exceção</h3>
          
          {/* Toggle Tipo */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-background">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Loja Fechada</p>
                <p className="text-sm text-muted-foreground">
                  {tipo === "fechado" 
                    ? "A loja estará fechada neste dia" 
                    : "Definir horários diferentes para o dia"}
                </p>
              </div>
            </div>
            <Switch
              checked={tipo === "fechado"}
              onCheckedChange={(checked) => setTipo(checked ? "fechado" : "horario_especial")}
            />
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label>Data Específica</Label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                    date && "bg-warning/10 border-warning text-warning"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : "Escolha uma data"}
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
                  disabled={(selectedDate) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const target = new Date(selectedDate);
                    target.setHours(0, 0, 0, 0);
                    return target < today;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Horários (apenas se não for fechado) */}
          {tipo === "horario_especial" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horário de Abertura</Label>
                <Input
                  type="time"
                  value={horarioAbertura}
                  onChange={(e) => setHorarioAbertura(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Horário de Fechamento</Label>
                <Input
                  type="time"
                  value={horarioFechamento}
                  onChange={(e) => setHorarioFechamento(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Mensagem */}
          <div className="space-y-2">
            <Label>Mensagem de Aviso (opcional)</Label>
            <Input
              placeholder={tipo === "fechado" 
                ? "Ex: Fechado para manutenção" 
                : "Ex: Horário reduzido devido a evento"}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
            />
          </div>

          {/* Botão Salvar */}
          <Button 
            onClick={handleSave} 
            disabled={saving || !date}
            className="w-full bg-warning hover:bg-warning/90 text-white"
          >
            {saving ? "Salvando..." : "Salvar Configuração"}
          </Button>
        </div>

        {/* Lista de Horários Especiais */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Configurações Ativas</h3>
          
          {loading ? (
            <div className="text-center text-muted-foreground py-4">Carregando...</div>
          ) : horarios.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              Nenhum horário especial configurado
            </div>
          ) : (
            <div className="space-y-2">
              {horarios.map((h) => (
                <div 
                  key={h.id} 
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    h.tipo === "fechado" 
                      ? "bg-destructive/10 border-destructive/30" 
                      : "bg-warning/10 border-warning/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {h.tipo === "fechado" ? (
                      <X className="h-5 w-5 text-destructive" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-warning" />
                    )}
                    <div>
                      <p className="font-medium">
                        {format(new Date(h.data + 'T12:00:00'), "PPP", { locale: ptBR })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {h.tipo === "fechado" 
                          ? "Loja Fechada" 
                          : `${formatTime(h.horario_abertura)} - ${formatTime(h.horario_fechamento)}`}
                        {h.mensagem && ` • ${h.mensagem}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(h.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
