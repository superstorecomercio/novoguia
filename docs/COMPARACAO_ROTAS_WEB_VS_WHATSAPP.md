# 🔄 Comparação: Rotas Web vs WhatsApp

## ✅ Resposta Direta

**SIM, eles executam códigos diferentes!**

Há **2 rotas de API diferentes**:

1. **`/api/calcular-orcamento`** → Usada pela calculadora web
2. **`/api/orcamentos`** → Usada pelo WhatsApp

Ambas chamam a **mesma função SQL** no final, mas o **processamento antes é diferente**.

---

## 📊 Comparação Detalhada

### 1. Rota: `/api/calcular-orcamento` (Calculadora Web)

**Arquivo:** `app/api/calcular-orcamento/route.ts`

**Fluxo:**
```
1. Recebe dados do formulário
   ↓
2. Chama IA (OpenAI) para calcular preço e extrair cidade/estado
   ↓
3. IA retorna: precoMin, precoMax, distanciaKm, cidadeOrigem, estadoOrigem, cidadeDestino, estadoDestino
   ↓
4. Chama criarOrcamentoENotificar() com dados da IA
   ↓
5. Função SQL salva e vincula campanhas
```

**Características:**
- ✅ Usa IA para calcular preço
- ✅ IA extrai e normaliza cidade/estado automaticamente
- ✅ Retorna faixa de preço para o frontend
- ✅ `origemFormulario: 'calculadora'`

**Dados enviados:**
```typescript
{
  origem: "Moema, São Paulo - SP",  // Texto livre
  destino: "Pinheiros, São Paulo - SP",
  tipoImovel: "2_quartos",
  temElevador: "sim",
  andar: 3,
  precisaEmbalagem: "sim",
  nome: "João",
  email: "joao@email.com",
  whatsapp: "11987654321"
}
```

**Dados que chegam na função SQL (após IA):**
```typescript
{
  origem: "Moema, São Paulo - SP",
  destino: "Pinheiros, São Paulo - SP",
  estadoOrigem: "SP",        // ✅ Extraído pela IA
  cidadeOrigem: "São Paulo", // ✅ Extraído pela IA
  estadoDestino: "SP",       // ✅ Extraído pela IA
  cidadeDestino: "São Paulo", // ✅ Extraído pela IA
  precoMin: 850,             // ✅ Calculado pela IA
  precoMax: 1150,            // ✅ Calculado pela IA
  distanciaKm: 12,           // ✅ Calculado pela IA
  // ...
}
```

---

### 2. Rota: `/api/orcamentos` (WhatsApp)

**Arquivo:** `app/api/orcamentos/route.ts`

**Fluxo:**
```
1. Recebe dados do webhook do WhatsApp
   ↓
2. NÃO chama IA (recebe dados já estruturados)
   ↓
3. Monta dados manualmente
   ↓
4. Chama criarOrcamentoENotificar() com dados do formulário
   ↓
5. Função SQL salva e vincula campanhas
```

**Características:**
- ❌ NÃO usa IA (não calcula preço)
- ❌ NÃO extrai cidade/estado (espera que venham do webhook)
- ✅ Mais simples e direto
- ✅ `origemFormulario: 'formulario_simples'`

**Dados enviados (esperados do webhook):**
```typescript
{
  nomeCliente: "João",
  emailCliente: "joao@email.com",
  telefoneCliente: "11987654321",
  cidadeOrigem: "São Paulo",
  estadoOrigem: "SP",        // ⚠️ DEVE VIR DO WEBHOOK
  cidadeDestino: "Guarulhos",
  estadoDestino: "SP",       // ⚠️ DEVE VIR DO WEBHOOK (OBRIGATÓRIO)
  tipoOrigem: "apartamento",
  precisaEmbalagem: false,
  // ...
}
```

**Dados que chegam na função SQL:**
```typescript
{
  origem: "São Paulo, SP",      // Montado manualmente
  destino: "Guarulhos, SP",     // Montado manualmente
  estadoOrigem: "SP",           // ⚠️ Do webhook (pode estar vazio)
  cidadeOrigem: "São Paulo",    // ⚠️ Do webhook
  estadoDestino: "SP",          // ⚠️ Do webhook (OBRIGATÓRIO)
  cidadeDestino: "Guarulhos",   // ⚠️ Do webhook
  precoMin: undefined,          // ❌ Não calculado
  precoMax: undefined,          // ❌ Não calculado
  distanciaKm: undefined,       // ❌ Não calculado
  // ...
}
```

---

## 🔍 Diferenças Principais

| Aspecto | Calculadora Web | WhatsApp |
|---------|----------------|----------|
| **Rota** | `/api/calcular-orcamento` | `/api/orcamentos` |
| **Usa IA?** | ✅ Sim (OpenAI) | ❌ Não |
| **Calcula preço?** | ✅ Sim | ❌ Não |
| **Extrai cidade/estado?** | ✅ Sim (IA) | ❌ Não (espera do webhook) |
| **Origem formulário** | `'calculadora'` | `'formulario_simples'` |
| **Validação estado** | ✅ IA garante | ⚠️ Depende do webhook |
| **Função SQL final** | ✅ Mesma | ✅ Mesma |

