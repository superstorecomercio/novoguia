# 📦 PACOTE COMPLETO - DOCUMENTAÇÃO WHATSAPP BOT JULIA

## ✅ O QUE ESTÁ INCLUÍDO NESTE PACOTE

Este pacote contém **TUDO** que você precisa para restaurar, modificar ou entender o sistema completo.

---

## 📂 ESTRUTURA DO PACOTE

```
whatsapp-docs/
├── README.md                      # Índice geral (COMECE AQUI!)
├── 01-VISAO-GERAL.md             # Arquitetura e componentes
├── 02-INSTALACAO-SERVIDOR.md     # Instalação passo a passo no VPS
├── 03-CONFIGURACAO-FACEBOOK.md   # Config do WhatsApp Business API
├── 04-ESTRUTURA-CODIGO.md        # Como o código funciona
├── 05-FLUXO-CONVERSACIONAL.md    # Perguntas e respostas do bot
├── 06-INTEGRACAO-OPENAI.md       # Cálculo com IA
├── 07-INTEGRACAO-SUPABASE.md     # Banco de dados
├── 08-MANUTENCAO.md              # Comandos diários e troubleshooting
├── 09-RESTAURACAO.md             # Como restaurar em novo servidor
└── codigo/                        # TODOS os arquivos de código
    ├── server.js                  # Servidor Express (COMENTADO)
    ├── message-handler.js         # Lógica do bot (COMENTADO)
    ├── sessions.js                # Gerenciador de sessões (COMENTADO)
    ├── whatsapp.js                # Cliente WhatsApp API (COMENTADO)
    ├── openai-service.js          # Cliente OpenAI (COMENTADO)
    ├── supabase-service.js        # Cliente Supabase (COMENTADO)
    ├── .env.example               # Template de variáveis
    └── package.json               # Dependências NPM
```

---

## 🚀 GUIA RÁPIDO DE USO

### CENÁRIO 1: Restaurar Sistema em Novo Servidor

```bash
# 1. Baixe este pacote no novo servidor
scp whatsapp-docs-completo.tar.gz root@NOVO_IP:/home/

# 2. Extraia
cd /home
tar -xzf whatsapp-docs-completo.tar.gz
cd whatsapp-docs

# 3. Siga este documento NA ORDEM:
cat 09-RESTAURACAO.md
```

### CENÁRIO 2: Entender Como Funciona

```bash
# 1. Leia a visão geral
cat 01-VISAO-GERAL.md

# 2. Veja a estrutura do código
cat 04-ESTRUTURA-CODIGO.md

# 3. Explore os arquivos comentados
cd codigo/
cat server.js  # Todos os arquivos têm comentários detalhados!
```

### CENÁRIO 3: Fazer Manutenção

```bash
# Comandos úteis do dia a dia
cat 08-MANUTENCAO.md
```

### CENÁRIO 4: Modificar Funcionalidade

```bash
# 1. Entenda o fluxo
cat 05-FLUXO-CONVERSACIONAL.md

# 2. Veja o código específico
cd codigo/
nano message-handler.js  # Altere as perguntas aqui

# 3. Deploy
scp message-handler.js root@38.242.148.169:/home/whatsapp-webhook/
ssh root@38.242.148.169 "pm2 restart whatsapp-webhook"
```

---

## 📋 TODOS OS COMANDOS EXECUTADOS NO SERVIDOR

### Instalação do Zero (Resumo Completo)

