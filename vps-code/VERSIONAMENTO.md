# 📦 Sistema de Versionamento VPS

**Objetivo:** Manter sincronizado o código da VPS com o projeto local

---

## 🎯 Estratégia Recomendada

### Opção 1: Git na VPS (RECOMENDADO) ⭐

**Vantagens:**
- ✅ Histórico completo de alterações
- ✅ Fácil rollback
- ✅ Sincronização automática
- ✅ Backup automático

**Como funciona:**
1. VPS tem repositório Git local
2. Você faz alterações via terminal
3. Commita na VPS
4. Pull do projeto local para ver alterações

### Opção 2: Arquivo de Versão + Changelog

**Vantagens:**
- ✅ Simples
- ✅ Não precisa Git
- ✅ Fácil de entender

**Como funciona:**
1. Arquivo `VERSION.txt` na VPS com número da versão
2. Arquivo `CHANGELOG.md` com histórico
3. Sempre atualizar ao fazer alterações

---

## 🚀 Implementação: Git na VPS

### Passo 1: Inicializar Git na VPS

```bash
# 1. Conectar na VPS
ssh root@38.242.148.169

# 2. Ir para diretório da aplicação
cd /home/whatsapp-webhook

# 3. Inicializar Git (se ainda não tiver)
git init

# 4. Configurar Git
git config user.name "VPS Bot"
git config user.email "vps@mudatech.com"

# 5. Criar .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
*.log
.DS_Store
backup-*.tar.gz
EOF

# 6. Primeiro commit
git add .
git commit -m "Versão inicial - $(date +%Y-%m-%d)"
```

### Passo 2: Criar Script de Atualização

```bash
# Criar script para atualizar versão
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
    
    # Incrementar patch
    PATCH=$((PATCH + 1))
    NEW_VERSION="$MAJOR.$MINOR.$PATCH"
else
    NEW_VERSION="1.0.0"
fi

# Atualizar arquivo de versão
echo $NEW_VERSION > $VERSION_FILE

# Criar changelog se não existir
if [ ! -f "$CHANGELOG_FILE" ]; then
    cat > $CHANGELOG_FILE << 'CHANGELOG'
# Changelog - VPS WhatsApp Bot

## [1.0.0] - 2025-01-23
### Inicial
- Versão inicial do sistema

CHANGELOG
fi

# Adicionar entrada no changelog
echo "" >> $CHANGELOG_FILE
echo "## [$NEW_VERSION] - $(date +%Y-%m-%d)" >> $CHANGELOG_FILE
echo "### Alterações" >> $CHANGELOG_FILE
echo "- $1" >> $CHANGELOG_FILE

# Commit
git add .
git commit -m "v$NEW_VERSION: $1"

echo "✅ Versão atualizada para $NEW_VERSION"
echo "📝 Commit criado: $1"
EOF

# Dar permissão de execução
chmod +x /home/whatsapp-webhook/atualizar-versao.sh
```

### Passo 3: Usar o Script

```bash
# Sempre que fizer alteração, use o script:
cd /home/whatsapp-webhook
./atualizar-versao.sh "Alterada mensagem de boas-vindas"

# Isso vai:
# 1. Incrementar versão (ex: 1.0.0 → 1.0.1)
# 2. Atualizar CHANGELOG.md
# 3. Fazer commit
```

### Passo 4: Ver Histórico

```bash
# Ver commits
cd /home/whatsapp-webhook
git log --oneline

# Ver diferenças
git diff

# Ver versão atual
cat VERSION.txt
```

---

## 📋 Arquivo de Versão Manual

Se preferir não usar Git, use este método:

### Criar Arquivo de Versão

```bash
# Na VPS
cd /home/whatsapp-webhook
echo "1.0.0" > VERSION.txt
```

### Criar Changelog

```bash
# Na VPS
cat > /home/whatsapp-webhook/CHANGELOG.md << 'EOF'
# Changelog - VPS WhatsApp Bot

## [1.0.0] - 2025-01-23
### Inicial
- Versão inicial do sistema
EOF
```

### Atualizar Manualmente

Sempre que fizer alteração:

```bash
# 1. Editar VERSION.txt
nano /home/whatsapp-webhook/VERSION.txt
# Alterar: 1.0.0 → 1.0.1

# 2. Editar CHANGELOG.md
nano /home/whatsapp-webhook/CHANGELOG.md
# Adicionar nova entrada
```

---

## 🔄 Sincronização com Projeto Local

### Método 1: Pull Manual (Recomendado)

**No projeto local:**

```bash
# 1. Baixar código da VPS
scp -r root@38.242.148.169:/home/whatsapp-webhook/* ./vps-code/codigo/

# 2. Verificar diferenças
git diff vps-code/codigo/

# 3. Commit se necessário
git add vps-code/
git commit -m "Sincronizado código VPS v$(ssh root@38.242.148.169 'cat /home/whatsapp-webhook/VERSION.txt')"
```

