# 🔄 Mudança de Domínio: novoguia.vercel.app → mudatech.vercel.app

## ✅ O que precisa ser alterado

### 1. Na Vercel (Dashboard)

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto
3. Vá em **Settings** → **General**
4. Em **Project Name**, altere de `novoguia` para `mudatech`
5. Salve

**Resultado:** A URL automaticamente muda de `novoguia.vercel.app` para `mudatech.vercel.app`

---

### 2. Na VPS (Arquivos que chamam a API)

**⚠️ IMPORTANTE:** Se a VPS tem URLs hardcoded, precisa atualizar!

#### Verificar na VPS:

```bash
# Na VPS, procurar por referências ao domínio antigo
grep -r "novoguia.vercel.app" /caminho/do/projeto/whatsapp/
grep -r "novoguia" /caminho/do/projeto/whatsapp/
```

#### Atualizar código na VPS:

**Antes:**
```python
# Python
url = "https://novoguia.vercel.app/api/orcamentos"
```

**Depois:**
```python
# Python
url = "https://mudatech.vercel.app/api/orcamentos"
```

**Ou melhor ainda, usar variável de ambiente:**
```python
import os

# No arquivo .env da VPS
# API_URL=https://mudatech.vercel.app/api/orcamentos

url = os.getenv('API_URL', 'https://mudatech.vercel.app/api/orcamentos')
```

---

### 3. Variáveis de Ambiente (se houver)

Se você tiver variáveis de ambiente configuradas com a URL antiga:

#### Na Vercel:
1. Vá em **Settings** → **Environment Variables**
2. Procure por variáveis que contenham `novoguia.vercel.app`
3. Atualize para `mudatech.vercel.app`

#### Na VPS:
1. Edite o arquivo `.env` ou configuração de ambiente
2. Atualize qualquer referência a `novoguia.vercel.app`

---

### 4. Webhooks Externos (se houver)

Se você tem webhooks configurados em outros serviços que chamam sua API:

- **Stripe** (se usar)
- **WhatsApp Business API** (se configurado)
- **Outros serviços**

Atualize as URLs de callback para: `https://mudatech.vercel.app/api/...`

---

### 5. Domínio Customizado (se usar)

Se você tem um domínio customizado configurado (ex: `mudatech.com.br`):

- ✅ **Não precisa mudar nada** - o domínio customizado continua funcionando
- Apenas certifique-se de que está apontando para o projeto correto na Vercel

---

## ✅ O que NÃO precisa ser alterado

### No código deste repositório:
- ✅ **Nada!** Não há URLs hardcoded no código
- ✅ Todas as URLs são dinâmicas ou usam variáveis de ambiente
- ✅ O código funciona independente do domínio

### Variáveis de ambiente do Next.js:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - não precisa mudar
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - não precisa mudar
- ✅ `OPENAI_API_KEY` - não precisa mudar
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - não precisa mudar

---

## 🔍 Checklist Completo

- [ ] Mudar nome do projeto na Vercel (`novoguia` → `mudatech`)
- [ ] Verificar se a URL mudou para `mudatech.vercel.app`
- [ ] Atualizar código na VPS (se tiver URLs hardcoded)
- [ ] Atualizar variáveis de ambiente na VPS (se houver)
- [ ] Atualizar webhooks externos (se houver)
- [ ] Testar chamada da API da VPS para nova URL
- [ ] Verificar se tudo está funcionando

---

## 🧪 Como Testar

### 1. Testar URL nova diretamente:

```bash
curl -X POST https://mudatech.vercel.app/api/test-post \
  -H "Content-Type: application/json" \
  -d '{"test": "ok"}'
```

### 2. Testar endpoint de orçamentos:

```bash
curl -X POST https://mudatech.vercel.app/api/orcamentos \
  -H "Content-Type: application/json" \
  -d '{
    "nomeCliente": "Teste",
    "emailCliente": "teste@teste.com",
    "telefoneCliente": "11999999999",
    "cidadeOrigem": "São Paulo",
    "cidadeDestino": "Guarulhos",
    "estadoDestino": "SP"
  }'
```

### 3. Testar da VPS:

Após atualizar o código na VPS, faça um teste real enviando um orçamento pelo WhatsApp.

---

## ⚠️ Importante

### URL antiga ainda funciona?

**Por um tempo sim**, mas a Vercel pode redirecionar ou desativar a URL antiga. **Sempre atualize para a nova URL o quanto antes.**

### Cache/CDN

Se você usa CDN ou cache:
- Limpe o cache após a mudança
- Aguarde alguns minutos para propagação

---

## 📝 Resumo

**No código deste repositório:** ✅ Nada precisa ser alterado

**Na Vercel:** 
- Mudar nome do projeto de `novoguia` para `mudatech`

**Na VPS:**
- Atualizar URLs hardcoded (se houver)
- Atualizar variáveis de ambiente (se houver)

**Webhooks:**
- Atualizar URLs de callback (se houver)

---

## 🆘 Problemas Comuns

### Problema: VPS não consegue chamar a API

**Solução:**
1. Verificar se atualizou a URL na VPS
2. Verificar se a nova URL está funcionando: `https://mudatech.vercel.app/api/test-post`
3. Verificar logs da Vercel para ver se a requisição está chegando

### Problema: Erro 404 na nova URL

**Solução:**
1. Aguardar alguns minutos após mudar o nome na Vercel
2. Verificar se o deploy foi concluído
3. Verificar se o nome do projeto foi salvo corretamente

### Problema: URL antiga ainda funciona

**Solução:**
- Isso é normal por um tempo
- A Vercel mantém a URL antiga funcionando temporariamente
- Mas sempre use a nova URL para evitar problemas futuros

