# Estratégia de Migração de Dados

## 🎯 Objetivo

Migrar dados do banco legado (SQL Server) para o novo banco Supabase (PostgreSQL).

## 📊 Estrutura de Migração

### Opção 1: Migração via SQL (Recomendada para grandes volumes)

**Vantagens:**
- ✅ Mais rápida para grandes volumes
- ✅ Executa diretamente no banco
- ✅ Menos overhead de rede

**Desvantagens:**
- ❌ Requer acesso direto ao banco legado
- ❌ Mais complexa para transformações complexas

### Opção 2: Migração via Script Node.js (Recomendada para transformações complexas)

**Vantagens:**
- ✅ Mais flexível para transformações
- ✅ Pode fazer validações e tratamento de erros
- ✅ Pode processar em lotes
- ✅ Pode fazer logs detalhados

**Desvantagens:**
- ❌ Mais lenta para grandes volumes
- ❌ Requer conexão com ambos os bancos

## 🔄 Fluxo de Migração

### 1. Cidades (cidades)
- Mapeamento direto
- Gerar slugs automaticamente

### 2. Empresas (empresas)
- Mapeamento de campos básicos
- Transformar telefones (string → array)
- Gerar slugs automaticamente

### 3. Empresa Serviços (empresa_servicos)
- Mapear tipos de serviço do formato antigo para o novo
- Criar registros N:N

### 4. Hotsites (hotsites)
- Migrar dados de marketing
- Transformar campos JSONB

### 5. Planos de Publicidade (empresa_planos)
- Mapear planos antigos para novos
- Criar relacionamentos

## 📝 Próximos Passos

1. Criar script de migração Node.js
2. Criar mapeamento de campos
3. Criar funções de transformação
4. Criar script de validação

---

**Última atualização**: 2024-11-20

