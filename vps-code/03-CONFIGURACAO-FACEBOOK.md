# 03 - Configuração Facebook / WhatsApp Business API

## 🎯 Objetivo

Configurar a API do WhatsApp Business através do Facebook Developers para receber e enviar mensagens.

---

## ✅ Pré-requisitos

- Conta no Facebook
- Servidor configurado (PASSO 2 completo)
- URL do webhook funcionando: `https://mudancas.duckdns.org/webhook`

---

## 📋 Visão Geral

```
Facebook Developers
  └── App (seu aplicativo)
      └── WhatsApp Business Product
          ├── Phone Numbers (números de telefone)
          ├── Webhook Configuration (configuração do webhook)
          └── API Setup (configuração da API)
```

---

## 🚀 Passo a Passo

### PASSO 1: Criar Conta no Facebook Business

1. Acesse: https://business.facebook.com/
2. Clique em **"Criar conta"**
3. Preencha informações da empresa
4. Confirme email

---

### PASSO 2: Acessar Facebook Developers

1. Acesse: https://developers.facebook.com/
2. Faça login com sua conta Facebook
3. Clique em **"Meus Aplicativos"** (canto superior direito)

---

### PASSO 3: Criar Aplicativo

1. Clique em **"Criar Aplicativo"**
2. Escolha tipo: **"Empresa"** ou **"Outro"**
3. Clique em **"Próximo"**

**Preencha:**
- **Nome do aplicativo:** "WhatsApp Bot Julia" (ou qualquer nome)
- **Email de contato:** seu email
- **Conta de negócios:** Selecione ou crie uma

4. Clique em **"Criar Aplicativo"**
5. Complete verificação de segurança (se solicitado)

---

### PASSO 4: Adicionar Produto WhatsApp

1. Na página do app, procure **"Adicionar produtos"**
2. Encontre **"WhatsApp"**
3. Clique em **"Configurar"** ou **"Set up"**
4. Selecione (ou crie) uma **Conta do WhatsApp Business**

---

### PASSO 5: Configurar Webhook

#### 5.1 - Configurar URL e Token

1. No menu lateral, vá em **WhatsApp → Configuração**
2. Procure seção **"Webhook"**
3. Clique em **"Editar"** ou **"Configurar Webhook"**

**Preencha:**
```
Callback URL: https://mudancas.duckdns.org/webhook
Verify Token: meu_token_secreto_12345
```

4. Clique em **"Verificar e salvar"**

**O Facebook vai fazer uma requisição GET para validar!**

**Sucesso:** Deve aparecer checkmark verde ✅

**Erro:** Verifique:
- URL está correta e acessível
- Token no `.env` é exatamente `meu_token_secreto_12345`
- Servidor está rodando (`sudo pm2 status`)

#### 5.2 - Inscrever em Campos

1. Na mesma página, procure **"Campos do webhook"** ou **"Webhook fields"**
2. Clique em **"Gerenciar"** ou **"Manage"**
3. **Marque:** `messages`
4. Clique em **"Subscribe"** ou **"Inscrever"**

**Importante:** O campo deve ficar **ASSINADO** ✅

---

### PASSO 6: Inscrever Aplicativo (CRÍTICO!)

Este passo é essencial para o webhook funcionar!

#### Via Interface (nem sempre funciona):

Procure na interface uma opção para inscrever o app. Se não encontrar, use o comando abaixo.

#### Via API (recomendado):

```bash
# No seu VPS, execute:
curl -X POST "https://graph.facebook.com/v21.0/SEU_WABA_ID/subscribed_apps" \
  -H "Authorization: Bearer SEU_TOKEN_TEMPORARIO" \
  -d "subscribed_fields[]=messages"
```

**Onde:**
- `SEU_WABA_ID`: ID da conta WhatsApp Business (ex: 2898791313645761)
- `SEU_TOKEN_TEMPORARIO`: Token de acesso gerado no próximo passo

**Resposta esperada:**
```json
{"success":true}
```

**Encontrar o WABA ID:**
- Vá em WhatsApp → Primeiros passos
- Procure "WhatsApp Business Account ID" ou similar
- Anote o número

---

### PASSO 7: Gerar Token de Acesso

#### 7.1 - Token Temporário (24 horas - para testes)

1. Vá em **WhatsApp → Primeiros passos**
2. Procure **"Token de acesso temporário"**
3. Clique em **"Gerar token"**
4. **Copie o token** (algo como `EAAMQyJvE32EB...`)

#### 7.2 - Token Permanente (Sistema em Produção)

**Opção A: System User (Recomendado - nunca expira)**

1. Vá em **Configurações → Usuários**
2. Clique em **"Adicionar usuários do sistema"**
3. Crie um System User (ex: "Bot WhatsApp")
4. Clique no usuário criado
5. Clique em **"Gerar novo token"**
6. Selecione seu **App**
7. Marque permissões:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
8. Clique em **"Gerar token"**
9. **COPIE E GUARDE** (não expira!)

**Opção B: Page Access Token (60 dias, renovável)**

1. No app, vá em **Ferramentas → Token de Acesso**
2. Gere token de longa duração
3. Renove a cada 60 dias

---

### PASSO 8: Atualizar .env no Servidor

```bash
# No VPS
sudo nano /home/whatsapp-webhook/.env
```

