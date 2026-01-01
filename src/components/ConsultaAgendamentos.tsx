import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
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

  // Buscar agendamentos do usuário quando contato e senha são preenchidos
  useEffect(() => {
    const searchUserBookings = async () => {
      if (!contact || !senha) {
        setUserBookings([]);
        return;
      }

      setLoadingBookings(true);
      try {
        // Usar edge function para consulta segura
        const { data, error } = await supabase.functions.invoke('query_bookings', {
          body: { 
            contact,
            senha
          }
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
    <Card className="border-green-500/20 bg-card/95 backdrop-blur-sm">
      <CardHeader>
        <Alert className="mb-3 border-yellow-500/50 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-500">
            Atenção! Agendamentos passados não poderão ser consultados
          </AlertDescription>
        </Alert>
        <CardTitle className="text-green-600">Consultar Agendamento</CardTitle>
        <p className="text-sm text-muted-foreground">
          Digite seu contato e senha para consultar seus agendamentos
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="consultaContact">Contato (Telefone)</Label>
            <Input 
              id="consultaContact" 
              value={contact} 
              onChange={e => setContact(e.target.value)} 
              placeholder="Digite um número de telefone válido" 
              className="border-green-500/40" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consultaSenha">Senha (4 dígitos)</Label>
            <Input 
              id="consultaSenha" 
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="Digite os 4 dígitos" 
              className="border-green-500/40" 
              maxLength={4}
            />
          </div>
        </div>

        {/* Agendamentos encontrados */}
        {contact && senha && (
          <div className="mt-4">
            {loadingBookings ? (
              <p className="text-sm text-muted-foreground">Buscando agendamentos...</p>
            ) : userBookings.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium text-green-600">Seus Agendamentos:</h4>
                {userBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-3 border border-green-500/20 rounded-lg bg-green-500/5"
                  >
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-green-600">Nome:</span>
                        <p>{booking.NOME}</p>
                      </div>
                      <div>
                        <span className="font-medium text-green-600">Data:</span>
                        <p>{format(new Date(booking.DATA + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}</p>
                      </div>
                      <div>
                        <span className="font-medium text-green-600">Horário:</span>
                        <p>{booking.HORA.slice(0, 5)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-green-600">Profissional:</span>
                        <p>{booking.PROFISSIONAL || "Não especificado"}</p>
                      </div>
                    </div>
                    {booking.servico && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-green-600">Serviço:</span>
                        <p>{booking.servico}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {contact && senha ? "Nenhum agendamento futuro encontrado ou senha incorreta." : ""}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
