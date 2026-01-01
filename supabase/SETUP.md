# 🚀 Guia de Setup do Supabase

## ⚠️ IMPORTANTE: NÃO USAMOS MIGRATIONS

Este projeto **NÃO utiliza** a pasta `supabase/migrations/`.

**Toda a estrutura do banco é gerenciada pelo arquivo:**
📄 **`supabase_setup_instructions.sql`** (na raiz do projeto)

### Por que não usamos migrations?
- ✅ Mais simples: um único arquivo SQL com tudo
- ✅ Mais claro: você vê toda a estrutura de uma vez
- ✅ Mais confiável: menos erros de ordem de execução
- ✅ Portável: fácil de copiar para novos projetos
---
## Para Nova Conta Supabase

### 1️⃣ Criar Projeto no Supabase
1. Acesse https://supabase.com/dashboard
2. Clique em "New Project"
3. Anote o **Project ID** que será gerado

### 2️⃣ Executar SQL de Setup
1. Vá em `SQL Editor` no dashboard
2. Abra o arquivo `supabase_setup_instructions.sql` da raiz do projeto
3. Cole TODO o conteúdo e execute
4. Verifique se todas as tabelas foram criadas

### 3️⃣ Configurar GitHub Secrets (para deploy automático)
1. Vá em `Settings > Secrets and variables > Actions` do seu repositório GitHub
2. Adicione estes secrets:
```
SUPABASE_ACCESS_TOKEN = (encontre em: https://supabase.com/dashboard/account/tokens)
SUPABASE_PROJECT_ID = seu-project-id-aqui
```

### 4️⃣ Deploy Manual das Edge Functions (primeira vez)
```bash
# Instale o Supabase CLI
npm install -g supabase

# Faça login
supabase login

# Deploy das functions
supabase functions deploy --project-ref SEU_PROJECT_ID

Se o workflow não rodar diretamente quando colocar as secrets no github, altere um arquivo .md dentro da pasta supabase/function faça commit para o workflow rodar no action.
```

### 5️⃣ Pegar as Credenciais para o Frontend
No dashboard do Supabase:
1. Vá em `Settings > API`
2. Copie:
   - **Project URL** (URL)
   - **anon public** key (ANON_KEY)

### 6️⃣ Configurar Variáveis de Ambiente no Frontend
Dependendo da plataforma de deploy:

**Vercel/Netlify/Cloudflare:**
```
VITE_SUPABASE_URL=https://seu-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

---

## ✅ Checklist de Verificação

- [ ] Tabelas criadas (agendamentos_robustos, info_loja, feriados, cadastro, bd_ativo)
- [ ] Edge Functions deployadas (8 functions)
- [ ] RLS policies ativas
- [ ] Usuário admin criado no Supabase Auth
- [ ] Email do admin cadastrado em `info_loja.auth_user`
- [ ] Feriados populados para 2025-2026
- [ ] GitHub Secrets configurados
- [ ] Deploy automático funcionando

---

## 🆘 Troubleshooting

### Erro: "PROJECT_ID not configured"
→ Configure `SUPABASE_PROJECT_ID` nos GitHub Secrets

### Erro: "relation does not exist"
→ Execute novamente o `supabase_setup_instructions.sql`

### Erro: "permission denied"
→ Verifique se as RLS policies foram criadas corretamente

### Edge Functions não deployam
→ Verifique se o `SUPABASE_ACCESS_TOKEN` está correto nos Secrets
```

**✅ COMMIT ISSO**

---

### **PASSO 1.6: Deletar arquivos temporários**

📁 **Deletar TODA a pasta: `supabase/.temp/`**

Esses arquivos são gerados automaticamente pelo CLI e não devem estar no git.

**✅ COMMIT A DELEÇÃO**

---

## 🎯 **CHECKPOINT 1 - O QUE CONSEGUIMOS?**

✅ **Configuração dinâmica**: Agora ao mudar de conta Supabase, você só precisa:
1. Atualizar os **GitHub Secrets** (SUPABASE_PROJECT_ID)
2. Deploy automático funcionará

✅ **Segurança**: Nenhuma credencial no código

✅ **Documentação**: README claro de como fazer setup

✅ **Limpeza**: Arquivos temporários fora do git

---

## 📌 **AÇÕES NECESSÁRIAS AGORA:**

### **No GitHub:**
1. Commit os 4 novos arquivos
2. Commit as 2 edições
3. Commit a deleção da pasta `.temp/`

### **No GitHub Secrets:**
Vá em `Settings > Secrets and variables > Actions` e adicione:
```
SUPABASE_PROJECT_ID = tmdtwkufvwlzoarslvip
SUPABASE_ACCESS_TOKEN = (pegue em https://supabase.com/dashboard/account/tokens)