**Atualize:**
```env
WHATSAPP_TOKEN=SEU_TOKEN_PERMANENTE_AQUI
WHATSAPP_PHONE_ID=SEU_PHONE_NUMBER_ID_AQUI
```

**Onde encontrar Phone Number ID:**
- WhatsApp → Primeiros passos
- Seção "Número de telefone"
- Copie o ID (ex: 871455159388695)

**Salvar e reiniciar:**
```bash
# Ctrl+O, Enter, Ctrl+X

# Reiniciar aplicação
sudo pm2 restart whatsapp-webhook
```

---

### PASSO 9: Adicionar Números de Teste

No modo de desenvolvimento, só números cadastrados podem testar.

1. Vá em **WhatsApp → Primeiros passos**
2. Procure seção **"Números de telefone"** ou **"To:"**
3. Clique em **"Gerenciar números de telefone"**
4. Adicione números no formato: `+55 11 98765-4321`
5. Salve

**Limite:** Até 5 números em modo gratuito

---

### PASSO 10: Testar Webhook

#### 10.1 - Verificar status no Facebook

1. WhatsApp → Configuração → Webhook
2. Deve estar **verificado** ✅
3. Campo `messages` deve estar **inscrito** ✅

#### 10.2 - Testar envio de mensagem

1. No WhatsApp do seu celular (número cadastrado)
2. Adicione o número de teste aos contatos: `+1 555 184 2523`
3. Envie: **"oi"**

#### 10.3 - Ver logs no servidor

```bash
sudo pm2 logs whatsapp-webhook
```

**Deve aparecer:**
```
Webhook recebido: {...}
Mensagem de 5511999999999: oi
✅ ATIVAÇÃO: Criando nova sessão para 5511999999999
📤 ENVIANDO mensagem de boas-vindas para 5511999999999
Mensagem enviada: {...}
✅ Mensagem enviada com sucesso para 5511999999999
```

**No WhatsApp:** Você deve receber a mensagem da Julia!

---

## 🎉 Configuração Concluída!

Se recebeu a mensagem de boas-vindas, está TUDO funcionando! ✅

---

## 🔄 Modo Produção (App Live)

Para funcionar com QUALQUER número (não apenas teste):

### PASSO 11: Verificar Número Próprio

1. WhatsApp → Números de telefone
2. Clique em **"Adicionar número de telefone"**
3. Escolha: **"Usar meu próprio número"**
4. Digite o número (deve ser um chip ativo)
5. Facebook envia código de verificação (SMS ou ligação)
6. Digite o código
7. Número verificado! ✅

**ATENÇÃO:** Esse número sai do WhatsApp normal e funciona APENAS pela API!

### PASSO 12: Enviar App para Revisão

1. Configure políticas de privacidade
2. Preencha informações obrigatórias
3. Envie para revisão do Facebook
4. Aguarde aprovação (1-3 dias úteis)

### PASSO 13: Colocar em Modo Live

1. **Configurações → Básico**
2. Mude de **"Desenvolvimento"** para **"Ativo"** / **"Live"**
3. Confirme

**Pronto!** Agora QUALQUER número pode conversar com a Julia!

---

## 🐛 Troubleshooting

### Webhook não verifica

**Erro:** "Token de verificação não corresponde"

**Solução:**
```bash
# Verificar token no .env
cat /home/whatsapp-webhook/.env | grep VERIFY_TOKEN

# Deve ser exatamente: meu_token_secreto_12345
```

### Mensagens não chegam no servidor

**Verificar:**
1. Campo `messages` está inscrito? ✅
2. App está inscrito no WABA? (executar curl do PASSO 6)
3. Número está na lista de teste?
4. Logs mostram algo? `sudo pm2 logs`

**Solução:**
```bash
# Re-inscrever app
curl -X POST "https://graph.facebook.com/v21.0/SEU_WABA_ID/subscribed_apps" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d "subscribed_fields[]=messages"
```

### Token expirou

**Erro:** "Error validating access token"

**Solução:**
- Gerar novo token (PASSO 7)
- Atualizar `.env`
- Reiniciar: `sudo pm2 restart whatsapp-webhook`

---

## 📊 Estrutura Final

```
Facebook Developers
└── App: "WhatsApp Bot Julia"
    ├── WhatsApp Product
    │   ├── Webhook: https://mudancas.duckdns.org/webhook ✅
    │   ├── Fields: messages ✅
    │   ├── Phone Number: +1 555 184 2523 (teste)
    │   └── Access Token: EAAMQy... (permanente)
    ├── Settings
    │   ├── Basic: App ID, App Secret
    │   └── Advanced: App Mode (Development/Live)
    └── Business Account
        └── WABA ID: 2898791313645761
```

---

## 📝 Informações para Guardar

**SEMPRE anote e guarde em local seguro:**

```
App ID: __________________
App Secret: __________________
WABA ID: __________________
Phone Number ID: __________________
Access Token (permanente): __________________
Verify Token: meu_token_secreto_12345
Webhook URL: https://mudancas.duckdns.org/webhook
```

---

## 🔐 Segurança

- **NUNCA** compartilhe tokens de acesso
- **NUNCA** exponha App Secret
- Use System User Token em produção
- Renove tokens regularmente
- Monitore logs de acesso

---

**Próximo:** [04-ESTRUTURA-CODIGO.md](04-ESTRUTURA-CODIGO.md) - Entenda como o código funciona