```bash
# ═══════════════════════════════════════════════════════════════
# FASE 1: ATUALIZAR SISTEMA
# ═══════════════════════════════════════════════════════════════
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw

# ═══════════════════════════════════════════════════════════════
# FASE 2: INSTALAR NODE.JS
# ═══════════════════════════════════════════════════════════════
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verificar: v20.x.x
npm --version   # Verificar: 10.x.x

# ═══════════════════════════════════════════════════════════════
# FASE 3: INSTALAR PM2
# ═══════════════════════════════════════════════════════════════
sudo npm install -g pm2
pm2 --version

# ═══════════════════════════════════════════════════════════════
# FASE 4: INSTALAR NGINX
# ═══════════════════════════════════════════════════════════════
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx

# ═══════════════════════════════════════════════════════════════
# FASE 5: CONFIGURAR FIREWALL
# ═══════════════════════════════════════════════════════════════
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status

# ═══════════════════════════════════════════════════════════════
# FASE 6: CRIAR DIRETÓRIO DA APLICAÇÃO
# ═══════════════════════════════════════════════════════════════
cd /home
sudo mkdir -p whatsapp-webhook
cd whatsapp-webhook
sudo npm init -y

# ═══════════════════════════════════════════════════════════════
# FASE 7: INSTALAR DEPENDÊNCIAS
# ═══════════════════════════════════════════════════════════════
sudo npm install express body-parser axios dotenv openai @supabase/supabase-js

# ═══════════════════════════════════════════════════════════════
# FASE 8: CRIAR ARQUIVO .env
# ═══════════════════════════════════════════════════════════════
sudo nano .env
# Cole o conteúdo de codigo/.env.example (substitua valores reais)

# ═══════════════════════════════════════════════════════════════
# FASE 9: COPIAR ARQUIVOS DE CÓDIGO
# ═══════════════════════════════════════════════════════════════
# Copie todos os arquivos da pasta codigo/ desta documentação para:
# /home/whatsapp-webhook/

# ═══════════════════════════════════════════════════════════════
# FASE 10: CONFIGURAR NGINX
# ═══════════════════════════════════════════════════════════════
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# Editar nginx.conf
sudo nano /etc/nginx/nginx.conf
# Adicione dentro do bloco http { }: include /etc/nginx/sites-enabled/*;

# Criar configuração do site
sudo nano /etc/nginx/sites-available/whatsapp-webhook
# Cole a configuração do arquivo 02-INSTALACAO-SERVIDOR.md

# Ativar site
sudo ln -s /etc/nginx/sites-available/whatsapp-webhook /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# ═══════════════════════════════════════════════════════════════
# FASE 11: INSTALAR SSL (LET'S ENCRYPT)
# ═══════════════════════════════════════════════════════════════
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d mudancas.duckdns.org
# Email: seu@email.com
# Termos: Y
# Newsletter: N

# ═══════════════════════════════════════════════════════════════
# FASE 12: INICIAR APLICAÇÃO COM PM2
# ═══════════════════════════════════════════════════════════════
cd /home/whatsapp-webhook
sudo pm2 start server.js --name whatsapp-webhook
sudo pm2 startup
# Executar o comando que PM2 mostrar
sudo pm2 save
sudo pm2 status

# ═══════════════════════════════════════════════════════════════
# FASE 13: TESTAR
# ═══════════════════════════════════════════════════════════════
curl https://mudancas.duckdns.org/
# Deve retornar: "WhatsApp Webhook Bot está rodando! ✅"

sudo pm2 logs whatsapp-webhook
# Deve mostrar: Servidor rodando na porta 3000
```

---

## 🔐 CREDENCIAIS E TOKENS (Template)

```env
# Anote seus valores reais aqui:

# WhatsApp
WHATSAPP_TOKEN=EAAMQy...
WHATSAPP_PHONE_ID=871455159388695
WABA_ID=2898791313645761

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_KEY=eyJhbG...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Servidor
VPS_IP=38.242.148.169
DOMAIN=mudancas.duckdns.org
VERIFY_TOKEN=meu_token_secreto_12345
```

---

## 📞 COMANDOS MAIS USADOS

```bash
# Ver status do bot
sudo pm2 status

# Ver logs em tempo real
sudo pm2 logs whatsapp-webhook

# Reiniciar bot
sudo pm2 restart whatsapp-webhook

# Parar bot
sudo pm2 stop whatsapp-webhook

# Editar código
sudo nano /home/whatsapp-webhook/message-handler.js

# Ver logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Renovar SSL
sudo certbot renew

# Testar webhook
curl https://mudancas.duckdns.org/

# Backup do código
cd /home/whatsapp-webhook
sudo tar -czf backup-$(date +%Y%m%d).tar.gz *.js .env
```

---

## 🗂️ LOCALIZAÇÃO DOS ARQUIVOS NO SERVIDOR

```
VPS Ubuntu 24.04 (IP: 38.242.148.169)

/home/whatsapp-webhook/        ← Aplicação principal
├── server.js
├── message-handler.js
├── sessions.js
├── whatsapp.js
├── openai-service.js
├── supabase-service.js
├── .env                        ← CREDENCIAIS (não versionar!)
├── package.json
├── package-lock.json
└── node_modules/

/etc/nginx/
├── nginx.conf
├── sites-available/
│   └── whatsapp-webhook
└── sites-enabled/
    └── whatsapp-webhook → ../sites-available/whatsapp-webhook

/etc/letsencrypt/
└── live/
    └── mudancas.duckdns.org/
        ├── fullchain.pem
        └── privkey.pem

/root/.pm2/
├── logs/
│   ├── whatsapp-webhook-out.log
│   └── whatsapp-webhook-error.log
└── pm2.pid
```

