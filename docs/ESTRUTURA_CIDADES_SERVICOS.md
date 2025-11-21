# Estrutura de Páginas de Cidades com Tipos de Serviço

## 🎯 Proposta de Arquitetura

### Opção 1: Rotas Específicas por Tipo (Recomendada para SEO)

```
/cidades/[slug]                    → Lista todas as empresas (com filtros)
/cidades/[slug]/mudancas           → Apenas empresas de mudança
/cidades/[slug]/carretos          → Apenas empresas de carreto
/cidades/[slug]/guarda-moveis     → Apenas empresas de guarda-móveis
```

**Vantagens:**
- ✅ URLs amigáveis e específicas para SEO
- ✅ Cada tipo de serviço tem sua própria página otimizada
- ✅ Fácil de compartilhar links específicos
- ✅ Melhor para SEO (Google indexa páginas específicas)

### Opção 2: Query Parameters (Mais Simples)

```
/cidades/[slug]                   → Lista todas (com filtros)
/cidades/[slug]?tipo=mudanca     → Filtrado por tipo
/cidades/[slug]?tipo=carreto     → Filtrado por tipo
```

**Vantagens:**
- ✅ Menos arquivos para manter
- ✅ Mais flexível (fácil adicionar novos filtros)
- ✅ Uma única página para gerenciar

## 🏗️ Estrutura Recomendada (Híbrida)

**Implementar ambas:**
- Rotas específicas para SEO (`/mudancas`, `/carretos`, `/guarda-moveis`)
- Query parameters para filtros adicionais (`?bairro=centro`, `?busca=nome`)

## 📁 Estrutura de Arquivos

```
app/
├── cidades/
│   ├── page.tsx                          # Lista todas as cidades
│   ├── [slug]/
│   │   ├── page.tsx                      # Página da cidade (todas empresas)
│   │   ├── mudancas/
│   │   │   └── page.tsx                  # Apenas mudanças
│   │   ├── carretos/
│   │   │   └── page.tsx                  # Apenas carretos
│   │   └── guarda-moveis/
│   │       └── page.tsx                  # Apenas guarda-móveis
```

## 🎨 Componentes Necessários

1. **Filtros de Tipo de Serviço**
   - Botões/tabs para alternar entre tipos
   - Badge mostrando quantidade por tipo
   - Link ativo destacado

2. **Lista de Empresas Filtrada**
   - Componente reutilizável que recebe tipo como prop
   - Ordenação por plano de publicidade
   - Paginação

3. **Breadcrumbs**
   - Home > Cidades > [Cidade] > [Tipo de Serviço]

## 🔍 Funcionalidades

### Filtros Disponíveis:
- ✅ Tipo de serviço (mudança, carreto, guarda-móveis)
- ✅ Bairro/área atendida
- ✅ Busca por nome da empresa
- ✅ Ordenação (por plano, por nome, por avaliação futura)

### Informações por Página:
- Título específico: "Empresas de Mudança em São Paulo"
- Descrição otimizada para SEO
- Lista de empresas filtradas
- CTA específico: "Solicitar Orçamento de Mudança"

## 📊 Dados Necessários

### Query para buscar empresas por tipo:
```typescript
getEmpresasByCidadeAndTipo(cidadeSlug, tipoServico)
```

### Query para contar empresas por tipo:
```typescript
getEmpresasCountByTipo(cidadeSlug)
// Retorna: { mudanca: 15, carreto: 8, guardamoveis: 5 }
```

## 🚀 Implementação Sugerida

1. Criar componente `ServiceTypeFilter`
2. Criar componente `EmpresasList` (reutilizável)
3. Criar queries específicas para tipos de serviço
4. Criar páginas específicas para cada tipo
5. Adicionar metadata dinâmica para SEO

---

**Última atualização**: 2024-11-20

