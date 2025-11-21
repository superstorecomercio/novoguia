# Plano de Migração - Guia de Mudanças

## Análise do Sistema Legado vs Implementação Atual

### Problemas Identificados no Sistema Legado

1. **URLs Inconsistentes**:
   - Mistura de query strings (`?estado=SP&cidade=São Paulo`) e slugs (`mudancas-sp-saopaulo.aspx`)
   - Muitas páginas estáticas duplicadas por cidade
   - URLs não amigáveis para SEO

2. **Estrutura Desorganizada**:
   - Páginas estáticas repetitivas (50+ páginas `.aspx` por cidade)
   - Lógica de negócio espalhada em code-behind
   - Falta de componentes reutilizáveis

3. **Banco de Dados Complexo**:
   - SQL Server com stored procedures
   - Múltiplas tabelas de relacionamento
   - Sistema de planos de publicidade complexo

### O Que Já Foi Implementado (Base Inicial)

✅ Estrutura básica Next.js 14 (App Router)  
✅ Tipos TypeScript básicos  
✅ Componentes reutilizáveis (Header, Footer, Cards)  
✅ Rotas principais (/cidades, /empresas, /orcamento)  
✅ Cliente Supabase configurado  
✅ Layout responsivo com Tailwind

### O Que Precisa Ser Melhorado/Alinhado

#### 1. ESTRUTURA DE ROTAS

**Atual**: `/cidades/[slug]`  
**Proposto no Documento**: `/mudancas/[estado]/[cidade]`  
**Decisão**: Manter `/cidades/[slug]` (mais simples e SEO-friendly)

**Melhorias necessárias**:
- Adicionar suporte a filtros por tipo de serviço
- Adicionar filtros por bairro
- Implementar paginação

#### 2. TIPOS TYPESCRIPT

**Faltando**:
- Planos de publicidade (Top, Quality, Standard, Intermediário)
- Hotsites (detalhes expandidos das empresas)
- Tipos de serviço (mudança, carreto, guarda-móveis)
- Preferência de contato (WhatsApp, Email, Telefone)
- Campos adicionais do formulário (cômodos, estilo de vida, etc.)

#### 3. FORMULÁRIO DE ORÇAMENTO

**Atual**: Formulário simples single-step  
**Legado**: Formulário multi-step complexo  
**Necessário**: Implementar formulário multi-step com:
- Passo 1: Origem (estado/cidade)
- Passo 2: Destino (estado/cidade)
- Passo 3: Tipo de serviço
- Passo 4: Detalhes específicos
- Passo 5: Dados pessoais

#### 4. SISTEMA DE PLANOS DE PUBLICIDADE

**Faltando completamente**:
- Tabela de planos no banco
- Lógica de ordenação por plano
- Badges visuais (Top, Quality, etc.)
- Sistema de campanhas

#### 5. PÁGINAS ADICIONAIS IMPORTANTES

**Faltando**:
- `/carretos` - Página de carretos
- `/guarda-moveis` - Página de guarda-móveis
- `/busca` - Busca de empresas por nome
- `/blog` - Artigos e dicas
- `/orcamento-enviado` - Página de confirmação

#### 6. FUNCIONALIDADES AVANÇADAS

**Faltando**:
- Rate limiting (proteção contra spam)
- Sistema de avaliações
- Calculadora de embalagem
- Busca avançada com filtros

---

## Plano de Ação Prioritizado

### FASE 1: Fundação Sólida (URGENTE)

1. ✅ Expandir tipos TypeScript
2. ✅ Melhorar estrutura de rotas
3. ✅ Implementar formulário multi-step
4. ✅ Criar schema SQL completo no Supabase

### FASE 2: Funcionalidades Core (IMPORTANTE)

1. Sistema de planos de publicidade
2. Páginas de serviços (carretos, guarda-móveis)
3. Busca de empresas
4. Página de confirmação de orçamento

### FASE 3: Melhorias e Otimizações (DESEJÁVEL)

1. Sistema de avaliações
2. Blog/Artigos
3. Calculadora de embalagem
4. Dashboard administrativo

---

## Próximos Passos Imediatos

1. **Expandir tipos TypeScript** com todos os campos necessários
2. **Criar schema SQL completo** baseado na análise do documento
3. **Melhorar formulário de orçamento** para multi-step
4. **Implementar sistema de planos** de publicidade
5. **Adicionar páginas faltantes** (carretos, guarda-móveis, busca)