### Método 2: Script de Sincronização

**Criar script no projeto local:**

```bash
# Criar script
cat > scripts/sincronizar-vps.sh << 'EOF'
#!/bin/bash
# Script para sincronizar código da VPS com projeto local

VPS_USER="root"
VPS_IP="38.242.148.169"
VPS_PATH="/home/whatsapp-webhook"
LOCAL_PATH="./vps-code/codigo"

echo "🔄 Sincronizando código da VPS..."

# Baixar arquivos
scp -r $VPS_USER@$VPS_IP:$VPS_PATH/*.js $LOCAL_PATH/
scp $VPS_USER@$VPS_IP:$VPS_PATH/package.json $LOCAL_PATH/
scp $VPS_USER@$VPS_IP:$VPS_PATH/VERSION.txt $LOCAL_PATH/ 2>/dev/null || echo "VERSION.txt não encontrado"
scp $VPS_USER@$VPS_IP:$VPS_PATH/CHANGELOG.md $LOCAL_PATH/ 2>/dev/null || echo "CHANGELOG.md não encontrado"

# Pegar versão atual
VERSION=$(ssh $VPS_USER@$VPS_IP "cat $VPS_PATH/VERSION.txt 2>/dev/null || echo '1.0.0'")

echo "✅ Sincronização concluída!"
echo "📦 Versão atual da VPS: $VERSION"
echo ""
echo "📝 Próximos passos:"
echo "   1. Verificar diferenças: git diff $LOCAL_PATH/"
echo "   2. Commit se necessário: git add $LOCAL_PATH/ && git commit -m 'Sincronizado VPS v$VERSION'"
EOF

chmod +x scripts/sincronizar-vps.sh
```

**Usar o script:**

```bash
# Executar sincronização
./scripts/sincronizar-vps.sh
```

---

## 📝 Workflow Recomendado

### Quando Fazer Alteração na VPS:

```bash
# 1. Conectar na VPS
ssh root@38.242.148.169

# 2. Fazer backup
cd /home/whatsapp-webhook
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz *.js .env

# 3. Fazer alteração
nano message-handler.js
# ... editar ...

# 4. Testar
pm2 restart whatsapp-webhook
pm2 logs whatsapp-webhook

# 5. Atualizar versão
./atualizar-versao.sh "Descrição da alteração"

# 6. Verificar
cat VERSION.txt
git log --oneline -1
```

### Depois, no Projeto Local:

```bash
# 1. Sincronizar código
./scripts/sincronizar-vps.sh

# 2. Verificar diferenças
git diff vps-code/codigo/

# 3. Commit
git add vps-code/
git commit -m "Sincronizado VPS - $(cat vps-code/codigo/VERSION.txt)"
```

---

## 📊 Estrutura de Arquivos

### Na VPS:

```
/home/whatsapp-webhook/
├── server.js
├── message-handler.js
├── sessions.js
├── whatsapp.js
├── openai-service.js
├── supabase-service.js
├── package.json
├── .env
├── VERSION.txt          ← Versão atual
├── CHANGELOG.md         ← Histórico
├── atualizar-versao.sh  ← Script de atualização
└── .git/                ← Repositório Git (se usar)
```

### No Projeto Local:

```
vps-code/
├── codigo/
│   ├── server.js
│   ├── message-handler.js
│   ├── ...
│   ├── VERSION.txt      ← Sincronizado da VPS
│   └── CHANGELOG.md     ← Sincronizado da VPS
├── VERSIONAMENTO.md     ← Este arquivo
└── ...
```

---

## 🔍 Como Verificar Versão Atual

### Na VPS:

```bash
# Ver versão
cat /home/whatsapp-webhook/VERSION.txt

# Ver último commit (se usar Git)
cd /home/whatsapp-webhook
git log --oneline -1

# Ver changelog
cat /home/whatsapp-webhook/CHANGELOG.md
```

### No Projeto Local:

```bash
# Ver versão sincronizada
cat vps-code/codigo/VERSION.txt

# Ver quando foi sincronizado
git log --oneline vps-code/codigo/VERSION.txt | head -1
```

---

## ⚠️ Importante

1. **Sempre atualize a versão** após fazer alteração
2. **Sempre sincronize** no projeto local após alterar na VPS
3. **Sempre faça backup** antes de alterar
4. **Sempre teste** antes de commitar

---

## 🎯 Resumo

**Workflow Completo:**

1. **Alterar na VPS** → Editar arquivo → Testar → Atualizar versão
2. **Sincronizar local** → Baixar código → Verificar → Commit
3. **Documentar** → Atualizar INTEGRACAO_VPS_NEXTJS_COMPLETA.md se necessário

**Comandos Rápidos:**

```bash
# VPS: Atualizar versão
./atualizar-versao.sh "Descrição"

# Local: Sincronizar
./scripts/sincronizar-vps.sh
```

---

**Última atualização:** 2025-01-23

