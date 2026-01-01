-- ============================================
-- POLÍTICAS DE SEGURANÇA (RLS) - Sistema de Agendamentos
-- ============================================
-- Execute este arquivo no Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Cole e Execute

-- ============================================
-- 1. AGENDAMENTOS_ROBUSTOS
-- ============================================
-- Remover políticas antigas
DROP POLICY IF EXISTS "Authenticated users can update all appointments" ON agendamentos_robustos;
DROP POLICY IF EXISTS "Public can read appointments" ON agendamentos_robustos;
DROP POLICY IF EXISTS "Service role can delete appointments" ON agendamentos_robustos;
DROP POLICY IF EXISTS "Service role can insert appointments" ON agendamentos_robustos;
DROP POLICY IF EXISTS "Service role can read all appointments" ON agendamentos_robustos;
DROP POLICY IF EXISTS "Service role can update appointments" ON agendamentos_robustos;

-- Criar políticas seguras
-- Apenas service_role (edge functions) pode inserir
CREATE POLICY "Service role can insert appointments"
ON agendamentos_robustos
FOR INSERT
TO service_role
WITH CHECK (true);

-- Apenas service_role pode atualizar
CREATE POLICY "Service role can update appointments"
ON agendamentos_robustos
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Apenas service_role pode deletar
CREATE POLICY "Service role can delete appointments"
ON agendamentos_robustos
FOR DELETE
TO service_role
USING (true);

-- Usuários autenticados (admin) podem ler todos os agendamentos
CREATE POLICY "Authenticated users can read all appointments"
ON agendamentos_robustos
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 2. CUSTOMER_AUTH
-- ============================================
-- Remover políticas antigas
DROP POLICY IF EXISTS "Service role can manage customer_auth" ON customer_auth;

-- CRÍTICO: Apenas service_role pode gerenciar autenticação de clientes
CREATE POLICY "Service role full access to customer_auth"
ON customer_auth
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 3. CADASTRO
-- ============================================
-- Remover políticas antigas
DROP POLICY IF EXISTS "cadastro_agendamento" ON cadastro;
DROP POLICY IF EXISTS "Service role full access to cadastro" ON cadastro;
DROP POLICY IF EXISTS "Users can delete own cadastro" ON cadastro;
DROP POLICY IF EXISTS "Users can insert own cadastro" ON cadastro;
DROP POLICY IF EXISTS "Users can update own cadastro" ON cadastro;
DROP POLICY IF EXISTS "Users can view own cadastro" ON cadastro;

-- Service role tem acesso total
CREATE POLICY "Service role full access to cadastro"
ON cadastro
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Usuários autenticados (admin) podem ler todos os cadastros
CREATE POLICY "Authenticated users can read all cadastros"
ON cadastro
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 4. BD_ATIVO
-- ============================================
-- Remover política antiga se existir
DROP POLICY IF EXISTS "Service role full access to bd_ativo" ON bd_ativo;

-- Esta tabela controla qual BD está ativo
CREATE POLICY "Service role full access to bd_ativo"
ON bd_ativo
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 5. FERIADOS
-- ============================================
-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Public can read feriados" ON feriados;
DROP POLICY IF EXISTS "Service role full access to feriados" ON feriados;

-- Público pode ler feriados (necessário para verificar disponibilidade)
CREATE POLICY "Public can read feriados"
ON feriados
FOR SELECT
TO anon, authenticated
USING (true);

-- Service role pode gerenciar feriados
CREATE POLICY "Service role full access to feriados"
ON feriados
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 6. INFO_LOJA
-- ============================================
-- Remover políticas antigas
DROP POLICY IF EXISTS "Service role can delete info_loja" ON info_loja;
DROP POLICY IF EXISTS "Service role can insert info_loja" ON info_loja;
DROP POLICY IF EXISTS "Service role can read info_loja" ON info_loja;
DROP POLICY IF EXISTS "Service role can update info_loja" ON info_loja;
DROP POLICY IF EXISTS "Public can read info_loja" ON info_loja;

-- Público pode ler informações da loja (necessário para booking)
CREATE POLICY "Public can read info_loja"
ON info_loja
FOR SELECT
TO anon, authenticated
USING (true);

-- Apenas service_role pode modificar info_loja
CREATE POLICY "Service role can insert info_loja"
ON info_loja
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update info_loja"
ON info_loja
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can delete info_loja"
ON info_loja
FOR DELETE
TO service_role
USING (true);

-- ============================================
-- VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================
-- Execute para confirmar que RLS está ativo em todas as tabelas

SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'agendamentos_robustos', 
  'customer_auth', 
  'cadastro', 
  'bd_ativo', 
  'feriados', 
  'info_loja'
);

-- Se alguma tabela mostrar rowsecurity = false, execute:
-- ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RESUMO DAS POLÍTICAS
-- ============================================
-- 
-- TABELA: agendamentos_robustos
-- ✓ service_role: INSERT, UPDATE, DELETE (via edge functions)
-- ✓ authenticated: SELECT (dashboard admin)
-- ✓ anon: SEM ACESSO (proteção de dados pessoais: NOME, CONTATO)
--
-- TABELA: customer_auth
-- ✓ service_role: ALL (apenas via edge functions)
-- ✓ Totalmente protegida - senhas e dados de autenticação
--
-- TABELA: cadastro
-- ✓ service_role: ALL
-- ✓ authenticated: SELECT (admin pode ver cadastros)
--
-- TABELA: bd_ativo
-- ✓ service_role: ALL (controle interno do sistema)
--
-- TABELA: feriados
-- ✓ anon/authenticated: SELECT (necessário para booking)
-- ✓ service_role: ALL
--
-- TABELA: info_loja
-- ✓ anon/authenticated: SELECT (necessário para booking)
-- ✓ service_role: INSERT, UPDATE, DELETE
--
-- ============================================
-- SEGURANÇA IMPLEMENTADA
-- ============================================
-- ✓ Dados pessoais (NOME, CONTATO) não acessíveis publicamente
-- ✓ customer_auth completamente protegida
-- ✓ Operações críticas apenas via edge functions (service_role)
-- ✓ Dashboard admin pode visualizar dados (authenticated)
-- ✓ Usuários anônimos só acessam dados necessários para agendamento
-- ✓ Princípio do menor privilégio aplicado
-- ============================================
