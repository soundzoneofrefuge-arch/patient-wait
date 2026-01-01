import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Calendar, Clock, User, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import authBackground from "@/assets/background.png";
export default function CancelConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;
  useEffect(() => {
    document.title = "Cancelamento Confirmado | ÁSPERUS";
  }, []);
  if (!state) {
    navigate("/");
    return null;
  }
  const {
    name,
    contact,
    date,
    time,
    message
  } = state;
  return <div className="min-h-screen bg-cover bg-center bg-no-repeat relative" style={{
    backgroundImage: `url(${authBackground})`
  }}>
      <div className="absolute inset-0 bg-black/50"></div>
      
      <main className="container mx-auto px-6 py-8 relative z-10">
        <header className="mb-8 text-center relative">
          <Button variant="outline" className="absolute top-0 left-0 flex items-center gap-2" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
            Início
          </Button>
          <h1 className="text-3xl font-bold text-destructive">Cancelamento Confirmado</h1>
        </header>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-card/95 backdrop-blur-sm border-destructive/40">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-destructive" />
              </div>
          <CardTitle className="text-2xl text-white">
            Agendamento Cancelado com Sucesso
          </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg border border-destructive/40 bg-transparent">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-white">
                  <Calendar className="h-4 w-4" />
                  Agendamento Cancelado
                </h3>
                <div className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-destructive" />
                    <span className="text-white">
                      Nome: {name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white">
                      Contato: {contact}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-destructive" />
                    <span className="line-through text-white">
                      {format(new Date(date), "PPP", {
                      locale: ptBR
                    })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-destructive" />
                    <span className="line-through text-white">
                      {time}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-4">
                <p className="text-white">
                  {message || "Seu agendamento foi cancelado com sucesso."}
                  <br />
                  Caso precise de um novo agendamento, utilize o botão abaixo.
                </p>
                
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => navigate("/")} className="bg-primary hover:bg-primary/90 text-white">
                    Fazer Novo Agendamento
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/cancelar")} className="border-destructive/40 hover:bg-destructive/10 text-slate-50">
                    Cancelar Outro Agendamento
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>;
}