import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Calendar, Clock, User, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import authBackground from "@/assets/background.png";

export default function RescheduleConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;

  useEffect(() => {
    document.title = "Reagendamento Confirmado | ÁSPERUS";
  }, []);

  if (!state) {
    navigate("/");
    return null;
  }

  const { oldDate, oldTime, newDate, newTime, contact, professional, service, senha } = state;

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `url(${authBackground})`,
      }}
    >
      <div className="absolute inset-0 bg-black/50"></div>
      
      <main className="container mx-auto px-6 py-8 relative z-10">
        <header className="mb-8 text-center relative">
          <Button 
            variant="outline" 
            className="absolute top-0 left-0 flex items-center gap-2"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
            Início
          </Button>
          <h1 className="text-3xl font-bold text-warning">Reagendamento Confirmado</h1>
        </header>

        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="bg-card/95 backdrop-blur-sm border-warning/40">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-warning" />
              </div>
              <CardTitle className="text-2xl text-warning">
                Seu atendimento foi reagendado com sucesso!
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Dados antigos */}
              <div className="p-4 bg-muted/20 rounded-lg border border-muted/40">
                <h3 className="font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Agendamento Anterior
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="line-through text-muted-foreground">
                      {format(new Date(oldDate), "PPP", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="line-through text-muted-foreground">
                      {oldTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dados novos */}
              <div className="p-4 bg-warning/10 rounded-lg border border-warning/40">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Novo Agendamento
                </h3>
                <div className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-white" />
                    <span className="font-medium text-white">
                      {format(new Date(newDate), "PPP", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-white" />
                    <span className="font-medium text-white">
                      {newTime}
                    </span>
                  </div>
                  {professional && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-white" />
                      <span className="text-white">
                        Profissional: {professional}
                      </span>
                    </div>
                  )}
                  {service && (
                    <div className="flex items-center gap-2">
                      <span className="text-white">
                        Serviço: {service}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-white">
                      Contato: {contact}
                    </span>
                  </div>
                </div>
                
                {senha && (
                  <div className="text-lg font-mono text-white mt-4 p-4 bg-warning/20 rounded border-2 border-warning text-center">
                    <div className="text-sm mb-2">ATENÇÃO!!!</div>
                    <div className="text-base mb-2">Guarde esta SENHA para reagendar ou cancelar:</div>
                    <div className="text-3xl font-bold tracking-wider">{senha}</div>
                  </div>
                )}
              </div>

              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Guarde essas informações. Chegue alguns minutos antes do horário agendado.
                </p>
                
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => navigate("/")}
                    className="bg-warning hover:bg-warning/90 text-warning-foreground"
                  >
                    Fazer Novo Agendamento
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/reagendar")}
                    className="border-warning/40 text-warning hover:bg-warning/10"
                  >
                    Reagendar Novamente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}