---

## 🔄 FLUXO COMPLETO DO SISTEMA

```
1. Cliente envia "oi" no WhatsApp (+55 11 xxxxx-xxxx)
   ↓
2. Facebook recebe a mensagem
   ↓
3. Facebook envia POST para https://mudancas.duckdns.org/webhook
   ↓
4. Nginx (porta 443) recebe e faz proxy para Node.js (porta 3000)
   ↓
5. server.js recebe o webhook
   ↓
6. server.js extrai a mensagem e chama processarMensagem()
   ↓
7. message-handler.js processa:
   - Verifica se tem sessão (sessions.js)
   - Se não tem e é palavra de ativação, cria sessão
   - Faz pergunta sequencial baseada na etapa atual
   - Usa whatsapp.js para enviar resposta
   ↓
8. Cliente responde → volta para passo 1 (loop)
   ↓
9. Após todas as perguntas respondidas:
   - openai-service.js calcula orçamento
   - supabase-service.js salva no banco
   - whatsapp.js envia resultado final
   - sessions.js limpa a sessão
   ↓
10. Cliente recebe orçamento completo!
```

---

## 🎯 ORDEM DAS PERGUNTAS DO BOT

1. **Origem** - "De onde você está saindo?"
2. **Destino** - "Para onde você está se mudando?"
3. **Tipo de imóvel** - Lista: Kitnet, 1q, 2q, 3+, Comercial
4. **Elevador?** - Botões: Sim / Não
5. **Embalagem?** - Botões: Sim, completa / Não preciso
6. **Nome** - "Qual é o seu nome?"
7. **Email** - "Qual o seu e-mail?"
8. **Data estimada** - "Qual a data da mudança?" (opcional)
9. **Lista de objetos?** - Botões: Sim, quero / Não precisa
10. **Texto da lista** - "Descreva os objetos" (se respondeu sim)

---

## 🐛 TROUBLESHOOTING RÁPIDO

| Problema | Solução Rápida |
|----------|----------------|
| Bot não responde | `sudo pm2 restart whatsapp-webhook` |
| Erro 502 | `sudo systemctl restart nginx && sudo pm2 restart whatsapp-webhook` |
| SSL expirou | `sudo certbot renew --force-renewal` |
| Token inválido | Gerar novo token no Facebook, atualizar `.env`, reiniciar PM2 |
| Sessão travada | `sudo pm2 restart whatsapp-webhook` (limpa memória) |
| Webhook não verifica | Conferir `VERIFY_TOKEN` no `.env` |
| Mensagens não chegam | Verificar inscrição do app: `curl -X POST ...subscribed_apps` |

---

## 📚 DOCUMENTOS POR FINALIDADE

**Quero instalar tudo do zero:**
→ 02-INSTALACAO-SERVIDOR.md + 03-CONFIGURACAO-FACEBOOK.md

**Quero entender como funciona:**
→ 01-VISAO-GERAL.md + 04-ESTRUTURA-CODIGO.md + codigo/

**Quero restaurar em novo servidor:**
→ 09-RESTAURACAO.md

**Quero fazer manutenção:**
→ 08-MANUTENCAO.md

**Quero modificar perguntas:**
→ 05-FLUXO-CONVERSACIONAL.md + codigo/message-handler.js

**Quero alterar cálculo de preços:**
→ 06-INTEGRACAO-OPENAI.md + codigo/openai-service.js

**Quero mudar salvamento no banco:**
→ 07-INTEGRACAO-SUPABASE.md + codigo/supabase-service.js

---

## 🎉 SISTEMA PRONTO!

Com esta documentação você tem:
✅ Todos os comandos executados
✅ Todos os arquivos de código comentados
✅ Guia completo de instalação
✅ Guia completo de restauração
✅ Explicação detalhada de como tudo funciona
✅ Troubleshooting para problemas comuns

**Boa sorte com o projeto!** 🚀

---

📅 **Documentação gerada em:** 25/11/2025
📦 **Versão do sistema:** 1.0
👨‍💻 **Bot:** Julia - Assistente de Cotação de Mudanças
