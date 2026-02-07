import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Agendamento } from './useAgendamentos';

/**
 * Hook unificado para Realtime de agendamentos
 * OTIMIZAÇÃO: Um único canal WebSocket em vez de dois separados
 * Filtra apenas agendamentos relevantes (última semana + futuros)
 */
export const useAgendamentosRealtimeUnificado = () => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data de hoje no formato YYYY-MM-DD
  const hoje = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Data limite: 7 dias atrás (para histórico recente)
  const dataLimite = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    const fetchAgendamentos = async () => {
      try {
        setIsLoading(true);
        
        // OTIMIZAÇÃO: Busca apenas última semana + futuros (não todo o histórico)
        const { data, error } = await supabase
          .from('agendamentos_robustos')
          .select('*')
          .gte('DATA', dataLimite)
          .order('DATA', { ascending: false })
          .order('HORA', { ascending: true });

        if (error) throw error;

        setAgendamentos(data as Agendamento[]);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching agendamentos:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgendamentos();

    // OTIMIZAÇÃO: Canal único para todas as funcionalidades admin
    const channel = supabase
      .channel('admin-agendamentos-unificado')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agendamentos_robustos'
        },
        (payload) => {
          const newData = payload.new as Agendamento;
          const oldData = payload.old as any;
          
          // Ignora eventos de datas muito antigas (mais de 7 dias)
          const eventDate = newData?.DATA || oldData?.DATA;
          if (eventDate && eventDate < dataLimite) {
            return;
          }

          console.log('Realtime unificado:', payload.eventType);
          
          switch (payload.eventType) {
            case 'INSERT':
              setAgendamentos(prev => {
                const newAgendamento = payload.new as Agendamento;
                return [newAgendamento, ...prev].sort((a, b) => {
                  if (a.DATA !== b.DATA) {
                    return new Date(b.DATA).getTime() - new Date(a.DATA).getTime();
                  }
                  return a.HORA.localeCompare(b.HORA);
                });
              });
              break;
              
            case 'UPDATE':
              setAgendamentos(prev => 
                prev.map(agendamento => 
                  agendamento.id === payload.new.id 
                    ? payload.new as Agendamento 
                    : agendamento
                )
              );
              break;
              
            case 'DELETE':
              setAgendamentos(prev => 
                prev.filter(agendamento => agendamento.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dataLimite]);

  // Dados derivados para QuadroEfetivados (calculados do estado existente)
  const efetivadosHoje = useMemo(() => {
    const agora = new Date();
    const horaAtual = agora.getHours().toString().padStart(2, '0') + ':' + 
                     agora.getMinutes().toString().padStart(2, '0');

    return agendamentos.filter(ag => 
      ag.DATA === hoje && 
      (ag.STATUS === 'AGENDADO' || ag.STATUS === 'REAGENDADO') &&
      ag.HORA <= horaAtual
    );
  }, [agendamentos, hoje]);

  return { 
    agendamentos, 
    isLoading, 
    error,
    // Dados derivados para compatibilidade com QuadroEfetivados
    efetivados: efetivadosHoje.length,
    agendamentosEfetivados: efetivadosHoje,
    dataHoje: hoje
  };
};
