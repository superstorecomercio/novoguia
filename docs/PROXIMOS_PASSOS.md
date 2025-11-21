# Próximos Passos - Guia de Mudanças

## ✅ Etapa Concluída: Banco de Dados Criado

O schema do banco de dados foi criado com sucesso no Supabase!

## 📋 Próximos Passos

### 1. Configurar Variáveis de Ambiente ⚠️ OBRIGATÓRIO

**Criar/editar arquivo `.env.local` na raiz do projeto:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key
```

**Onde encontrar:**
- Supabase Dashboard → Settings → API
- Copie `Project URL` e `anon public` key

**⚠️ IMPORTANTE**: 
- Nunca commite o arquivo `.env.local` no Git
- Já deve estar no `.gitignore`

---

### 2. Criar Funções de Query no Código

Criar arquivos em `lib/db/` para buscar dados do Supabase:

- `queries/cidades.ts` - Buscar cidades
- `queries/empresas.ts` - Buscar empresas
- `queries/orcamentos.ts` - Criar/listar orçamentos

---

### 3. Substituir Dados Mockados

Atualizar as páginas para usar dados reais do Supabase:

- ✅ `app/cidades/page.tsx` - Listar cidades do banco
- ✅ `app/cidades/[slug]/page.tsx` - Buscar empresas por cidade
- ✅ `app/empresas/[slug]/page.tsx` - Buscar empresa específica
- ✅ `app/orcamento/page.tsx` - Salvar orçamento no banco

---

### 4. Implementar Funcionalidades Principais

#### 4.1 Busca e Filtros
- Busca de empresas por nome
- Filtros por tipo de serviço
- Filtros por bairro
- Ordenação por plano de publicidade

#### 4.2 Formulário de Orçamento
- Formulário multi-step (5 passos)
- Validação de dados
- Rate limiting (proteção contra spam)
- Envio de emails (futuro)

#### 4.3 Páginas Adicionais
- `/carretos` - Página de carretos
- `/guarda-moveis` - Página de guarda-móveis
- `/busca` - Busca de empresas
- `/orcamento-enviado` - Confirmação de envio

---

### 5. Melhorias de UX

- Loading states (skeletons)
- Error boundaries
- Empty states melhorados
- Paginação
- SEO (metadata dinâmica)

---

### 6. Testes e Validação

- Testar todas as rotas
- Validar queries do Supabase
- Testar formulários
- Verificar RLS (Row Level Security)

---

## 🚀 Ordem Recomendada de Implementação

### Fase 1: Conexão e Queries Básicas (PRIORIDADE ALTA)
1. ✅ Configurar `.env.local`
2. ✅ Criar funções de query para cidades
3. ✅ Substituir mock de cidades por dados reais
4. ✅ Criar funções de query para empresas
5. ✅ Substituir mock de empresas por dados reais

### Fase 2: Funcionalidades Core (PRIORIDADE ALTA)
6. ✅ Implementar busca de empresas
7. ✅ Implementar filtros
8. ✅ Implementar ordenação por planos
9. ✅ Conectar formulário de orçamento ao banco

### Fase 3: Melhorias (PRIORIDADE MÉDIA)
10. ⏳ Páginas adicionais (carretos, guarda-móveis)
11. ⏳ Loading states e error handling
12. ⏳ SEO e metadata dinâmica

### Fase 4: Funcionalidades Avançadas (PRIORIDADE BAIXA)
13. ⏳ Sistema de emails
14. ⏳ Dashboard administrativo
15. ⏳ Sistema de avaliações

---

## 📝 Checklist de Progresso

- [ ] Configurar variáveis de ambiente
- [ ] Criar funções de query para cidades
- [ ] Criar funções de query para empresas
- [ ] Substituir dados mockados por queries reais
- [ ] Implementar busca de empresas
- [ ] Implementar filtros
- [ ] Conectar formulário de orçamento
- [ ] Testar todas as funcionalidades
- [ ] Implementar loading states
- [ ] Adicionar tratamento de erros

---

## 🔧 Comandos Úteis

```bash
# Instalar dependências (se necessário)
npm install

# Rodar projeto em desenvolvimento
npm run dev

# Verificar tipos TypeScript
npm run build

# Verificar lint
npm run lint
```

---

**Última atualização**: 2024-11-20

