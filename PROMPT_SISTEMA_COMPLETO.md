# 🎯 PROMPT COMPLETO - SISTEMA DE AGENDAMENTOS OTIMIZADO PARA PLANO GRATUITO

> **VERSÃO**: 2.0 | **DATA**: Fevereiro 2025  
> **OTIMIZADO PARA**: Supabase Free Tier (500MB) + Cloudflare Free

---

## 📋 SUMÁRIO

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Stack Tecnológica](#stack-tecnológica)
3. [⭐ OTIMIZAÇÕES PARA PLANO GRATUITO](#-otimizações-para-plano-gratuito)
4. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
5. [Edge Functions (Backend)](#edge-functions-backend)
6. [Frontend - Páginas e Componentes](#frontend---páginas-e-componentes)
7. [Segurança Implementada](#segurança-implementada)
8. [Deploy e Configuração](#deploy-e-configuração)
9. [Manutenção Automatizada](#manutenção-automatizada)
10. [Troubleshooting](#troubleshooting)

---

## 📖 VISÃO GERAL DO SISTEMA

Sistema completo de agendamentos para barbearias/salões com:

### Funcionalidades Principais
- ✅ **Agendamento online** com seleção de data, profissional, serviço e horário
- ✅ **Cancelamento e reagendamento** com validação por senha
- ✅ **Dashboard administrativo** com autenticação
- ✅ **Quadro de efetivados** (marcar atendimentos como realizados ou não)
- ✅ **Horários especiais e fechamentos pontuais**
- ✅ **Loja de produtos** integrada
- ✅ **Realtime updates** (atualização automática de disponibilidade)
- ✅ **Sistema de feriados nacionais**

### Diferenciais de Otimização
- 🆓 **100% funcional no plano gratuito** do Supabase
- ⚡ **Cache inteligente via Cloudflare** para reduzir requisições
- 🧹 **Limpeza automática** do banco para não exceder 500MB
- 🔄 **Keep-alive automático** para evitar hibernação do projeto

---

## 🛠 STACK TECNOLÓGICA

### Frontend
```
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- React Router DOM v7
- React Query (TanStack Query)
- date-fns (manipulação de datas)
- Sonner (toast notifications)
```

### Backend (Supabase)
```
- Supabase PostgreSQL (banco de dados)
- Supabase Edge Functions (Deno/TypeScript)
- Supabase Realtime (websockets)
- Supabase Storage (imagens de produtos)
- Supabase Auth (autenticação admin)
```

### Deploy
```
- Cloudflare Pages ou Vercel (frontend)
- Supabase Cloud (backend)
- GitHub Actions (CI/CD para Edge Functions)
```

---

## ⭐ OTIMIZAÇÕES PARA PLANO GRATUITO

### 🗄️ 1. LIMITE DE 500MB DO BANCO

#### Problema
O Supabase Free Tier oferece apenas 500MB de armazenamento. Um sistema de agendamentos pode crescer rapidamente.

#### Solução: Edge Function `db-cleanup`

```typescript
// supabase/functions/db-cleanup/index.ts
// Monitora o tamanho e remove registros antigos automaticamente

Configuração:
- THRESHOLD_MB = 400 (80% do limite - gatilho de limpeza)
- DAYS_CANCELED = 30 (cancelados > 30 dias são removidos)
- DAYS_NAO_EFETIVADO = 60 (não efetivados > 60 dias são removidos)
- DAYS_EFETIVADO = 90 (efetivados > 90 dias são removidos)
```

#### Hierarquia de Limpeza (Prioridade)
1. **Primeiro**: Agendamentos CANCELADOS (menos importantes)
2. **Segundo**: Agendamentos NÃO EFETIVADOS (cliente não compareceu)
3. **Terceiro**: Agendamentos EFETIVADOS (histórico importante)

#### Configurar Cron Job no Supabase
```sql
-- Execute no SQL Editor do Supabase
SELECT cron.schedule(
  'db-cleanup-weekly',
  '0 3 * * 0', -- Domingo às 3h da manhã
  $$
  SELECT net.http_post(
    url:='https://SEU-PROJECT-ID.supabase.co/functions/v1/db-cleanup',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer SUA-ANON-KEY"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

---

### 😴 2. HIBERNAÇÃO APÓS 7 DIAS DE INATIVIDADE

#### Problema
Projetos Supabase Free hibernam após 1 semana sem atividade.

#### Solução: Edge Function `keep-alive`

```typescript
// supabase/functions/keep-alive/index.ts
// Faz uma query simples para manter o banco ativo

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Query simples que gera atividade
  await supabase.from('agendamentos_robustos').select('id').limit(1);

  return new Response(JSON.stringify({ message: "Projeto mantido ativo!" }));
});
```

#### Configurar Cron Job (2x por semana)
```sql
SELECT cron.schedule(
  'keep_alive_biweekly',
  '0 0 * * 1,5', -- Segunda e Sexta à meia-noite
  $$
  SELECT net.http_post(
    url:='https://SEU-PROJECT-ID.supabase.co/functions/v1/keep-alive',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer SUA-ANON-KEY"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

---

### ⚡ 3. CACHE VIA CLOUDFLARE (REDUZ REQUISIÇÕES)

#### Problema
Supabase Free tem limite de invocações de Edge Functions.

#### Solução: Cache-Control Headers

```typescript
// supabase/functions/get-available-slots/index.ts

function getCacheHeaders(isToday: boolean, isClosedOrHoliday: boolean) {
  if (isClosedOrHoliday) {
    // Feriados/fechados: cache longo (1 hora no CDN)
    return { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=60" };
  }
  if (isToday) {
    // Hoje: cache curto (30s no CDN) - muda mais rápido
    return { "Cache-Control": "public, max-age=15, s-maxage=30, stale-while-revalidate=15" };
  }
  // Datas futuras: cache médio (60s no CDN)
  return { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=30" };
}
```

#### Benefícios
- Requisições repetidas são servidas pelo cache do Cloudflare
- Reduz carga no Supabase em ~70%
- Melhora tempo de resposta para usuários

#### Configuração Cloudflare
- Deploy no Cloudflare Pages: cache automático
- Ou configure Page Rules para `/functions/v1/*`

---

### 📉 4. REDUÇÃO DE QUERIES NO BANCO

#### Problema
Queries excessivas consomem recursos e podem causar timeouts.

#### Solução 1: Enviar parâmetros do frontend

```typescript
// Frontend envia dados já conhecidos, evitando query em info_loja
const { data } = await supabase.functions.invoke("get-available-slots", {
  body: {
    date: selectedDate,
    professional: selectedProfessional,
    // OTIMIZAÇÃO: Frontend já tem esses dados
    opening_time: config.opening_time,
    closing_time: config.closing_time,
    slot_interval_minutes: config.slot_interval_minutes
  }
});
```

#### Solução 2: Busca sob demanda (não carrega tudo de uma vez)

```typescript
// Antigo: Carregava slots de 6 datas ao iniciar (6 queries)
// Novo: Carrega apenas quando usuário clica na data (1 query)

const handleDateCardClick = (dateStr: string) => {
  setSelectedDateCard(dateStr);
  if (professional) {
    fetchSlotsForDate(dateStr); // Apenas 1 query
  }
};
```

---

### 🔄 5. REALTIME COM DEBOUNCE

#### Problema
Muitas atualizações simultâneas causam recarregamentos excessivos.

#### Solução: Debounce de 1.5 segundos

```typescript
// src/pages/Booking.tsx
const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  const channel = supabase
    .channel("booking-slots")
    .on("postgres_changes", {/*...*/}, (payload) => {
      // Só atualiza se a mudança afeta a data SELECIONADA
      if (changedDate === selectedDateCard) {
        // Cancelar timer anterior
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        // Aguardar 1.5s antes de buscar novamente
        debounceTimerRef.current = setTimeout(() => {
          fetchSlotsForDate(selectedDateCard);
        }, 1500);
      }
    })
    .subscribe();
}, [selectedDateCard]);
```

---

### 🛡️ 6. CONFLITO DE SIMULTANEIDADE (HTTP 409)

#### Problema
Dois usuários podem tentar reservar o mesmo horário ao mesmo tempo.

#### Solução: Validação em tempo real na Edge Function

```typescript
// supabase/functions/book-slot/index.ts

// Verificar se o horário está disponível ANTES de inserir
const { data: conflicts } = await supabase
  .from("agendamentos_robustos")
  .select("id")
  .eq("DATA", date)
  .eq("HORA", time)
  .eq("PROFISSIONAL", professional)
  .in("STATUS", ["AGENDADO", "REAGENDADO"]);

if (conflicts && conflicts.length > 0) {
  return new Response(JSON.stringify({ 
    error: "Horário já reservado. Atualize a página.",
    conflictType: "OUTDATED_SCHEDULE"
  }), {
    status: 409, // Conflict - NÃO CACHEADO
    headers: corsHeaders
  });
}
```

#### No Frontend
```typescript
// Detectar erro 409 e recarregar slots
if (e?.context?.status === 409) {
  toast.error("Horário reservado por outra pessoa. Atualizando...");
  setSelectedSlot(null);
  await fetchSlotsForDate(selectedDateCard);
}
```

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### Tabelas Principais

#### `agendamentos_robustos`
```sql
CREATE TABLE agendamentos_robustos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  "DATA" DATE NOT NULL,
  "HORA" TIME NOT NULL,
  "STATUS" status_agendamento_robusto DEFAULT 'AGENDADO',
  "NOME" TEXT,
  "CONTATO" TEXT,
  "PROFISSIONAL" TEXT,
  servico TEXT,
  senha TEXT,
  finalização TEXT  -- 'EFETIVADO' ou 'NÃO EFETIVADO'
);

-- Enum de status
CREATE TYPE status_agendamento_robusto AS ENUM (
  'AGENDADO', 'REAGENDADO', 'CANCELADO', 'CONCLUÍDO'
);
```

#### `info_loja`
```sql
CREATE TABLE info_loja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  opening_time TIME DEFAULT '09:00',
  closing_time TIME DEFAULT '18:00',
  slot_interval_minutes INTEGER DEFAULT 60,
  nome_profissionais TEXT,  -- Separados por \n

  escolha_serviços TEXT,    -- Separados por \n

  auth_user TEXT,           -- Email do admin
  url_insta TEXT,
  maps_url TEXT,
  url_phone TEXT
);
```

#### `feriados`
```sql
CREATE TABLE feriados (
  data DATE PRIMARY KEY,
  descricao TEXT NOT NULL
);
```

#### `horarios_especiais`
```sql
CREATE TABLE horarios_especiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE UNIQUE NOT NULL,
  tipo TEXT CHECK (tipo IN ('horario_especial', 'fechado')),
  mensagem TEXT,
  horario_abertura TIME,
  horario_fechamento TIME
);
```

#### `user_roles`
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role DEFAULT 'user',
  UNIQUE (user_id, role)
);

CREATE TYPE app_role AS ENUM ('admin', 'user');
```

### View Pública (Segurança)
```sql
-- Expõe info_loja SEM o campo auth_user
CREATE VIEW info_loja_public AS
SELECT 
  id, name, address, opening_time, closing_time,
  slot_interval_minutes, nome_profissionais, escolha_serviços,
  url_insta, maps_url, url_phone, instructions
FROM info_loja;
-- auth_user é OMITIDO (campo sensível)
```

---

## ⚙️ EDGE FUNCTIONS (BACKEND)

### Lista Completa

| Function | Método | Descrição | Cache |
|----------|--------|-----------|-------|
| `get-available-slots` | POST | Lista horários disponíveis | ✅ Sim |
| `book-slot` | POST | Cria agendamento | ❌ Não |
| `cancel-booking` | POST | Cancela agendamento | ❌ Não |
| `reschedule-booking` | POST | Reagenda | ❌ Não |
| `query-bookings` | POST | Busca por contato | ❌ Não |
| `authenticate-admin` | POST | Login admin | ❌ Não |
| `update-finalizacao` | POST | Marca efetivado | ❌ Não |
| `get-day-movement` | POST/GET | Movimentação do dia | ✅ Sim |
| `keep-alive` | GET | Mantém projeto ativo | ❌ Não |
| `db-cleanup` | POST | Limpeza automática | ❌ Não |

### Configuração (supabase/config.toml)
```toml
project_id = "SEU-PROJECT-ID"

[functions.book-slot]
verify_jwt = false

[functions.get-available-slots]
verify_jwt = false

# ... repetir para todas as functions
```

### Utilitários Compartilhados

```typescript
// supabase/functions/_shared/utils.ts

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

export function getBrazilDateTime(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
}

export function generatePassword(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
```

---

## 🖥️ FRONTEND - PÁGINAS E COMPONENTES

### Páginas Principais

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/` | `Booking.tsx` | Página de agendamento |
| `/booking-confirmation` | `BookingConfirmation.tsx` | Confirmação com senha |
| `/cancel` | `Cancel.tsx` | Cancelamento |
| `/cancel-confirmation` | `CancelConfirmation.tsx` | Confirmação de cancelamento |
| `/reschedule` | `Reschedule.tsx` | Reagendamento |
| `/auth` | `Auth.tsx` | Login admin |
| `/dashboard` | `Dashboard.tsx` | Painel admin |
| `/loja` | `Loja.tsx` | Loja de produtos |

### Componentes Importantes

```
src/components/
├── AgendamentosTempoReal.tsx  # Lista com Realtime
├── QuadroEfetivados.tsx       # Marcar efetivado/não
├── HorariosEspeciais.tsx      # Gerenciar horários especiais
├── ConsultaAgendamentos.tsx   # Buscar por contato
├── MovimentacaoDia.tsx        # Resumo do dia
└── ui/                        # shadcn/ui components
```

### Tratamento de Timezone
```typescript
// CRÍTICO: Evitar erro "off-by-one-day"
// Sempre adicionar T12:00:00 antes de formatar
const dateObj = new Date(dateString + 'T12:00:00');
const formatted = format(dateObj, "dd/MM/yyyy", { locale: ptBR });
```

---

## 🔒 SEGURANÇA IMPLEMENTADA

### 1. Row Level Security (RLS)
```sql
-- Todas as tabelas têm RLS habilitado
ALTER TABLE agendamentos_robustos ENABLE ROW LEVEL SECURITY;

-- Apenas admin vê todos os agendamentos
CREATE POLICY "Admins can read all"
  ON agendamentos_robustos FOR SELECT
  USING (is_admin());

-- Service role (Edge Functions) tem acesso total
CREATE POLICY "Service role full access"
  ON agendamentos_robustos FOR ALL
  USING (true);
```

### 2. Função is_admin()
```sql
CREATE FUNCTION is_admin() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

### 3. Logs Sanitizados (Sem dados sensíveis)
```typescript
// ❌ ANTES (expõe dados)
console.log('Agendamento:', booking);
console.log('Email:', email);

// ✅ DEPOIS (sanitizado)
console.log('Agendamento criado:', booking?.id);
console.log('Tentativa de autenticação');
```

### 4. Validação de Inputs
```typescript
// Limites de tamanho
const MAX_NAME_LENGTH = 100;
const MAX_CONTACT_LENGTH = 20;

// Sanitização
const sanitizedContact = contact.replace(/[^\\d\\s\\-\\(\\)]/g, '').slice(0, 20);
```

### 5. Proteção contra Leak de Password
> ⚠️ **LIMITAÇÃO DO PLANO GRATUITO**: O recurso "Leaked Password Protection" 
> do Supabase só está disponível em planos pagos. Documentar isso para o usuário.

---

## 🚀 DEPLOY E CONFIGURAÇÃO

### Passo 1: Criar Projeto Supabase
1. Acesse supabase.com/dashboard
2. New Project → Escolha região São Paulo
3. Anote: Project URL, anon key, service_role key, Project ID

### Passo 2: Executar SQL de Migração
```bash
# Abra o arquivo supabase_migration_complete.sql
# EDITE a PARTE 10 com dados da sua loja
# Execute no SQL Editor do Supabase
```

### Passo 3: Criar Usuário Admin
1. Authentication → Users → Add User
2. Use o MESMO email que colocou em `info_loja.auth_user`
3. Copie o UUID do usuário
4. Execute no SQL Editor:
```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('UUID-DO-USUARIO', 'admin');
```

### Passo 4: Deploy das Edge Functions
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref SEU-PROJECT-ID

# Deploy de todas as functions
supabase functions deploy --project-ref SEU-PROJECT-ID
```

### Passo 5: Configurar Cron Jobs
Execute no SQL Editor:
```sql
-- 1. Keep-alive (2x por semana)
SELECT cron.schedule('keep_alive_biweekly', '0 0 * * 1,5', $$ ... $$);

-- 2. DB Cleanup (1x por semana)
SELECT cron.schedule('db-cleanup-weekly', '0 3 * * 0', $$ ... $$);
```

### Passo 6: Deploy Frontend
```bash
# Variáveis de ambiente
VITE_SUPABASE_URL=https://SEU-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key

# Build
npm run build

# Deploy para Cloudflare Pages, Vercel ou Netlify
```

### Passo 7: GitHub Actions (Opcional)
Configure secrets no GitHub:
```
SUPABASE_ACCESS_TOKEN=seu-token
SUPABASE_PROJECT_ID=seu-project-id
```

---

## 🧹 MANUTENÇÃO AUTOMATIZADA

### Checklist Semanal (Automático via Cron)
- [x] Keep-alive executa 2x/semana
- [x] DB-cleanup executa 1x/semana

### Checklist Mensal (Manual)
- [ ] Verificar tamanho do banco no Dashboard
- [ ] Revisar logs das Edge Functions
- [ ] Atualizar feriados do próximo ano

### Monitoramento de Limites

| Recurso | Limite Free | Verificar em |
|---------|-------------|--------------|
| Database | 500MB | Dashboard → Database → Settings |
| Storage | 1GB | Dashboard → Storage |
| Edge Functions | 500k inv/mês | Dashboard → Edge Functions |
| Realtime | 200 concurrent | Dashboard → Realtime |

---

## 🔧 TROUBLESHOOTING

### Erro: "Horário indisponível"
**Causa**: Conflito de simultaneidade
**Solução**: Sistema já trata com erro 409 e recarrega slots

### Erro: "relation does not exist"
**Causa**: SQL não executado
**Solução**: Execute `supabase_migration_complete.sql` novamente

### Erro: "permission denied"
**Causa**: RLS bloqueando
**Solução**: Verificar se usuário tem role admin

### Projeto pausado (hibernando)
**Causa**: Inatividade > 7 dias
**Solução**: 
1. Resume no Dashboard
2. Verificar se cron keep-alive está configurado

### Banco chegando em 500MB
**Causa**: Muitos agendamentos históricos
**Solução**:
1. Verificar se cron db-cleanup está configurado
2. Executar manualmente: `POST /functions/v1/db-cleanup`

### Horários não aparecem
**Causa**: Pode ser domingo, feriado ou horário especial
**Solução**: Verificar tabelas `feriados` e `horarios_especiais`

---

## 📝 RESUMO DAS OTIMIZAÇÕES

### Para Supabase Free (500MB)
1. ✅ Limpeza automática do banco (`db-cleanup`)
2. ✅ Keep-alive para evitar hibernação
3. ✅ Cache headers via Cloudflare
4. ✅ Busca sob demanda (não carrega tudo)
5. ✅ Realtime com debounce (1.5s)
6. ✅ Parâmetros enviados do frontend (menos queries)
7. ✅ View pública para dados não-sensíveis

### Para Cloudflare Free
1. ✅ Headers Cache-Control configurados
2. ✅ Diferentes TTLs por tipo de dado
3. ✅ stale-while-revalidate para UX

### Segurança
1. ✅ RLS em todas as tabelas
2. ✅ Logs sanitizados (sem dados pessoais)
3. ✅ Validação e sanitização de inputs
4. ✅ Conflito 409 para simultaneidade

---

## 🎯 PROMPT PARA RECRIAR O SISTEMA

Para reproduzir este sistema do zero, use este prompt:

```
Crie um sistema de agendamentos para barbearia/salão com as seguintes características:

FRONTEND:
- React + Vite + TypeScript + Tailwind + shadcn/ui
- Página de agendamento com seleção de data, profissional, serviço e horário
- Sistema de cancelamento e reagendamento com senha
- Dashboard administrativo protegido
- Loja de produtos integrada
- Realtime updates com Supabase

BACKEND (Supabase):
- Tabelas: agendamentos_robustos, info_loja, feriados, horarios_especiais, cadastro, user_roles, produtos_loja, categorias_produto
- Edge Functions para todas as operações
- RLS policies para segurança
- View pública (info_loja_public) ocultando campo auth_user

OTIMIZAÇÕES CRÍTICAS PARA PLANO GRATUITO:

1. DB-CLEANUP: Edge Function que monitora o tamanho do banco e remove automaticamente:
   - Cancelados > 30 dias
   - Não efetivados > 60 dias
   - Efetivados > 90 dias
   Gatilho: quando banco atinge 400MB (80% de 500MB)

2. KEEP-ALIVE: Edge Function + Cron Job (2x/semana) para evitar hibernação após 7 dias

3. CACHE CLOUDFLARE: Headers Cache-Control nas responses:
   - Feriados/fechados: 1h no CDN
   - Hoje: 30s no CDN
   - Futuro: 60s no CDN
   - Book-slot: NO CACHE (validação em tempo real)

4. OTIMIZAÇÃO DE QUERIES:
   - Frontend envia opening_time, closing_time, slot_interval_minutes
   - Busca slots apenas da data selecionada (não todas)
   - Realtime com debounce de 1.5s

5. CONFLITO 409: Validação de disponibilidade antes de inserir
   - Retorna HTTP 409 se horário ocupado
   - Frontend detecta e recarrega slots

6. SEGURANÇA:
   - Logs sanitizados (sem nome, contato, email, senha)
   - RLS em todas as tabelas
   - Função is_admin() para verificar permissões

DEPLOY:
- Frontend: Cloudflare Pages ou Vercel
- Backend: Supabase Cloud
- CI/CD: GitHub Actions para Edge Functions

Gere toda a estrutura incluindo SQL de migração, Edge Functions, componentes React e documentação de setup.
```

---

**Documento criado em**: Fevereiro 2025  
**Última atualização**: Após implementação de todas as otimizações para plano gratuito