---

## ⚠️ Problema Identificado

### Por que funciona na web mas não no WhatsApp?

**Calculadora Web:**
1. IA sempre extrai `estadoDestino` corretamente
2. Dados chegam normalizados na função SQL
3. ✅ Funciona

**WhatsApp:**
1. Depende do webhook enviar `estadoDestino`
2. Se não enviar ou enviar errado, função SQL não encontra campanhas
3. ❌ `hotsites_notificados = 0`

---

## 🔧 Código Comparado

### Calculadora Web (`/api/calcular-orcamento`)

```typescript
// 1. Chama IA primeiro
const resultado = await calcularOrcamentoComIA(body);

// 2. IA retorna dados normalizados
// resultado.estadoDestino = "SP" (sempre presente)

// 3. Passa para função SQL
const orcamentoSalvo = await criarOrcamentoENotificar({
  estadoOrigem: resultado.estadoOrigem || undefined,  // ✅ Da IA
  estadoDestino: resultado.estadoDestino || undefined, // ✅ Da IA
  cidadeOrigem: resultado.cidadeOrigem || undefined,
  cidadeDestino: resultado.cidadeDestino || undefined,
  precoMin: resultado.precoMin,
  precoMax: resultado.precoMax,
  distanciaKm: resultado.distanciaKm,
  origemFormulario: 'calculadora',
  // ...
});
```

### WhatsApp (`/api/orcamentos`)

```typescript
// 1. NÃO chama IA
// Recebe dados diretamente do webhook

// 2. Monta dados manualmente
const dadosOrcamento = {
  estadoOrigem: formData.estadoOrigem,      // ⚠️ Do webhook
  estadoDestino: formData.estadoDestino,    // ⚠️ Do webhook (pode estar vazio!)
  cidadeOrigem: formData.cidadeOrigem,
  cidadeDestino: formData.cidadeDestino,
  origemFormulario: 'formulario_simples',
  // ...
};

// 3. Validação manual
if (!dadosOrcamento.estadoDestino || dadosOrcamento.estadoDestino.trim() === '') {
  return NextResponse.json({ error: 'Estado de destino é obrigatório' }, { status: 400 });
}

// 4. Passa para função SQL
const resultado = await criarOrcamentoENotificar(dadosOrcamento);
```

---

## ✅ Função SQL Final (Mesma para Ambos)

Ambas as rotas chamam a **mesma função SQL**:

```sql
criar_orcamento_e_notificar(p_orcamento_data JSONB)
```

Esta função:
1. Salva o orçamento
2. Busca campanhas ativas do `estado_destino`
3. Cria vínculos
4. Atualiza `hotsites_notificados`
5. Retorna o resultado

**A diferença está nos DADOS que chegam na função SQL:**
- Web: Dados normalizados pela IA ✅
- WhatsApp: Dados do webhook (podem estar incompletos) ⚠️

---

## 🎯 Solução para o Problema do WhatsApp

### Opção 1: Garantir que webhook envia `estadoDestino`

```json
{
  "estadoDestino": "SP"  // ✅ OBRIGATÓRIO
}
```

### Opção 2: Adicionar extração de estado na rota do WhatsApp

```typescript
// Se estadoDestino não vier, tentar extrair do texto
if (!formData.estadoDestino && formData.cidadeDestino) {
  // Extrair estado do texto (similar ao que a IA faz)
  const estadoExtraido = extrairEstadoDoTexto(formData.cidadeDestino);
  formData.estadoDestino = estadoExtraido;
}
```

### Opção 3: Usar a mesma rota da calculadora web

Fazer o WhatsApp chamar `/api/calcular-orcamento` em vez de `/api/orcamentos`.

---

## 📝 Resumo

**SIM, são códigos diferentes:**

1. **Calculadora Web** → `/api/calcular-orcamento`
   - Usa IA
   - Extrai cidade/estado automaticamente
   - Calcula preço
   - ✅ Sempre funciona

2. **WhatsApp** → `/api/orcamentos`
   - Não usa IA
   - Depende do webhook enviar cidade/estado
   - Não calcula preço
   - ⚠️ Pode não funcionar se dados estiverem incompletos

**Ambas chamam a mesma função SQL no final**, mas os dados que chegam são diferentes.

---

## 🔍 Arquivos Relacionados

- `app/api/calcular-orcamento/route.ts` - Rota da calculadora web
- `app/api/orcamentos/route.ts` - Rota do WhatsApp
- `lib/db/queries/orcamentos.ts` - Função TypeScript (comum)
- `supabase/migrations/028_filtrar_campanhas_por_estado.sql` - Função SQL (comum)

