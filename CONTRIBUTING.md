# Guia de Contribuição

Obrigado pelo interesse em contribuir com o MudaTech! Este documento descreve as diretrizes e padrões para contribuições.

## Configuração do Ambiente

1. Fork o repositório
2. Clone seu fork localmente
3. Instale as dependências: `npm install`
4. Crie um branch para sua feature: `git checkout -b feature/nome-da-feature`

## Padrões de Código

### Estrutura de Arquivos

- **Componentes**: `app/components/` - Use PascalCase (ex: `Header.tsx`)
- **Páginas**: `app/[rota]/page.tsx` - Use lowercase para rotas
- **API Routes**: `app/api/[rota]/route.ts`
- **Utilitários**: `lib/` - Use camelCase (ex: `rateLimiter.ts`)
- **Queries**: `lib/db/queries/` - Use camelCase (ex: `orcamentos.ts`)

### Convenções de Nomenclatura

```typescript
// Variáveis e funções: camelCase
const supabaseInstance = createClient()
function handleSubmit() {}

// Componentes e tipos: PascalCase
interface UserData {}
function UserCard() {}

// Constantes: CONSTANT_CASE
const MAX_RETRIES = 3
const API_BASE_URL = 'https://...'
```

### TypeScript

- Use tipagem forte sempre
- Defina interfaces em `app/types.ts` para tipos compartilhados
- Evite `any` - use `unknown` quando necessário

```typescript
// Bom
interface Props {
  title: string
  onClick: () => void
}

// Evitar
const data: any = fetchData()
```

### Componentes React

```typescript
"use client" // Apenas se necessário

import { useState } from "react"

interface ComponentProps {
  title: string
  children?: React.ReactNode
}

export default function Component({ title, children }: ComponentProps) {
  const [state, setState] = useState(false)

  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  )
}
```

### API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Lógica
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Mensagem de erro' },
      { status: 500 }
    )
  }
}
```

### Estilização

- Use Tailwind CSS para estilos
- Use a função `cn()` para classes condicionais
- Mantenha consistência com o design system existente

```typescript
import { cn } from "@/lib/utils"

<div className={cn(
  "base-classes",
  condition && "conditional-classes"
)} />
```

## Commits

### Formato das Mensagens

Use mensagens descritivas em português:

```
tipo: descrição breve

[corpo opcional com mais detalhes]
```

### Tipos de Commit

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (sem mudança de código)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

### Exemplos

```bash
feat: adiciona filtro por cidade na busca
fix: corrige cálculo de orçamento para mudanças locais
docs: atualiza README com instruções de setup
refactor: simplifica lógica do rate limiter
```

## Pull Requests

1. Mantenha PRs pequenos e focados
2. Descreva claramente o que foi alterado
3. Inclua screenshots para mudanças visuais
4. Verifique se o lint passa: `npm run lint`
5. Teste localmente antes de abrir o PR

### Template de PR

```markdown
## Descrição
[Descreva as mudanças]

## Tipo de Mudança
- [ ] Nova feature
- [ ] Correção de bug
- [ ] Refatoração
- [ ] Documentação

## Como Testar
1. [Passos para testar]

## Screenshots (se aplicável)
[Adicione screenshots]
```

## Estrutura de Branches

- `master`: Branch principal (produção)
- `feature/*`: Novas funcionalidades
- `fix/*`: Correções de bugs
- `docs/*`: Atualizações de documentação

## Dúvidas

Se tiver dúvidas, abra uma issue ou entre em contato com a equipe.
