# 🚀 GUIA RÁPIDO DE REPLICAÇÃO - Sistema de Agendamentos

## ⏱️ Tempo Total: ~20 minutos

---

## 📋 CHECKLIST PRÉ-DEPLOY

Informações que você precisa do CLIENTE:

- [ ] Nome da barbearia/salão
- [ ] Endereço completo
- [ ] Telefone de contato
- [ ] Link do Google Maps
- [ ] Horário de funcionamento (abertura e fechamento)
- [ ] Lista de profissionais (nomes)
- [ ] Lista de serviços oferecidos
- [ ] Email do administrador
- [ ] Senha do administrador (ou você gera)

---

## 🎯 PASSO A PASSO RÁPIDO

### 1️⃣ GITHUB (2 min)

```bash
# Clonar master
git clone https://github.com/SEU-USUARIO/projeto-master.git cliente-nome
cd cliente-nome

# Criar repo no GitHub do cliente (privado)
# Depois:
git remote remove origin
git remote add origin https://github.com/CLIENTE/repo-nome.git
git push -u origin main
```

⚠️ **IMPORTANTE**: O projeto master já tem todos os arquivos necessários em `_shared/`, incluindo `utils.ts` que exporta as utilities. Não precisa criar nada manualmente!

---

⚠️**ATENÇÃO!!!**
No caminho src/integrations/supabase/client.ts por padrão de criação e fácil exibição, a ferramenta de criação deixa as chaves lá. 
Quando em produção, eu uso o seguinte código no client.ts:

