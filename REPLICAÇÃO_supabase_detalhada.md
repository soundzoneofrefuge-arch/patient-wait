# 🚀 GUIA COMPLETO DE MIGRAÇÃO V2

## Sistema de Agendamentos + Loja

Este guia fornece instruções detalhadas para migrar todo o projeto para uma **nova conta Supabase**, incluindo banco de dados, Edge Functions e configurações.

---

## 📋 ÍNDICE

1. [Pré-requisitos](#pré-requisitos)
2. [Passo 1: Criar Projeto no Supabase](#passo-1-criar-projeto-no-supabase)
3. [Passo 2: Executar SQL de Migração](#passo-2-executar-sql-de-migração)
4. [Passo 3: Criar Usuário Admin](#passo-3-criar-usuário-admin)
5. [Passo 4: Configurar Storage](#passo-4-configurar-storage)
6. [Passo 5: Deploy das Edge Functions](#passo-5-deploy-das-edge-functions)
7. [Passo 6: Configurar Frontend](#passo-6-configurar-frontend)
8. [Passo 7: Testar Sistema](#passo-7-testar-sistema)
9. [Troubleshooting](#troubleshooting)
10. [Referência Rápida](#referência-rápida)

---

## 📦 PRÉ-REQUISITOS

Antes de começar, você precisa:

- [ ] Conta no [Supabase](https://supabase.com)
- [ ] [Node.js](https://nodejs.org) instalado (v18+)
- [ ] [Supabase CLI](https://supabase.com/docs/guides/cli) instalado
- [ ] Acesso ao repositório do projeto
- [ ] Informações da nova loja (nome, endereço, profissionais, etc.)

### Instalação do Supabase CLI

```bash
# Via npm
npm install -g supabase

# Ou via homebrew (macOS)
brew install supabase/tap/supabase
```

---

## 🗄️ PASSO 1: CRIAR PROJETO NO SUPABASE

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: Nome do projeto (ex: `barbearia-cliente`)
   - **Database Password**: Gere uma senha segura (guarde-a!)
   - **Region**: Escolha a mais próxima (ex: South America - São Paulo)
4. Clique em **"Create new project"**
5. Aguarde a criação (~2 minutos)

### Anote as credenciais:

Após criação, vá em **Settings > API** e anote:

| Credencial | Descrição |
|------------|-----------|
| `Project URL` | URL do projeto (ex: `https://xxxxx.supabase.co`) |
| `anon public` | Chave pública para o frontend |
| `service_role` | Chave privada (NUNCA exponha no frontend!) |
| `Project ID` | ID do projeto (usado no CLI) |

---

## 🛠️ PASSO 2: EXECUTAR SQL DE MIGRAÇÃO

### 2.1 Abrir SQL Editor

1. No dashboard do Supabase, vá em **SQL Editor**
2. Clique em **"+ New Query"**

### 2.2 Executar Script Completo

1. Abra o arquivo `supabase_migration_complete.sql` do projeto
2. **ANTES de executar**, edite a **PARTE 10** com os dados da nova loja:

```sql
-- 10.1 Inserir dados da loja (ALTERE ESTES VALORES)
INSERT INTO public.info_loja (...) VALUES (
    'NOME DA BARBEARIA',           -- ← ALTERE
    'Endereço completo',           -- ← ALTERE
    '08:00:00',                    -- ← Horário abertura
    '21:00:00',                    -- ← Horário fechamento
    60,                            -- Intervalo (minutos)
    E'Profissional 1\nProfissional 2',  -- ← ALTERE
    E'Cabelo + Barba\nCabelo\nBarba',   -- ← Serviços
    'admin@email.com',              -- ← Email admin
    'https://instagram.com/xxx',    -- ← Instagram
    'https://maps.google.com/xxx',  -- ← Google Maps
    '+5511999999999'                -- ← Telefone
);
```

3. Cole o script completo no SQL Editor
4. Clique em **"Run"** (ou Ctrl+Enter)
5. Verifique se não há erros

### 2.3 Verificar Criação

Execute esta query para verificar:

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Todas as tabelas devem ter `rowsecurity = true`**

---

## 👤 PASSO 3: CRIAR USUÁRIO ADMIN

### 3.1 Criar Usuário no Supabase Auth

1. Vá em **Authentication > Users**
2. Clique em **"Add user"**
3. Preencha:
   - **Email**: MESMO email usado em `auth_user` na tabela `info_loja`
   - **Password**: Senha segura
4. Clique em **"Create user"**
5. **COPIE O UUID** do usuário criado (coluna ID)

### 3.2 Adicionar Role de Admin

1. Vá em **SQL Editor**
2. Execute (substitua o UUID):

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('COLE-O-UUID-DO-USUARIO-AQUI', 'admin');
```

### 3.3 Verificar Admin

```sql
SELECT u.id, u.email, r.role
FROM auth.users u
JOIN public.user_roles r ON r.user_id = u.id
WHERE r.role = 'admin';
```

---

## 📁 PASSO 4: CONFIGURAR STORAGE

### 4.1 Verificar Bucket

O bucket `produtos` já foi criado pelo SQL. Verifique:

1. Vá em **Storage**
2. Confirme que existe o bucket **"produtos"**
3. Confirme que está marcado como **Public**

### 4.2 Se precisar criar manualmente

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO NOTHING;
```

---

## ⚡ PASSO 5: DEPLOY DAS EDGE FUNCTIONS

### 5.1 Login no Supabase CLI

```bash
supabase login
```

Isso abrirá o navegador para autenticar.

### 5.2 Linkar Projeto

```bash
# No diretório do projeto
supabase link --project-ref SEU_PROJECT_ID
```

Substitua `SEU_PROJECT_ID` pelo ID do projeto (encontrado em Settings > General).

### 5.3 Deploy de Todas as Functions

```bash
supabase functions deploy --project-ref SEU_PROJECT_ID
```

Isso fará deploy de todas as Edge Functions:
- `authenticate-admin`
- `book-slot`
- `cancel-booking`
- `get-available-slots`
- `get-day-movement`
- `keep-alive`
- `query-bookings`
- `reschedule-booking`
- `update-finalizacao`

### 5.4 Deploy Individual (se necessário)

```bash
supabase functions deploy nome-da-function --project-ref SEU_PROJECT_ID
```

### 5.5 Verificar Deploy

1. Vá em **Edge Functions** no dashboard
2. Confirme que todas as 9 functions estão listadas
3. Status deve ser **Active**

---

## 🖥️ PASSO 6: CONFIGURAR FRONTEND

### 6.1 Variáveis de Ambiente

Crie ou edite o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 6.2 Para Deploy em Produção

#### Vercel
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

#### Cloudflare Pages
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

#### Netlify
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### 6.3 Atualizar config.toml (se usar GitHub Actions)

Edite `supabase/config.toml`:

```toml
project_id = "SEU-NOVO-PROJECT-ID"
```

### 6.4 Configurar GitHub Secrets (Deploy Automático)

Se usar GitHub Actions para deploy das Edge Functions:

1. Vá no repositório GitHub > Settings > Secrets and variables > Actions
2. Adicione:
   - `SUPABASE_ACCESS_TOKEN`: Token pessoal (Settings > Access Tokens no dashboard)
   - `SUPABASE_PROJECT_ID`: ID do novo projeto

---

## ✅ PASSO 7: TESTAR SISTEMA

### 7.1 Checklist de Testes

| Teste | Como verificar |
|-------|----------------|
| ✅ Página de agendamento carrega | Acesse a URL do frontend |
| ✅ Profissionais aparecem | Lista dropdown mostra os profissionais |
| ✅ Serviços aparecem | Lista dropdown mostra os serviços |
| ✅ Horários disponíveis | Selecione uma data e veja os slots |
| ✅ Criar agendamento | Complete um agendamento de teste |
| ✅ Login admin | Acesse /auth e faça login |
| ✅ Dashboard funciona | Veja os agendamentos no painel |
| ✅ Cancelar agendamento | Cancele o agendamento de teste |
| ✅ Loja funciona | Veja produtos em /loja (se houver) |

### 7.2 Testar Edge Functions

```bash
# Testar get-available-slots
curl -X POST 'https://SEU-PROJECT-ID.supabase.co/functions/v1/get-available-slots' \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUA-ANON-KEY" \
  -d '{"date":"2025-01-20"}'
```

---

## 🔧 TROUBLESHOOTING

### Erro: "relation does not exist"

O SQL não foi executado corretamente. Execute novamente o `supabase_migration_complete.sql`.

### Erro: "permission denied"

RLS não está configurado corretamente. Verifique:
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables WHERE schemaname = 'public';
```

### Erro: "JWT expired" ou "invalid token"

Verifique se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretas.

### Edge Functions não respondem

1. Verifique os logs: Dashboard > Edge Functions > Logs
2. Confirme que o deploy foi bem-sucedido
3. Verifique se `verify_jwt = false` está em `config.toml`

### Admin não consegue logar

1. Confirme que o email do usuário no Supabase Auth = email em `info_loja.auth_user`
2. Confirme que o usuário tem role admin em `user_roles`

### Horários não aparecem

1. Verifique se `info_loja` tem dados
2. Verifique se a data não é domingo ou feriado
3. Veja logs da Edge Function `get-available-slots`

---

## 📖 REFERÊNCIA RÁPIDA

### Estrutura de Tabelas

| Tabela | Descrição |
|--------|-----------|
| `info_loja` | Configurações da loja |
| `feriados` | Datas de feriados |
| `agendamentos_robustos` | Todos os agendamentos |
| `cadastro` | Cadastro de clientes |
| `user_roles` | Roles de usuários (admin, user) |
| `categorias_produto` | Categorias de produtos |
| `produtos_loja` | Produtos da loja |
| `bd_ativo` | Controle interno |

### Edge Functions

| Function | Método | Descrição |
|----------|--------|-----------|
| `get-available-slots` | POST/GET | Lista horários disponíveis |
| `book-slot` | POST | Cria novo agendamento |
| `cancel-booking` | POST | Cancela agendamento |
| `reschedule-booking` | POST | Reagenda agendamento |
| `query-bookings` | POST | Busca agendamentos do cliente |
| `authenticate-admin` | POST | Login do admin |
| `update-finalizacao` | POST | Marca como efetivado/não efetivado |
| `get-day-movement` | POST/GET | Movimentação do dia |
| `keep-alive` | GET | Mantém projeto ativo |

### URLs Importantes

```
Dashboard Supabase: https://supabase.com/dashboard/project/SEU_PROJECT_ID
SQL Editor: https://supabase.com/dashboard/project/SEU_PROJECT_ID/sql/new
Edge Functions: https://supabase.com/dashboard/project/SEU_PROJECT_ID/functions
Authentication: https://supabase.com/dashboard/project/SEU_PROJECT_ID/auth/users
Storage: https://supabase.com/dashboard/project/SEU_PROJECT_ID/storage/buckets
```

---

## 📝 NOTAS FINAIS

### Backup de Dados

Para exportar dados do projeto antigo:
```sql
-- Exportar agendamentos
COPY (SELECT * FROM agendamentos_robustos) TO STDOUT WITH CSV HEADER;

-- Exportar cadastros
COPY (SELECT * FROM cadastro) TO STDOUT WITH CSV HEADER;
```

### Atualizar para Nova Versão

Se o projeto base for atualizado, você pode:
1. Fazer merge das alterações no código
2. Executar novos SQLs de migração (se houver)
3. Fazer redeploy das Edge Functions

### Custos

| Serviço | Free Tier |
|---------|-----------|
| Supabase | 500MB database, 1GB storage, 2 Edge Functions invocações/mês |
| Vercel | 100GB bandwidth |
| Cloudflare Pages | Unlimited static requests |

---

**Última atualização**: Janeiro 2025
**Versão**: 2.0
