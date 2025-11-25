# 🎉 DOCUMENTAÇÃO COMPLETA - WHATSAPP BOT JULIA

## ✅ PACOTE FINALIZADO E PRONTO PARA USO!

---

## 📦 ARQUIVOS DISPONÍVEIS PARA DOWNLOAD

### 🔴 **PRINCIPAL: [whatsapp-docs-completo.tar.gz](computer:///mnt/user-data/outputs/whatsapp-docs-completo.tar.gz)**
**BAIXE ESTE ARQUIVO!** Contém TUDO que você precisa.

### Documentos individuais (também disponíveis):

1. **[LEIA-ME-PRIMEIRO.md](computer:///mnt/user-data/outputs/LEIA-ME-PRIMEIRO.md)** ⭐
   - Guia rápido consolidado
   - Todos os comandos executados
   - Troubleshooting rápido

2. **[00-README.md](computer:///mnt/user-data/outputs/00-README.md)**
   - Índice geral da documentação

3. **[01-VISAO-GERAL.md](computer:///mnt/user-data/outputs/01-VISAO-GERAL.md)**
   - Arquitetura completa do sistema
   - Fluxo de dados detalhado
   - Componentes e tecnologias

4. **[02-INSTALACAO-SERVIDOR.md](computer:///mnt/user-data/outputs/02-INSTALACAO-SERVIDOR.md)**
   - Instalação completa do zero
   - Passo a passo detalhado
   - Comandos para Ubuntu 24.04

5. **[03-CONFIGURACAO-FACEBOOK.md](computer:///mnt/user-data/outputs/03-CONFIGURACAO-FACEBOOK.md)**
   - Configuração do WhatsApp Business API
   - Geração de tokens
   - Inscrição do webhook

---

## 📂 O QUE HÁ DENTRO DO PACOTE COMPLETO

```
whatsapp-docs-completo.tar.gz  (9.5 KB)
│
└── whatsapp-docs/
    ├── README.md                    # Índice geral
    ├── 01-VISAO-GERAL.md           # Arquitetura e componentes
    ├── 02-INSTALACAO-SERVIDOR.md   # Instalação passo a passo
    ├── 03-CONFIGURACAO-FACEBOOK.md # Config WhatsApp API
    ├── 04-ESTRUTURA-CODIGO.md      # Como o código funciona
    ├── 05-FLUXO-CONVERSACIONAL.md  # Perguntas e respostas
    ├── 06-INTEGRACAO-OPENAI.md     # Cálculo com IA
    ├── 07-INTEGRACAO-SUPABASE.md   # Banco de dados
    ├── 08-MANUTENCAO.md            # Comandos diários
    ├── 09-RESTAURACAO.md           # Restaurar em novo servidor
    │
    └── codigo/                      # 📁 TODOS OS ARQUIVOS DE CÓDIGO
        ├── server.js                # Servidor Express (COMENTADO)
        ├── message-handler.js       # Lógica do bot (COMENTADO)
        ├── sessions.js              # Gerenciador de sessões (COMENTADO)
        ├── whatsapp.js              # Cliente WhatsApp API (COMENTADO)
        ├── openai-service.js        # Cliente OpenAI (COMENTADO)
        ├── supabase-service.js      # Cliente Supabase (COMENTADO)
        ├── .env.example             # Template de variáveis
        └── package.json             # Dependências NPM
```

---

## 🚀 COMO USAR

### 1️⃣ Extrair o Pacote

```bash
# Baixe o arquivo whatsapp-docs-completo.tar.gz

# Extraia:
tar -xzf whatsapp-docs-completo.tar.gz

# Entre na pasta:
cd whatsapp-docs

# Veja o índice:
cat README.md
```

### 2️⃣ Para Restaurar Sistema em Novo Servidor

```bash
# 1. Leia o guia de restauração
cat 09-RESTAURACAO.md

# 2. Siga o guia de instalação
cat 02-INSTALACAO-SERVIDOR.md

# 3. Copie os arquivos de código
cp codigo/* /home/whatsapp-webhook/

# 4. Configure o .env
cp codigo/.env.example /home/whatsapp-webhook/.env
nano /home/whatsapp-webhook/.env  # Preencha com valores reais

# 5. Instale dependências
cd /home/whatsapp-webhook
npm install

# 6. Inicie com PM2
pm2 start server.js --name whatsapp-webhook
```

### 3️⃣ Para Entender Como Funciona

```bash
# Leia na ordem:
1. cat 01-VISAO-GERAL.md       # Arquitetura
2. cat 04-ESTRUTURA-CODIGO.md  # Como funciona
3. cat 05-FLUXO-CONVERSACIONAL.md  # Conversa

# Veja o código comentado:
cd codigo/
cat server.js  # Todos os arquivos têm comentários detalhados!
```

---

## 📋 RESUMO DO SISTEMA

### O que foi construído:

✅ **Bot conversacional completo** via WhatsApp  
✅ **10 perguntas** sequenciais para coleta de dados  
✅ **Cálculo automático** com OpenAI (distância e preço)  
✅ **Salvamento automático** no Supabase  
✅ **Notificação automática** de empresas parceiras  
✅ **Funcionando 24/7** com PM2  
✅ **SSL/HTTPS** com Let's Encrypt  
✅ **Domínio** mudancas.duckdns.org  

### Tecnologias:

- **VPS:** Ubuntu 24.04
- **Backend:** Node.js 20.x + Express
- **Process Manager:** PM2
- **Web Server:** Nginx
- **SSL:** Let's Encrypt
- **API:** Facebook WhatsApp Business Cloud API v21.0
- **IA:** OpenAI GPT-4o-mini
- **Database:** Supabase (PostgreSQL)
- **DNS:** DuckDNS

---

## 📞 DADOS DO SISTEMA ATUAL

```
VPS IP: 38.242.148.169
Domínio: mudancas.duckdns.org
Webhook: https://mudancas.duckdns.org/webhook

WhatsApp Phone ID: 871455159388695
WABA ID: 2898791313645761
Número de teste: +1 555 184 2523

Localização dos arquivos:
- Aplicação: /home/whatsapp-webhook/
- Nginx: /etc/nginx/sites-available/whatsapp-webhook
- SSL: /etc/letsencrypt/live/mudancas.duckdns.org/
- Logs PM2: /root/.pm2/logs/
```

---

## 🔧 COMANDOS MAIS USADOS

```bash
# Ver status
sudo pm2 status

# Ver logs
sudo pm2 logs whatsapp-webhook

# Reiniciar
sudo pm2 restart whatsapp-webhook

# Editar código
sudo nano /home/whatsapp-webhook/message-handler.js

# Testar webhook
curl https://mudancas.duckdns.org/

# Backup
cd /home/whatsapp-webhook
tar -czf backup-$(date +%Y%m%d).tar.gz *.js .env
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
8. **Data** - "Qual a data da mudança?" (opcional)
9. **Lista objetos?** - Botões: Sim, quero / Não precisa
10. **Texto lista** - "Descreva os objetos" (se sim)

**Após todas respostas:**
→ Calcula com OpenAI  
→ Salva no Supabase  
→ Envia resultado formatado  
→ Limpa sessão  

---

## 📁 TODOS OS ARQUIVOS DE CÓDIGO INCLUÍDOS

### ✅ server.js (9.3 KB)
Servidor Express que recebe webhooks do Facebook

**Principais funções:**
- `GET /webhook` - Verificação do Facebook
- `POST /webhook` - Recebe mensagens
- `GET /` - Health check

### ✅ message-handler.js (17 KB)
Cérebro do bot - gerencia todo fluxo conversacional

**Principais funções:**
- `processarMensagem()` - Processa cada resposta
- `finalizarOrcamento()` - Calcula e salva
- `validarEmail()` - Valida formato
- `validarData()` - Valida e converte datas

### ✅ sessions.js (1.7 KB)
Gerenciador de sessões em memória

**Principais funções:**
- `criarSessao()` - Inicia nova conversa
- `getSessao()` - Recupera sessão
- `atualizarSessao()` - Atualiza dados
- `proximaEtapa()` - Avança pergunta
- `limparSessao()` - Remove sessão

### ✅ whatsapp.js (2.7 KB)
Cliente da API do WhatsApp

**Principais funções:**
- `enviarMensagem()` - Texto simples
- `enviarBotoes()` - Até 3 botões
- `enviarLista()` - Lista de opções

### ✅ openai-service.js (3.2 KB)
Integração com OpenAI para cálculos

**Principais funções:**
- `calcularOrcamentoComIA()` - Calcula distância e preços

**Retorna:**
```json
{
  "distanciaKm": 432,
  "precoMin": 6000,
  "precoMax": 8500,
  "explicacao": "...",
  "cidadeOrigem": "São Paulo",
  "estadoOrigem": "SP",
  "cidadeDestino": "Rio de Janeiro",
  "estadoDestino": "RJ"
}
```

### ✅ supabase-service.js (1.9 KB)
Integração com Supabase (PostgreSQL)

**Principais funções:**
- `salvarOrcamento()` - Salva no banco e notifica empresas

**Chama função SQL:**
```sql
criar_orcamento_e_notificar(p_orcamento_data JSONB)
```

### ✅ .env.example (1 KB)
Template de variáveis de ambiente

**Campos:**
```env
PORT=3000
VERIFY_TOKEN=meu_token_secreto_12345
WHATSAPP_TOKEN=EAAMQy...
WHATSAPP_PHONE_ID=871455159388695
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_KEY=eyJhbG...
OPENAI_API_KEY=sk-proj-...
```

### ✅ package.json (520 bytes)
Dependências do projeto

**Pacotes:**
- express
- body-parser
- axios
- dotenv
- openai
- @supabase/supabase-js

---

## 🐛 TROUBLESHOOTING RÁPIDO

| Problema | Solução |
|----------|---------|
| Bot não responde | `sudo pm2 restart whatsapp-webhook` |
| Erro 502 | `sudo systemctl restart nginx && sudo pm2 restart whatsapp-webhook` |
| SSL expirado | `sudo certbot renew --force-renewal` |
| Token inválido | Gerar novo no Facebook, atualizar `.env`, reiniciar PM2 |
| Sessão travada | `sudo pm2 restart whatsapp-webhook` |
| Webhook não verifica | Conferir `VERIFY_TOKEN` no `.env` |

---

## 📚 DOCUMENTOS POR FINALIDADE

**Instalar tudo do zero:**
→ 02-INSTALACAO-SERVIDOR.md + 03-CONFIGURACAO-FACEBOOK.md

**Entender como funciona:**
→ 01-VISAO-GERAL.md + 04-ESTRUTURA-CODIGO.md + codigo/

**Restaurar em novo servidor:**
→ 09-RESTAURACAO.md

**Fazer manutenção:**
→ 08-MANUTENCAO.md

**Modificar funcionalidades:**
→ codigo/ (todos arquivos comentados)

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Antes de usar em produção, verifique:

- [ ] Todos os arquivos extraídos corretamente
- [ ] `.env` configurado com valores reais
- [ ] Domínio apontando para VPS
- [ ] SSL ativo e válido
- [ ] PM2 rodando aplicação
- [ ] Webhook verificado no Facebook
- [ ] App inscrito (`subscribed_apps`)
- [ ] Número de teste cadastrado
- [ ] Bot responde "oi" corretamente
- [ ] OpenAI API Key válida
- [ ] Supabase conectado

---

## 🎉 SISTEMA 100% DOCUMENTADO!

Com este pacote você tem:

✅ Arquitetura completa explicada  
✅ Todos os comandos executados  
✅ Todo o código fonte comentado  
✅ Guias de instalação e restauração  
✅ Troubleshooting para problemas comuns  
✅ Fluxo conversacional detalhado  
✅ Integrações (OpenAI + Supabase) explicadas  

**Está TUDO pronto para:**
- Restaurar em novo servidor
- Modificar funcionalidades
- Entender como funciona
- Fazer manutenção
- Criar cópias do sistema

---

## 📞 PALAVRAS DE ATIVAÇÃO DO BOT

O bot responde quando recebe:
- oi, olá, ola, hey, hi, hello
- orçamento, orcamento, cotação, cotacao
- mudança, mudanca, mudar
- iniciar, começar, comecar, start
- nova cotação, novo orçamento

**Qualquer outra mensagem fora de conversa ativa é IGNORADA**

---

## 💾 COMO FAZER BACKUP

```bash
# Backup completo do código
cd /home/whatsapp-webhook
sudo tar -czf backup-codigo-$(date +%Y%m%d-%H%M%S).tar.gz \
  *.js .env package.json

# Backup do Nginx
sudo tar -czf backup-nginx-$(date +%Y%m%d).tar.gz \
  /etc/nginx/sites-available/whatsapp-webhook

# Backup do PM2
sudo tar -czf backup-pm2-$(date +%Y%m%d).tar.gz \
  /root/.pm2/

# Backup do SSL
sudo tar -czf backup-ssl-$(date +%Y%m%d).tar.gz \
  /etc/letsencrypt/
```

---

## 🚀 PRÓXIMOS PASSOS RECOMENDADOS

1. Colocar app em modo "Live" no Facebook
2. Verificar número próprio (não usar teste)
3. Implementar Redis para sessões persistentes
4. Adicionar lista de empresas na resposta final
5. Configurar monitoramento (alertas)
6. Implementar backup automático diário

---

📅 **Documentação criada em:** 25/11/2025  
📦 **Versão do sistema:** 1.0  
👨‍💻 **Bot:** Julia - Assistente de Cotação de Mudanças  
🏢 **Empresa:** Guia de Mudanças  

---

## 🎯 DOWNLOAD E COMECE AGORA!

**[📥 BAIXAR PACOTE COMPLETO (whatsapp-docs-completo.tar.gz)](computer:///mnt/user-data/outputs/whatsapp-docs-completo.tar.gz)**

Ou baixe documentos individuais acima ☝️

**Boa sorte com o projeto!** 🚀✨
