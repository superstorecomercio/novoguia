# Hotsites Vinculados a Cidades

## 🎯 Conceito Importante

No sistema legado, **toda empresa tem um hotsite que é exibido em uma determinada cidade**. Isso significa:

- ✅ Uma empresa pode ter **múltiplos hotsites** (um para cada cidade onde ela aparece)
- ✅ Cada hotsite está **vinculado a uma cidade específica**
- ✅ O mesmo hotsite pode ter informações diferentes por cidade (endereço, serviços, etc.)

## 📊 Estrutura do Schema

### Tabela `hotsites`

```sql
CREATE TABLE hotsites (
  id UUID PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id),
  cidade_id UUID REFERENCES cidades(id), -- Cidade onde este hotsite é exibido
  nome_exibicao VARCHAR(255),
  descricao TEXT,
  endereco VARCHAR(500),
  cidade VARCHAR(255), -- Nome da cidade (para exibição)
  estado VARCHAR(2),
  -- ... outros campos
  UNIQUE(empresa_id, cidade_id) -- Uma empresa só pode ter um hotsite por cidade
);
```

## 🔍 Queries Importantes

### Buscar Hotsite de uma Empresa para uma Cidade

```typescript
import { getHotsiteByEmpresaECidade } from '@/lib/db/queries/hotsites';

const hotsite = await getHotsiteByEmpresaECidade(empresaId, cidadeId);
```

### Buscar Todos os Hotsites de uma Empresa

```typescript
import { getHotsitesByEmpresa } from '@/lib/db/queries/hotsites';

const hotsites = await getHotsitesByEmpresa(empresaId);
// Retorna array de hotsites, um para cada cidade
```

### Buscar Hotsites de uma Cidade

```typescript
import { getHotsitesByCidade } from '@/lib/db/queries/hotsites';

const hotsites = await getHotsitesByCidade(cidadeId);
// Retorna todos os hotsites exibidos nesta cidade
```

## 🔄 Migração

### Script de Migração

O script `scripts/migrate/03_migrate_hotsites.ts` já está configurado para:

1. ✅ Buscar hotsites do banco legado (`guiaHotsite`)
2. ✅ Identificar a cidade onde cada hotsite é exibido (`hotCidade`, `hotEstado`)
3. ✅ Vincular o hotsite à cidade correta no Supabase
4. ✅ Permitir múltiplos hotsites por empresa

### Executar Migração

```bash
# Testar primeiro
npx tsx scripts/migrate/03_migrate_hotsites.ts --dry-run

# Executar migração
npx tsx scripts/migrate/03_migrate_hotsites.ts
```

## 📝 Uso nas Páginas

### Exemplo: Página de Empresa por Cidade

```typescript
// app/empresas/[slug]/page.tsx
import { getHotsiteByEmpresaECidade } from '@/lib/db/queries/hotsites';

export default async function EmpresaPage({ params }: { params: { slug: string } }) {
  const empresa = await getEmpresaBySlug(params.slug);
  const cidade = await getCidadeBySlug(cidadeSlug); // Da URL ou contexto
  
  // Buscar hotsite específico para esta cidade
  const hotsite = await getHotsiteByEmpresaECidade(empresa.id, cidade.id);
  
  return (
    <div>
      <h1>{hotsite?.nomeExibicao || empresa.nome}</h1>
      <p>{hotsite?.descricao}</p>
      {/* Exibir informações específicas desta cidade */}
    </div>
  );
}
```

## ⚠️ Importante

1. **Sempre buscar hotsite por empresa + cidade**: Não assuma que uma empresa tem apenas um hotsite
2. **Fallback**: Se não encontrar hotsite específico, usar dados da empresa
3. **Migração**: Execute a migração de cidades e empresas ANTES de migrar hotsites

---

**Última atualização**: 2024-11-20

