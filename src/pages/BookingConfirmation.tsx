import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, Clock, User, Briefcase, Phone, MapPin, FileText, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import authBackground from "@/assets/auth-background.jpg";
interface BookingData {
  date: string;
  time: string;
  name: string;
  contact: string;
  professional: string;
  service: string;
  senha?: string;
}
export default function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state as BookingData;
  const [storeInfo, setStoreInfo] = useState<any>(null);
  useEffect(() => {
    document.title = "Agendamento Confirmado | ÁSPERUS";

    // Carregar informações da loja
    const loadStoreInfo = async () => {
      const {
        data,
        error
      } = await supabase.from("info_loja").select("address, phone, maps_url, instructions").limit(1).maybeSingle();
      if (!error && data) {
        setStoreInfo(data);
      }
    };
    loadStoreInfo();
  }, []);
  if (!bookingData) {
    return <div className="min-h-screen bg-cover bg-center bg-no-repeat relative flex items-center justify-center" style={{
      backgroundImage: `url(${authBackground})`
    }}>
      <div className="absolute inset-0 bg-black/50"></div>
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm relative z-10">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Dados do agendamento não encontrados.</p>
          <Button onClick={() => navigate("/")}>
            Fazer novo agendamento
          </Button>
        </CardContent>
      </Card>
    </div>;
  }
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
        <h1 className="text-3xl font-bold text-primary">Agendamento Confirmado</h1>
      </header>
      
      <div className="max-w-2xl mx-auto">
        <Card className="bg-card/95 backdrop-blur-sm border-primary/40">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl text-primary">
                Agendamento Confirmado!
              </CardTitle>
              <div className="text-lg font-medium text-foreground mt-2">
                {bookingData.name}
              </div>
              <p className="text-muted-foreground bg-white">
                Seu horário foi reservado com sucesso
              </p>
            </CardHeader>
            <CardContent className="space-y-6 mx-0">
              {/* Detalhes do agendamento */}
              <div className="grid gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg py-[5px]">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Data</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(bookingData.date), "PPPP", {
                      locale: ptBR
                    })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg py-[5px]">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Horário</p>
                    <p className="text-sm text-muted-foreground">{bookingData.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg py-[5px]">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Profissional</p>
                    <p className="text-sm text-muted-foreground">{bookingData.professional}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg py-[5px]">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Serviço</p>
                    <p className="text-sm text-muted-foreground">{bookingData.service}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg py-[5px]">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Contato</p>
                    <p className="text-sm text-muted-foreground">{bookingData.contact}</p>
                  </div>
                </div>

                {bookingData.senha && (
                  <div className="p-4 bg-primary/20 rounded border-2 border-primary text-center">
                    <div className="text-sm font-bold text-primary mb-2">ATENÇÃO!!!</div>
                    <div className="text-base text-foreground mb-2">Guarde esta SENHA para reagendar ou cancelar:</div>
                    <div className="text-3xl font-bold tracking-wider font-mono text-primary">{bookingData.senha}</div>
                  </div>
                )}
              </div>

              {/* Informações da loja */}
              {storeInfo && <div className="border-t pt-6 py-[5px]">
                  <h3 className="font-semibold mb-4">Informações da loja</h3>
                  <div className="space-y-4">
                    {storeInfo.address && <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Endereço</p>
                          <p className="text-sm text-muted-foreground">{storeInfo.address}</p>
                        </div>
                      </div>}
                    
                    {storeInfo.phone && <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Telefone</p>
                          <p className="text-sm text-muted-foreground">{storeInfo.phone}</p>
                        </div>
                      </div>}
                    
                    {storeInfo.maps_url && <Button onClick={() => window.open(storeInfo.maps_url, '_blank')} variant="outline" size="sm" className="w-full">
                        <MapPin className="h-4 w-4 mr-2" />
                        Ver no mapa
                      </Button>}
                    
                    {storeInfo.instructions && <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Instruções</p>
                          <p className="text-sm text-muted-foreground">{storeInfo.instructions}</p>
                        </div>
                      </div>}
                  </div>
                </div>}

              {/* Orientações */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-3">Orientações importantes:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Chegue com 10 minutos de antecedência.</li>
                  <li>• Aceitamos pagamento em dinheiro, Pix e cartões de crédito/débito.</li>
                  <li>• Em caso de cancelamento, entre em contato com antecedência.</li>
                  <li>• A tolerância para atrasos é de 15 minutos Após esse tempo, o horário será cancelado e será necessário um novo agendamento.</li>
                </ul>
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-4 py-[10px]">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>
                  Novo Agendamento
                </Button>
                <Button className="flex-1" onClick={() => window.print()}>
                  Imprimir Comprovante
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>;
}