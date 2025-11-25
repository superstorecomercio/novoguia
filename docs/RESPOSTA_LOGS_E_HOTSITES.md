# 📋 Respostas: Logs e hotsites_notificados

## 1. Onde ver os logs?

### Durante desenvolvimento (npm run dev)

**Terminal onde você rodou `npm run dev`:**
- Todos os logs aparecem no terminal
- Procure por mensagens como:
  - `📋 [API Orçamentos] Recebendo dados:`
  - `📦 Dados preparados para RPC:`
  - `✅ [API Orçamentos] Orçamento criado:`
  - `⚠️ [API Orçamentos] ATENÇÃO: Nenhuma empresa foi notificada!`

### Em produção (Vercel)

**Vercel Dashboard:**
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Logs** (menu lateral)
4. Veja logs em tempo real

**Ou via CLI:**
```bash
vercel logs
```

### Arquivos de log (se configurado)

Os logs também são salvos em arquivos na pasta `logs/`:
- `logs/api-calculadora-YYYY-MM-DD.log`
- `logs/db-orcamentos-YYYY-MM-DD.log`

---

## 2. Como funciona `hotsites_notificados`?

### ✅ Resposta direta:

**`hotsites_notificados` é calculado AUTOMATICAMENTE pela função SQL no banco de dados**, não pela API.

### Fluxo completo:

```
1. WhatsApp chama API → POST /api/orcamentos
   ↓
2. API chama função TypeScript → criarOrcamentoENotificar()
   ↓
3. Função TypeScript chama função SQL → criar_orcamento_e_notificar()
   ↓
4. Função SQL (no banco):
   - Insere orçamento na tabela
   - Busca campanhas ativas do estado
   - Cria vínculos em orcamentos_campanhas
   - Conta quantos vínculos foram criados
   - Atualiza campo hotsites_notificados
   - Retorna o número
   ↓
5. API retorna resultado para WhatsApp
```

### Detalhes técnicos:

**Função SQL (`criar_orcamento_e_notificar`):**

```sql
-- 1. Insere orçamento
INSERT INTO orcamentos (...) VALUES (...)
RETURNING id INTO v_orcamento_id;

-- 2. Busca campanhas ativas do estado
FOR v_campanhas IN
  SELECT * FROM buscar_hotsites_ativos_por_estado(estado_destino, 'mudanca')
LOOP
  -- 3. Cria vínculo para cada campanha encontrada
  INSERT INTO orcamentos_campanhas (orcamento_id, campanha_id, hotsite_id)
  VALUES (v_orcamento_id, v_campanhas.campanha_id, v_campanhas.hotsite_id);
  
  -- 4. Conta quantos foram criados
  v_hotsites_count := v_hotsites_count + 1;
END LOOP;

-- 5. Atualiza o campo no orçamento
UPDATE orcamentos
SET hotsites_notificados = v_hotsites_count
WHERE id = v_orcamento_id;

-- 6. Retorna o número
RETURN QUERY SELECT v_orcamento_id, v_hotsites_count, ...;
```

**Então:**
- ✅ O WhatsApp **só chama a API** para incluir no banco
- ✅ A API **chama a função SQL**
- ✅ A função SQL **faz tudo automaticamente**:
  - Salva o orçamento
  - Busca campanhas
  - Cria vínculos
  - Conta e atualiza `hotsites_notificados`

---

## 3. Por que funciona na calculadora web mas não no WhatsApp?

### Diferença principal:

**Calculadora Web (`/api/calcular-orcamento`):**
1. Chama IA primeiro
2. IA extrai e normaliza `estadoDestino`: `"SP"`
3. Passa `estadoDestino: "SP"` para função SQL
4. ✅ Função SQL encontra campanhas

**WhatsApp (`/api/orcamentos`):**
1. Recebe dados diretamente do formulário
2. Pode não ter `estadoDestino` ou estar em formato errado
3. Passa `estadoDestino: undefined` ou `"sp"` ou `"SP "`
4. ❌ Função SQL não encontra campanhas → `hotsites_notificados = 0`

### O que verificar:

1. **O webhook do WhatsApp está enviando `estadoDestino`?**
   ```json
   {
     "estadoDestino": "SP"  // ✅ Deve estar aqui
   }
   ```

