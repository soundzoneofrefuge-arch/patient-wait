# Documentação Técnica: Sistema Keep Alive (Supabase)

## 1. Objetivo
Evitar a hibernação automática (pause) do projeto Supabase no plano gratuito, que ocorre após **7 dias de inatividade**. Este sistema simula atividade real através de chamadas automatizadas.

## 2. Componentes do Sistema
O sistema é composto por dois pilares:
1.  **Edge Function (`keep-alive`):** Script que executa uma consulta (SELECT) no banco de dados para gerar tráfego.
2.  **Cron Job:** Agendador interno que dispara a função em intervalos definidos.

   O CÓDIGO:

   ` ` `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Faz uma consulta simples na tabela que sabemos que existe para gerar atividade e mante-la acordada. Trocar o nome da tabela quando usar em outro projeto.
    const { error } = await supabase
      .from('agendamentos_robustos')
      .select('id')
      .limit(1);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ message: "Projeto mantido ativo com sucesso!" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});` ` `

## 3. Configuração do Cron Job
Acesse o Dashboard do Supabase > **Database** > **Cron Jobs** e crie um novo agendador com as seguintes especificações:

| Parâmetro | Configuração Recomendada |
| :--- | :--- |
| **Name** | `keep_alive_biweekly` |
| **Schedule** | `0 0 * * 1,5` |
| **Type** | `Supabase Edge Function` |
| **Edge Function** | `keep-alive` |
| **Method** | `POST` |
| **Timeout** | `1000 ms` |

### Detalhes do Agendamento (Cron Expression)
A expressão `0 0 * * 1,5` define que a função será executada:
* Todas as **segundas-feiras** às 00:00.
* Todas as **sextas-feiras** às 00:00.

Este intervalo de 3 a 5 dias garante que o projeto nunca atinja o limite de 7 dias de inatividade total.

## 4. Funcionamento Interno
O fluxo de atividade segue o seguinte caminho para garantir que o banco de dados seja considerado "ativo":



1.  O **Cron Job** inicia a requisição HTTP interna.
2.  A **Edge Function** recebe a chamada e utiliza a `service_role_key` para se autenticar.
3.  A função realiza um `SELECT` simples na tabela `agendamentos_robustos`.
4.  O banco de dados processa a consulta, zerando o contador de inatividade do Supabase.

## 5. Monitoramento e Manutenção
* **Logs:** Podem ser verificados em `Edge Functions > keep-alive > Logs`.
* **Inatividade Manual:** Se o projeto for pausado por qualquer outro motivo, ele deve ser retomado manualmente através do Dashboard antes que o Cron Job possa voltar a funcionar.
