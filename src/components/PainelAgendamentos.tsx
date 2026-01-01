import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAgendamentosRealtime } from "@/hooks/useAgendamentosRealtime";
import { Calendar, Clock, User, Briefcase, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'AGENDADO':
      return <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">Agendado</Badge>;
    case 'REAGENDADO':
      return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30">Reagendado</Badge>;
    case 'CANCELADO':
      return <Badge className="bg-red-500/20 text-red-300 border-red-400/30">Cancelado</Badge>;
    default:
      return <Badge className="bg-gray-500/20 text-gray-300 border-gray-400/30">{status}</Badge>;
  }
};
const formatDate = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
const formatTime = (timeString: string) => {
  return timeString.slice(0, 5); // Remove segundos se existirem
};
export const PainelAgendamentos = () => {
  const { toast } = useToast();
  const {
    agendamentos,
    isLoading,
    error
  } = useAgendamentosRealtime();

  const [isSubmitting, setIsSubmitting] = useState<Set<string>>(new Set());
  const [finalizados, setFinalizados] = useState<Set<string>>(new Set());

  // Obter data de hoje no formato YYYY-MM-DD
  const hoje = new Date();
  const year = hoje.getFullYear();
  const month = String(hoje.getMonth() + 1).padStart(2, '0');
  const day = String(hoje.getDate()).padStart(2, '0');
  const dataHoje = `${year}-${month}-${day}`;

  // Filtrar agendamentos conforme a regra:
  // 1. Todos do dia atual (independente do status_final/finalização)
  // 2. De outros dias:
  //    - CANCELADO: não mostrar (deve sumir após a data passar)
  //    - AGENDADO/REAGENDADO: só mostrar se não tiver finalização
  const agendamentosFiltrados = agendamentos.filter(ag => {
    const isHoje = ag.DATA === dataHoje;
    const isPast = ag.DATA < dataHoje;
    const temFinalizacao = ag.finalização && ag.finalização.trim() !== '';
    
    if (isHoje) {
      return true; // Mostra todos do dia atual
    } else if (isPast) {
      // Para datas passadas:
      // - CANCELADO não aparece
      // - AGENDADO/REAGENDADO só aparece se não tiver finalização
      if (ag.STATUS === 'CANCELADO') {
        return false;
      }
      return !temFinalizacao;
    } else {
      // Para datas futuras, mostra todos
      return true;
    }
  });

  const handleStatusFinal = async (agendamentoId: string, statusFinal: string) => {
    setIsSubmitting(prev => new Set(prev).add(agendamentoId));
    try {
      const { data, error } = await supabase.functions.invoke('update-finalizacao', {
        body: {
          id: agendamentoId,
          statusFinal
        }
      });

      if (error) {
        throw error;
      }

      // Otimista: marcar como finalizado localmente
      setFinalizados(prev => new Set(prev).add(agendamentoId));

      toast({
        title: "Status atualizado",
        description: `Agendamento marcado como ${statusFinal.toLowerCase()}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status final:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do agendamento",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(prev => {
        const next = new Set(prev);
        next.delete(agendamentoId);
        return next;
      });
    }
  };
  if (error) {
    return <div className="p-6">
        <h1 className="text-3xl font-bold text-primary mb-6">Acompanhamento de Agendamentos</h1>
        <div className="text-red-400 bg-red-500/10 border border-red-400/30 rounded-lg p-4">
          Erro ao carregar agendamentos: {error}
        </div>
      </div>;
  }
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6 break-words">Acompanhamento de Agendamentos</h1>
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando agendamentos...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {agendamentosFiltrados?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum agendamento encontrado.</p>
          ) : (
            agendamentosFiltrados?.map((agendamento) => (
              <Card key={agendamento.id} className="p-3 md:p-4">
                <div className="space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-xs md:text-sm">{formatDate(agendamento.DATA)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-xs md:text-sm">{formatTime(agendamento.HORA)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="text-xs md:text-sm font-medium">{agendamento.NOME}</span>
                      </div>
                      {agendamento.PROFISSIONAL && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary" />
                          <span className="text-xs md:text-sm">{agendamento.PROFISSIONAL}</span>
                        </div>
                      )}
                    </div>
                    {getStatusBadge(agendamento.STATUS)}
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="text-xs md:text-sm text-muted-foreground">
                      Contato: {agendamento.CONTATO}
                    </div>
                    
                     {/* Botões de Status Final - apenas para agendamentos AGENDADO ou REAGENDADO */}
                     {(agendamento.STATUS === 'AGENDADO' || agendamento.STATUS === 'REAGENDADO') && (
                       <div className="flex items-center gap-2">
                         <Button
                           size="sm"
                           onClick={() => handleStatusFinal(agendamento.id, 'EFETIVADO')}
                           disabled={!!agendamento.finalização || finalizados.has(agendamento.id) || isSubmitting.has(agendamento.id)}
                           className="bg-green-600 hover:bg-green-700 text-white text-[10px] md:text-xs px-2 md:px-3 py-1 h-7 md:h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                           <CheckCircle className="h-3 w-3 mr-1" />
                           EFETIVADO
                         </Button>
                         <Button
                           size="sm"
                           onClick={() => handleStatusFinal(agendamento.id, 'NÃO EFETIVADO')}
                           disabled={!!agendamento.finalização || finalizados.has(agendamento.id) || isSubmitting.has(agendamento.id)}
                           className="bg-red-600 hover:bg-red-700 text-white text-[10px] md:text-xs px-2 md:px-3 py-1 h-7 md:h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                           <XCircle className="h-3 w-3 mr-1" />
                           N.E
                         </Button>
                       </div>
                     )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};