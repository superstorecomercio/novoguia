# Setup Completo - Próximos Passos

## ✅ Banco de Dados Criado!

O schema foi criado com sucesso no Supabase.

## 🚀 Próximos Passos (Execute em Ordem)

### PASSO 1: Configurar Variáveis de Ambiente ⚠️ OBRIGATÓRIO

1. Crie o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key
```

2. Encontre essas informações em:
   - Supabase Dashboard → **Settings** → **API**
   - Copie `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copie `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Reinicie o servidor de desenvolvimento após criar o arquivo:
```bash
npm run dev
```

---

### PASSO 2: Testar Conexão

Crie um arquivo de teste temporário para verificar se a conexão funciona:

**Criar**: `app/test-supabase/page.tsx`

```tsx
import { getCidades } from '@/lib/db/queries';

export default async function TestPage() {
  try {
    const cidades = await getCidades();
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Teste de Conexão Supabase</h1>
        <p className="text-green-600 mb-4">✅ Conexão funcionando!</p>
        <p>Cidades encontradas: {cidades.length}</p>
        <ul className="mt-4">
          {cidades.map((cidade) => (
            <li key={cidade.id}>{cidade.nome}</li>
          ))}
        </ul>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Erro de Conexão</h1>
        <p className="text-red-600">{String(error)}</p>
      </div>
    );
  }
}
```

Acesse `/test-supabase` no navegador para testar.

---

### PASSO 3: Substituir Dados Mockados

Agora você pode atualizar as páginas para usar dados reais:

#### 3.1 Atualizar `app/cidades/page.tsx`

```tsx
import { getCidades } from '@/lib/db/queries';
import CityCard from '../components/CityCard';

export default async function CitiesPage() {
  const cidades = await getCidades();

  return (
    <div className="container mx-auto px-4 py-12">
      {/* ... resto do código ... */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cidades.map((city) => (
          <CityCard key={city.id} city={city} />
        ))}
      </div>
    </div>
  );
}
```

#### 3.2 Atualizar `app/cidades/[slug]/page.tsx`

```tsx
import { getCidadeBySlug, getEmpresasByCidade } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
// ... resto do código
```

#### 3.3 Atualizar `app/empresas/[slug]/page.tsx`

```tsx
import { getEmpresaBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
// ... resto do código
```

---

### PASSO 4: Conectar Formulário de Orçamento

Atualizar `app/orcamento/page.tsx` para salvar no banco:

```tsx
import { createOrcamento, relacionarOrcamentoComEmpresas } from '@/lib/db/queries';

// No handleSubmit:
const novoOrcamento = await createOrcamento({
  tipo: formData.tipo,
  nomeCliente: formData.nomeCliente,
  // ... outros campos
});

// Relacionar com empresas
await relacionarOrcamentoComEmpresas(
  novoOrcamento.id,
  formData.cidadeOrigem,
  formData.cidadeDestino
);
```

---

## 📁 Arquivos Criados

### Queries Criadas:
- ✅ `lib/db/queries/cidades.ts` - Funções para buscar cidades
- ✅ `lib/db/queries/empresas.ts` - Funções para buscar empresas
- ✅ `lib/db/queries/orcamentos.ts` - Funções para criar/listar orçamentos
- ✅ `lib/db/queries/index.ts` - Export centralizado

### Documentação:
- ✅ `docs/PROXIMOS_PASSOS.md` - Guia completo de próximos passos
- ✅ `docs/SETUP_COMPLETO.md` - Este arquivo

---

## 🔍 Verificação Rápida

Execute estas queries no SQL Editor do Supabase para verificar:

```sql
-- Verificar cidades criadas
SELECT COUNT(*) FROM cidades;
-- Deve retornar 10

-- Verificar planos criados
SELECT COUNT(*) FROM planos_publicidade;
-- Deve retornar 4

-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
-- Todas devem ter rowsecurity = true
```

---

## ⚠️ Problemas Comuns

### Erro: "Invalid API key"
- Verifique se copiou a chave correta do Supabase
- Verifique se o arquivo `.env.local` está na raiz do projeto
- Reinicie o servidor após criar/editar `.env.local`

### Erro: "relation does not exist"
- Verifique se executou o script `001_complete_schema.sql`
- Verifique se todas as tabelas foram criadas

### Erro: "permission denied"
- Verifique se as políticas RLS estão corretas
- Verifique se está usando a chave `anon` (não `service_role`)

---

## ✅ Checklist

- [ ] Criar arquivo `.env.local` com credenciais do Supabase
- [ ] Reiniciar servidor de desenvolvimento
- [ ] Testar conexão (criar página de teste)
- [ ] Atualizar `app/cidades/page.tsx` para usar dados reais
- [ ] Atualizar `app/cidades/[slug]/page.tsx` para usar dados reais
- [ ] Atualizar `app/empresas/[slug]/page.tsx` para usar dados reais
- [ ] Conectar formulário de orçamento ao banco
- [ ] Testar todas as funcionalidades
- [ ] Remover página de teste (`/test-supabase`)

---

**Próxima etapa recomendada**: Configurar `.env.local` e testar a conexão!