```bash
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// --- CONFIGURAÇÃO GENÉRICA (CLOUD & LOCAL) ---
// Busca as chaves nas variáveis de ambiente.
// Em PRODUÇÃO: Pega do Painel da Cloudflare.
// Em DESENVOLVIMENTO: Pega do arquivo .env (se existir) ou Secrets do Lovable.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
// O Project ID muitas vezes é útil para logs ou integrações futuras
const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

// Alerta de Segurança no Console (Ajuda a debugar telas brancas)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("ERRO CRÍTICO: Variáveis do Supabase não encontradas.");
  console.error("Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão configuradas no .env ou no painel da Cloudflare.");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

Este código é genérico, não guarda chaves e aponta para o .env local e/ou em nuvem, no caso queremos cloudfare pages. É importante ressaltar que quando precisar editar novamente em alguma ferramenta, como o Lovable, por exemplo, tem que subir um arquivo .env para a raiz do projeto no github para que consiga visualizar o preview. 
Assim, não temos nenhuma chave no frontend do código. Não é boa prática deixar chaves no forntend. Até posso ter o arquivo .env na raiz, mas paenas com os nomes, sem as chaves. Quando for editar, basta colocar as chaves no env. mas em produção não esqueça de apagar.

Por padrão, o Lovable, por exemplo, costuma usar para credencias e isso que preencherá o .env. 

**ATENÇÃO!!!**
Use os nomes abaixo ocmo padrão. **Os nomes precisam ser exatamente iguais aos que estão no Supabase. Eu já esqueci de colocar o VITE_ no cloudfare e não funcionou!**

```bash
VITE_SUPABASE_PROJECT_ID=seu_id_do_projeto_aqui
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh... (sua chave inteira aqui)
```
Você perceberá que com as chvaves configuradas na cloudfare, o site vai aparecer, mas no preview do Lovable, por exemplo, não vai aparecer, vai dar erro de págino. Para editar no Lovable, suba um .env com nome e chaves segundo o modelo acima.

---

### 2️⃣ SUPABASE (10 min)

#### A) Criar projeto no Supabase
1. Acesse: https://supabase.com/dashboard
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: `Cliente Agendamentos` (ou nome do cliente)
   - **Database Password**: Gere senha forte → **SALVAR EM LOCAL SEGURO!**
   - **Region**: `South America (São Paulo)` ⚠️ Sempre escolher São Paulo!
4. Clique em **"Create new project"**
5. Aguarde ~2 minutos para o projeto ser criado

#### B) Copiar credenciais (GUARDAR!)
1. Vá em: **Settings** (engrenagem) → **API**
2. Copie e salve em local seguro:

```
PROJECT_URL: https://xxxxx.supabase.co
PROJECT_ID: xxxxx (está na URL do projeto)
ANON_KEY: eyJhbGc... (chave pública)
SERVICE_ROLE_KEY: eyJhbGc... (⚠️ NUNCA EXPONHA PUBLICAMENTE!)
```

#### C) Executar SQL de migração completa
1. Vá em: **SQL Editor** (ícone de banco de dados) → **New Query**
2. Abra o arquivo `supabase_migration_complete.sql` do projeto
3. **⚠️ ANTES DE EXECUTAR**, edite a **PARTE 10** do SQL com os dados do cliente:

```sql
-- ============================================
-- PARTE 10: DADOS INICIAIS - INFORMAÇÕES DA LOJA
-- ⚠️ EDITE ESSES VALORES ANTES DE EXECUTAR!
-- ============================================
INSERT INTO public.info_loja (
    name,
    address,
    opening_time,
    closing_time,
    slot_interval_minutes,
    nome_profissionais,
    escolha_serviços,
    instructions,
    auth_user,
    url_insta,
    maps_url,
    url_phone
) VALUES (
    'NOME DA BARBEARIA AQUI',           -- ⬅️ EDITAR: Nome do estabelecimento
    'RUA, NÚMERO - CIDADE/UF',          -- ⬅️ EDITAR: Endereço completo
    '09:00:00',                         -- ⬅️ EDITAR: Horário abertura (HH:MM:SS)
    '20:00:00',                         -- ⬅️ EDITAR: Horário fechamento (HH:MM:SS)
    60,                                 -- Intervalo entre agendamentos (minutos)
    E'João\nMaria\nPedro',              -- ⬅️ EDITAR: Profissionais (um por linha com \n)
    E'Corte\nBarba\nCorte + Barba',     -- ⬅️ EDITAR: Serviços (um por linha com \n)
    'Chegar 10 minutos antes',          -- ⬅️ EDITAR: Instruções (opcional)
    'admin@cliente.com',                -- ⬅️ EDITAR: Email do administrador
    'https://instagram.com/cliente',    -- ⬅️ EDITAR: URL Instagram (ou NULL)
    'https://maps.google.com/?q=...',   -- ⬅️ EDITAR: URL Google Maps (ou NULL)
    'https://wa.me/5511999999999'       -- ⬅️ EDITAR: URL WhatsApp (ou NULL)
);
```

4. Após editar, clique em **"Run"** (ou Ctrl+Enter)
5. ✅ Deve aparecer: "Success. No rows returned" (isso é normal!)

#### D) Verificar se tabelas foram criadas
1. Vá em: **Table Editor** (ícone de tabela)
2. Verifique se existem as tabelas:
   - ✅ `agendamentos_robustos`
   - ✅ `info_loja`
   - ✅ `feriados`
   - ✅ `cadastro`
   - ✅ `produtos_loja`
   - ✅ `categorias_produto`
   - ✅ `user_roles`
   - ✅ `bd_ativo`

3. Clique em `info_loja` e verifique se os dados do cliente estão lá

#### E) Criar usuário administrador (MANUAL - OBRIGATÓRIO!)
1. Vá em: **Authentication** → **Users**
2. Clique em **"Add User"** → **"Create New User"**
3. Preencha:
   - **Email**: `admin@cliente.com` (⚠️ MESMO email usado no SQL!)
   - **Password**: `SenhaSegura123!` (crie uma senha forte)
   - ✅ Marque **"Auto Confirm User"**
4. Clique em **"Create User"**
5. **COPIE O USER ID** que aparece na lista (formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

#### F) Atribuir role de admin ao usuário (MANUAL - OBRIGATÓRIO!)
1. Vá em: **SQL Editor** → **New Query**
2. Execute o seguinte SQL (substituindo o USER_ID):

```sql
-- ⚠️ SUBSTITUA 'USER_ID_AQUI' pelo ID copiado no passo anterior!
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_AQUI', 'admin');
```

3. Clique em **"Run"**
4. ✅ Deve aparecer: "Success. No rows returned"

#### G) Verificar role foi atribuída
```sql
-- Execute no SQL Editor para confirmar:
SELECT * FROM public.user_roles;
```
Deve aparecer uma linha com o user_id e role = 'admin'

#### H) Configurar Storage (para produtos)
1. Vá em: **Storage** → verifique se existe o bucket `produtos`
2. Se não existir, o SQL já criou automaticamente
3. Verifique se está como **Public** (ícone de olho aberto)

#### I) GitHub Secrets (para deploy automático)
1. No GitHub do cliente, vá em: **Settings** → **Secrets and variables** → **Actions**
2. Clique em **"New repository secret"** e adicione:

| Nome | Valor |
|------|-------|
| `SUPABASE_ACCESS_TOKEN` | Gere em: https://supabase.com/dashboard/account/tokens |
| `SUPABASE_PROJECT_ID` | O ID do projeto (xxxxx) |

#### J) Deploy Edge Functions (Automático via GitHub Actions)
O deploy acontece automaticamente quando você faz push para o repositório.

Para forçar o deploy:
```bash
# Adicione um comentário em qualquer Edge Function
# Por exemplo em: supabase/functions/book-slot/index.ts
# Adicione: // deployed for cliente-nome

