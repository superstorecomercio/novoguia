# 📤 Como Adicionar vps-code ao GitHub

## 📋 Situação Atual

- ✅ Repositório Git já configurado
- ✅ Remote GitHub: `https://github.com/superstorecomercio/novoguia.git`
- ✅ Branch: `master`
- ✅ **vps-code já está rastreado pelo Git!**
- ✅ Todos os arquivos já estão commitados

## 🚀 Passo a Passo

### Opção 1: Adicionar ao Repositório Atual (Recomendado)

Se você quer manter o código da VPS no mesmo repositório do projeto principal:

#### 1. Verificar se vps-code já está rastreado

```bash
git status vps-code/
```

Se aparecer "Untracked files", significa que não está sendo rastreado.

#### 2. Adicionar arquivos da VPS

```bash
# Adicionar toda a pasta vps-code
git add vps-code/

# Verificar o que será commitado
git status
```

#### 3. Fazer commit

```bash
git commit -m "feat: adicionar código do bot WhatsApp (VPS)"
```

#### 4. Fazer push para GitHub

```bash
git push origin master
```

### Opção 2: Criar Repositório Separado (Alternativa)

Se você preferir manter o código da VPS em um repositório separado:

#### 1. Criar novo repositório no GitHub

1. Acesse: https://github.com/new
2. Nome: `mudatech-whatsapp-bot` (ou outro nome)
3. Descrição: "Bot WhatsApp para cotação de mudanças - MudaTech"
4. **NÃO** inicialize com README, .gitignore ou license
5. Clique em "Create repository"

#### 2. Inicializar Git na pasta vps-code

```bash
cd vps-code
git init
git add .
git commit -m "Initial commit: código do bot WhatsApp"
```

#### 3. Adicionar remote e fazer push

```bash
# Substitua USERNAME pelo seu usuário do GitHub
git remote add origin https://github.com/USERNAME/mudatech-whatsapp-bot.git
git branch -M main
git push -u origin main
```

## ⚠️ Importante: Arquivos Sensíveis

### Verificar antes de fazer commit

Certifique-se de que **NÃO** há arquivos sensíveis na pasta `vps-code`:

```bash
# Verificar se há arquivos .env
find vps-code/ -name ".env*" -type f

# Verificar se há chaves privadas
find vps-code/ -name "*.pem" -o -name "*key*" -o -name "*secret*"
```

### Adicionar ao .gitignore (se necessário)

Se houver arquivos sensíveis, adicione ao `.gitignore` na raiz do projeto:

```bash
# Adicionar ao .gitignore
echo "vps-code/codigo/.env" >> .gitignore
echo "vps-code/codigo/*.pem" >> .gitignore
echo "vps-code/codigo/node_modules/" >> .gitignore
```

## 📝 Estrutura Recomendada no GitHub

```
guia-de-mudancas-next/
├── app/
├── lib/
├── docs/
├── vps-code/              ← Código da VPS
│   ├── codigo/
│   │   ├── server.js
│   │   ├── message-handler.js
│   │   ├── whatsapp.js
│   │   ├── supabase-service.js
│   │   ├── openai-service.js
│   │   ├── sessions.js
│   │   ├── url-shortener.js
│   │   ├── telefone-validator.js
│   │   ├── date-validator.js
│   │   ├── package.json
│   │   └── ...
│   ├── README.md
│   ├── DOCUMENTACAO-COMPLETA.md
│   └── ...
└── ...
```

## 🔒 Segurança

### O que NÃO deve ir para o GitHub:

- ❌ Arquivos `.env` com credenciais
- ❌ Chaves privadas (`.pem`, `*.key`)
- ❌ Tokens de API
- ❌ Senhas
- ❌ Certificados SSL

### O que PODE ir para o GitHub:

- ✅ Código fonte (`.js`, `.ts`)
- ✅ `package.json` (sem credenciais)
- ✅ Documentação (`.md`)
- ✅ Scripts de configuração
- ✅ `.env.example` (template sem valores reais)

## 🎯 Recomendação

**Recomendo a Opção 1** (mesmo repositório) porque:
- ✅ Tudo fica centralizado
- ✅ Facilita sincronização entre código local e VPS
- ✅ Histórico unificado
- ✅ Mais fácil de manter

## 📋 Checklist Final

- [ ] Verificar se há arquivos sensíveis em `vps-code/`
- [ ] Adicionar `vps-code/` ao Git
- [ ] Fazer commit
- [ ] Fazer push para GitHub
- [ ] Verificar no GitHub se os arquivos apareceram
- [ ] Criar `.env.example` na pasta `vps-code/codigo/` (template)

## 🔄 Após Adicionar ao GitHub

### Para sincronizar da VPS para local:

```bash
# Usar o script de sincronização
./scripts/sincronizar-vps.sh
```

### Para fazer deploy do local para VPS:

```bash
# Usar o script de deploy
./scripts/deploy-vps.sh
```

