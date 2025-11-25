# 📚 Documentação Completa - WhatsApp Bot API Julia

**Sistema de Cotação Automatizada de Mudanças via WhatsApp**

---

## 📖 Sobre Esta Documentação

Esta documentação completa contém TODO o processo de criação, configuração e deployment do bot Julia - um assistente de WhatsApp que automatiza o processo de cotação de mudanças residenciais e comerciais.

**Última atualização:** 25 de Novembro de 2025

---

## 🎯 O que é o Sistema

**Julia** é um bot conversacional via WhatsApp que:

✅ Coleta informações sobre mudanças (origem, destino, tipo de imóvel, etc.)  
✅ Calcula orçamento usando Inteligência Artificial (OpenAI)  
✅ Salva dados no banco (Supabase/PostgreSQL)  
✅ Notifica empresas parceiras automaticamente  
✅ Funciona 24/7 sem intervenção humana  

---

## 📋 Índice da Documentação

### 📘 Documentos de Referência

1. **[01-VISAO-GERAL.md](01-VISAO-GERAL.md)**
   - Arquitetura completa do sistema
   - Fluxo de dados
   - Componentes e tecnologias

2. **[02-INSTALACAO-SERVIDOR.md](02-INSTALACAO-SERVIDOR.md)**
   - Instalação do zero no VPS Ubuntu 24.04
   - Passo a passo completo
   - Configuração de Nginx, SSL, PM2

3. **[03-CONFIGURACAO-FACEBOOK.md](03-CONFIGURACAO-FACEBOOK.md)**
   - Criação de app no Facebook Developers
   - Configuração do WhatsApp Business API
   - Geração de tokens e credenciais

4. **[04-ESTRUTURA-CODIGO.md](04-ESTRUTURA-CODIGO.md)**
   - Explicação detalhada de cada arquivo
   - Como o código funciona
   - Funções e responsabilidades

5. **[05-FLUXO-CONVERSACIONAL.md](05-FLUXO-CONVERSACIONAL.md)**
   - Fluxo completo de perguntas
   - Validações e tratamento de erros
   - Estados da conversa

6. **[06-INTEGRACAO-OPENAI.md](06-INTEGRACAO-OPENAI.md)**
   - Como funciona o cálculo com IA
   - Prompt engineering
   - Regras de precificação

7. **[07-INTEGRACAO-SUPABASE.md](07-INTEGRACAO-SUPABASE.md)**
   - Estrutura do banco de dados
   - Função SQL de salvamento
   - Notificação de empresas

8. **[08-MANUTENCAO.md](08-MANUTENCAO.md)**
   - Comandos úteis diários
   - Monitoramento e logs
   - Troubleshooting comum

9. **[09-RESTAURACAO.md](09-RESTAURACAO.md)**
   - Como restaurar sistema em novo servidor
   - Checklist completo
   - Backup e recuperação

### 💻 Código Fonte Comentado

10. **[codigo/](codigo/)**
    - Todos os arquivos com comentários detalhados
    - `server.js` - Servidor Express
    - `message-handler.js` - Lógica do bot
    - `sessions.js` - Gerenciador de sessões
    - `whatsapp.js` - Cliente WhatsApp API
    - `openai-service.js` - Cliente OpenAI
    - `supabase-service.js` - Cliente Supabase
    - `.env.example` - Template de variáveis

---

## 🚀 Quick Start

### Para Instalar Tudo do Zero:

```bash
# 1. Leia primeiro a visão geral
cat 01-VISAO-GERAL.md

# 2. Siga o guia de instalação
cat 02-INSTALACAO-SERVIDOR.md

# 3. Configure o Facebook
cat 03-CONFIGURACAO-FACEBOOK.md

# 4. Deploy dos arquivos de código
cp codigo/* /home/whatsapp-webhook/
```

### Para Entender o Sistema:

1. Comece com **01-VISAO-GERAL.md** (arquitetura)
2. Leia **04-ESTRUTURA-CODIGO.md** (como funciona)
3. Veja **05-FLUXO-CONVERSACIONAL.md** (conversa)

