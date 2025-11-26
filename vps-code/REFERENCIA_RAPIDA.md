# ⚡ Referência Rápida - Bot WhatsApp Julia

**Para consulta rápida durante desenvolvimento e manutenção**

---

## 📍 Localização dos Arquivos

```bash
# VPS
/home/whatsapp-webhook/

# Documentação
vps-code/README.md
vps-code/ESTADO_ATUAL.md
vps-code/REFERENCIA_RAPIDA.md (este arquivo)
```

---

## 🔧 Comandos Essenciais

```bash
# Conectar ao VPS
ssh root@38.242.148.169

# Status do bot
pm2 status

# Logs em tempo real
pm2 logs whatsapp-webhook

# Reiniciar bot
pm2 restart whatsapp-webhook

# Ver versão atual
cat /home/whatsapp-webhook/VERSION.txt

# Health check
curl https://mudancas.duckdns.org/
```

---

## 📋 Estrutura de Arquivos

```
/home/whatsapp-webhook/
├── server.js              # Servidor Express (webhook)
├── message-handler.js     # Lógica do bot (cérebro)
├── sessions.js            # Gerenciador de sessões
├── whatsapp.js            # Cliente WhatsApp API
├── openai-service.js      # Cliente OpenAI
├── supabase-service.js    # Cliente Supabase
├── url-shortener.js       # Encurtador de URLs
├── telefone-validator.js  # Validador de telefones
├── date-validator.js      # Validador de datas
├── .env                   # Variáveis de ambiente
├── package.json           # Dependências
├── VERSION.txt            # Versão atual
└── CHANGELOG.md           # Histórico de mudanças
```

---

## 🔄 Fluxo Rápido

```
Cliente envia "oi"
  ↓
Facebook → POST /webhook
  ↓
server.js → message-handler.js
  ↓
Verifica ativação → Cria sessão
  ↓
10 perguntas sequenciais
  ↓
openai-service.js (cálculo)
  ↓
supabase-service.js (salvar)
  ↓
url-shortener.js (links)
  ↓
Envia 2 mensagens ao cliente
  ↓
Limpa sessão
```

---

## 📝 Ordem das Perguntas

1. Origem
2. Destino
3. Tipo de imóvel
4. Elevador?
5. Embalagem?
6. Nome
7. Email
8. Data estimada (opcional)
9. Lista de objetos? (Sim/Não)
10. Texto da lista (se Sim)

---

## 🎯 Palavras de Ativação

O bot responde quando recebe:
- "calcular mudança" (com/sem acento)
- "olá" (com/sem acento)
- oi, orçamento, cotação, mudança, iniciar, etc.

---

## 🔗 Integrações

### OpenAI
- **Modelo**: GPT-4o-mini
- **Função**: `calcularOrcamentoComIA()`
- **Retorna**: distância, preço min/max, cidade/estado

### Supabase
- **Função SQL**: `criar_orcamento_e_notificar()`
- **Retorna**: orcamento_id, hotsites_notificados, codigo_orcamento

### URL Shortener
- **Serviços**: is.gd → v.gd → 0x0.st
- **Função**: `criarLinkWhatsApp()`

---

## 📊 Variáveis de Ambiente

```env
PORT=3000
VERIFY_TOKEN=[token]
WHATSAPP_TOKEN=[token]
WHATSAPP_PHONE_ID=871455159388695
SUPABASE_URL=[url]
SUPABASE_ANON_KEY=[key]
SUPABASE_SERVICE_KEY=[key]
OPENAI_API_KEY=[key]
```

---

## 🐛 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Bot não responde | `pm2 restart whatsapp-webhook` |
| Erro 502 | `sudo systemctl restart nginx && pm2 restart whatsapp-webhook` |
| Token expirado | Gerar novo no Facebook, atualizar `.env` |
| Sessão travada | `pm2 restart whatsapp-webhook` |
| URL shortener falha | Ver logs: `pm2 logs | grep shortener` |

---

## 📚 Documentação Completa

- **README.md** - Documentação completa
- **ESTADO_ATUAL.md** - Estado atual do sistema
- **DOCUMENTACAO-COMPLETA.md** - Guia detalhado

---

## 🔄 Workflow de Atualização

```bash
# 1. Editar arquivo
nano /home/whatsapp-webhook/message-handler.js

# 2. Reiniciar bot
pm2 restart whatsapp-webhook

# 3. Verificar logs
pm2 logs whatsapp-webhook --lines 50

# 4. Atualizar versão (se necessário)
echo "1.0.3" > /home/whatsapp-webhook/VERSION.txt

# 5. Atualizar CHANGELOG.md
nano /home/whatsapp-webhook/CHANGELOG.md
```

---

## 📞 Dados do Sistema

- **IP**: 38.242.148.169
- **Domínio**: mudancas.duckdns.org / mudatech.com.br
- **Webhook**: https://mudancas.duckdns.org/webhook
- **Phone ID**: 871455159388695
- **Versão**: 1.0.2

---

**Última atualização**: 26/11/2025

