import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Search, Calendar, Clock, User, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export default function ConsultaAgendamentos() {
  const [contact, setContact] = useState("");
  const [senha, setSenha] = useState("");
  const [userBookings, setUserBookings] = useState<Agendamento[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    const searchUserBookings = async () => {
      if (!contact || !senha) {
        setUserBookings([]);
        return;
      }

      setLoadingBookings(true);
      try {
        const { data, error } = await supabase.functions.invoke('query-bookings', {
          body: { contact, senha }
        });

        if (error) {
          console.error('Erro ao buscar agendamentos:', error);
          setUserBookings([]);
          return;
        }

        setUserBookings(data?.bookings || []);
      } catch (err) {
        console.error('Erro na consulta:', err);
        setUserBookings([]);
      } finally {
        setLoadingBookings(false);
      }
    };

    searchUserBookings();
  }, [contact, senha]);

  return (
    <Card className="border-success/20 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <Alert className="mb-3 border-warning/30 bg-warning/5">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning text-sm">
            Agendamentos passados não poderão ser consultados
          </AlertDescription>
        </Alert>
        <CardTitle className="text-lg font-semibold text-success flex items-center gap-2">
          <Search className="h-5 w-5" />
          Consultar Agendamento
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Digite seu contato e senha para consultar seus agendamentos
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="consultaContact" className="text-xs uppercase tracking-wider text-muted-foreground">
              Contato (Telefone)
            </Label>
            <Input 
              id="consultaContact" 
              value={contact} 
              onChange={e => setContact(e.target.value)} 
              placeholder="Digite um número de telefone válido" 
              className="border-success/30 focus:border-success" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consultaSenha" className="text-xs uppercase tracking-wider text-muted-foreground">
              Senha (4 dígitos)
            </Label>
            <Input 
              id="consultaSenha" 
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="Digite os 4 dígitos" 
              className="border-success/30 focus:border-success font-mono text-center tracking-widest" 
              maxLength={4}
            />
          </div>
        </div>

        {contact && senha && (
          <div className="mt-4">
            {loadingBookings ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-success/30 border-t-success rounded-full animate-spin"></div>
                <span className="ml-3 text-sm text-muted-foreground">Buscando agendamentos...</span>
              </div>
            ) : userBookings.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-semibold text-success text-sm uppercase tracking-wider">
                  Seus Agendamentos ({userBookings.length})
                </h4>
                {userBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 border border-success/20 rounded-xl bg-success/5 hover:bg-success/10 transition-colors"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-success" />
                        <div>
                          <p className="text-xs text-muted-foreground">Nome</p>
                          <p className="font-medium text-foreground">{booking.NOME}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-success" />
                        <div>
                          <p className="text-xs text-muted-foreground">Data</p>
                          <p className="font-medium text-foreground">
                            {format(new Date(booking.DATA + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-success" />
                        <div>
                          <p className="text-xs text-muted-foreground">Horário</p>
                          <p className="font-medium text-foreground font-mono">{booking.HORA.slice(0, 5)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-success" />
                        <div>
                          <p className="text-xs text-muted-foreground">Profissional</p>
                          <p className="font-medium text-foreground">{booking.PROFISSIONAL || "—"}</p>
                        </div>
                      </div>
                    </div>
                    {booking.servico && (
                      <div className="mt-3 pt-3 border-t border-success/10">
                        <p className="text-xs text-muted-foreground">Serviço</p>
                        <p className="text-sm font-medium text-foreground">{booking.servico}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum agendamento futuro encontrado ou senha incorreta.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