### Para Fazer Manutenção:

- Consulte **08-MANUTENCAO.md** para comandos do dia a dia

### Para Restaurar em Novo Servidor:

- Siga **09-RESTAURACAO.md** passo a passo

---

## 🏗️ Tecnologias Utilizadas

| Componente | Tecnologia | Versão |
|------------|-----------|---------|
| Sistema Operacional | Ubuntu | 24.04 LTS |
| Runtime | Node.js | 20.x LTS |
| Servidor Web | Nginx | 1.24+ |
| SSL/TLS | Let's Encrypt | (Certbot) |
| Process Manager | PM2 | Latest |
| Framework Web | Express.js | 4.x |
| WhatsApp API | Facebook Cloud API | v21.0 |
| Inteligência Artificial | OpenAI GPT-4o-mini | Latest |
| Banco de Dados | Supabase (PostgreSQL) | Latest |
| DNS | DuckDNS | - |

---

## 📊 Dados do Sistema Atual

### Servidor
- **IP:** 38.242.148.169
- **Domínio:** mudancas.duckdns.org
- **Sistema:** Ubuntu 24.04
- **Webhook URL:** https://mudancas.duckdns.org/webhook

### WhatsApp
- **Phone Number ID:** 871455159388695
- **WABA ID:** 2898791313645761
- **Número de teste:** +1 555 184 2523

### Estrutura de Arquivos
```
VPS: /home/whatsapp-webhook/
├── server.js
├── message-handler.js
├── sessions.js
├── whatsapp.js
├── openai-service.js
├── supabase-service.js
├── .env (credenciais)
└── package.json

Config: /etc/nginx/sites-available/whatsapp-webhook
SSL: /etc/letsencrypt/live/mudancas.duckdns.org/
PM2: ~/.pm2/
```

---

## 🔄 Fluxo Simplificado

```
1. Cliente envia "oi" no WhatsApp
   ↓
2. Facebook recebe e envia para webhook
   ↓
3. Nginx proxy para Node.js (porta 3000)
   ↓
4. Bot processa e faz perguntas sequenciais
   ↓
5. Após coletar tudo, chama OpenAI para calcular
   ↓
6. Salva no Supabase e notifica empresas
   ↓
7. Envia resultado para cliente
   ↓
8. Limpa sessão e aguarda próximo "oi"
```

---

## 📈 Ordem das Perguntas do Bot

1. **Origem** - De onde será a mudança?
2. **Destino** - Para onde será a mudança?
3. **Tipo de imóvel** - Kitnet, 1 quarto, 2 quartos, 3+, comercial
4. **Elevador?** - Sim/Não
5. **Embalagem?** - Sim, completa / Não precisa
6. **Nome** - Qual é o seu nome?
7. **Email** - Qual o seu e-mail?
8. **Data estimada** - Qual a data? (opcional)
9. **Lista de objetos?** - Quer enviar lista? Sim/Não
10. **Texto da lista** - Descreva objetos (se sim)

---

## 🔐 Segurança

