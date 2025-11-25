# 📋 Alteração: Exibir Lista de Empresas Notificadas no WhatsApp

**Data:** 2025-01-23  
**Status:** ✅ Implementado

---

## 🎯 Objetivo

Exibir a lista de empresas notificadas na última mensagem do WhatsApp, quando `hotsites_notificados >= 1`.

---

## 📝 Alterações Realizadas

### 1. `vps-code/codigo/supabase-service.js`

**O que foi alterado:**
- Adicionada busca de nomes das empresas após salvar orçamento
- Retorna lista de empresas notificadas junto com o resultado

**Código adicionado:**
```javascript
// Buscar nomes das empresas notificadas
let empresasNotificadas = [];
if (campanhasIds.length > 0) {
  // Busca campanhas e extrai nomes dos hotsites
  const { data: campanhas } = await supabase
    .from('campanhas')
    .select(`
      id,
      hotsite:hotsites!hotsite_id(
        id,
        nome_exibicao
      )
    `)
    .in('id', campanhasIds);
  
  // Extrai nomes únicos
  // ...
}

return {
  orcamento_id: resultado.orcamento_id,
  hotsites_notificados: resultado.hotsites_notificados || 0,
  campanhas_ids: campanhasIds,
  empresasNotificadas: empresasNotificadas  // ← NOVO
};
```

---

### 2. `vps-code/codigo/message-handler.js`

**O que foi alterado:**
- Modificada função `finalizarOrcamento()` para aguardar resultado do salvamento
- Adicionada exibição da lista de empresas na mensagem final

**Código alterado:**

**Antes:**
```javascript
// Salvar no banco (não bloqueia a resposta)
salvarOrcamento(sessao.dados, resultadoIA).catch(err => {
  console.error('Erro ao salvar orçamento (assíncrono):', err);
});
```

**Depois:**
```javascript
// Salvar no banco e obter lista de empresas notificadas
let resultadoSalvamento = null;
try {
  resultadoSalvamento = await salvarOrcamento(sessao.dados, resultadoIA);
  console.log('Orçamento salvo:', resultadoSalvamento);
} catch (err) {
  console.error('Erro ao salvar orçamento:', err);
  // Continua mesmo se der erro ao salvar
}
```

**Mensagem final:**

**Antes:**
```
━━━━━━━━━━━━━━━━━
✨ *Empresas parceiras entrarão em contato em breve!*
```

**Depois:**
```
━━━━━━━━━━━━━━━━━
${resultadoSalvamento && resultadoSalvamento.hotsites_notificados >= 1 && resultadoSalvamento.empresasNotificadas && resultadoSalvamento.empresasNotificadas.length > 0
  ? `✨ *Empresas parceiras que receberam seu orçamento:*\n\n${resultadoSalvamento.empresasNotificadas.map((empresa, index) => `${index + 1}. ${empresa}`).join('\n')}\n\n💬 *Elas entrarão em contato em breve!*`
  : `✨ *Empresas parceiras entrarão em contato em breve!*`}
```

---

## 📊 Exemplo de Mensagem Final

### Se houver empresas notificadas (>= 1):

```
✅ *ORÇAMENTO CALCULADO!*

👤 *Cliente:* João
📧 *Email:* joao@email.com

📍 *Origem:* São Paulo, SP
🎯 *Destino:* Rio de Janeiro, RJ

🏠 *Tipo:* Apartamento 2 quartos
🚪 *Elevador:* Sim
📦 *Embalagem:* Sim, completa

💰 *FAIXA DE PREÇO ESTIMADA:*
*R$ 6.000 - R$ 8.500*

📏 *Distância:* 432 km

🤖 *Análise:*
...

━━━━━━━━━━━━━━━━━
✨ *Empresas parceiras que receberam seu orçamento:*

1. Mudanças Express SP
2. Translocação Rápida
3. Mudanças Premium RJ

💬 *Elas entrarão em contato em breve!*

Digite *nova cotação* para fazer outro orçamento.
```

### Se não houver empresas notificadas (0):

```
━━━━━━━━━━━━━━━━━
✨ *Empresas parceiras entrarão em contato em breve!*

Digite *nova cotação* para fazer outro orçamento.
```

---

## 🚀 Como Fazer Deploy

### 1. Fazer Commit (Opcional)

```bash
# No projeto local
git add vps-code/codigo/
git commit -m "Adicionada exibição de lista de empresas notificadas no WhatsApp"
```

### 2. Fazer Deploy

```bash
# Deploy para VPS
./scripts/deploy-vps.sh
```

### 3. Testar

```bash
# Ver logs
ssh root@38.242.148.169 'pm2 logs whatsapp-webhook --lines 50'

# Testar enviando "oi" no WhatsApp
# Completar o fluxo e verificar se lista aparece
```

### 4. Atualizar Versão

```bash
# Atualizar versão na VPS
ssh root@38.242.148.169 'cd /home/whatsapp-webhook && ./atualizar-versao.sh "Adicionada exibição de lista de empresas notificadas"'

# Sincronizar versão
./scripts/sincronizar-vps.sh
```

---

## 🔍 Como Funciona

### Fluxo:

1. **Cliente completa orçamento** → `finalizarOrcamento()` é chamada
2. **Calcula com IA** → `calcularOrcamentoComIA()`
3. **Salva no banco** → `salvarOrcamento()`
   - Chama função SQL `criar_orcamento_e_notificar()`
   - Recebe `campanhas_ids` (array de UUIDs)
   - Busca nomes dos hotsites a partir dos IDs
   - Retorna lista de empresas
4. **Formata mensagem** → Inclui lista se `hotsites_notificados >= 1`
5. **Envia mensagem** → Cliente vê lista de empresas

---

## 🐛 Troubleshooting

### Problema: Lista não aparece

**Verificar:**
1. Logs da VPS: `pm2 logs whatsapp-webhook`
2. Verificar se `hotsites_notificados >= 1`
3. Verificar se `empresasNotificadas` tem dados

**Logs esperados:**
```
Buscando nomes das empresas para campanhas: [...]
Campanhas encontradas: [...]
Empresa encontrada: Nome da Empresa
Total de empresas únicas encontradas: X
```

### Problema: Erro ao buscar empresas

**Verificar:**
- Conexão com Supabase
- Permissões da Service Key
- Estrutura da query (hotsite:hotsites!hotsite_id)

---

## ✅ Checklist

- [x] Modificado `supabase-service.js` para buscar nomes
- [x] Modificado `message-handler.js` para exibir lista
- [x] Adicionado tratamento de erros
- [x] Adicionado logs para debug
- [ ] Testado em produção
- [ ] Versão atualizada

---

## 📝 Notas

- Lista só aparece se `hotsites_notificados >= 1`
- Nomes são únicos (Set remove duplicatas)
- Se der erro ao buscar nomes, mensagem padrão é exibida
- Ordem das empresas segue ordem das campanhas

---

**Última atualização:** 2025-01-23

