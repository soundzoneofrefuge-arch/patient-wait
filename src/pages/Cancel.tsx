import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import authBackground from "@/assets/auth-background.jpg";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
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
}
export default function Cancel() {
  const navigate = useNavigate();
  const [contact, setContact] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userBookings, setUserBookings] = useState<Agendamento[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Agendamento | null>(null);

  // Verificar se pode cancelar
  const canCancel = useMemo(() => {
    return isValidBrazilContact(contact) && isValidSenha(senha) && selectedBooking !== null;
  }, [contact, senha, selectedBooking]);

  useEffect(() => {
    document.title = "Cancelar atendimento | ÁSPERUS";
  }, []);

  // Buscar agendamentos do usuário quando contato e senha são preenchidos
  useEffect(() => {
    if (contact.length >= 10 && senha.length === 4) {
      const searchUserBookings = async () => {
        setLoadingBookings(true);
        try {
          const { data, error } = await supabase.functions.invoke('query-bookings', {
            body: { 
              contact,
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
  }, [contact, senha]);
  async function handleCancel() {
    if (!selectedBooking) {
      toast.warning("Selecione o agendamento que deseja cancelar.");
      return;
    }
    
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("cancel-booking", {
        body: {
          name: selectedBooking.NOME,
          contact: selectedBooking.CONTATO,
          date: selectedBooking.DATA,
          time: selectedBooking.HORA,
          senha: senha
        }
      });
      if (error) {
        console.error('Erro na edge function cancel_booking:', error);
        
        // Verificar se é erro de validação específico
        if (error.message?.includes("não encontrado")) {
          toast.error("Agendamento não encontrado. Verifique os dados informados.");
        } else {
          toast.error("Erro ao cancelar. Verifique os dados e tente novamente.");
        }
        return;
      }

      // Redirecionar para página de confirmação
      navigate("/cancel-confirmation", {
        state: {
          name: selectedBooking.NOME,
          contact: selectedBooking.CONTATO,
          date: selectedBooking.DATA,
          time: selectedBooking.HORA,
          message: data?.message
        }
      });
    } catch (e: any) {
      console.error('Erro completo ao cancelar:', e);
      toast.error("Erro ao cancelar. Tente novamente.");
    } finally {
      setIsLoading(false);
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
          <h1 className="font-bold text-3xl text-red-600">Cancelar Atendimento</h1>
          <p className="text-slate-50">Informe os dados do agendamento que deseja cancelar</p>
        </header>

        <div className="max-w-4xl mx-auto">
          {/* Buscar agendamentos */}
          <Card className="mb-6 bg-card/95 backdrop-blur-sm border-destructive/20">
            <CardHeader>
              <Alert className="mb-3 border-yellow-500/50 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700 dark:text-yellow-500">
                  Atenção! Agendamentos passados não poderão ser consultados
                </AlertDescription>
              </Alert>
              <CardTitle className="text-center text-red-600">Buscar Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact">Contato (Telefone)</Label>
                  <Input 
                    id="contact" 
                    value={contact} 
                    onChange={e => setContact(e.target.value)} 
                    placeholder="Digite um número de telefone válido para buscar agendamentos" 
                    className="border-destructive/40" 
                    disabled={isLoading} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha (4 dígitos)</Label>
                  <Input 
                    id="senha" 
                    placeholder="Digite os 4 dígitos" 
                    className="border-destructive/40" 
                    maxLength={4}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agendamentos encontrados */}
          {contact && senha.length === 4 && (
            <Card className="mb-6 bg-card/95 backdrop-blur-sm border-destructive/20">
              <CardHeader>
                <CardTitle className="text-red-600">Seus Agendamentos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Selecione o agendamento que deseja cancelar
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
                           ? "border-destructive bg-destructive/10"
                           : "border-border hover:border-destructive/50"
                        )}
                       onClick={() => setSelectedBooking(booking)}
                     >
                        {/* Círculo indicador de seleção - posicionado na curvatura da borda */}
                        {selectedBooking?.id === booking.id && (
                          <div className="absolute left-2 top-2 w-3 h-3 bg-destructive rounded-full"></div>
                        )}
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm ml-6">
                          <div>
                            <span className="font-medium text-red-600">Nome:</span>
                            <p>{booking.NOME}</p>
                          </div>
                          <div>
                            <span className="font-medium text-red-600">Data:</span>
                            <p>{format(new Date(booking.DATA + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}</p>
                          </div>
                          <div>
                            <span className="font-medium text-red-600">Horário:</span>
                            <p>{booking.HORA.slice(0, 5)}</p>
                          </div>
                          <div>
                            <span className="font-medium text-red-600">Profissional:</span>
                            <p>{booking.PROFISSIONAL || "Não especificado"}</p>
                          </div>
                        </div>
                        {booking.servico && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium text-red-600">Serviço:</span>
                            <p>{booking.servico}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {contact ? "Nenhum agendamento futuro encontrado para este contato." : "Digite seu contato para buscar agendamentos."}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Botão cancelar */}
          <Card className="bg-card/95 backdrop-blur-sm border-destructive/20">
            <CardContent className="pt-6">
              <Button 
                onClick={handleCancel} 
                disabled={!canCancel || isLoading} 
                className={cn(
                  "w-full text-xl font-bold transition-all duration-300",
                  canCancel 
                    ? "bg-warning text-white hover:bg-warning/90 shadow-[0_0_20px_rgba(245,158,11,0.6)]" 
                    : "bg-muted/50 text-muted-foreground"
                )}
              >
                {isLoading ? "CANCELANDO..." : "CANCELAR AGENDAMENTO"}
              </Button>
              
              {!selectedBooking && contact && userBookings.length > 0 && (
                <p className="mt-2 text-sm text-muted-foreground text-center">
                  Selecione um agendamento para cancelar
                </p>
              )}
              
              {selectedBooking && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Você está prestes a cancelar o agendamento de <strong>{selectedBooking.NOME}</strong> para <strong>{format(new Date(selectedBooking.DATA + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}</strong> às <strong>{selectedBooking.HORA.slice(0, 5)}</strong>. Esta ação não pode ser desfeita.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="mt-8">
            <ContactInfo />
          </div>
        </div>
      </main>
    </div>;
}
