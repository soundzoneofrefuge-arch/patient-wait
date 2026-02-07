import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações de limpeza
const THRESHOLD_MB = 400; // 80% de 500MB
const DAYS_CANCELED = 30;
const DAYS_NAO_EFETIVADO = 60;
const DAYS_EFETIVADO = 90;

interface CleanupResult {
  success: boolean;
  database_size_mb: number;
  threshold_mb: number;
  cleanup_performed: boolean;
  message: string;
  details?: {
    canceled_deleted: number;
    nao_efetivado_deleted: number;
    efetivado_deleted: number;
  };
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🧹 Iniciando verificação de limpeza do banco...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verificar tamanho do banco usando uma estimativa baseada nas tabelas
    // Como não temos acesso direto ao pg_database_size, estimamos pelo número de registros
    const { count: agendamentosCount, error: countError } = await supabase
      .from('agendamentos_robustos')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Erro ao contar agendamentos:', countError);
      throw countError;
    }

    // Estimativa: cada registro ~1KB, mais overhead
    const estimatedSizeMB = ((agendamentosCount || 0) * 1.5) / 1024;
    
    console.log(`📊 Registros na tabela: ${agendamentosCount}`);
    console.log(`📊 Tamanho estimado: ${estimatedSizeMB.toFixed(2)} MB`);
    console.log(`📊 Threshold: ${THRESHOLD_MB} MB`);

    // 2. Verificar se precisa limpar
    if (estimatedSizeMB < THRESHOLD_MB) {
      const result: CleanupResult = {
        success: true,
        database_size_mb: parseFloat(estimatedSizeMB.toFixed(2)),
        threshold_mb: THRESHOLD_MB,
        cleanup_performed: false,
        message: `Banco dentro do limite seguro (${estimatedSizeMB.toFixed(2)} MB / ${THRESHOLD_MB} MB)`,
      };

      console.log('✅ Limpeza não necessária:', result.message);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 3. Executar limpeza por prioridade
    console.log('🚨 Iniciando limpeza - banco acima do threshold');

    // Calcular datas de corte
    const today = new Date();
    const cutoffCanceled = new Date(today);
    cutoffCanceled.setDate(cutoffCanceled.getDate() - DAYS_CANCELED);
    
    const cutoffNaoEfetivado = new Date(today);
    cutoffNaoEfetivado.setDate(cutoffNaoEfetivado.getDate() - DAYS_NAO_EFETIVADO);
    
    const cutoffEfetivado = new Date(today);
    cutoffEfetivado.setDate(cutoffEfetivado.getDate() - DAYS_EFETIVADO);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    // 3.1 Deletar CANCELADOS > 30 dias
    console.log(`🗑️ Deletando CANCELADOS anteriores a ${formatDate(cutoffCanceled)}...`);
    const { data: canceledDeleted, error: canceledError } = await supabase
      .from('agendamentos_robustos')
      .delete()
      .eq('STATUS', 'CANCELADO')
      .lt('DATA', formatDate(cutoffCanceled))
      .select('id');

    if (canceledError) {
      console.error('Erro ao deletar cancelados:', canceledError);
    }

    // 3.2 Deletar NÃO EFETIVADO > 60 dias
    console.log(`🗑️ Deletando NÃO EFETIVADO anteriores a ${formatDate(cutoffNaoEfetivado)}...`);
    const { data: naoEfetivadoDeleted, error: naoEfetivadoError } = await supabase
      .from('agendamentos_robustos')
      .delete()
      .eq('finalização', 'NÃO EFETIVADO')
      .lt('DATA', formatDate(cutoffNaoEfetivado))
      .select('id');

    if (naoEfetivadoError) {
      console.error('Erro ao deletar não efetivados:', naoEfetivadoError);
    }

    // 3.3 Deletar EFETIVADO > 90 dias
    console.log(`🗑️ Deletando EFETIVADO anteriores a ${formatDate(cutoffEfetivado)}...`);
    const { data: efetivadoDeleted, error: efetivadoError } = await supabase
      .from('agendamentos_robustos')
      .delete()
      .eq('finalização', 'EFETIVADO')
      .lt('DATA', formatDate(cutoffEfetivado))
      .select('id');

    if (efetivadoError) {
      console.error('Erro ao deletar efetivados:', efetivadoError);
    }

    const details = {
      canceled_deleted: canceledDeleted?.length || 0,
      nao_efetivado_deleted: naoEfetivadoDeleted?.length || 0,
      efetivado_deleted: efetivadoDeleted?.length || 0,
    };

    const totalDeleted = details.canceled_deleted + details.nao_efetivado_deleted + details.efetivado_deleted;

    // Recalcular tamanho após limpeza
    const { count: newCount } = await supabase
      .from('agendamentos_robustos')
      .select('*', { count: 'exact', head: true });

    const newSizeMB = ((newCount || 0) * 1.5) / 1024;

    const result: CleanupResult = {
      success: true,
      database_size_mb: parseFloat(newSizeMB.toFixed(2)),
      threshold_mb: THRESHOLD_MB,
      cleanup_performed: true,
      message: `Limpeza concluída! ${totalDeleted} registros removidos.`,
      details,
    };

    console.log('✅ Limpeza concluída:', JSON.stringify(details));
    console.log(`📊 Novo tamanho estimado: ${newSizeMB.toFixed(2)} MB`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro na função db-cleanup:', errorMessage);

    const result: CleanupResult = {
      success: false,
      database_size_mb: 0,
      threshold_mb: THRESHOLD_MB,
      cleanup_performed: false,
      message: 'Erro ao executar limpeza',
      error: errorMessage,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
