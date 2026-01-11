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

#### A) Criar projeto
- https://supabase.com/dashboard > New Project
- Nome: `Cliente Agendamentos`
- Region: `South America (São Paulo)`
- Gerar senha forte → **SALVAR!**

#### B) Copiar credenciais
```
Settings > API:
- PROJECT_URL: https://xxxxx.supabase.co
- PROJECT_ID: xxxxx
- ANON_KEY: eyJhbGc...
- SERVICE_ROLE_KEY: eyJhbGc... (NUNCA EXPONHA!)
```

#### C) Setup banco de dados
```sql
-- SQL Editor > New Query
-- Cole: supabase_setup_instructions.sql
-- ⚠️ EDITE ANTES DE EXECUTAR:

-- Linha 24 (auth_user):
auth_user = 'admin@clientebarbearia.com'

-- Linhas 18-22 (dados da loja):
INSERT INTO info_loja (...) VALUES (
  'Barbearia do Cliente',              -- NOME
  'Rua Exemplo, 123 - Cidade/UF',      -- ENDEREÇO
  '(11) 98765-4321',                   -- TELEFONE
  'https://maps.google.com/?q=...',    -- GOOGLE MAPS
  '09:00:00',                          -- ABERTURA
  '20:00:00',                          -- FECHAMENTO
  60,                                  -- INTERVALO (minutos)
  E'João\nMaria\nPedro',               -- PROFISSIONAIS
  E'Corte\nBarba\nCorte + Barba',      -- SERVIÇOS
  'admin@clientebarbearia.com'         -- EMAIL ADMIN
);

-- RUN!
```

⚠️ **SE DER ERRO "tabelas não existem"**: Rode primeiro `supabase_create_tables.sql` e depois rode `supabase_setup_instructions.sql` novamente.

#### D) Criar usuário admin
```
Authentication > Users > Add User:
- Email: admin@clientebarbearia.com (MESMO do passo C)
- Password: SenhaSegura123!
- ✅ Auto Confirm User
```

#### E) GitHub Secrets
```
No GitHub do cliente:
Settings > Secrets > Actions > New secret:

Nome: SUPABASE_ACCESS_TOKEN
Valor: (gere em supabase.com/dashboard/account/tokens)

Nome: SUPABASE_PROJECT_ID  
Valor: xxxxx (do passo B)
```

#### F) Deploy Edge Functions (Automático)
```bash
# O deploy é AUTOMÁTICO via GitHub Actions
# Basta fazer qualquer alteração em supabase/functions/ e fazer push:

# Por exemplo, edite um comentário em qualquer Edge Function:
# supabase/functions/book_slot/index.ts
# Adicione: // deployed for cliente-nome

git add .
git commit -m "trigger deploy"
git push origin main

# Vá em: GitHub > Actions > Deploy Supabase Functions
# Aguarde ~30 segundos para ver o workflow rodar
```

✅ **Verificar deploy**: No Supabase Dashboard > Edge Functions, deve aparecer todas as functions deployadas.

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
