# 📱 VPS WhatsApp Bot - Julia (MudaTech)

**Bot conversacional completo para cotação de mudanças via WhatsApp Business API**

**⚠️ IMPORTANTE: Esta é a documentação principal do bot WhatsApp. Consulte sempre este arquivo antes de fazer alterações no código do VPS.**

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Status Atual do Sistema](#status-atual-do-sistema)
3. [Arquitetura](#arquitetura)
4. [Como Funciona Hoje](#como-funciona-hoje)
5. [Estrutura de Arquivos](#estrutura-de-arquivos)
6. [Funcionalidades Implementadas](#funcionalidades-implementadas)
7. [Fluxo Completo](#fluxo-completo)
8. [Comandos e Manutenção](#comandos-e-manutenção)
9. [Versionamento](#versionamento)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O **Bot Julia** é um assistente virtual que funciona 24/7 via WhatsApp, coletando informações sobre mudanças, calculando orçamentos com IA e conectando clientes com empresas verificadas.

### Características Principais

- ✅ **Conversacional**: Interface natural via WhatsApp
- ✅ **IA Integrada**: Cálculo automático com OpenAI GPT-4o-mini
- ✅ **Notificação Automática**: Empresas recebem orçamentos automaticamente
- ✅ **URL Shortener**: Links encurtados para empresas
- ✅ **Validações**: Telefone, email, data com múltiplos formatos
- ✅ **Código Único**: Cada orçamento recebe código MD-XXXX-XXXX

---

## 📊 Status Atual do Sistema

### Versão Atual
**v1.0.2** (Última atualização: 26/11/2025)

### Servidor
- **IP**: 38.242.148.169
- **Domínio**: mudancas.duckdns.org (legado) / mudatech.com.br (novo)
- **Sistema**: Ubuntu 24.04 LTS
- **Node.js**: 20.x
- **PM2**: Gerenciador de processos

### WhatsApp
- **Phone Number ID**: 871455159388695
- **WABA ID**: 2898791313645761
- **Número de Teste**: +1 555 184 2523
- **Webhook URL**: https://mudancas.duckdns.org/webhook

### Localização dos Arquivos
```
/home/whatsapp-webhook/
├── server.js
├── message-handler.js
├── sessions.js
├── whatsapp.js
├── openai-service.js
├── supabase-service.js
├── url-shortener.js
├── telefone-validator.js
├── date-validator.js
├── .env
├── package.json
├── VERSION.txt
└── CHANGELOG.md
```

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│         CLIENTE (WhatsApp)               │
└──────────────────┬──────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────┐
│    FACEBOOK WHATSAPP BUSINESS API        │
└──────────────────┬──────────────────────┘
                   │
                   │ HTTPS POST
                   │ /webhook
                   ↓
┌─────────────────────────────────────────┐
│         VPS (Node.js + Express)          │
│                                          │
│  server.js → message-handler.js          │
│       ↓                                  │
│  openai-service.js (cálculo)             │
│       ↓                                  │
│  supabase-service.js (salvar)            │
│       ↓                                  │
│  url-shortener.js (links empresas)       │
└──────────────────┬──────────────────────┘
                   │
                   │ RPC Call
                   ↓
┌─────────────────────────────────────────┐
│      SUPABASE (PostgreSQL)               │
│  criar_orcamento_e_notificar()          │
└─────────────────────────────────────────┘
```

---

## 🔄 Como Funciona Hoje

### 1. Ativação do Bot

O bot responde quando recebe mensagens contendo:

- **"calcular mudança"** (com ou sem acento)
- **"olá"** (com ou sem acento)
- Palavras-chave: `oi`, `orçamento`, `cotação`, `mudança`, `iniciar`, etc.

**Normalização**: Remove acentos e converte para minúsculas para melhor detecção.

### 2. Fluxo de Perguntas (10 Etapas)

1. **Origem** - "De onde você está saindo?"
2. **Destino** - "Para onde você está se mudando?"
3. **Tipo de Imóvel** - Lista: Kitnet, 1 quarto, 2 quartos, 3+, Comercial
4. **Elevador?** - Botões: Sim / Não
5. **Embalagem?** - Botões: Sim, completa / Não preciso
6. **Nome** - "Qual é o seu nome?"
7. **Email** - Validação de formato
8. **Data Estimada** - Aceita: DD/MM, DD.MM, DD MM, DD/MM/YYYY (opcional)
9. **Lista de Objetos?** - Botões: Sim, quero / Não precisa
10. **Texto da Lista** - Se escolheu "Sim"

### 3. Processamento

Após coletar todos os dados:

1. **Cálculo com IA** (`openai-service.js`)
   - Extrai cidade/estado de origem e destino
   - Calcula distância real
   - Estima faixa de preço (min/max)
   - Gera explicação personalizada

2. **Salvamento** (`supabase-service.js`)
   - Chama função SQL `criar_orcamento_e_notificar()`
   - Busca empresas ativas no estado de destino
   - Cria vínculos automáticos
   - Retorna código do orçamento (MD-XXXX-XXXX)
   - Busca nomes e telefones das empresas notificadas

3. **Geração de Links** (`url-shortener.js`)
   - Cria mensagem simplificada com dados do orçamento
   - Encurta URL usando is.gd → v.gd → 0x0.st (fallback)
   - Retorna link WhatsApp para cada empresa

### 4. Mensagem Final

O cliente recebe **duas mensagens**:

**Mensagem 1:**
```
📋 *Dados do Orçamento*

🔖 *Código:* MD-XXXX-XXXX

📍 Origem: [cidade], [estado] → Destino: [cidade], [estado]
🏠 Tipo: [tipo]
🚪 Elevador: [Sim/Não]
📦 Embalagem: [Sim/Não]
📏 Distância: [X]km
💰 Faixa de Preço: R$ [min] - R$ [max]

[Explicação da IA]

📤 *Orçamento enviado por MudaTech*
```

**Mensagem 2:**
```
📋 *Empresas Notificadas*

- "Nome da Empresa 1" - [link WhatsApp]
- "Nome da Empresa 2" - [link WhatsApp]
...
```

**Nota**: Nomes das empresas entre aspas para evitar que números sejam clicáveis.

---

## 📁 Estrutura de Arquivos

### Arquivos Principais

#### `server.js`
Servidor Express que recebe webhooks do Facebook.

**Endpoints:**
- `GET /webhook` - Verificação do Facebook (webhook setup)
- `POST /webhook` - Recebe mensagens do WhatsApp
- `GET /` - Health check

#### `message-handler.js`
Cérebro do bot - gerencia todo o fluxo conversacional.

**Funções principais:**
- `processarMensagem()` - Processa cada mensagem recebida
- `ehMensagemAtivacao()` - Detecta palavras de ativação
- `validarEmail()` - Valida formato de email
- `validarData()` - Valida e formata datas (múltiplos formatos)
- `finalizarOrcamento()` - Calcula e salva orçamento

#### `sessions.js`
Gerenciador de sessões em memória (por número de telefone).

**Funções:**
- `criarSessao()` - Inicia nova conversa
- `getSessao()` - Recupera sessão existente
- `atualizarSessao()` - Atualiza dados da sessão
- `proximaEtapa()` - Avança para próxima pergunta
- `limparSessao()` - Remove sessão após finalizar

#### `whatsapp.js`
Cliente da API do WhatsApp (Facebook Graph API).

**Funções:**
- `enviarMensagem()` - Envia texto simples
- `enviarBotoes()` - Envia até 3 botões interativos
- `enviarLista()` - Envia lista de opções
- `enviarTyping()` - Indica que está digitando

#### `openai-service.js`
Integração com OpenAI para cálculos.

**Função principal:**
- `calcularOrcamentoComIA()` - Calcula distância e preços

**Retorna:**
```javascript
{
  distanciaKm: 432,
  precoMin: 6000,
  precoMax: 8500,
  explicacao: "...",
  cidadeOrigem: "São Paulo",
  estadoOrigem: "SP",
  cidadeDestino: "Rio de Janeiro",
  estadoDestino: "RJ"
}
```

#### `supabase-service.js`
Integração com Supabase (PostgreSQL).

**Função principal:**
- `salvarOrcamento()` - Salva no banco e notifica empresas

**Processo:**
1. Prepara dados no formato correto (snake_case)
2. Chama função SQL `criar_orcamento_e_notificar()`
3. Busca empresas notificadas (nomes e telefones)
4. Cria links WhatsApp para cada empresa
5. Retorna dados completos incluindo código do orçamento

#### `url-shortener.js`
Encurtador de URLs para links do WhatsApp.

**Serviços (ordem de tentativa):**
1. **is.gd** (primeira opção)
2. **v.gd** (segunda opção)
3. **0x0.st** (terceira opção)

**Função principal:**
- `criarLinkWhatsApp()` - Cria URL encurtada com mensagem pré-formatada

**Mensagem simplificada:**
```
Vou mudar e preciso desse orçamento:

*Orçamento enviado por MudaTech*
🔖 *Código:* MD-XXXX-XXXX
👤 [Nome]
📧 [Email]
📍 [Origem] → [Destino]
🏠 Tipo: [tipo]
🚪 Elevador: [Sim/Não]
📦 Embalagem: [Sim/Não]
📏 Distância: [X]km
💰 Faixa: R$ [min] - R$ [max]
📅 Data: [data] (se houver)

Gostaria de uma cotação personalizada.
```

#### `telefone-validator.js`
Validador e formatador de telefones.

**Função:**
- `validarEFormatarTelefone()` - Valida e formata para padrão WhatsApp (55DD9XXXXXXXX)

**Características:**
- Remove caracteres não numéricos
- Valida DDD brasileiro
- Adiciona código do país (55) se faltar
- Retorna formato: `5511999999999`

#### `date-validator.js`
Validador e formatador de datas.

**Função:**
- `validarEFormatarData()` - Aceita múltiplos formatos e retorna DD/MM/YYYY

**Formatos aceitos:**
- `DD/MM/YYYY`, `DD/MM`, `DD-MM-YYYY`, `DD-MM`
- `DD.MM.YYYY`, `DD.MM`
- `DD MM YYYY`, `DD MM`
- `YYYY-MM-DD` (ISO)

---

## ✨ Funcionalidades Implementadas

### ✅ Versão 1.0.2 (Atual)

- ✅ Código único de orçamento (MD-XXXX-XXXX)
- ✅ Validação de data melhorada (múltiplos formatos)
- ✅ Separação de mensagens (dados + empresas)
- ✅ Marca MudaTech nas mensagens
- ✅ Lista de empresas com links WhatsApp
- ✅ URL shortener com múltiplos serviços (is.gd, v.gd, 0x0.st)
- ✅ Validação de telefone robusta
- ✅ Prevenção de números clicáveis (aspas nos nomes)
- ✅ Ativação melhorada ("calcular mudança", "olá" com/sem acento)

### ✅ Versão 1.0.1

- ✅ Exibição de lista de empresas notificadas

### ✅ Versão 1.0.0

- ✅ Bot conversacional completo
- ✅ Integração OpenAI + Supabase
- ✅ Webhook Facebook configurado
- ✅ SSL e domínio ativos

---

## 🔄 Fluxo Completo

```
1. Cliente envia "oi" no WhatsApp
   ↓
2. Facebook → POST /webhook (VPS)
   ↓
3. server.js extrai mensagem e número
   ↓
4. message-handler.js verifica se é ativação
   ↓
5. Se sim, cria sessão e faz primeira pergunta
   ↓
6. Cliente responde → processarMensagem()
   ↓
7. Valida resposta e atualiza sessão
   ↓
8. Avança para próxima pergunta
   ↓
9. Repete até coletar todos os dados
   ↓
10. FinalizarOrcamento():
    - Chama openai-service.js (cálculo)
    - Chama supabase-service.js (salvar)
    - Busca empresas notificadas
    - Cria links WhatsApp (url-shortener.js)
    ↓
11. Envia mensagem 1 (dados do orçamento)
    ↓
12. Envia mensagem 2 (lista de empresas)
    ↓
13. Limpa sessão
    ↓
14. Aguarda próximo "oi"
```

---

## 🛠️ Comandos e Manutenção

### Comandos Básicos

```bash
# Conectar ao VPS
ssh root@38.242.148.169

# Ver status do bot
pm2 status

# Ver logs em tempo real
pm2 logs whatsapp-webhook

# Ver logs apenas de erro
pm2 logs whatsapp-webhook --err

# Reiniciar bot
pm2 restart whatsapp-webhook

# Parar bot
pm2 stop whatsapp-webhook

# Iniciar bot
pm2 start whatsapp-webhook

# Ver informações detalhadas
pm2 show whatsapp-webhook
```

### Editar Código

```bash
# Editar arquivo
nano /home/whatsapp-webhook/message-handler.js

# Após editar, reiniciar
pm2 restart whatsapp-webhook

# Verificar se funcionou
pm2 logs whatsapp-webhook --lines 50
```

### Backup

```bash
# Backup completo do código
cd /home/whatsapp-webhook
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  *.js .env package.json VERSION.txt CHANGELOG.md

# Backup do .env (importante!)
cp .env .env.backup-$(date +%Y%m%d)
```

### Verificar Sistema

```bash
# Health check
curl https://mudancas.duckdns.org/

# Verificar Nginx
sudo systemctl status nginx

# Verificar SSL
sudo certbot certificates

# Verificar espaço em disco
df -h

# Verificar memória
free -h
```

---

## 📝 Versionamento

### Sistema de Versões

O sistema usa versionamento semântico: `MAJOR.MINOR.PATCH`

- **MAJOR**: Mudanças incompatíveis
- **MINOR**: Novas funcionalidades compatíveis
- **PATCH**: Correções de bugs

### Arquivos de Versionamento

- `VERSION.txt` - Versão atual
- `CHANGELOG.md` - Histórico de mudanças

### Atualizar Versão

```bash
# 1. Editar VERSION.txt
echo "1.0.3" > /home/whatsapp-webhook/VERSION.txt

# 2. Atualizar CHANGELOG.md
nano /home/whatsapp-webhook/CHANGELOG.md

# 3. Commit (se usando Git)
git add VERSION.txt CHANGELOG.md
git commit -m "Bump version to 1.0.3"
```

---

## 🐛 Troubleshooting

### Bot não responde

```bash
# 1. Verificar se está rodando
pm2 status

# 2. Ver logs de erro
pm2 logs whatsapp-webhook --err

# 3. Reiniciar
pm2 restart whatsapp-webhook

# 4. Verificar webhook no Facebook
# (Dashboard → WhatsApp → Configuration → Webhook)
```

### Erro 502 Bad Gateway

```bash
# 1. Reiniciar Nginx
sudo systemctl restart nginx

# 2. Reiniciar bot
pm2 restart whatsapp-webhook

# 3. Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

### Token expirado

```bash
# 1. Gerar novo token no Facebook Developers
# 2. Atualizar .env
nano /home/whatsapp-webhook/.env
# Editar WHATSAPP_TOKEN

# 3. Reiniciar bot
pm2 restart whatsapp-webhook
```

### Sessão travada

```bash
# Reiniciar bot (limpa memória/sessões)
pm2 restart whatsapp-webhook
```

### URL shortener falhando

```bash
# Verificar logs
pm2 logs whatsapp-webhook | grep "shortener\|encurtar"

# Testar manualmente
curl "https://is.gd/create.php?format=json&url=https://example.com"
```

### OpenAI não calcula

```bash
# 1. Verificar chave API
grep OPENAI_API_KEY /home/whatsapp-webhook/.env

# 2. Ver logs
pm2 logs whatsapp-webhook | grep "openai\|OpenAI"

# 3. Testar chave manualmente
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_KEY"
```

---

## 📚 Documentação Adicional

### Documentos Disponíveis

- **[DOCUMENTACAO-COMPLETA.md](DOCUMENTACAO-COMPLETA.md)** - Documentação detalhada completa
- **[01-VISAO-GERAL.md](01-VISAO-GERAL.md)** - Arquitetura e componentes
- **[02-INSTALACAO-SERVIDOR.md](02-INSTALACAO-SERVIDOR.md)** - Instalação do zero
- **[03-CONFIGURACAO-FACEBOOK.md](03-CONFIGURACAO-FACEBOOK.md)** - Configuração WhatsApp API
- **[LEIA-ME-PRIMEIRO.md](LEIA-ME-PRIMEIRO.md)** - Guia rápido consolidado

### Integração com Next.js

Consulte: **[docs/INTEGRACAO_VPS_NEXTJS_COMPLETA.md](../docs/INTEGRACAO_VPS_NEXTJS_COMPLETA.md)**

---

## 🔐 Segurança

### Variáveis de Ambiente

Todas as credenciais estão em `.env` (não versionado):

```env
PORT=3000
VERIFY_TOKEN=seu_token_secreto
WHATSAPP_TOKEN=EAAMQy...
WHATSAPP_PHONE_ID=871455159388695
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_KEY=eyJhbG...
OPENAI_API_KEY=sk-proj-...
```

### Boas Práticas

- ✅ `.env` não versionado no Git
- ✅ HTTPS obrigatório (Let's Encrypt)
- ✅ Firewall UFW ativo
- ✅ Validação de webhook token
- ✅ Service Role Key do Supabase (não exposta)

---

## 🚀 Próximos Passos Recomendados

- [ ] Implementar Redis para sessões persistentes
- [ ] Adicionar métricas e monitoramento
- [ ] Configurar alertas automáticos
- [ ] Implementar retry para URL shortener
- [ ] Adicionar cache para cálculos similares
- [ ] Melhorar tratamento de erros
- [ ] Adicionar testes automatizados

---

## 📞 Suporte

### Logs Importantes

- **Aplicação**: `pm2 logs whatsapp-webhook`
- **Nginx**: `/var/log/nginx/error.log`
- **SSL**: `/var/log/letsencrypt/letsencrypt.log`

### Contato

Para problemas ou dúvidas, consulte:
1. Esta documentação
2. Logs do sistema
3. Documentação do Facebook WhatsApp API
4. Documentação do Supabase

---

**Última atualização**: 26/11/2025  
**Versão do Bot**: 1.0.2  
**Status**: ✅ Funcionando 24/7
