

# Plano: Edge Function de Limpeza Automática do Banco de Dados

## Objetivo
Criar uma edge function que monitora o tamanho do banco de dados e limpa automaticamente dados antigos quando o uso se aproxima do limite de 500MB do plano gratuito do Supabase.

---

## Estratégia de Limpeza

A função irá limpar dados **por antiguidade e status**, seguindo esta ordem de prioridade:

1. **Agendamentos CANCELADOS** com mais de 30 dias
2. **Agendamentos finalizados (NÃO EFETIVADO)** com mais de 60 dias  
3. **Agendamentos finalizados (EFETIVADO)** com mais de 90 dias
4. **Cadastros de clientes** sem agendamentos associados (opcional)

---

## Arquitetura

```text
┌─────────────────────────────────────────────────────────────┐
│                    Cron Job (Supabase)                      │
│              Executa semanalmente (domingo 3h)              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               Edge Function: db-cleanup                     │
│                                                             │
│  1. Verifica tamanho atual do banco                         │
│  2. Se > 400MB (80%), inicia limpeza                        │
│  3. Remove dados antigos por prioridade                     │
│  4. Registra log da operação                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementação Técnica

### 1. Nova Edge Function: `db-cleanup`

**Arquivo:** `supabase/functions/db-cleanup/index.ts`

```typescript
// Pseudocódigo da função
- Verificar tamanho do banco via query SQL
- Se tamanho > 400MB (threshold de 80%):
  - Deletar agendamentos CANCELADOS > 30 dias
  - Deletar finalizados NÃO EFETIVADO > 60 dias
  - Deletar finalizados EFETIVADO > 90 dias
- Retornar relatório de limpeza
```

### 2. Atualizar `config.toml`

Adicionar configuração da nova função:
```toml
[functions.db-cleanup]
verify_jwt = false
```

### 3. Configurar Cron Job (Manual no Supabase)

Executar semanalmente via Dashboard do Supabase:
- **Schedule:** `0 3 * * 0` (domingo às 3h da manhã)
- **Edge Function:** `db-cleanup`

---

## Parâmetros Configuráveis

| Parâmetro | Valor Padrão | Descrição |
|-----------|--------------|-----------|
| `THRESHOLD_MB` | 400 | Tamanho em MB para iniciar limpeza |
| `DAYS_CANCELED` | 30 | Dias para manter agendamentos cancelados |
| `DAYS_NAO_EFETIVADO` | 60 | Dias para manter não efetivados |
| `DAYS_EFETIVADO` | 90 | Dias para manter efetivados |

---

## Segurança

- A função usa `SERVICE_ROLE_KEY` para acesso administrativo
- Sem autenticação JWT (será chamada apenas por cron interno)
- Logs detalhados para auditoria

---

## Seção Técnica

### Query de Verificação de Tamanho
```sql
SELECT pg_database_size(current_database()) as size_bytes;
```

### Query de Limpeza (exemplo)
```sql
DELETE FROM agendamentos_robustos 
WHERE "STATUS" = 'CANCELADO' 
AND "DATA" < CURRENT_DATE - INTERVAL '30 days';
```

### Resposta da Função
```json
{
  "success": true,
  "database_size_mb": 14.05,
  "threshold_mb": 400,
  "cleanup_performed": false,
  "message": "Banco dentro do limite seguro"
}
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/db-cleanup/index.ts` | Criar nova edge function |
| `supabase/config.toml` | Adicionar configuração da função |

---

## Estado Atual do Banco

- **Tamanho atual:** 14 MB (2.8% do limite)
- **Tabela maior:** `agendamentos_robustos` (80 KB, 32 registros)
- **Status:** Muito longe do limite, mas a função previne problemas futuros

---

## Configuração do Cron Job (Pós-Deploy)

Após o deploy, você precisará configurar manualmente o cron job no Dashboard do Supabase:

1. Ir em **Database > Cron Jobs**
2. Criar novo job com schedule `0 3 * * 0`
3. Tipo: **Supabase Edge Function**
4. Selecionar: `db-cleanup`

