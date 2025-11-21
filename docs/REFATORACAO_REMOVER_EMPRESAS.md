# Refatoração: Remover Dependência da Tabela Empresas

## 📊 Situação Atual

### **Onde `empresa_id` é usado:**

1. **`lib/db/queries/empresas.ts`** (arquivo inteiro depende de empresas)
   - `getEmpresas()` - busca empresas com campanhas ativas
   - `getEmpresaBySlug()` - busca empresa por slug
   - `getEmpresasByCidade()` - busca empresas por cidade
   - `getEmpresasCountByTipo()` - conta empresas por tipo

2. **Fluxo atual:**
   ```
   campanhas -> empresa_id -> empresas -> empresa_servicos
                                       -> hotsites
   ```

3. **Páginas que usam:**
   - `/cidades/[slug]/page.tsx` - Lista empresas
   - `/cidades/[slug]/carretos/page.tsx` - Lista empresas de carreto
   - `/cidades/[slug]/mudancas/page.tsx` - Lista empresas de mudança
   - `/cidades/[slug]/guarda-moveis/page.tsx` - Lista empresas de guarda-móveis

4. **Admin usa:**
   - `/admin/empresas` - CRUD de empresas
   - `/admin/campanhas` - Vincula campanhas a empresas

---

## ✅ Proposta: Trabalhar Apenas com Hotsites

### **Nova estrutura:**
```
campanhas -> hotsites (buscar direto por campanha.empresa_id)
```

### **Vantagens:**
- ✅ Simplifica o código
- ✅ Remove uma camada de abstração
- ✅ Mais rápido (menos JOINs)
- ✅ Dados consolidados em um lugar (hotsites)

### **O que manter:**
- ✅ Tabela `campanhas` (relacionamento com hotsites via empresa_id)
- ✅ Campo `empresa_id` nos `hotsites` (mas não precisa existir em empresas)
- ⚠️  Admin `/admin/empresas` - decidir se mantém ou remove

---

## 🔧 Alterações Necessárias

### **1. Nova Query: `getHotsitesByCidade()`**

```typescript
// lib/db/queries/hotsites.ts (NOVO)

export const getHotsitesByCidade = async (
  cidadeSlug: string,
  serviceType?: ServiceType
): Promise<Hotsite[]> => {
  const supabase = createServerClient();
  
  // 1. Buscar campanhas ativas
  const hoje = new Date().toISOString().split('T')[0];
  const { data: campanhasAtivas } = await supabase
    .from('campanhas')
    .select('empresa_id, plano_id, plano:planos_publicidade(nome, ordem)')
    .or(`data_fim.is.null,data_fim.gte.${hoje}`);
  
  const empresaIdsAtivas = [...new Set(campanhasAtivas?.map(c => c.empresa_id))];
  
  if (empresaIdsAtivas.length === 0) return [];
  
  // 2. Parse cidade/estado do slug
  const parts = cidadeSlug.split('-');
  const estadosBR = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
  const estadoNome = parts.length >= 2 && estadosBR.includes(parts[parts.length - 1].toUpperCase())
    ? parts[parts.length - 1].toUpperCase()
    : null;
  const cidadeNome = estadoNome ? parts.slice(0, -1).join(' ') : parts.join(' ');
  
  // 3. Buscar hotsites da cidade com campanhas ativas
  let query = supabase
    .from('hotsites')
    .select('*')
    .in('empresa_id', empresaIdsAtivas)
    .ilike('cidade', `%${cidadeNome}%`);
  
  if (estadoNome) {
    query = query.eq('estado', estadoNome);
  }
  
  const { data: hotsites } = await query;
  
  // 4. Adicionar informação de plano a cada hotsite
  const empresaPlanoMap = new Map();
  campanhasAtivas?.forEach((c: any) => {
    if (!empresaPlanoMap.has(c.empresa_id)) {
      empresaPlanoMap.set(c.empresa_id, c.plano);
    }
  });
  
  const hotsitesComPlano = hotsites?.map(h => ({
    ...h,
    plano: empresaPlanoMap.get(h.empresa_id),
  }));
  
  // 5. Filtrar por tipo de serviço (se especificado)
  let resultado = hotsitesComPlano || [];
  if (serviceType && serviceType !== 'todos') {
    resultado = resultado.filter(h => 
      h.servicos?.includes(serviceType)
    );
  }
  
  // 6. Ordenar por plano
  resultado.sort((a, b) => {
    const ordemA = a.plano?.ordem ?? 999;
    const ordemB = b.plano?.ordem ?? 999;
    return ordemA - ordemB;
  });
  
  return resultado;
};
```

