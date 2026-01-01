-- ============================================
-- INSTRUÇÕES DE CONFIGURAÇÃO DO SISTEMA
-- ============================================
-- Execute este arquivo no Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Cole e Execute
-- ============================================

-- 1. REMOVER TABELAS NÃO UTILIZADAS
-- ============================================
DROP VIEW IF EXISTS store_info_public CASCADE;
DROP TABLE IF EXISTS customer_auth CASCADE;

-- 2. POPULAR TABELA INFO_LOJA
-- ============================================
-- Limpar dados existentes
DELETE FROM info_loja;

-- Inserir configurações da loja
INSERT INTO info_loja (
  name,
  address,
  phone,
  maps_url,
  opening_time,
  closing_time,
  slot_interval_minutes,
  nome_profissionais,
  escolha_serviços,
  auth_user
) VALUES (
  'Nome da Barbearia',
  'Endereço completo',
  '(XX) XXXXX-XXXX',
  'https://maps.google.com/link',
  '08:00:00',
  '21:00:00',
  60,
  E'PROFISSIONAL 1\nPROFISSIONAL 2',
  E'Cabelo + Barba\nCabelo\nBarba',
  'seu-email@gmail.com'  -- ALTERE AQUI
);

-- 3. POPULAR TABELA FERIADOS (2025-2026)
-- ============================================
-- Limpar feriados existentes
DELETE FROM feriados;

-- Feriados Nacionais 2025
INSERT INTO feriados (data, descricao) VALUES
  ('2025-01-01', 'Confraternização Universal'),
  ('2025-02-28', 'Carnaval'),
  ('2025-03-03', 'Segunda-feira de Carnaval'),
  ('2025-03-04', 'Terça-feira de Carnaval'),
  ('2025-04-18', 'Sexta-feira Santa'),
  ('2025-04-20', 'Páscoa'),
  ('2025-04-21', 'Tiradentes'),
  ('2025-05-01', 'Dia do Trabalhador'),
  ('2025-06-19', 'Corpus Christi'),
  ('2025-09-07', 'Independência do Brasil'),
  ('2025-10-12', 'Nossa Senhora Aparecida'),
  ('2025-11-02', 'Finados'),
  ('2025-11-15', 'Proclamação da República'),
  ('2025-11-20', 'Dia da Consciência Negra'),
  ('2025-12-25', 'Natal');

-- Feriados Nacionais 2026
INSERT INTO feriados (data, descricao) VALUES
  ('2026-01-01', 'Confraternização Universal'),
  ('2026-02-13', 'Carnaval'),
  ('2026-02-16', 'Segunda-feira de Carnaval'),
  ('2026-02-17', 'Terça-feira de Carnaval'),
  ('2026-04-03', 'Sexta-feira Santa'),
  ('2026-04-05', 'Páscoa'),
  ('2026-04-21', 'Tiradentes'),
  ('2026-05-01', 'Dia do Trabalhador'),
  ('2026-06-04', 'Corpus Christi'),
  ('2026-09-07', 'Independência do Brasil'),
  ('2026-10-12', 'Nossa Senhora Aparecida'),
  ('2026-11-02', 'Finados'),
  ('2026-11-15', 'Proclamação da República'),
  ('2026-11-20', 'Dia da Consciência Negra'),
  ('2026-12-25', 'Natal');

-- 4. POLÍTICAS RLS - AGENDAMENTOS_ROBUSTOS
-- ============================================
DROP POLICY IF EXISTS "Service role can insert appointments" ON agendamentos_robustos;
DROP POLICY IF EXISTS "Service role can update appointments" ON agendamentos_robustos;
DROP POLICY IF EXISTS "Service role can delete appointments" ON agendamentos_robustos;
DROP POLICY IF EXISTS "Authenticated users can read all appointments" ON agendamentos_robustos;

ALTER TABLE agendamentos_robustos ENABLE ROW LEVEL SECURITY;

-- Apenas service_role (edge functions) pode inserir
CREATE POLICY "Service role can insert appointments"
ON agendamentos_robustos FOR INSERT
TO service_role
WITH CHECK (true);

-- Apenas service_role pode atualizar
CREATE POLICY "Service role can update appointments"
ON agendamentos_robustos FOR UPDATE
TO service_role
USING (true) WITH CHECK (true);

