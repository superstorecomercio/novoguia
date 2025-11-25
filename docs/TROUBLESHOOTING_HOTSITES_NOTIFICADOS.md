# 🔍 Troubleshooting: hotsites_notificados = 0

## Problema
Quando você preenche o orçamento pela API do WhatsApp, o campo `hotsites_notificados` fica em 0, ou seja, nenhuma empresa é notificada.

---

## ✅ Checklist de Verificação

### 1. **Verificar se `estado_destino` está sendo enviado**

A função SQL **exige** que `estado_destino` seja enviado. Se não for enviado, o orçamento não é salvo.

**Como verificar:**
```sql
-- Verificar último orçamento criado
SELECT 
  id,
  estado_destino,
  cidade_destino,
  origem_completo,
  destino_completo,
  hotsites_notificados,
  created_at
FROM orcamentos
ORDER BY created_at DESC
LIMIT 5;
```

**Se `estado_destino` estiver NULL ou vazio:**
- ❌ Problema: A API do WhatsApp não está enviando `estadoDestino`
- ✅ Solução: Garantir que a API do WhatsApp envie o campo `estadoDestino` no payload

---

### 2. **Verificar formato do estado**

A função SQL normaliza o estado com `UPPER(TRIM())`, mas é importante garantir que o formato está correto.

**Como verificar:**
```sql
-- Verificar formato do estado no último orçamento
SELECT 
  estado_destino,
  LENGTH(estado_destino) as tamanho,
  UPPER(TRIM(estado_destino)) as estado_normalizado
FROM orcamentos
ORDER BY created_at DESC
LIMIT 1;

-- Comparar com estados na tabela hotsites
SELECT DISTINCT 
  estado,
  UPPER(TRIM(estado)) as estado_normalizado
FROM hotsites
WHERE estado IS NOT NULL
ORDER BY estado;
```

**Problemas comuns:**
- Estado com espaços extras: `"SP "` ou `" SP"`
- Estado em minúsculas: `"sp"` (deve funcionar, mas verificar)
- Estado com caracteres especiais

---

### 3. **Verificar se há campanhas ativas no estado**

Mesmo que o estado esteja correto, pode não haver campanhas ativas.

**Como verificar:**
```sql
-- Substitua 'SP' pelo estado do seu orçamento
SELECT COUNT(*) as total_campanhas_ativas
FROM buscar_hotsites_ativos_por_estado('SP', 'mudanca');
```

**Se retornar 0:**
- Não há campanhas ativas no estado
- Verificar próximos passos

---

### 4. **Verificar critérios das campanhas**

A função `buscar_hotsites_ativos_por_estado` filtra por:
- ✅ `c.ativo = true` (campanha ativa)
- ✅ `c.participa_cotacao = true` (campanha participa de cotação)
- ✅ `h.nome_exibicao IS NOT NULL` (hotsite tem nome)

**Como verificar:**
```sql
-- Verificar campanhas que NÃO passam nos filtros
SELECT 
  h.id as hotsite_id,
  h.nome_exibicao,
  h.estado,
  c.ativo as campanha_ativo,
  c.participa_cotacao,
  h.nome_exibicao IS NULL as nome_exibicao_null,
  CASE 
    WHEN c.ativo = false THEN '❌ Campanha inativa'
    WHEN c.participa_cotacao = false THEN '❌ Não participa de cotação'
    WHEN h.nome_exibicao IS NULL THEN '❌ Nome de exibição vazio'
    ELSE '✅ OK'
  END as motivo_exclusao
FROM hotsites h
INNER JOIN campanhas c ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = UPPER(TRIM('SP'))  -- Substitua pelo estado
  AND (
    c.ativo = false 
    OR c.participa_cotacao = false 
    OR h.nome_exibicao IS NULL
  );
```

---

### 5. **Testar função diretamente**

Teste a função SQL com o estado do último orçamento:

```sql
-- Pegar estado do último orçamento e testar
SELECT * FROM buscar_hotsites_ativos_por_estado(
  (SELECT estado_destino FROM orcamentos ORDER BY created_at DESC LIMIT 1),
  'mudanca'
);
```

**Se retornar vazio:**
- Verificar passos anteriores
- Verificar se há campanhas ativas no estado

---

## 🔧 Soluções Comuns

### Problema 1: API do WhatsApp não envia `estadoDestino`

**Sintoma:** `estado_destino` está NULL no banco

**Solução:** Garantir que a API do WhatsApp envie o campo:

```typescript
// Exemplo de payload correto
const dadosOrcamento = {
  nome: "João Silva",
  email: "joao@email.com",
  whatsapp: "11987654321",
  origem: "São Paulo, SP",
  destino: "Guarulhos, SP",
  estadoOrigem: "SP",        // ✅ OBRIGATÓRIO
  cidadeOrigem: "São Paulo",
  estadoDestino: "SP",       // ✅ OBRIGATÓRIO - CRÍTICO!
  cidadeDestino: "Guarulhos",
  // ... outros campos
};
```

### Problema 2: Estado em formato incorreto

**Sintoma:** Estado está sendo enviado, mas não encontra campanhas

**Solução:** Normalizar o estado antes de enviar:

```typescript
// Normalizar estado
const estadoDestino = dados.estadoDestino?.toUpperCase().trim();
```

### Problema 3: Não há campanhas ativas

**Sintoma:** Estado correto, mas nenhuma campanha encontrada

**Solução:** Verificar e ativar campanhas:

```sql
-- Verificar campanhas inativas
SELECT 
  h.nome_exibicao,
  h.estado,
  c.ativo,
  c.participa_cotacao
FROM campanhas c
INNER JOIN hotsites h ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = 'SP'
  AND (c.ativo = false OR c.participa_cotacao = false);

-- Ativar campanhas (se necessário)
UPDATE campanhas
SET ativo = true, participa_cotacao = true
WHERE id IN (
  SELECT c.id
  FROM campanhas c
  INNER JOIN hotsites h ON c.hotsite_id = h.id
  WHERE UPPER(TRIM(h.estado)) = 'SP'
);
```

### Problema 4: Hotsites sem `nome_exibicao`

**Sintoma:** Campanhas ativas, mas não retornadas

**Solução:** Preencher `nome_exibicao`:

```sql
-- Verificar hotsites sem nome_exibicao
SELECT id, nome_exibicao, estado
FROM hotsites
WHERE nome_exibicao IS NULL;

-- Preencher nome_exibicao (exemplo)
UPDATE hotsites
SET nome_exibicao = 'Nome da Empresa'
WHERE id = 'uuid-do-hotsite';
```

---

## 📋 Script de Diagnóstico Completo

Execute este script substituindo `'SP'` pelo estado do seu orçamento:

```sql
-- Ver arquivo: scripts/diagnostico-hotsites-notificados.sql
```

---

## 🎯 Resumo: O que verificar primeiro

1. ✅ **`estado_destino` está sendo enviado?** (mais comum)
2. ✅ **Formato do estado está correto?** (SP, não "sp" ou "SP ")
3. ✅ **Há campanhas ativas no estado?**
4. ✅ **Campanhas têm `participa_cotacao = true`?**
5. ✅ **Hotsites têm `nome_exibicao` preenchido?**

---

## 📞 Próximos Passos

1. Execute o script de diagnóstico: `scripts/diagnostico-hotsites-notificados.sql`
2. Verifique os logs da API para ver o que está sendo enviado
3. Compare o payload da API do WhatsApp com o payload da calculadora web
4. Verifique se o estado está sendo extraído corretamente do texto de destino

