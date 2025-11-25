# 🐛 Debug: Webhook WhatsApp - hotsites_notificados = 0

## Problema
- ✅ Calculadora web (`/calcularmudanca`) funciona: `hotsites_notificados > 0`
- ❌ API do WhatsApp não funciona: `hotsites_notificados = 0`
- ✅ Dados estão sendo salvos no banco corretamente

---

## 🔍 Diferenças entre os dois fluxos

### Calculadora Web (`/api/calcular-orcamento`)

1. **Chama IA primeiro** → IA extrai e normaliza cidade/estado
2. **Passa dados já processados** para `criarOrcamentoENotificar`:
   ```typescript
   estadoOrigem: resultado.estadoOrigem || undefined,  // Da IA: "SP"
   cidadeOrigem: resultado.cidadeOrigem || undefined,  // Da IA: "São Paulo"
   estadoDestino: resultado.estadoDestino || undefined, // Da IA: "SP"
   cidadeDestino: resultado.cidadeDestino || undefined, // Da IA: "Guarulhos"
   ```

### API WhatsApp (`/api/orcamentos`)

1. **Recebe dados diretamente** do formulário
2. **Monta manualmente** os campos:
   ```typescript
   estadoOrigem: formData.estadoOrigem,      // Do formulário
   cidadeOrigem: formData.cidadeOrigem,      // Do formulário
   estadoDestino: formData.estadoDestino,    // Do formulário
   cidadeDestino: formData.cidadeDestino,    // Do formulário
   ```

---

## ✅ Checklist de Verificação

### 1. Verificar o que está sendo enviado pela API do WhatsApp

**Adicione logs na rota `/api/orcamentos`:**

```typescript
// app/api/orcamentos/route.ts
console.log('📤 [WhatsApp] Dados recebidos:', {
  estadoOrigem: formData.estadoOrigem,
  estadoDestino: formData.estadoDestino,
  cidadeOrigem: formData.cidadeOrigem,
  cidadeDestino: formData.cidadeDestino,
});

console.log('📤 [WhatsApp] Dados preparados para RPC:', {
  estadoOrigem: dadosOrcamento.estadoOrigem,
  estadoDestino: dadosOrcamento.estadoDestino,
  cidadeOrigem: dadosOrcamento.cidadeOrigem,
  cidadeDestino: dadosOrcamento.cidadeDestino,
});
```

### 2. Verificar o que está sendo salvo no banco

Execute o script SQL:
```sql
-- Ver arquivo: scripts/comparar-orcamentos-web-vs-whatsapp.sql
```

### 3. Comparar formato do `estado_destino`

```sql
-- Últimos orçamentos WhatsApp
SELECT 
  id,
  estado_destino,
  LENGTH(estado_destino) as tamanho,
  UPPER(TRIM(estado_destino)) as normalizado,
  hotsites_notificados
FROM orcamentos
WHERE origem_formulario = 'formulario_simples'
ORDER BY created_at DESC
LIMIT 5;

-- Comparar com orçamentos da calculadora web
SELECT 
  id,
  estado_destino,
  LENGTH(estado_destino) as tamanho,
  UPPER(TRIM(estado_destino)) as normalizado,
  hotsites_notificados
FROM orcamentos
WHERE origem_formulario = 'calculadora'
ORDER BY created_at DESC
LIMIT 5;
```

### 4. Testar função SQL diretamente

```sql
-- Pegar estado do último orçamento WhatsApp
SELECT 
  o.id,
  o.estado_destino,
  o.hotsites_notificados,
  (SELECT COUNT(*) 
   FROM buscar_hotsites_ativos_por_estado(o.estado_destino, 'mudanca')
  ) as campanhas_encontradas
FROM orcamentos o
WHERE o.origem_formulario = 'formulario_simples'
ORDER BY o.created_at DESC
LIMIT 1;
```

---

## 🔧 Possíveis Problemas e Soluções

### Problema 1: `estadoDestino` não está sendo enviado

**Sintoma:** `estado_destino` está NULL no banco

**Solução:** Garantir que o webhook do WhatsApp envie o campo:

```typescript
// No webhook do WhatsApp, garantir que envia:
{
  estadoDestino: "SP",  // ✅ OBRIGATÓRIO
  cidadeDestino: "São Paulo",
  // ...
}
```

### Problema 2: Formato do estado diferente

**Sintoma:** Estado está sendo enviado, mas formato está errado

**Solução:** Normalizar antes de enviar:

```typescript
// Na API do WhatsApp, normalizar:
const estadoDestino = formData.estadoDestino?.toUpperCase().trim();
const estadoOrigem = formData.estadoOrigem?.toUpperCase().trim();

const dadosOrcamento = {
  // ...
  estadoDestino: estadoDestino,  // Já normalizado
  estadoOrigem: estadoOrigem,    // Já normalizado
  // ...
};
```

### Problema 3: Estado está vindo em formato diferente

**Sintoma:** Estado está sendo enviado, mas não encontra campanhas

**Verificar:**
- Estado com espaços: `"SP "` ou `" SP"`
- Estado em minúsculas: `"sp"` (deve funcionar, mas verificar)
- Estado com caracteres especiais

**Solução:** A função SQL já normaliza com `UPPER(TRIM())`, mas garantir que está sendo enviado corretamente.

### Problema 4: Dados não estão sendo mapeados corretamente

**Sintoma:** Dados estão no `formData`, mas não chegam na função RPC

**Verificar:** A função `criarOrcamentoENotificar` espera:

```typescript
{
  estadoDestino: string,  // Não "estado_destino"
  estadoOrigem: string,   // Não "estado_origem"
  // ...
}
```

**Solução:** Verificar se o mapeamento está correto em `/api/orcamentos`.

---

## 📋 Script de Debug Completo

Execute este script para comparar os dois fluxos:

```sql
-- Ver arquivo: scripts/comparar-orcamentos-web-vs-whatsapp.sql
```

---

## 🎯 Próximos Passos

1. **Adicionar logs** na rota `/api/orcamentos` para ver o que está sendo recebido
2. **Executar script SQL** para comparar orçamentos web vs WhatsApp
3. **Verificar logs do servidor** quando criar orçamento pelo WhatsApp
4. **Comparar payload** do WhatsApp com o payload da calculadora web

---

## 🔍 Exemplo de Log Esperado

Quando funcionar corretamente, você deve ver nos logs:

```
📤 [WhatsApp] Dados recebidos: {
  estadoOrigem: "SP",
  estadoDestino: "SP",
  cidadeOrigem: "São Paulo",
  cidadeDestino: "Guarulhos"
}

📤 [WhatsApp] Dados preparados para RPC: {
  estadoOrigem: "SP",
  estadoDestino: "SP",
  cidadeOrigem: "São Paulo",
  cidadeDestino: "Guarulhos"
}

✅ [API Orçamentos] Orçamento criado: {
  id: "uuid...",
  hotsites: 10,  // ✅ Deve ser > 0
  ids: ["uuid1", "uuid2", ...]
}
```

Se `hotsites: 0`, verificar:
- Se `estadoDestino` está sendo enviado
- Se o formato está correto
- Se há campanhas ativas no estado