-- Apenas service_role pode deletar
CREATE POLICY "Service role can delete appointments"
ON agendamentos_robustos FOR DELETE
TO service_role
USING (true);

-- Usuários autenticados (admin) podem ler todos os agendamentos
CREATE POLICY "Authenticated users can read all appointments"
ON agendamentos_robustos FOR SELECT
TO authenticated
USING (true);

-- 5. POLÍTICAS RLS - CADASTRO
-- ============================================
DROP POLICY IF EXISTS "Service role full access to cadastro" ON cadastro;
DROP POLICY IF EXISTS "Authenticated users can read all cadastros" ON cadastro;

ALTER TABLE cadastro ENABLE ROW LEVEL SECURITY;

-- Service role tem acesso total
CREATE POLICY "Service role full access to cadastro"
ON cadastro FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- Usuários autenticados (admin) podem ler todos os cadastros
CREATE POLICY "Authenticated users can read all cadastros"
ON cadastro FOR SELECT
TO authenticated
USING (true);

-- 6. POLÍTICAS RLS - BD_ATIVO
-- ============================================
DROP POLICY IF EXISTS "Service role full access to bd_ativo" ON bd_ativo;

ALTER TABLE bd_ativo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to bd_ativo"
ON bd_ativo FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- 7. POLÍTICAS RLS - FERIADOS
-- ============================================
DROP POLICY IF EXISTS "Public can read feriados" ON feriados;
DROP POLICY IF EXISTS "Service role full access to feriados" ON feriados;

ALTER TABLE feriados ENABLE ROW LEVEL SECURITY;

-- Público pode ler feriados (necessário para verificar disponibilidade)
CREATE POLICY "Public can read feriados"
ON feriados FOR SELECT
TO anon, authenticated
USING (true);

-- Service role pode gerenciar feriados
CREATE POLICY "Service role full access to feriados"
ON feriados FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- 8. POLÍTICAS RLS - INFO_LOJA
-- ============================================
DROP POLICY IF EXISTS "Public can read info_loja" ON info_loja;
DROP POLICY IF EXISTS "Public can read public info_loja" ON info_loja;
DROP POLICY IF EXISTS "Service role can read info_loja" ON info_loja;
DROP POLICY IF EXISTS "Service role can insert info_loja" ON info_loja;
DROP POLICY IF EXISTS "Service role can update info_loja" ON info_loja;
DROP POLICY IF EXISTS "Service role can delete info_loja" ON info_loja;

ALTER TABLE info_loja ENABLE ROW LEVEL SECURITY;

-- Público pode ler informações básicas
CREATE POLICY "Public can read info_loja"
ON info_loja FOR SELECT
TO anon, authenticated
USING (true);

-- CRÍTICO: Service role precisa ler para autenticação
CREATE POLICY "Service role can read info_loja"
ON info_loja FOR SELECT
TO service_role
USING (true);

-- Service role pode modificar tudo
CREATE POLICY "Service role can insert info_loja"
ON info_loja FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update info_loja"
ON info_loja FOR UPDATE
TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role can delete info_loja"
ON info_loja FOR DELETE
TO service_role
USING (true);

-- 9. CRIAR USUÁRIO ADMIN NO SUPABASE AUTH
-- ============================================
-- IMPORTANTE: Você precisa criar o usuário admin manualmente no Supabase:
-- 1. Vá em Authentication > Users
-- 2. Clique em "Add User"
-- 3. Email: seu-email@gmail.com (MESMO EMAIL usado no auth_user acima)
-- 4. Senha: SuaSenhaSegura
-- 5. Clique em "Create User"

-- 10. VERIFICAR RLS ATIVO
-- ============================================
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'agendamentos_robustos', 
  'cadastro', 
  'bd_ativo', 
  'feriados', 
  'info_loja'
);

-- ============================================
-- RESUMO DAS POLÍTICAS
-- ============================================
-- 
-- TABELA: agendamentos_robustos
-- ✓ service_role: INSERT, UPDATE, DELETE (via edge functions)
-- ✓ authenticated: SELECT (dashboard admin)
-- ✓ anon: SEM ACESSO (proteção de dados pessoais)
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
-- ✓ anon/authenticated: SELECT (acesso público)
-- ✓ service_role: SELECT, INSERT, UPDATE, DELETE (CRÍTICO para authenticate_admin)
-- ============================================