- ✅ HTTPS obrigatório (Let's Encrypt)
- ✅ Tokens de acesso em variáveis de ambiente
- ✅ Firewall UFW ativo
- ✅ Validação de webhook token
- ✅ Service Role Key do Supabase

---

## 🆘 Ajuda Rápida

### Verificar se está rodando:
```bash
sudo pm2 status
curl https://mudancas.duckdns.org/
```

### Ver logs em tempo real:
```bash
sudo pm2 logs whatsapp-webhook
```

### Reiniciar bot:
```bash
sudo pm2 restart whatsapp-webhook
```

### Testar webhook:
Envie "oi" do WhatsApp cadastrado para +1 555 184 2523

---

## 📞 Palavras-chave de Ativação

O bot responde quando recebe:
- oi, olá, ola, hey, hi, hello
- orçamento, orcamento, cotação, cotacao
- mudança, mudanca, mudar
- iniciar, começar, comecar, start
- nova cotação, novo orçamento

**Fora dessas palavras, o bot NÃO responde (evita spam)**

---

## 🎨 Personalização

### Para Alterar Perguntas:
Edite `message-handler.js` e `sessions.js`

### Para Mudar Cálculo de Preços:
Edite `openai-service.js` (prompt da IA)

### Para Alterar Salvamento:
Edite `supabase-service.js`

### Para Mudar Mensagens:
Edite textos em `message-handler.js`

---

## 📝 Logs Importantes

### Logs da Aplicação (PM2):
```bash
/root/.pm2/logs/whatsapp-webhook-out.log
/root/.pm2/logs/whatsapp-webhook-error.log
```

### Logs do Nginx:
```bash
/var/log/nginx/access.log
/var/log/nginx/error.log
```

### Logs do Certbot (SSL):
```bash
/var/log/letsencrypt/letsencrypt.log
```

---

## 🔄 Atualizações e Versões

### Como Atualizar Código:

1. **Editar arquivo no servidor:**
```bash
sudo nano /home/whatsapp-webhook/message-handler.js
```

2. **Reiniciar aplicação:**
```bash
sudo pm2 restart whatsapp-webhook
```

3. **Ver se funcionou:**
```bash
sudo pm2 logs whatsapp-webhook
```

### Backup Antes de Atualizar:
```bash
cd /home/whatsapp-webhook
sudo tar -czf backup-$(date +%Y%m%d).tar.gz *.js .env
```

---

## 🐛 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Bot não responde | Verificar PM2, logs, webhook inscrito |
| Erro 502 Bad Gateway | Reiniciar PM2 e Nginx |
| SSL expirado | `sudo certbot renew` |
| Token expirado | Gerar novo token, atualizar .env |
| Sessão travada | Reiniciar PM2 (limpa memória) |

---

## 📦 Dependências NPM

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "body-parser": "^1.20.2",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1",
    "openai": "^4.20.0",
    "@supabase/supabase-js": "^2.38.0"
  }
}
```

---

## 📅 Histórico

- **25/11/2025** - Versão 1.0 inicial completa
  - Sistema instalado e configurado
  - Bot conversacional funcionando
  - Integração OpenAI + Supabase
  - Webhook Facebook configurado
  - SSL e domínio ativos

---

## 📜 Licença e Créditos

**Desenvolvido para:** Guia de Mudanças  
**Bot:** Julia  
**Tecnologias:** Node.js, WhatsApp Business API, OpenAI, Supabase  

---

## 🚀 Próximos Passos Recomendados

1. [ ] Colocar app em modo produção (Live)
2. [ ] Verificar número próprio (não usar teste)
3. [ ] Configurar monitoramento (alertas)
4. [ ] Implementar Redis para sessões persistentes
5. [ ] Adicionar lista de empresas na resposta final
6. [ ] Configurar backup automático diário

---

## 📚 Como Usar Esta Documentação

### Se você é novo no projeto:
1. Leia **README.md** (este arquivo)
2. Leia **01-VISAO-GERAL.md**
3. Explore os arquivos em `codigo/`

### Se vai instalar em novo servidor:
1. Siga **09-RESTAURACAO.md**
2. Use **02-INSTALACAO-SERVIDOR.md** como referência

### Se vai fazer manutenção:
1. Consulte **08-MANUTENCAO.md**
2. Veja **04-ESTRUTURA-CODIGO.md** para entender o que modificar

### Se vai modificar funcionalidades:
1. Entenda o fluxo em **05-FLUXO-CONVERSACIONAL.md**
2. Veja código comentado em `codigo/`
3. Teste localmente antes de fazer deploy

---

**Dúvidas?** Consulte a seção específica na documentação ou os logs do sistema.

**Problemas?** Veja **08-MANUTENCAO.md** → Troubleshooting

---

🎉 **Sistema pronto para uso!** Qualquer número cadastrado pode enviar "oi" para +1 555 184 2523 e conversar com a Julia.
