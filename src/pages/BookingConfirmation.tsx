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
  return <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { 
            margin: 0 !important; 
            padding: 0 !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .print-container {
            min-height: auto !important;
            background: white !important;
            padding: 8px !important;
          }
          .print-container > div:first-child { display: none !important; }
          main { padding: 4px 8px !important; }
          .print-card {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            background: white !important;
          }
          .print-card * {
            font-size: 11px !important;
            line-height: 1.2 !important;
          }
          .print-card h1, .print-card h2, .print-card h3 {
            font-size: 13px !important;
            margin: 4px 0 !important;
          }
          .print-card .text-3xl {
            font-size: 18px !important;
          }
          .print-card .text-2xl {
            font-size: 14px !important;
          }
          .print-card .p-3, .print-card .p-4 {
            padding: 4px !important;
          }
          .print-card .space-y-6 > * + * {
            margin-top: 6px !important;
          }
          .print-card .space-y-4 > * + * {
            margin-top: 4px !important;
          }
          .print-card .gap-4 {
            gap: 4px !important;
          }
          .print-card .mb-4 {
            margin-bottom: 4px !important;
          }
          .print-card .pt-6 {
            padding-top: 6px !important;
          }
          .print-card .w-16 {
            width: 32px !important;
            height: 32px !important;
          }
          .print-card .w-8 {
            width: 20px !important;
            height: 20px !important;
          }
          .print-card .w-5 {
            width: 14px !important;
            height: 14px !important;
          }
          .print-card ul {
            margin: 0 !important;
            padding-left: 8px !important;
          }
          .print-card li {
            margin: 2px 0 !important;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
      
      <div className="min-h-screen bg-cover bg-center bg-no-repeat relative print-container" style={{
      backgroundImage: `url(${authBackground})`
    }}>
        <div className="absolute inset-0 bg-black/50"></div>
        
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
          <header className="mb-6 sm:mb-8 text-center relative no-print">
            <Button variant="outline" className="absolute top-0 left-0 flex items-center gap-2" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
              Início
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">Agendamento Confirmado</h1>
          </header>
          
          <div className="max-w-2xl mx-auto">
            <Card className="bg-card/95 backdrop-blur-sm border-primary/40 print-card">
                <CardHeader className="text-center pb-2 sm:pb-4">
                  <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 sm:mb-4">
                    <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-primary">
                    Agendamento Confirmado!
                  </CardTitle>
                  <div className="text-base sm:text-lg font-medium text-foreground mt-1 sm:mt-2">
                    {bookingData.name}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Seu horário foi reservado com sucesso
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 pt-0">
                  {/* Detalhes do agendamento */}
                  <div className="grid gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm">Data</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {format(new Date(bookingData.date + 'T12:00:00'), "PPPP", {
                        locale: ptBR
                      })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Horário</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{bookingData.time}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Profissional</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{bookingData.professional}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                      <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Serviço</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{bookingData.service}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Contato</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{bookingData.contact}</p>
                      </div>
                    </div>

                    {bookingData.senha && <div className="p-3 sm:p-4 bg-primary/20 rounded border-2 border-primary text-center">
                        <div className="text-xs sm:text-sm font-bold text-primary mb-1 sm:mb-2">ATENÇÃO!!!</div>
                        <div className="text-sm text-foreground mb-1 sm:mb-2">Guarde esta SENHA para reagendar ou cancelar:</div>
                        <div className="text-2xl sm:text-3xl font-bold tracking-wider font-mono text-primary">{bookingData.senha}</div>
                      </div>}
                  </div>

                  {/* Informações da loja */}
                  {storeInfo && <div className="border-t pt-4 sm:pt-6">
                      <h3 className="font-semibold mb-2 sm:mb-4 text-sm">Informações da loja</h3>
                      <div className="space-y-2 sm:space-y-4">
                        {storeInfo.address && <div className="flex items-start gap-2 sm:gap-3">
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="font-medium text-sm">Endereço</p>
                              <p className="text-xs sm:text-sm text-muted-foreground">{storeInfo.address}</p>
                            </div>
                          </div>}
                        
                        {storeInfo.phone && <div className="flex items-center gap-2 sm:gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="font-medium text-sm">Telefone</p>
                              <p className="text-xs sm:text-sm text-muted-foreground">{storeInfo.phone}</p>
                            </div>
                          </div>}
                        
                        {storeInfo.maps_url && <Button onClick={() => window.open(storeInfo.maps_url, '_blank')} variant="outline" size="sm" className="w-full no-print">
                            <MapPin className="h-4 w-4 mr-2" />
                            Ver no mapa
                          </Button>}
                        
                        {storeInfo.instructions && <div className="flex items-start gap-2 sm:gap-3">
                            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="font-medium text-sm">Instruções</p>
                              <p className="text-xs sm:text-sm text-muted-foreground">{storeInfo.instructions}</p>
                            </div>
                          </div>}
                      </div>
                    </div>}

                  {/* Orientações */}
                  <div className="border-t pt-4 sm:pt-6">
                    <h3 className="font-semibold mb-2 sm:mb-3 text-sm">Orientações importantes:</h3>
                    <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                      <li>• Chegue com 15 minutos de antecedência.</li>
                      <li>• Aceitamos pagamento em dinheiro, Pix e cartões de crédito/débito.</li>
                      <li>• Precisa cancelar? Avise antes e libere esse horário para quem precisa.</li>
                      <li>• Aguardamos até 15 minutinhos. Depois disso, precisaremos remarcar para garantir a qualidade do seu atendimento.</li>
                    </ul>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4 no-print">
                    <Button variant="outline" className="flex-1 text-sm" onClick={() => navigate("/")}>
                      Novo Agendamento
                    </Button>
                    <Button className="flex-1 text-sm" onClick={() => window.print()}>
                      Imprimir Comprovante
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
    </>;
}