git add .
git commit -m "deploy edge functions"
git push origin main
```

Verificar: **GitHub** → **Actions** → deve aparecer o workflow rodando

✅ **Confirmar deploy**: No Supabase → **Edge Functions** → deve listar todas as functions

---

### 3️⃣ CLOUDFLARE PAGES (5 min)

Apague o arquivo bun.lock do projeto. Cloudfare opera em npm, melhor. Já tem o package-lock.json. Com o bun.lock, a cloudfare fica perdida com 2 para implantar.
Assim é mais fácil.

#### A) Conectar repo
```
https://dash.cloudflare.com
> Workers & Pages > Create > Pages > Connect to Git
> Selecione repositório do cliente

Build settings:
- Framework preset: None (Nenhum)
- Build command: npm run build (atualizado 11/01/2026)
- Build output directory: dist
- Deployment command: (deixar em branco)
```

💡 **Dica**: `bun run build` é geralmente mais rápido que npm!

#### B) Variáveis de ambiente
```
Settings > Environment Variables > Production:

VITE_SUPABASE_URL = https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGc...

(usar credenciais do passo 2B)
```

#### C) Deploy
```
Save and Deploy → Aguardar 2-3 min
```
**ATENÇÃO!!!**

**O site subirá com o nome padrão do repositório do github. Para colocar um nome.pagas.dev que quiser, crie um nome projeto, em Project Name coloque o nome que quiser e faça novo deploy,
como um nome projeto. Agora, você terá 2. Apague o anterior em Settings depois.
---

## ✅ CHECKLIST PÓS-DEPLOY

### Frontend
- [ ] Site abre
- [ ] Nome/endereço/telefone aparecem
- [ ] Google Maps funciona
- [ ] Profissionais carregam
- [ ] Serviços carregam

### Agendamentos
- [ ] Calendário funciona
- [ ] Domingos bloqueados
- [ ] Feriados bloqueados
- [ ] Criar agendamento funciona
- [ ] Consultar agendamento funciona
- [ ] Cancelar funciona
- [ ] Reagendar funciona

### Admin
- [ ] Login funciona (/admin)
- [ ] Dashboard carrega
- [ ] Vê agendamentos
- [ ] Vê cadastros
- [ ] Edita configurações

---

## 🆘 TROUBLESHOOTING

### "Não carrega horários disponíveis"
```sql
-- Verificar info_loja:
SELECT * FROM info_loja;