2. **O formato está correto?**
   - ✅ Correto: `"SP"` (maiúsculas, sem espaços)
   - ❌ Errado: `"sp"`, `"SP "`, `" Sp"`, `null`, `undefined`

3. **Há campanhas ativas no estado?**
   ```sql
   SELECT COUNT(*) 
   FROM buscar_hotsites_ativos_por_estado('SP', 'mudanca');
   ```

---

## 4. Alterações feitas no código

### Alteração 1: Logs detalhados na API do WhatsApp

**Arquivo:** `app/api/orcamentos/route.ts`

**Adicionado:**
- Logs antes de chamar função SQL
- Validação se `estadoDestino` está vazio
- Alerta se `hotsites_notificados = 0`

### Alteração 2: Função SQL sempre busca por estado

**Arquivo:** `supabase/migrations/028_filtrar_campanhas_por_estado.sql`

**Mudança:**
- Antes: Buscava por cidade se encontrada, senão por estado
- Agora: **SEMPRE busca por estado**, independente de ter encontrado a cidade

**Por quê:**
- Mais empresas são notificadas
- Funciona mesmo se cidade não estiver cadastrada
- Mais simples e previsível

### Alteração 3: Função `buscar_hotsites_ativos_por_estado`

**Filtros aplicados:**
- ✅ `c.ativo = true` (campanha ativa)
- ✅ `c.participa_cotacao = true` (participa de cotação)
- ✅ `h.nome_exibicao IS NOT NULL` (tem nome)
- ❌ **NÃO filtra por `h.ativo`** (removido)

**Ordenação:**
1. Ordem do plano (menor = melhor)
2. Data de início (mais recente primeiro)
3. ID do hotsite

---

## 5. Como debugar o problema do WhatsApp

### Passo 1: Ver logs no terminal

Quando criar orçamento pelo WhatsApp, veja o terminal:

```
📋 [API Orçamentos] Recebendo dados: {
  estadoDestino: "SP"  // ⚠️ Verificar se está aqui
}

📦 Dados preparados para RPC: {
  estadoDestino: "SP"  // ⚠️ Verificar se está aqui
}

✅ [API Orçamentos] Orçamento criado: {
  hotsites: 0  // ⚠️ Se for 0, há problema
}
```

### Passo 2: Verificar no banco

```sql
-- Último orçamento do WhatsApp
SELECT 
  id,
  estado_destino,
  hotsites_notificados,
  created_at
FROM orcamentos
WHERE origem_formulario = 'formulario_simples'
ORDER BY created_at DESC
LIMIT 1;
```

### Passo 3: Testar função SQL diretamente

```sql
-- Pegar estado do último orçamento e testar
SELECT COUNT(*) 
FROM buscar_hotsites_ativos_por_estado(
  (SELECT estado_destino FROM orcamentos 
   WHERE origem_formulario = 'formulario_simples' 
   ORDER BY created_at DESC LIMIT 1),
  'mudanca'
);
```

**Se retornar 0:**
- Não há campanhas ativas no estado
- Ou o estado está em formato incorreto

**Se retornar > 0:**
- Há campanhas, mas não foram vinculadas
- Verificar se `estado_destino` está NULL no orçamento

---

## 6. Resumo final

### O que acontece:

1. **WhatsApp chama API** → `/api/orcamentos`
2. **API chama função SQL** → `criar_orcamento_e_notificar()`
3. **Função SQL faz tudo:**
   - Salva orçamento
   - Busca campanhas ativas do `estado_destino`
   - Cria vínculos
   - Conta e atualiza `hotsites_notificados`
4. **API retorna** o número de empresas notificadas

### Problema mais comum:

**`estadoDestino` não está sendo enviado pelo webhook do WhatsApp ou está em formato incorreto.**

### Solução:

Garantir que o webhook envia:
```json
{
  "estadoDestino": "SP"  // Maiúsculas, sem espaços
}
```

---

## 📝 Arquivos relacionados

- `app/api/orcamentos/route.ts` - API do WhatsApp
- `lib/db/queries/orcamentos.ts` - Função TypeScript
- `supabase/migrations/028_filtrar_campanhas_por_estado.sql` - Função SQL
- `scripts/comparar-orcamentos-web-vs-whatsapp.sql` - Script de diagnóstico