### **2. Atualizar Páginas de Cidade**

```typescript
// app/cidades/[slug]/page.tsx

const CityPage = async ({ params }: CityPageProps) => {
  const { slug } = await params;
  const city = await getCidadeBySlug(slug);
  const hotsites = await getHotsitesByCidade(slug); // <- MUDANÇA
  const counts = await getHotsitesCountByTipo(slug); // <- MUDANÇA

  // ...resto do código
  
  {hotsites.map((hotsite) => (
    <HotsiteListItem key={hotsite.id} hotsite={hotsite} />
  ))}
};
```

### **3. Novo Componente: `HotsiteListItem`**

```typescript
// app/components/HotsiteListItem.tsx (NOVO)

interface HotsiteListItemProps {
  hotsite: {
    id: string;
    nome_exibicao: string;
    descricao?: string;
    cidade: string;
    estado: string;
    telefone1?: string;
    telefone2?: string;
    logo_url?: string;
    foto1_url?: string;
    servicos?: string[];
    descontos?: string[];
    formas_pagamento?: string[];
    highlights?: string[];
    plano?: { nome: string; ordem: number };
  };
}

export default function HotsiteListItem({ hotsite }: HotsiteListItemProps) {
  // Renderizar card do hotsite direto
}
```

### **4. Atualizar Tipos**

```typescript
// app/types.ts

// REMOVER ou depreciar:
export interface Company { ... }

// USAR:
export interface Hotsite {
  id: string;
  empresa_id?: string; // manter por compatibilidade
  nome_exibicao: string;
  descricao?: string;
  endereco?: string;
  cidade: string;
  estado: string;
  telefone1?: string;
  telefone2?: string;
  logo_url?: string;
  foto1_url?: string;
  foto2_url?: string;
  foto3_url?: string;
  servicos?: string[];
  descontos?: string[];
  formas_pagamento?: string[];
  highlights?: string[];
  plano?: {
    nome: string;
    ordem: number;
  };
}
```

---

## 🗑️ O que Remover/Manter no Admin

### **Opção 1: Remover Completamente Empresas**
- ❌ Deletar `/admin/empresas`
- ❌ Remover `EmpresasList`, `EmpresaEditForm`
- ✅ Trabalhar apenas com `/admin/hotsites` e `/admin/campanhas`
- ⚠️  Migração: vincular campanhas existentes aos hotsites

### **Opção 2: Manter Admin de Empresas (legado)**
- ✅ Manter `/admin/empresas` apenas para histórico
- ✅ Site funciona 100% com hotsites
- ⚠️  Dois lugares para gerenciar dados (confuso)

**Recomendação: Opção 1** (remover empresas completamente)

---

## 📋 Checklist de Migração

### **Fase 1: Preparação**
- [ ] Garantir que todos hotsites têm `empresa_id` preenchido
- [ ] Criar backup das tabelas
- [ ] Verificar se há campanhas sem hotsite correspondente

### **Fase 2: Código**
- [ ] Criar `getHotsitesByCidade()` e `getHotsitesCountByTipo()`
- [ ] Criar componente `HotsiteListItem`
- [ ] Atualizar páginas de cidade para usar hotsites
- [ ] Atualizar tipos em `app/types.ts`
- [ ] Testar todas as páginas de cidade

### **Fase 3: Admin (se remover empresas)**
- [ ] Remover `/admin/empresas`
- [ ] Atualizar `/admin/campanhas` para vincular direto a hotsites
- [ ] Remover componentes `EmpresasList`, `EmpresaEditForm`

### **Fase 4: Limpeza**
- [ ] Remover `lib/db/queries/empresas.ts` (se não usado)
- [ ] Remover tipo `Company` do `types.ts`
- [ ] Atualizar documentação

---

## 🚀 Próximos Passos

**Quer que eu implemente essa refatoração?**

Posso:
1. ✅ Criar a nova query `getHotsitesByCidade()`
2. ✅ Criar o componente `HotsiteListItem`
3. ✅ Atualizar as páginas de cidade
4. ✅ Remover a dependência de empresas
5. ⚠️  Decidir o que fazer com `/admin/empresas`

**Tempo estimado:** ~30-60 minutos para refatoração completa

