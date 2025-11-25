# 🔗 Integração Completa: VPS WhatsApp Bot + Next.js

**Data:** 2025-01-23  
**Status:** ✅ Documentação completa para manutenção

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura Completa](#arquitetura-completa)
3. [Fluxo de Dados](#fluxo-de-dados)
4. [Mapeamento de Dados](#mapeamento-de-dados)
5. [Sistema de Versionamento](#sistema-de-versionamento) ⭐ NOVO
6. [Guia de Alterações](#guia-de-alterações)
7. [Comandos VPS](#comandos-vps)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

### Dois Sistemas Paralelos

**Sistema 1: VPS (WhatsApp Bot)**
- Recebe mensagens do WhatsApp via Facebook API
- Processa conversa com bot Julia (10 perguntas)
- Calcula orçamento com OpenAI
- Salva direto no Supabase

**Sistema 2: Next.js (Site)**
- Calculadora web (`/api/calcular-orcamento`)
- API para webhooks externos (`/api/orcamentos`)
- Salva direto no Supabase

**Ambos usam:**
- ✅ Mesma função SQL: `criar_orcamento_e_notificar()`
- ✅ Mesmo banco de dados: Supabase
- ✅ Mesma estrutura de dados

---

## 🏗️ Arquitetura Completa

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (WhatsApp)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              FACEBOOK WHATSAPP BUSINESS API                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS POST
                       │ https://mudancas.duckdns.org/webhook
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    VPS UBUNTU                                │
│              (38.242.148.169)                                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         NODE.JS APPLICATION                          │  │
│  │  server.js → message-handler.js → supabase-service.js│  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          │ RPC Call
                          │ criar_orcamento_e_notificar()
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE (PostgreSQL)                          │
│  • Tabela: orcamentos                                       │
│  • Função SQL: criar_orcamento_e_notificar()               │
│  • Tabela: orcamentos_campanhas                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ (mesma função SQL)
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS (Site)                                 │
│  • /api/calcular-orcamento (calculadora web)               │
│  • /api/orcamentos (webhooks externos)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Dados

### VPS (WhatsApp Bot)

```
1. Cliente envia "oi" no WhatsApp
   ↓
2. Facebook → POST /webhook (VPS)
   ↓
3. server.js extrai mensagem
   ↓
4. message-handler.js processa
   - Cria sessão
   - Faz 10 perguntas sequenciais
   ↓
5. Após todas respostas:
   - Chama OpenAI (calcula preço + extrai estado)
   - Chama supabase-service.js
   ↓
6. supabase-service.js:
   - Monta payload com estadoDestino (da IA)
   - Chama criar_orcamento_e_notificar()
   ↓
7. Função SQL:
   - Salva orçamento
   - Busca campanhas do estado_destino
   - Cria vínculos
   - Atualiza hotsites_notificados
```

### Next.js (Site)

#### Calculadora Web (`/api/calcular-orcamento`)

```
1. Usuário preenche formulário no site
   ↓
2. Frontend → POST /api/calcular-orcamento
   ↓
3. API chama OpenAI (calcula preço + extrai estado)
   ↓
4. Chama criarOrcamentoENotificar()
   ↓
5. Função SQL (mesma da VPS)
```

#### Webhook Externo (`/api/orcamentos`)

```
1. Webhook externo → POST /api/orcamentos
   ↓
2. API recebe dados já estruturados
   ↓
3. Chama criarOrcamentoENotificar()
   - ⚠️ Depende de estadoDestino vir no payload
   ↓
4. Função SQL (mesma da VPS)
```

---

## 📊 Mapeamento de Dados

### VPS → Supabase

**Dados coletados na conversa:**
```javascript
// sessions.js (em memória)
{
  origem: "São Paulo",
  destino: "Rio de Janeiro",
  tipo_imovel: "2_quartos",
  tem_elevador: true,
  precisa_embalagem: true,
  nome: "João",
  email: "joao@email.com",
  whatsapp: "5511999999999",
  data_estimada: "2025-12-01",
  lista_objetos: "Sofá, geladeira..."
}
```

**Após OpenAI (`openai-service.js`):**
```javascript
{
  distanciaKm: 432,
  precoMin: 6000,
  precoMax: 8500,
  explicacao: "...",
  cidadeOrigem: "São Paulo",    // ✅ Extraído pela IA
  estadoOrigem: "SP",            // ✅ Extraído pela IA
  cidadeDestino: "Rio de Janeiro", // ✅ Extraído pela IA
  estadoDestino: "RJ"            // ✅ Extraído pela IA
}
```

**Payload para Supabase (`supabase-service.js`):**
```javascript
{
  nome_cliente: "João",
  email_cliente: "joao@email.com",
  telefone_cliente: "5511999999999",
  whatsapp: "5511999999999",
  origem_completo: "São Paulo",
  destino_completo: "Rio de Janeiro",
  estado_origem: "SP",           // ✅ Da IA
  cidade_origem: "São Paulo",    // ✅ Da IA
  estado_destino: "RJ",          // ✅ Da IA (CRÍTICO!)
  cidade_destino: "Rio de Janeiro", // ✅ Da IA
  tipo_imovel: "2_quartos",
  tem_elevador: true,
  andar: 1,
  precisa_embalagem: true,
  distancia_km: 432,
  preco_min: 6000,
  preco_max: 8500,
  mensagem_ia: "...",
  lista_objetos: "Sofá, geladeira...",
  data_estimada: "2025-12-01",
  origem_formulario: 'whatsapp',  // ✅ Identificador
  user_agent: 'WhatsApp Bot API',
  ip_cliente: null
}
```

### Next.js → Supabase

**Calculadora Web (`/api/calcular-orcamento`):**
```javascript
// Após OpenAI
{
  estadoOrigem: "SP",        // ✅ Da IA
  estadoDestino: "SP",       // ✅ Da IA
  cidadeOrigem: "São Paulo", // ✅ Da IA
  cidadeDestino: "Guarulhos", // ✅ Da IA
  precoMin: 850,
  precoMax: 1150,
  distanciaKm: 12
}

// Payload para Supabase
{
  origemFormulario: 'calculadora',
  estadoDestino: "SP",  // ✅ Sempre presente
  // ...
}
```

**Webhook Externo (`/api/orcamentos`):**
```javascript
// Recebe do webhook
{
  nomeCliente: "João",
  cidadeDestino: "Guarulhos",
  estadoDestino: "SP"  // ⚠️ Pode não vir!
}

// Payload para Supabase
{
  origemFormulario: 'formulario_simples',
  estadoDestino: "SP" || undefined,  // ⚠️ Pode estar vazio
  // ...
}
```

---

## 📦 Sistema de Versionamento

### ⚠️ IMPORTANTE: Como Manter Sincronizado

**Problema:** Quando você altera código na VPS, como eu (assistente) sei qual é a versão atual?

**Solução:** Sistema de versionamento + sincronização

### 🔄 Entendendo o Fluxo

**⚠️ IMPORTANTE:** Git na VPS é **LOCAL** (não sobe automaticamente!)

**Fluxo:**
1. Você altera código na VPS → Atualiza versão (commit LOCAL na VPS)
2. Você sincroniza → Copia arquivos da VPS para projeto local (via SCP)
3. Você commita no projeto → Versiona no Git do projeto (pode fazer push para GitHub)

**Veja documentação completa:** `docs/FLUXO_VERSIONAMENTO_VPS.md`

### Método Recomendado: Git na VPS + Script de Sincronização

#### 1. Configurar Git na VPS (Primeira vez)

```bash
# Conectar na VPS
ssh root@38.242.148.169

# Ir para diretório
cd /home/whatsapp-webhook

# Inicializar Git
git init
git config user.name "VPS Bot"
git config user.email "vps@mudatech.com"

# Criar .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
*.log
.DS_Store
backup-*.tar.gz
EOF

# Criar arquivo de versão
echo "1.0.0" > VERSION.txt

# Primeiro commit
git add .
git commit -m "Versão inicial - $(date +%Y-%m-%d)"
```

#### 2. Criar Script de Atualização de Versão

```bash
# Na VPS, criar script
cat > /home/whatsapp-webhook/atualizar-versao.sh << 'EOF'
#!/bin/bash
# Script para atualizar versão e fazer commit

VERSION_FILE="VERSION.txt"
CHANGELOG_FILE="CHANGELOG.md"

# Ler versão atual
if [ -f "$VERSION_FILE" ]; then
    CURRENT_VERSION=$(cat $VERSION_FILE)
    MAJOR=$(echo $CURRENT_VERSION | cut -d. -f1)
    MINOR=$(echo $CURRENT_VERSION | cut -d. -f2)
    PATCH=$(echo $CURRENT_VERSION | cut -d. -f3)
    PATCH=$((PATCH + 1))
    NEW_VERSION="$MAJOR.$MINOR.$PATCH"
else
    NEW_VERSION="1.0.0"
fi

# Atualizar versão
echo $NEW_VERSION > $VERSION_FILE

# Atualizar changelog
if [ ! -f "$CHANGELOG_FILE" ]; then
    cat > $CHANGELOG_FILE << 'CHANGELOG'
# Changelog - VPS WhatsApp Bot

## [1.0.0] - 2025-01-23
### Inicial
- Versão inicial do sistema
CHANGELOG
fi

echo "" >> $CHANGELOG_FILE
echo "## [$NEW_VERSION] - $(date +%Y-%m-%d)" >> $CHANGELOG_FILE
echo "### Alterações" >> $CHANGELOG_FILE
echo "- $1" >> $CHANGELOG_FILE

# Commit
git add .
git commit -m "v$NEW_VERSION: $1"

echo "✅ Versão atualizada para $NEW_VERSION"
EOF

chmod +x /home/whatsapp-webhook/atualizar-versao.sh
```

#### 3. Usar o Script (Sempre que alterar)

```bash
# Após fazer alteração na VPS:
cd /home/whatsapp-webhook
./atualizar-versao.sh "Descrição da alteração"

# Exemplo:
./atualizar-versao.sh "Alterada mensagem de boas-vindas"
```

#### 4. Sincronizar no Projeto Local

**No projeto local, execute:**

```bash
# Usar script de sincronização
./scripts/sincronizar-vps.sh

# Ou manualmente:
scp -r root@38.242.148.169:/home/whatsapp-webhook/* ./vps-code/codigo/
```

### Workflow Completo

```
1. Você altera código na VPS (via terminal)
   ↓
2. Testa (pm2 restart whatsapp-webhook)
   ↓
3. Atualiza versão (./atualizar-versao.sh "Descrição")
   ↓
4. Sincroniza no projeto local (./scripts/sincronizar-vps.sh)
   ↓
5. Eu (assistente) vejo a versão atual em vps-code/codigo/VERSION.txt
```

### Verificar Versão Atual

**Na VPS:**
```bash
cat /home/whatsapp-webhook/VERSION.txt
```

**No projeto local:**
```bash
cat vps-code/codigo/VERSION.txt
```

### Documentação Completa

Veja `vps-code/VERSIONAMENTO.md` para documentação completa do sistema de versionamento.

---

## ✏️ Métodos de Edição

### ⚠️ Você pode editar de duas formas:

**Opção 1: Editar direto na VPS (via terminal)**
- ✅ Rápido para alterações simples
- ❌ Sem IDE/autocomplete
- Use quando: alteração simples (1-2 linhas)

**Opção 2: Editar no projeto local + Deploy (RECOMENDADO) ⭐**
- ✅ IDE completo (VS Code, Cursor)
- ✅ Mais fácil para alterações complexas
- Use quando: alteração complexa ou múltiplos arquivos

**📋 Configuração Inicial:**
- Execute: `./scripts/setup-vps-edicao-local.sh` (configura tudo automaticamente)
- Ou siga: `docs/CONFIGURACAO_INICIAL.md` (passo a passo manual)

**Veja documentação completa:** 
- `docs/CONFIGURACAO_INICIAL.md` - ⭐ Setup inicial (comece aqui!)
- `docs/METODOS_EDICAO_VPS.md` - Métodos de edição
- `docs/FLUXO_EDICAO_LOCAL.md` - Fluxo completo: Editar → Git → Deploy

---

## 🔧 Guia de Alterações

### Quando alterar algo, você precisa mudar em:

1. **VPS** (se afetar bot WhatsApp)
2. **Next.js** (se afetar site/webhooks)
3. **Função SQL** (se afetar salvamento)

---

## 📝 Alterações Comuns

### 1. Adicionar Nova Pergunta no Bot

**O que muda:**
- VPS: `sessions.js` e `message-handler.js`
- Next.js: Nada (bot é só na VPS)

**Passos:**

#### Na VPS (via terminal):

```bash
# 1. Conectar na VPS
ssh root@38.242.148.169

# 2. Editar sessions.js
nano /home/whatsapp-webhook/sessions.js

# Adicionar nova pergunta no enum PERGUNTAS:
const PERGUNTAS = {
  // ... existentes
  NOVA_PERGUNTA: 'nova_pergunta'  // ← ADICIONAR
};

# Adicionar na ordem:
const ORDEM_ETAPAS = [
  // ... existentes
  PERGUNTAS.NOVA_PERGUNTA  // ← ADICIONAR
];

# Salvar: Ctrl+O, Enter, Ctrl+X

# 3. Editar message-handler.js
nano /home/whatsapp-webhook/message-handler.js

# Adicionar lógica da nova pergunta:
else if (etapa === PERGUNTAS.NOVA_PERGUNTA) {
  atualizarSessao(from, { nova_pergunta: mensagem });
  proximaEtapa(from);
  await enviarMensagem(from, 'Nova pergunta aqui?');
}

# Salvar: Ctrl+O, Enter, Ctrl+X

# 4. Atualizar supabase-service.js (se necessário)
nano /home/whatsapp-webhook/supabase-service.js

# Adicionar campo no payload:
const payload = {
  // ... existentes
  nova_pergunta: dados.nova_pergunta,  // ← ADICIONAR
};

# Salvar: Ctrl+O, Enter, Ctrl+X

# 5. Reiniciar aplicação
pm2 restart whatsapp-webhook

# 6. Verificar logs
pm2 logs whatsapp-webhook
```

#### No Next.js (se necessário):

```typescript
// app/api/calcular-orcamento/route.ts
// Adicionar campo se necessário
```

---

### 2. Alterar Mensagens do Bot

**O que muda:**
- VPS: `message-handler.js`

**Passos na VPS:**

```bash
# 1. Conectar na VPS
ssh root@38.242.148.169

# 2. Editar message-handler.js
nano /home/whatsapp-webhook/message-handler.js

# 3. Localizar mensagem e alterar
# Exemplo: Mensagem de boas-vindas (linha ~130)
await enviarMensagem(from, '👋 Olá! Sou a *Julia*!\n\n...');

# 4. Salvar: Ctrl+O, Enter, Ctrl+X

# 5. Reiniciar
pm2 restart whatsapp-webhook

# 6. Testar enviando "oi" no WhatsApp
```

---

### 3. Alterar Cálculo de Preços (OpenAI)

**O que muda:**
- VPS: `openai-service.js`
- Next.js: `app/api/calcular-orcamento/route.ts` (função `calcularOrcamentoComIA`)

**Passos:**

#### Na VPS:

```bash
# 1. Conectar na VPS
ssh root@38.242.148.169

# 2. Editar openai-service.js
nano /home/whatsapp-webhook/openai-service.js

# 3. Alterar prompt da IA (linha ~15-66)
# Exemplo: Alterar regras de precificação
const prompt = `
REGRAS DE PRECIFICAÇÃO (mercado brasileiro real):

1. BASE POR TIPO DE IMÓVEL:
   - kitnet: R$ 600 - R$ 1.200  ← ALTERAR AQUI
   ...
`;

# 4. Salvar: Ctrl+O, Enter, Ctrl+X

# 5. Reiniciar
pm2 restart whatsapp-webhook
```

#### No Next.js:

```typescript
// app/api/calcular-orcamento/route.ts
// Alterar função calcularOrcamentoComIA() (mesmo prompt)
```

---

### 4. Alterar Estrutura de Dados no Banco

**O que muda:**
- Função SQL: `criar_orcamento_e_notificar()`
- VPS: `supabase-service.js` (payload)
- Next.js: `lib/db/queries/orcamentos.ts` (payload)

**Passos:**

#### 1. Alterar Função SQL (Supabase):

```sql
-- supabase/migrations/XXX_nova_migration.sql
ALTER TABLE orcamentos ADD COLUMN novo_campo VARCHAR(255);

-- Atualizar função criar_orcamento_e_notificar()
-- Adicionar campo no INSERT
```

#### 2. Atualizar VPS:

```bash
# 1. Conectar na VPS
ssh root@38.242.148.169

# 2. Editar supabase-service.js
nano /home/whatsapp-webhook/supabase-service.js

# 3. Adicionar campo no payload:
const payload = {
  // ... existentes
  novo_campo: dados.novo_campo,  // ← ADICIONAR
};

# 4. Salvar: Ctrl+O, Enter, Ctrl+X

# 5. Reiniciar
pm2 restart whatsapp-webhook
```

#### 3. Atualizar Next.js:

```typescript
// lib/db/queries/orcamentos.ts
// Adicionar campo no orcamentoData
```

---

### 5. Alterar Validações

**O que muda:**
- VPS: `message-handler.js` (funções `validarEmail`, `validarData`)
- Next.js: `app/api/orcamentos/route.ts` (validações)

**Passos na VPS:**

```bash
# 1. Conectar na VPS
ssh root@38.242.148.169

# 2. Editar message-handler.js
nano /home/whatsapp-webhook/message-handler.js

# 3. Localizar função de validação (linha ~65-103)
function validarEmail(email) {
  // Alterar regex ou lógica
}

# 4. Salvar: Ctrl+O, Enter, Ctrl+X

# 5. Reiniciar
pm2 restart whatsapp-webhook
```

---

### 6. Alterar Ordem das Perguntas

**O que muda:**
- VPS: `sessions.js` (ORDEM_ETAPAS)

**Passos na VPS:**

```bash
# 1. Conectar na VPS
ssh root@38.242.148.169

# 2. Editar sessions.js
nano /home/whatsapp-webhook/sessions.js

# 3. Alterar ordem em ORDEM_ETAPAS (linha ~24-35)
const ORDEM_ETAPAS = [
  PERGUNTAS.ORIGEM,
  PERGUNTAS.DESTINO,
  PERGUNTAS.NOME,      // ← MOVER para antes
  PERGUNTAS.EMAIL,
  // ...
];

# 4. Salvar: Ctrl+O, Enter, Ctrl+X

# 5. Atualizar message-handler.js se necessário
nano /home/whatsapp-webhook/message-handler.js

# 6. Reiniciar
pm2 restart whatsapp-webhook
```

---

### 7. Adicionar Novo Campo no Formulário

**Exemplo: Adicionar campo "Observações"**

#### Na VPS:

```bash
# 1. Conectar na VPS
ssh root@38.242.148.169

# 2. Editar sessions.js
nano /home/whatsapp-webhook/sessions.js

# Adicionar no enum:
const PERGUNTAS = {
  // ... existentes
  OBSERVACOES: 'observacoes'
};

# Adicionar na ordem:
const ORDEM_ETAPAS = [
  // ... existentes
  PERGUNTAS.OBSERVACOES
];

# Salvar: Ctrl+O, Enter, Ctrl+X

# 3. Editar message-handler.js
nano /home/whatsapp-webhook/message-handler.js

# Adicionar lógica:
else if (etapa === PERGUNTAS.OBSERVACOES) {
  atualizarSessao(from, { observacoes: mensagem });
  proximaEtapa(from);
  await finalizarOrcamento(from);
}

# Salvar: Ctrl+O, Enter, Ctrl+X

# 4. Editar supabase-service.js
nano /home/whatsapp-webhook/supabase-service.js

# Adicionar no payload:
const payload = {
  // ... existentes
  observacoes: dados.observacoes || null,
};

# Salvar: Ctrl+O, Enter, Ctrl+X

# 5. Reiniciar
pm2 restart whatsapp-webhook
```

#### No Next.js:

```typescript
// app/types.ts
export interface OrcamentoFormData {
  // ... existentes
  observacoes?: string;  // ← ADICIONAR
}

// app/api/orcamentos/route.ts
const dadosOrcamento = {
  // ... existentes
  observacoes: formData.observacoes || undefined,
};

// lib/db/queries/orcamentos.ts
const orcamentoData = {
  // ... existentes
  observacoes: dados.observacoes || null,
};
```

#### No Banco (SQL):

```sql
-- Adicionar coluna
ALTER TABLE orcamentos ADD COLUMN observacoes TEXT;

-- Atualizar função (se necessário)
-- Adicionar campo no INSERT da função criar_orcamento_e_notificar()
```

---

## 🖥️ Comandos VPS (Referência Rápida)

### Conectar na VPS

```bash
ssh root@38.242.148.169
```

### Navegar para aplicação

```bash
cd /home/whatsapp-webhook
```

### Editar arquivos

```bash
# Editar arquivo
nano nome-do-arquivo.js

# Comandos do nano:
# Ctrl+O = Salvar
# Enter = Confirmar
# Ctrl+X = Sair
# Ctrl+W = Buscar
```

### Gerenciar aplicação (PM2)

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs whatsapp-webhook

# Ver últimas 100 linhas
pm2 logs whatsapp-webhook --lines 100

# Reiniciar
pm2 restart whatsapp-webhook

# Parar
pm2 stop whatsapp-webhook

# Iniciar
pm2 start whatsapp-webhook

# Recarregar (zero downtime)
pm2 reload whatsapp-webhook
```

### Verificar arquivos

```bash
# Listar arquivos
ls -la

# Ver conteúdo de arquivo
cat nome-do-arquivo.js

# Ver últimas linhas
tail -n 50 nome-do-arquivo.js

# Buscar texto em arquivo
grep "texto" nome-do-arquivo.js
```

### Backup

```bash
# Backup do código
cd /home/whatsapp-webhook
tar -czf backup-$(date +%Y%m%d).tar.gz *.js .env

# Backup do .env (importante!)
cp .env .env.backup-$(date +%Y%m%d)
```

### Testar webhook

```bash
# Health check
curl https://mudancas.duckdns.org/

# Ver logs em tempo real enquanto testa
pm2 logs whatsapp-webhook
```

---

## 🔍 Localização dos Arquivos

### Na VPS:

```
/home/whatsapp-webhook/
├── server.js              # Servidor Express
├── message-handler.js     # Lógica do bot (EDITAR AQUI)
├── sessions.js            # Sessões e ordem das perguntas (EDITAR AQUI)
├── whatsapp.js            # Envia mensagens
├── openai-service.js      # Cálculo com IA (EDITAR AQUI)
├── supabase-service.js    # Salva no banco (EDITAR AQUI)
├── .env                   # Variáveis de ambiente (EDITAR COM CUIDADO)
└── package.json           # Dependências
```

### No Next.js:

```
app/
├── api/
│   ├── calcular-orcamento/
│   │   └── route.ts       # Calculadora web (EDITAR AQUI)
│   └── orcamentos/
│       └── route.ts       # API webhooks (EDITAR AQUI)
└── types.ts               # Tipos TypeScript (EDITAR AQUI)

lib/
└── db/
    └── queries/
        └── orcamentos.ts  # Função TypeScript (EDITAR AQUI)

supabase/
└── migrations/
    └── XXX_*.sql          # Função SQL (EDITAR AQUI)
```

---

## 📋 Checklist de Alterações

Quando você quiser fazer uma alteração, siga este checklist:

### 1. Planejar Alteração

- [ ] O que precisa ser alterado?
- [ ] Afeta VPS, Next.js ou ambos?
- [ ] Precisa alterar banco de dados?
- [ ] Precisa alterar função SQL?

### 2. Verificar Versão Atual

**Na VPS:**
```bash
cat /home/whatsapp-webhook/VERSION.txt
```

**No projeto local:**
```bash
cat vps-code/codigo/VERSION.txt
```

### 3. Fazer Backup

**Na VPS:**
```bash
cd /home/whatsapp-webhook
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz *.js .env
```

**No Next.js:**
```bash
git commit -am "backup antes de alteração"
```

### 4. Fazer Alterações

- [ ] Alterar código na VPS (via terminal)
- [ ] Alterar código no Next.js (via editor)
- [ ] Alterar função SQL (se necessário)
- [ ] Atualizar tipos TypeScript (se necessário)

### 5. Atualizar Versão (VPS)

**Se alterou na VPS:**
```bash
cd /home/whatsapp-webhook
./atualizar-versao.sh "Descrição da alteração"
```

### 6. Sincronizar (Projeto Local)

**Se alterou na VPS:**
```bash
./scripts/sincronizar-vps.sh
```

### 7. Testar

**Na VPS:**
```bash
pm2 restart whatsapp-webhook
pm2 logs whatsapp-webhook
# Testar enviando "oi" no WhatsApp
```

**No Next.js:**
```bash
npm run dev
# Testar no navegador
```

### 8. Verificar

- [ ] Funciona na VPS?
- [ ] Funciona no Next.js?
- [ ] Dados salvam corretamente no banco?
- [ ] `hotsites_notificados` está correto?
- [ ] Versão atualizada? (`cat VERSION.txt`)
- [ ] Código sincronizado? (`git status`)

---

## 🐛 Troubleshooting

### Problema: Alteração não funciona na VPS

**Solução:**
```bash
# 1. Verificar se salvou o arquivo
cat /home/whatsapp-webhook/message-handler.js | grep "sua-alteracao"

# 2. Verificar se reiniciou
pm2 restart whatsapp-webhook

# 3. Ver logs de erro
pm2 logs whatsapp-webhook --err

# 4. Verificar sintaxe JavaScript
node -c /home/whatsapp-webhook/message-handler.js
```

### Problema: Erro de sintaxe

**Solução:**
```bash
# Verificar sintaxe antes de reiniciar
node -c /home/whatsapp-webhook/nome-do-arquivo.js

# Se der erro, corrigir e tentar novamente
```

### Problema: Sessões travadas

**Solução:**
```bash
# Reiniciar limpa todas as sessões
pm2 restart whatsapp-webhook
```

### Problema: Alteração não aparece

**Solução:**
```bash
# 1. Verificar se arquivo foi salvo
ls -la /home/whatsapp-webhook/message-handler.js

# 2. Verificar data de modificação
stat /home/whatsapp-webhook/message-handler.js

# 3. Reiniciar forçado
pm2 delete whatsapp-webhook
pm2 start /home/whatsapp-webhook/server.js --name whatsapp-webhook
```

---

## 📝 Exemplos Práticos

### Exemplo 1: Alterar Mensagem de Boas-Vindas

**O que fazer:**

#### Na VPS:

```bash
# 1. Conectar
ssh root@38.242.148.169

# 2. Editar
nano /home/whatsapp-webhook/message-handler.js

# 3. Localizar linha ~130
# ANTES:
await enviarMensagem(from, '👋 Olá! Sou a *Julia*!\n\nVou calcular...');

# DEPOIS:
await enviarMensagem(from, '👋 Olá! Sou a *Julia* do MudaTech!\n\nVou calcular...');

# 4. Salvar: Ctrl+O, Enter, Ctrl+X

# 5. Reiniciar
pm2 restart whatsapp-webhook

# 6. Testar enviando "oi" no WhatsApp
```

**Resultado:** Mensagem alterada apenas na VPS (bot WhatsApp)

---

### Exemplo 2: Adicionar Campo "Telefone Fixo" (Opcional)

**O que fazer:**

#### 1. Na VPS:

```bash
# 1. Conectar
ssh root@38.242.148.169

# 2. Editar sessions.js
nano /home/whatsapp-webhook/sessions.js

# Adicionar no enum:
const PERGUNTAS = {
  // ... existentes
  TELEFONE_FIXO: 'telefone_fixo'
};

# Adicionar na ordem (após email, por exemplo):
const ORDEM_ETAPAS = [
  PERGUNTAS.ORIGEM,
  PERGUNTAS.DESTINO,
  PERGUNTAS.TIPO_IMOVEL,
  PERGUNTAS.ELEVADOR,
  PERGUNTAS.EMBALAGEM,
  PERGUNTAS.NOME,
  PERGUNTAS.EMAIL,
  PERGUNTAS.TELEFONE_FIXO,  // ← NOVO
  PERGUNTAS.DATA,
  PERGUNTAS.LISTA_OBJETOS,
  PERGUNTAS.LISTA_TEXTO
];

# Salvar: Ctrl+O, Enter, Ctrl+X

# 3. Editar message-handler.js
nano /home/whatsapp-webhook/message-handler.js

# Adicionar após etapa EMAIL:
else if (etapa === PERGUNTAS.EMAIL) {
  if (!validarEmail(mensagem)) {
    await enviarMensagem(from, '❌ E-mail inválido...');
    return;
  }
  atualizarSessao(from, { email: mensagem });
  proximaEtapa(from);
  await enviarMensagem(from, '📞 *Telefone fixo (opcional):*\n\n_(Digite o número ou "pular")_');
}

// NOVA ETAPA:
else if (etapa === PERGUNTAS.TELEFONE_FIXO) {
  const telefoneFixo = mensagem.toLowerCase() === 'pular' ? null : mensagem;
  atualizarSessao(from, { telefone_fixo: telefoneFixo });
  proximaEtapa(from);
  await enviarMensagem(from, '📅 *Qual a data estimada da mudança?* _(opcional)_\n\n_(Digite no formato DD/MM/AAAA ou "pular")_');
}

# Salvar: Ctrl+O, Enter, Ctrl+X

# 4. Editar supabase-service.js
nano /home/whatsapp-webhook/supabase-service.js

# Adicionar no payload:
const payload = {
  // ... existentes
  telefone_fixo: dados.telefone_fixo || null,
};

# Salvar: Ctrl+O, Enter, Ctrl+X

# 5. Reiniciar
pm2 restart whatsapp-webhook
```

#### 2. No Banco (SQL):

```sql
-- Adicionar coluna
ALTER TABLE orcamentos ADD COLUMN telefone_fixo VARCHAR(50);

-- Atualizar função criar_orcamento_e_notificar()
-- Adicionar campo no INSERT
```

#### 3. No Next.js:

```typescript
// app/types.ts
export interface OrcamentoFormData {
  // ... existentes
  telefoneFixo?: string;
}

// app/api/orcamentos/route.ts
const dadosOrcamento = {
  // ... existentes
  telefoneFixo: formData.telefoneFixo || undefined,
};

// lib/db/queries/orcamentos.ts
const orcamentoData = {
  // ... existentes
  telefone_fixo: dados.telefoneFixo || null,
};
```

---

### Exemplo 3: Alterar Regras de Precificação

**O que fazer:**

#### Na VPS:

```bash
# 1. Conectar
ssh root@38.242.148.169

# 2. Editar openai-service.js
nano /home/whatsapp-webhook/openai-service.js

# 3. Localizar seção "REGRAS DE PRECIFICAÇÃO" (linha ~27)
# Alterar valores:
1. BASE POR TIPO DE IMÓVEL:
   - kitnet: R$ 700 - R$ 1.300    ← ALTERAR
   - 1_quarto: R$ 900 - R$ 2.200  ← ALTERAR
   ...

# Salvar: Ctrl+O, Enter, Ctrl+X

# 4. Reiniciar
pm2 restart whatsapp-webhook
```

#### No Next.js:

```typescript
// app/api/calcular-orcamento/route.ts
// Alterar função calcularOrcamentoComIA()
// Mesmo prompt, mesmas regras
```

---

## 🔐 Variáveis de Ambiente

### VPS (.env)

**Localização:** `/home/whatsapp-webhook/.env`

**Como editar:**
```bash
# 1. Conectar na VPS
ssh root@38.242.148.169

# 2. Editar .env
nano /home/whatsapp-webhook/.env

# 3. Alterar valor
# ANTES:
WHATSAPP_TOKEN=EAAMQy...antigo

# DEPOIS:
WHATSAPP_TOKEN=EAAMQy...novo

# 4. Salvar: Ctrl+O, Enter, Ctrl+X

# 5. Reiniciar (OBRIGATÓRIO após alterar .env)
pm2 restart whatsapp-webhook
```

**⚠️ IMPORTANTE:** Sempre reiniciar após alterar `.env`!

### Next.js (.env.local)

**Localização:** Raiz do projeto

**Como editar:**
- Via editor de código
- Reiniciar `npm run dev`

---

## 📊 Comparação: Onde Alterar

| Alteração | VPS | Next.js | SQL |
|-----------|-----|---------|-----|
| Mensagens do bot | ✅ | ❌ | ❌ |
| Ordem das perguntas | ✅ | ❌ | ❌ |
| Validações do bot | ✅ | ❌ | ❌ |
| Cálculo de preços | ✅ | ✅ | ❌ |
| Estrutura de dados | ✅ | ✅ | ✅ |
| Função SQL | ❌ | ❌ | ✅ |
| Validações API | ❌ | ✅ | ❌ |
| Interface do site | ❌ | ✅ | ❌ |

---

## 🎯 Resumo: Quando Alterar Onde

### Alterações que afetam APENAS VPS:

- ✅ Mensagens do bot
- ✅ Ordem das perguntas
- ✅ Validações do bot
- ✅ Palavras de ativação

**Comando:**
```bash
ssh root@38.242.148.169
nano /home/whatsapp-webhook/message-handler.js
# ou sessions.js
pm2 restart whatsapp-webhook
```

### Alterações que afetam APENAS Next.js:

- ✅ Interface do site
- ✅ Calculadora web
- ✅ Validações da API

**Comando:**
```bash
# Editar no editor
npm run dev
```

### Alterações que afetam AMBOS:

- ✅ Cálculo de preços (OpenAI)
- ✅ Estrutura de dados
- ✅ Campos do formulário

**Comando:**
```bash
# 1. VPS
ssh root@38.242.148.169
nano /home/whatsapp-webhook/openai-service.js
pm2 restart whatsapp-webhook

# 2. Next.js
# Editar no editor
npm run dev
```

### Alterações que afetam BANCO:

- ✅ Novos campos
- ✅ Função SQL
- ✅ Estrutura de tabelas

**Comando:**
```sql
-- No Supabase SQL Editor
ALTER TABLE orcamentos ADD COLUMN novo_campo VARCHAR(255);
```

---

## 📞 Informações Importantes

### VPS

- **IP:** 38.242.148.169
- **Domínio:** mudancas.duckdns.org
- **Localização código:** `/home/whatsapp-webhook/`
- **Process Manager:** PM2
- **Webhook URL:** `https://mudancas.duckdns.org/webhook`

### Next.js

- **URL produção:** `https://mudatech.vercel.app`
- **API calculadora:** `/api/calcular-orcamento`
- **API webhooks:** `/api/orcamentos`

### Banco de Dados

- **Supabase:** PostgreSQL
- **Função SQL:** `criar_orcamento_e_notificar()`
- **Tabela principal:** `orcamentos`

---

## ✅ Checklist Final

Antes de fazer qualquer alteração:

- [ ] Fazer backup (VPS e Next.js)
- [ ] Entender o que precisa ser alterado
- [ ] Identificar onde alterar (VPS, Next.js, SQL)
- [ ] Fazer alterações
- [ ] Testar
- [ ] Verificar logs
- [ ] Confirmar que funciona

---

## 📚 Arquivos de Referência

### VPS

- `vps-code/codigo/server.js` - Servidor Express
- `vps-code/codigo/message-handler.js` - Lógica do bot
- `vps-code/codigo/sessions.js` - Sessões
- `vps-code/codigo/openai-service.js` - Cálculo IA
- `vps-code/codigo/supabase-service.js` - Salva no banco

### Next.js

- `app/api/calcular-orcamento/route.ts` - Calculadora web
- `app/api/orcamentos/route.ts` - API webhooks
- `lib/db/queries/orcamentos.ts` - Função TypeScript
- `supabase/migrations/028_filtrar_campanhas_por_estado.sql` - Função SQL

---

**Documento criado em:** 2025-01-23  
**Última atualização:** 2025-01-23

**Este documento serve como referência única para todas as alterações futuras!**

