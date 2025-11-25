# 02 - Instalação Completa do Servidor

## 🎯 Objetivo

Este guia permite instalar TODO o sistema do zero em um novo VPS Ubuntu 24.04.

---

## ✅ Pré-requisitos

- VPS com Ubuntu 24.04
- Acesso root via SSH
- IP público (ex: 38.242.148.169)
- Domínio configurado (recomendado: DuckDNS)

---

## 📋 Checklist de Instalação

- [ ] Atualizar sistema
- [ ] Instalar Node.js
- [ ] Instalar Nginx
- [ ] Configurar Firewall (UFW)
- [ ] Configurar domínio (DuckDNS)
- [ ] Instalar SSL (Let's Encrypt)
- [ ] Instalar PM2
- [ ] Deploy da aplicação
- [ ] Testar funcionamento

---

## 🚀 Passo a Passo Detalhado

### PASSO 1: Conectar via SSH

```bash
ssh root@38.242.148.169
```

Ou se usar usuário não-root:
```bash
ssh usuario@38.242.148.169
```

---

### PASSO 2: Atualizar Sistema

```bash
# Atualizar lista de pacotes
sudo apt update

# Fazer upgrade de pacotes instalados
sudo apt upgrade -y

# Instalar dependências básicas
sudo apt install -y curl wget git ufw
```

**Tempo estimado:** 2-5 minutos

---

### PASSO 3: Instalar Node.js 20.x LTS

```bash
# Adicionar repositório oficial do Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js e npm
sudo apt install -y nodejs

# Verificar versões instaladas
node --version  # Deve mostrar v20.x.x
npm --version   # Deve mostrar 10.x.x
```

**Versões esperadas:**
- Node.js: v20.11.0 ou superior
- NPM: 10.2.4 ou superior

---

### PASSO 4: Instalar PM2 (Process Manager)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Verificar instalação
pm2 --version
```

**PM2** mantém a aplicação rodando 24/7 e reinicia automaticamente em caso de erro.

---

### PASSO 5: Instalar Nginx

```bash
# Instalar Nginx
sudo apt install nginx -y

# Verificar se está rodando
sudo systemctl status nginx

# Habilitar inicialização automática
sudo systemctl enable nginx
```

**Testar:** Acesse `http://SEU_IP` no navegador. Deve mostrar página padrão do Nginx.

---

### PASSO 6: Configurar Firewall (UFW)

```bash
# Permitir SSH (IMPORTANTE! Não se tranque fora!)
sudo ufw allow OpenSSH

# Permitir HTTP e HTTPS
sudo ufw allow 'Nginx Full'

# Ativar firewall
sudo ufw --force enable

# Verificar status
sudo ufw status
```

**Saída esperada:**
```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
```

---

### PASSO 7: Configurar Domínio no DuckDNS

#### 7.1 - Criar conta no DuckDNS

1. Acesse: https://www.duckdns.org/
2. Faça login com Google/GitHub
3. Crie um subdomínio (ex: `mudancas`)
4. Anote o subdomínio: `mudancas.duckdns.org`

#### 7.2 - Configurar IP no DuckDNS

1. No painel do DuckDNS, coloque seu IP: `38.242.148.169`
2. Clique em "update ip"
3. Aguarde 1-2 minutos para propagação

#### 7.3 - Testar DNS

```bash
# Testar resolução DNS
ping mudancas.duckdns.org

# Deve responder com seu IP
```

---

### PASSO 8: Criar Diretórios e Estrutura

```bash
# Criar diretório da aplicação
cd /home
sudo mkdir -p whatsapp-webhook
cd whatsapp-webhook

# Inicializar projeto Node.js
sudo npm init -y
```

---

### PASSO 9: Instalar Dependências Node.js

```bash
cd /home/whatsapp-webhook

# Instalar pacotes necessários
sudo npm install express body-parser axios dotenv openai @supabase/supabase-js
```

**Pacotes instalados:**
- `express` - Framework web
- `body-parser` - Parser de JSON
- `axios` - Cliente HTTP
- `dotenv` - Variáveis de ambiente
- `openai` - Cliente OpenAI
- `@supabase/supabase-js` - Cliente Supabase

---

### PASSO 10: Criar Arquivo .env

```bash
sudo nano /home/whatsapp-webhook/.env
```

**Cole este conteúdo (substitua os valores reais):**

```env
PORT=3000
VERIFY_TOKEN=meu_token_secreto_12345

# WhatsApp API
WHATSAPP_TOKEN=SEU_TOKEN_AQUI
WHATSAPP_PHONE_ID=SEU_PHONE_ID_AQUI

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_KEY=sua_service_key_aqui

# OpenAI
OPENAI_API_KEY=sk-proj-sua_key_aqui
```

**Salvar:** Ctrl+O, Enter, Ctrl+X

---

### PASSO 11: Criar Arquivos da Aplicação

Crie os arquivos principais (ver pasta `codigo/` na documentação para código completo):

```bash
# Criar arquivos vazios primeiro
sudo touch server.js
sudo touch message-handler.js
sudo touch sessions.js
sudo touch whatsapp.js
sudo touch openai-service.js
sudo touch supabase-service.js
```

**Copie o código de cada arquivo da pasta `codigo/` desta documentação.**

---

### PASSO 12: Configurar Nginx

#### 12.1 - Criar diretórios de configuração

```bash
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled
```

#### 12.2 - Editar nginx.conf

```bash
sudo nano /etc/nginx/nginx.conf
```

Procure o bloco `http {` e **ANTES da última chave `}`**, adicione:

```nginx
include /etc/nginx/sites-enabled/*;
```

**Salvar:** Ctrl+O, Enter, Ctrl+X

#### 12.3 - Criar configuração do site

```bash
sudo nano /etc/nginx/sites-available/whatsapp-webhook
```

**Cole este conteúdo:**

```nginx
server {
    listen 80;
    server_name mudancas.duckdns.org;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Salvar:** Ctrl+O, Enter, Ctrl+X

#### 12.4 - Ativar configuração

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/whatsapp-webhook /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

### PASSO 13: Instalar Certbot (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Gerar certificado SSL
sudo certbot --nginx -d mudancas.duckdns.org
```

**Durante instalação, responda:**
- Email: `seu@email.com`
- Termos: `Y` (yes)
- Newsletter: `N` (no)

**Certbot vai:**
1. Validar domínio
2. Gerar certificado
3. Configurar Nginx automaticamente para HTTPS

---

### PASSO 14: Iniciar Aplicação com PM2

```bash
cd /home/whatsapp-webhook

# Iniciar aplicação
sudo pm2 start server.js --name whatsapp-webhook

# Configurar para iniciar automaticamente no boot
sudo pm2 startup

# Executar o comando que o PM2 mostrar (algo como):
# sudo env PATH=... pm2 startup systemd -u root --hp /root

# Salvar configuração
sudo pm2 save

# Ver status
sudo pm2 status
```

**Saída esperada:**
```
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ whatsapp-webhook   │ fork     │ 0    │ online    │ 0%       │ 50.0mb   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

---

### PASSO 15: Testar Instalação

#### Teste 1: Health Check

```bash
curl https://mudancas.duckdns.org/
```

**Resposta esperada:**
```
WhatsApp Webhook Bot está rodando! ✅
```

#### Teste 2: Ver Logs

```bash
sudo pm2 logs whatsapp-webhook
```

**Deve mostrar:**
```
🚀 Servidor rodando na porta 3000
📱 Webhook URL: https://mudancas.duckdns.org/webhook
```

---

## ✅ Checklist de Verificação Final

Antes de configurar o Facebook, verifique:

- [ ] `https://mudancas.duckdns.org/` retorna mensagem de sucesso
- [ ] Certificado SSL válido (cadeado verde no navegador)
- [ ] PM2 mostra status "online"
- [ ] Logs não mostram erros
- [ ] Firewall permite portas 80 e 443

---

## 🔧 Comandos Úteis

### PM2
```bash
# Ver status
sudo pm2 status

# Ver logs
sudo pm2 logs whatsapp-webhook

# Reiniciar
sudo pm2 restart whatsapp-webhook

# Parar
sudo pm2 stop whatsapp-webhook

# Deletar
sudo pm2 delete whatsapp-webhook
```

### Nginx
```bash
# Testar configuração
sudo nginx -t

# Reiniciar
sudo systemctl restart nginx

# Ver logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Certificado SSL
```bash
# Renovar manualmente
sudo certbot renew

# Testar renovação
sudo certbot renew --dry-run
```

---

## 🐛 Troubleshooting

### Erro: "Port 3000 already in use"

```bash
# Ver o que está usando a porta
sudo lsof -i :3000

# Matar processo
sudo kill -9 PID
```

### Erro: "nginx: [emerg] bind() to 0.0.0.0:80 failed"

```bash
# Verificar o que está usando porta 80
sudo netstat -tulpn | grep :80

# Parar Apache se estiver instalado
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### Erro: SSL não funciona

```bash
# Ver status do certificado
sudo certbot certificates

# Renovar forçado
sudo certbot renew --force-renewal
```

---

## 📊 Estrutura de Diretórios Final

```
/home/whatsapp-webhook/
├── node_modules/
├── .env
├── package.json
├── package-lock.json
├── server.js
├── message-handler.js
├── sessions.js
├── whatsapp.js
├── openai-service.js
└── supabase-service.js

/etc/nginx/
├── nginx.conf
├── sites-available/
│   └── whatsapp-webhook
└── sites-enabled/
    └── whatsapp-webhook -> ../sites-available/whatsapp-webhook

/etc/letsencrypt/
├── live/
│   └── mudancas.duckdns.org/
│       ├── fullchain.pem
│       └── privkey.pem
└── renewal/
    └── mudancas.duckdns.org.conf
```

---

## 🎉 Servidor Instalado com Sucesso!

Agora vá para **[03-CONFIGURACAO-FACEBOOK.md](03-CONFIGURACAO-FACEBOOK.md)** para configurar a API do WhatsApp.

---

## 📝 Notas Importantes

1. **Backup do .env:** Sempre faça backup do arquivo `.env` com as credenciais
2. **Renovação SSL:** Certbot renova automaticamente a cada 60 dias
3. **Atualizações:** Execute `sudo apt update && sudo apt upgrade` mensalmente
4. **Monitoramento:** Configure alertas se o PM2 parar de responder
5. **Logs:** Logs do PM2 ficam em `/root/.pm2/logs/`
