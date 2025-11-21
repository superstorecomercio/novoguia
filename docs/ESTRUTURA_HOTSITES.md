# Estrutura de Hotsites por Cidade

## 🎯 Conceito Fundamental

**No sistema legado, toda empresa tem um hotsite que é exibido em uma determinada cidade.**

Isso significa:
- ✅ Uma empresa pode ter **múltiplos hotsites** (um para cada cidade onde ela aparece)
- ✅ Cada hotsite está **vinculado a uma cidade específica** (`hotCidade`, `hotEstado`)
- ✅ O mesmo hotsite pode ter informações diferentes por cidade (endereço, serviços, etc.)

## 📊 Schema Atualizado

### Tabela `hotsites`

```sql
CREATE TABLE hotsites (
  id UUID PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id),
  cidade_id UUID REFERENCES cidades(id), -- ⭐ Cidade onde este hotsite é exibido
  nome_exibicao VARCHAR(255),
  descricao TEXT,
  endereco VARCHAR(500),
  cidade VARCHAR(255), -- Nome da cidade (para exibição)
  estado VARCHAR(2),
  -- ... outros campos
  UNIQUE(empresa_id, cidade_id) -- Uma empresa só pode ter um hotsite por cidade
);
```

### Mudanças Necessárias

Execute o script de migração:

```sql
-- Execute no Supabase SQL Editor:
-- supabase/migrations/002_fix_hotsites_cidade.sql
```

Isso irá:
1. ✅ Remover constraint UNIQUE de `empresa_id` (permite múltiplos hotsites)
2. ✅ Adicionar coluna `cidade_id`
3. ✅ Criar constraint UNIQUE para `(empresa_id, cidade_id)`
4. ✅ Criar índice para busca por cidade

## 🔍 Queries Atualizadas

### Buscar Hotsite Específico por Empresa + Cidade

```typescript
import { getHotsiteByEmpresaECidade } from '@/lib/db/queries/hotsites';

// Buscar hotsite de uma empresa para uma cidade específica
const hotsite = await getHotsiteByEmpresaECidade(empresaId, cidadeId);
```

### Buscar Todos os Hotsites de uma Empresa

```typescript
import { getHotsitesByEmpresa } from '@/lib/db/queries/hotsites';

// Buscar todos os hotsites de uma empresa (um para cada cidade)
const hotsites = await getHotsitesByEmpresa(empresaId);
```

### Buscar Hotsites de uma Cidade

```typescript
import { getHotsitesByCidade } from '@/lib/db/queries/hotsites';

// Buscar todos os hotsites exibidos em uma cidade
const hotsites = await getHotsitesByCidade(cidadeId);
```

## 🔄 Migração

### Script de Migração Atualizado

O script `scripts/migrate/03_migrate_hotsites.ts` já está configurado para:

1. ✅ Buscar hotsites do banco legado (`guiaHotsite`)
2. ✅ Identificar a cidade onde cada hotsite é exibido (`hotCidade`, `hotEstado`)
3. ✅ Buscar a cidade correspondente no Supabase
4. ✅ Vincular o hotsite à cidade correta (`cidade_id`)
5. ✅ Permitir múltiplos hotsites por empresa

### Executar Migração

```bash
# 1. Primeiro execute a correção do schema
# Execute no Supabase SQL Editor: supabase/migrations/002_fix_hotsites_cidade.sql

# 2. Testar migração
npx tsx scripts/migrate/03_migrate_hotsites.ts --dry-run

# 3. Executar migração
npx tsx scripts/migrate/03_migrate_hotsites.ts
```

## 📝 Uso nas Páginas

### Exemplo: Página de Empresa por Cidade

```typescript
// app/empresas/[slug]/page.tsx
import { getEmpresaBySlug } from '@/lib/db/queries/empresas';
import { getHotsiteByEmpresaECidade } from '@/lib/db/queries/hotsites';
import { getCidadeBySlug } from '@/lib/db/queries/cidades';

export default async function EmpresaPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  
  // Buscar empresa
  const empresa = await getEmpresaBySlug(slug);
  if (!empresa) notFound();
  
  // Buscar cidade atual (da URL ou contexto)
  const cidadeSlug = searchParams.get('cidade') || empresa.cidadeName;
  const cidade = cidadeSlug ? await getCidadeBySlug(cidadeSlug) : null;
  
  // Buscar hotsite específico para esta cidade
  const hotsite = cidade 
    ? await getHotsiteByEmpresaECidade(empresa.id, cidade.id)
    : null;
  
  return (
    <div>
      <h1>{hotsite?.nomeExibicao || empresa.name}</h1>
      <p>{hotsite?.descricao || empresa.description}</p>
      
      {/* Exibir informações específicas desta cidade */}
      {hotsite && (
        <div>
          <p>Endereço: {hotsite.endereco}</p>
          <p>Serviços: {hotsite.servicos?.join(', ')}</p>
        </div>
      )}
    </div>
  );
}
```

### Exemplo: Listagem de Empresas por Cidade

```typescript
// app/cidades/[slug]/page.tsx
import { getEmpresasByCidade } from '@/lib/db/queries/empresas';
import { getHotsiteByEmpresaECidade } from '@/lib/db/queries/hotsites';

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cidade = await getCidadeBySlug(slug);
  const empresas = await getEmpresasByCidade(slug);
  
  // Para cada empresa, buscar hotsite específico desta cidade
  const empresasComHotsite = await Promise.all(
    empresas.map(async (empresa) => {
      const hotsite = cidade 
        ? await getHotsiteByEmpresaECidade(empresa.id, cidade.id)
        : null;
      
      return {
        ...empresa,
        hotsite,
      };
    })
  );
  
  return (
    <div>
      {empresasComHotsite.map((empresa) => (
        <div key={empresa.id}>
          <h2>{empresa.hotsite?.nomeExibicao || empresa.name}</h2>
          <p>{empresa.hotsite?.descricao || empresa.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## ⚠️ Importante

1. **Sempre buscar hotsite por empresa + cidade**: Não assuma que uma empresa tem apenas um hotsite
2. **Fallback**: Se não encontrar hotsite específico, usar dados da empresa
3. **Migração**: Execute a migração de cidades e empresas ANTES de migrar hotsites
4. **Schema**: Execute `002_fix_hotsites_cidade.sql` ANTES de migrar hotsites

## 📋 Checklist de Migração

- [ ] Executar `002_fix_hotsites_cidade.sql` no Supabase
- [ ] Migrar cidades primeiro (`01_migrate_cidades.ts`)
- [ ] Migrar empresas (`02_migrate_empresas.ts`)
- [ ] Migrar hotsites (`03_migrate_hotsites.ts`)
- [ ] Verificar relacionamentos empresa ↔ cidade ↔ hotsite

---

**Última atualização**: 2024-11-20

