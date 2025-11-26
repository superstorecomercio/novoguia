# 🚀 MudaTech - Plataforma de Orçamentos de Mudança

**Plataforma completa para conectar clientes com empresas de mudança através de IA e WhatsApp**

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Tecnologias](#tecnologias)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Funcionalidades Principais](#funcionalidades-principais)
5. [Documentação](#documentação)
6. [Instalação e Setup](#instalação-e-setup)
7. [Deploy](#deploy)
8. [Integração VPS](#integração-vps)

---

## 🎯 Visão Geral

O **MudaTech** é uma plataforma completa que utiliza **Inteligência Artificial** para calcular orçamentos de mudança e conectar clientes com empresas verificadas. O sistema funciona através de:

- **Website Next.js**: Calculadora interativa com interface moderna
- **Bot WhatsApp**: Assistente virtual "Julia" que coleta dados via conversa
- **Dashboard Empresas**: Painel administrativo para gestão de leads
- **IA OpenAI**: Cálculo automático de distâncias e estimativas de preço

### Domínio Principal
- **Produção**: `https://mudatech.com.br`
- **Vercel**: Deploy automático via GitHub

---

## 🛠️ Tecnologias

### Frontend
- **Next.js 16** (App Router)
- **TypeScript**
- **TailwindCSS** + **shadcn/ui**
- **React 18**

### Backend
- **Next.js API Routes**
- **Supabase** (PostgreSQL, Auth, Storage)
- **OpenAI GPT-4o-mini** (cálculo de orçamentos)

### Infraestrutura
- **Vercel** (deploy do site)
- **VPS Ubuntu 24.04** (bot WhatsApp)
- **Nginx** + **Let's Encrypt** (SSL)
- **PM2** (process manager)

### Integrações
- **WhatsApp Business API** (Facebook Cloud API)
- **OpenAI API** (cálculo de distâncias e preços)
- **Supabase** (banco de dados)

---

## 📁 Estrutura do Projeto

```
guia-de-mudancas-next/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── calcular-orcamento/   # Calculadora web
│   │   ├── orcamentos/           # Webhook externos
│   │   └── w/                    # URL shortener
│   ├── calcularmudanca/          # Página calculadora
│   ├── como-funciona/            # Página explicativa
│   ├── admin/                    # Dashboard admin
│   ├── painel/                   # Dashboard empresas
│   └── components/               # Componentes React
├── lib/                          # Bibliotecas e utilitários
│   ├── db/                       # Queries Supabase
│   └── supabase/                 # Cliente Supabase
├── supabase/                     # Migrations SQL
│   └── migrations/               # Arquivos de migração
├── docs/                         # Documentação completa
├── vps-code/                     # Código do bot WhatsApp
│   ├── codigo/                   # Arquivos do bot
│   └── README.md                 # Documentação VPS
└── scripts/                      # Scripts de deploy/sync
```

---

## ✨ Funcionalidades Principais

### Para Clientes

1. **Calculadora Web** (`/calcularmudanca`)
   - Interface conversacional moderna
   - Cálculo instantâneo com IA
   - Preview de orçamento antes de enviar

2. **Bot WhatsApp**
   - Assistente virtual "Julia"
   - 10 perguntas sequenciais
   - Resposta automática 24/7

3. **Resultado**
   - Estimativa de preço (faixa min/max)
   - Lista de empresas verificadas
   - Links diretos para WhatsApp das empresas

### Para Empresas

1. **Dashboard** (`/painel`)
   - Visualização de leads em tempo real
   - Filtros por data, cidade, estado
   - Detalhes completos do orçamento
   - Geração de PDF de orçamentos

2. **Perfil da Empresa**
   - Edição de informações
   - Upload de logo e fotos
   - Configuração de áreas de atuação

### Sistema

1. **IA de Cálculo**
   - Extração automática de cidade/estado
   - Cálculo de distância real
   - Estimativa baseada em dados históricos

2. **Notificação Automática**
   - Empresas ativas recebem orçamentos automaticamente
   - Filtro por estado de destino
   - Vínculo automático no banco de dados

---

## 📚 Documentação

### ⚠️ LEIA PRIMEIRO

**Antes de começar a trabalhar, leia:**
- **[docs/LEIA_PRIMEIRO.md](docs/LEIA_PRIMEIRO.md)** - Guia de leitura essencial para novas sessões

### Documentação Principal

- **[SISTEMA_COMPLETO.md](docs/SISTEMA_COMPLETO.md)** - Visão geral completa do sistema
- **[CALCULADORA_COMPLETA.md](docs/CALCULADORA_COMPLETA.md)** - Documentação da calculadora
- **[CONTEXTO_PROJETO.md](docs/CONTEXTO_PROJETO.md)** - Contexto e arquitetura

### Documentação VPS (Bot WhatsApp)

**⚠️ IMPORTANTE: Para atualizações do bot WhatsApp, consulte sempre a documentação do VPS:**

- **[vps-code/README.md](vps-code/README.md)** - Documentação completa do bot ⭐ **LEIA PRIMEIRO**
- **[vps-code/ESTADO_ATUAL.md](vps-code/ESTADO_ATUAL.md)** - Estado atual do sistema
- **[vps-code/REFERENCIA_RAPIDA.md](vps-code/REFERENCIA_RAPIDA.md)** - Referência rápida
- **[vps-code/DOCUMENTACAO-COMPLETA.md](vps-code/DOCUMENTACAO-COMPLETA.md)** - Guia detalhado
- **[docs/INTEGRACAO_VPS_NEXTJS_COMPLETA.md](docs/INTEGRACAO_VPS_NEXTJS_COMPLETA.md)** - Integração VPS + Next.js

### Outras Documentações

- **[API.md](docs/API.md)** - Documentação das APIs
- **[FLUXO_EDICAO_LOCAL.md](docs/FLUXO_EDICAO_LOCAL.md)** - Workflow de edição local
- **[SETUP_EDICAO_LOCAL.md](docs/SETUP_EDICAO_LOCAL.md)** - Setup para edição local

---

## 🚀 Instalação e Setup

### Pré-requisitos

- Node.js 20.x ou superior
- npm ou yarn
- Conta Supabase
- Chave API OpenAI
- (Opcional) VPS para bot WhatsApp

### Instalação Local

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/mudatech.git
cd mudatech

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 4. Execute as migrations do Supabase
# (via Supabase Dashboard ou CLI)

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# Vercel (automático)
VERCEL_URL=your_vercel_url
```

---

## 📦 Deploy

### Vercel (Automático)

O projeto está configurado para deploy automático no Vercel:

1. Push para `main` → Deploy automático
2. Domínio: `mudatech.com.br`
3. Variáveis de ambiente configuradas no Vercel Dashboard

### Deploy Manual

```bash
# Build de produção
npm run build

# Iniciar servidor
npm start
```

---

## 🔗 Integração VPS

O bot WhatsApp roda em um VPS separado. Para atualizações:

### Workflow Recomendado

1. **Editar localmente** (neste repositório)
2. **Testar** localmente
3. **Deploy para VPS** usando scripts:
   ```bash
   # Deploy para VPS
   ./scripts/deploy-vps.sh
   ```

### Documentação VPS

**⚠️ Sempre consulte a documentação do VPS antes de fazer alterações:**

```bash
# Ler documentação completa do VPS
cat vps-code/README.md

# Ver versão atual
cat vps-code/codigo/VERSION.txt

# Ver changelog
cat vps-code/codigo/CHANGELOG.md
```

### Estrutura VPS

```
VPS: /home/whatsapp-webhook/
├── server.js              # Servidor Express
├── message-handler.js     # Lógica do bot
├── sessions.js            # Gerenciador de sessões
├── whatsapp.js            # Cliente WhatsApp API
├── openai-service.js      # Cliente OpenAI
├── supabase-service.js    # Cliente Supabase
├── url-shortener.js       # Encurtador de URLs
├── telefone-validator.js  # Validador de telefones
├── date-validator.js      # Validador de datas
└── .env                   # Variáveis de ambiente
```

---

## 🎯 Principais Funcionalidades Técnicas

### Cálculo com IA

- **Extração de localização**: Identifica cidade e estado de textos livres
- **Cálculo de distância**: Usa APIs de geolocalização
- **Estimativa de preço**: Baseada em dados históricos e complexidade

### Sistema de Notificações

- **Busca automática**: Empresas ativas no estado de destino
- **Vínculo automático**: Criação de `orcamentos_campanhas`
- **Contador**: Atualização de `hotsites_notificados`

### Código Único de Orçamento

- **Formato**: `MD-XXXX-XXXX`
- **Geração automática**: Trigger no banco de dados
- **Exibição**: Dashboard e mensagens WhatsApp

### URL Shortener

- **Serviços**: is.gd, v.gd, 0x0.st (fallback)
- **Mensagem pré-formatada**: Dados do orçamento codificados
- **Links WhatsApp**: Direto para empresas com mensagem

---

## 📊 Banco de Dados

### Tabelas Principais

- `orcamentos` - Orçamentos criados
- `campanhas` - Campanhas de empresas
- `hotsites` - Perfis de empresas
- `orcamentos_campanhas` - Vínculo orçamento ↔ empresa
- `cidades` - Cidades cadastradas

### Função SQL Principal

```sql
criar_orcamento_e_notificar(p_orcamento_data JSONB)
```

Esta função:
1. Valida dados obrigatórios
2. Insere orçamento
3. Busca empresas ativas no estado
4. Cria vínculos automáticos
5. Retorna IDs e contadores

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção
npm run start            # Servidor de produção

# Supabase
npx supabase migration new nome_migration
npx supabase db push

# VPS (via SSH)
ssh root@38.242.148.169
pm2 status               # Status do bot
pm2 logs whatsapp-webhook # Logs
pm2 restart whatsapp-webhook # Reiniciar
```

---

## 📝 Changelog

### Versão Atual

- ✅ Página "Como Funciona" completa
- ✅ Dashboard empresas (`/painel`)
- ✅ Código único de orçamento (MD-XXXX-XXXX)
- ✅ URL shortener com múltiplos serviços
- ✅ Validação de telefone e data melhorada
- ✅ Lista de empresas na mensagem final
- ✅ Design premium na landing page

---

## 🆘 Suporte

### Problemas Comuns

1. **Bot não responde**: Verificar PM2 no VPS
2. **Orçamento não salva**: Verificar logs do Supabase
3. **IA não calcula**: Verificar chave OpenAI
4. **Empresas não notificadas**: Verificar estado de destino

### Logs

- **Vercel**: Dashboard → Deployments → Functions
- **VPS**: `pm2 logs whatsapp-webhook`
- **Supabase**: Dashboard → Logs

---

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

## 👥 Equipe

**MudaTech** - Conectando pessoas às melhores empresas de mudança do Brasil

---

**Última atualização**: Janeiro 2025  
**Versão**: 2.0.0
