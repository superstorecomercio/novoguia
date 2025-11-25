# 📚 Documentação Completa - WhatsApp Bot API Julia

## 📋 Índice da Documentação

Esta documentação está organizada em múltiplos arquivos para facilitar a consulta:

### 📖 Documentos Principais

1. **[01-VISAO-GERAL.md](01-VISAO-GERAL.md)** - Visão geral do sistema e arquitetura
2. **[02-INSTALACAO-SERVIDOR.md](02-INSTALACAO-SERVIDOR.md)** - Instalação completa do zero no VPS
3. **[03-CONFIGURACAO-FACEBOOK.md](03-CONFIGURACAO-FACEBOOK.md)** - Configuração do Facebook/WhatsApp API
4. **[04-ESTRUTURA-CODIGO.md](04-ESTRUTURA-CODIGO.md)** - Explicação detalhada do código
5. **[05-FLUXO-CONVERSACIONAL.md](05-FLUXO-CONVERSACIONAL.md)** - Fluxo de perguntas e respostas
6. **[06-INTEGRACAO-OPENAI.md](06-INTEGRACAO-OPENAI.md)** - Como funciona o cálculo com IA
7. **[07-INTEGRACAO-SUPABASE.md](07-INTEGRACAO-SUPABASE.md)** - Salvamento no banco de dados
8. **[08-MANUTENCAO.md](08-MANUTENCAO.md)** - Comandos úteis e troubleshooting
9. **[09-RESTAURACAO.md](09-RESTAURACAO.md)** - Como restaurar tudo em um novo servidor

### 📁 Código Fonte

10. **[codigo/](codigo/)** - Todos os arquivos do sistema com comentários

---

## 🎯 O que é este sistema?

**Julia** é um bot de WhatsApp que automatiza o processo de cotação de mudanças residenciais e comerciais.

### Funcionalidades Principais:

✅ Conversa natural via WhatsApp  
✅ Coleta dados da mudança (origem, destino, tipo de imóvel, etc)  
✅ Calcula preço estimado usando OpenAI  
✅ Salva orçamento no Supabase  
✅ Notifica empresas parceiras automaticamente  
✅ Funciona 24/7 sem intervenção manual  

---

## 🏗️ Tecnologias Utilizadas

- **VPS:** Ubuntu 24.04
- **Servidor Web:** Nginx
- **SSL:** Let's Encrypt (Certbot)
- **Runtime:** Node.js 20.x LTS
- **Gerenciador de Processos:** PM2
- **API WhatsApp:** Facebook Business API (Cloud API)
- **IA:** OpenAI GPT-4o-mini
- **Banco de Dados:** Supabase (PostgreSQL)
- **Domínio:** DuckDNS (mudancas.duckdns.org)

---

## 📊 Fluxo de Funcionamento

```
Cliente (WhatsApp)
    ↓
Facebook WhatsApp API
    ↓
Webhook (mudancas.duckdns.org/webhook)
    ↓
VPS Ubuntu (Nginx → Node.js → PM2)
    ↓
Bot Julia processa mensagem
    ↓
[Coleta dados] → [Chama OpenAI] → [Salva Supabase] → [Notifica empresas]
    ↓
Resposta enviada ao cliente
```

---

## 🚀 Quick Start

### Para Instalar do Zero:
1. Leia **[02-INSTALACAO-SERVIDOR.md](02-INSTALACAO-SERVIDOR.md)**
2. Configure Facebook/WhatsApp seguindo **[03-CONFIGURACAO-FACEBOOK.md](03-CONFIGURACAO-FACEBOOK.md)**
3. Deploy do código conforme **[04-ESTRUTURA-CODIGO.md](04-ESTRUTURA-CODIGO.md)**

### Para Manutenção:
- Consulte **[08-MANUTENCAO.md](08-MANUTENCAO.md)**

### Para Restaurar em Novo Servidor:
- Siga **[09-RESTAURACAO.md](09-RESTAURACAO.md)**

---

## 📝 Informações Importantes

### Credenciais e Tokens:
- WhatsApp Token: Configurado no `.env`
- OpenAI API Key: Configurado no `.env`
- Supabase: URL e Keys no `.env`
- Domínio: mudancas.duckdns.org
- IP VPS: 38.242.148.169

### Arquivos Críticos:
- `/home/whatsapp-webhook/` - Aplicação principal
- `/etc/nginx/sites-available/whatsapp-webhook` - Configuração Nginx
- `/etc/letsencrypt/` - Certificados SSL
- `~/.pm2/` - Configuração PM2

---

## 🆘 Suporte e Contato

Para dúvidas sobre esta documentação ou o sistema:
- Revise os arquivos de troubleshooting em **[08-MANUTENCAO.md](08-MANUTENCAO.md)**
- Verifique logs: `sudo pm2 logs whatsapp-webhook`
- Consulte estrutura do código em **[04-ESTRUTURA-CODIGO.md](04-ESTRUTURA-CODIGO.md)**

---

## 📅 Histórico de Versões

- **v1.0** (25/11/2025) - Versão inicial completa
  - Bot conversacional implementado
  - Integração OpenAI + Supabase
  - Sistema de sessões em memória
  - Deploy em produção

---

## 📜 Licença e Uso

Este sistema foi desenvolvido para o **Guia de Mudanças**.

---

**Próximo passo:** Comece lendo **[01-VISAO-GERAL.md](01-VISAO-GERAL.md)** para entender a arquitetura completa.