-- Se vazio, executar INSERT do passo 2C novamente
```

### "Login admin não funciona"
```sql
-- Verificar auth_user:
SELECT auth_user FROM info_loja;

-- Verificar usuário criado:
-- Authentication > Users > Procurar email
```

### "Edge Functions não deployaram"
```bash
# Ver logs no GitHub Actions:
# Repo > Actions > Deploy Supabase Functions > Clicar no workflow

# Verificar se GitHub Secrets estão criados:
# Settings > Secrets and variables > Actions

# Se necessário, re-deploy manual:
supabase functions deploy --project-ref xxxxx
```

### "Dados da loja não aparecem no site"
```sql
-- Atualizar info_loja no Supabase SQL Editor:
UPDATE info_loja SET
  name = 'Nome Correto',
  address = 'Endereço Correto',
  phone = '(XX) XXXXX-XXXX',
  maps_url = 'https://maps.google.com/...'
WHERE id = 1;

-- ✅ Mudanças aparecem INSTANTANEAMENTE (sem re-deploy!)
-- Basta atualizar a página do site
```

### "Workflow não roda automaticamente"
```
O workflow só roda quando você altera arquivos em:
- supabase/functions/**
- .github/workflows/deploy.yml

Para triggar manualmente:
1. Edite qualquer Edge Function (adicione um comentário)
2. Commit e push
3. Vá em Actions para ver rodando
```

---

## 📞 URLs IMPORTANTES

- **GitHub Repo**: `https://github.com/CLIENTE/repo-nome`
- **Supabase Dashboard**: `https://supabase.com/dashboard/project/PROJECT_ID`
- **Cloudflare Dashboard**: `https://dash.cloudflare.com`
- **Site Público**: `https://cliente-agendamentos.pages.dev`
- **Admin**: `https://cliente-agendamentos.pages.dev/admin`

---

## 💰 CUSTOS (informar ao cliente)

### Gratuito (até certo limite):
- ✅ Supabase Free: 500MB DB, 2GB bandwidth, 50,000 usuários ativos/mês
- ✅ Cloudflare Pages: Ilimitado builds e requests
- ✅ GitHub: Repositório privado gratuito

### Se ultrapassar:
- 💵 Supabase Pro: $25/mês (8GB DB, 250GB bandwidth)
- 💵 Cloudflare Workers Paid: $5/mês (apenas se precisar mais recursos)

**Para maioria das barbearias/salões**: Plan gratuito é suficiente! 🎉

---

## 🔄 PRÓXIMAS ATUALIZAÇÕES

Quando você atualizar o projeto master com novas features:

```bash
# No repo do cliente:
git remote add upstream https://github.com/SEU-USUARIO/projeto-master.git
git fetch upstream
git merge upstream/main

# Resolver conflitos se houver (normalmente não tem)
git push origin main

# GitHub Actions vai re-deployar automaticamente
# Cloudflare vai re-buildar automaticamente
```

---

## 🎉 PRONTO!

Cliente tem sistema completo funcionando em ~20 minutos! 🚀

---

## 📝 NOTAS ADICIONAIS

### Arquivos Importantes no Projeto Master:
- ✅ `supabase/functions/_shared/utils.ts` - Exporta todas utilities (cors, datetime, password)
- ✅ `supabase/functions/_shared/validators.ts` - Validações compartilhadas
- ✅ `supabase_setup_instructions.sql` - Setup completo do banco
- ✅ `supabase_create_tables.sql` - Apenas criação de tabelas (backup)
- ✅ `.github/workflows/deploy.yml` - Deploy automático configurado

### Estrutura das Edge Functions:
Todas as functions já importam utilities compartilhadas:
```typescript
import { corsHeaders, generatePassword, getBrazilDateTime } from '../_shared/utils.ts';
```

Isso garante:
- 🔒 Código sem duplicação
- ⚡ Fácil manutenção
- ✅ Comportamento consistente em todas functions
