# ⚙️ Setup Completo: Edição Local → Deploy VPS

**Objetivo:** Configurar tudo para trabalhar com edições no projeto local

---

## 📋 Checklist de Configuração

### ✅ Passo 1: Verificar Scripts (Projeto Local)

```bash
# Verificar se scripts existem
ls -la scripts/deploy-vps.sh
ls -la scripts/sincronizar-vps.sh

# Dar permissão de execução (se necessário)
chmod +x scripts/deploy-vps.sh
chmod +x scripts/sincronizar-vps.sh
```

### ✅ Passo 2: Configurar Git na VPS (Primeira Vez)

```bash
# 1. Conectar na VPS
ssh root@38.242.148.169

# 2. Ir para diretório
cd /home/whatsapp-webhook

# 3. Verificar se já tem Git
git status

# Se der erro "not a git repository", inicializar:
git init
git config user.name "VPS Bot"
git config user.email "vps@mudatech.com"

# 4. Criar .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
*.log
.DS_Store
backup-*.tar.gz
EOF

# 5. Criar arquivo de versão inicial
echo "1.0.0" > VERSION.txt

# 6. Criar CHANGELOG.md inicial
cat > CHANGELOG.md << 'EOF'
# Changelog - VPS WhatsApp Bot

## [1.0.0] - 2025-01-23
### Inicial
- Versão inicial do sistema
- Bot conversacional completo
- Integração OpenAI + Supabase
EOF

# 7. Primeiro commit
git add .
git commit -m "Versão inicial - $(date +%Y-%m-%d)"
```

### ✅ Passo 3: Criar Script de Atualização de Versão na VPS

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
echo "📝 Commit criado: $1"
EOF

# Dar permissão de execução
chmod +x /home/whatsapp-webhook/atualizar-versao.sh
```

### ✅ Passo 4: Sincronizar Código Inicial da VPS

```bash
# No projeto local, sincronizar código atual da VPS
./scripts/sincronizar-vps.sh

# Verificar se arquivos foram copiados
ls -la vps-code/codigo/

# Commit inicial no projeto
git add vps-code/
git commit -m "Sincronizado código inicial da VPS"
```

### ✅ Passo 5: Testar Deploy

```bash
# Fazer um teste de deploy (sem alterar nada)
./scripts/deploy-vps.sh

# Verificar logs na VPS
ssh root@38.242.148.169 'pm2 logs whatsapp-webhook --lines 20'
```

---

## 🎯 Configuração Completa (Script Único)

Criei um script que faz tudo automaticamente. Execute:

```bash
# No projeto local
./scripts/setup-vps-edicao-local.sh
```

---

## 📝 Verificação Final

### Checklist:

- [ ] Scripts têm permissão de execução (`chmod +x scripts/*.sh`)
- [ ] Git inicializado na VPS (`git status` funciona)
- [ ] Script `atualizar-versao.sh` existe na VPS
- [ ] `VERSION.txt` existe na VPS
- [ ] `CHANGELOG.md` existe na VPS
- [ ] Código sincronizado no projeto local (`vps-code/codigo/`)
- [ ] Deploy funciona (`./scripts/deploy-vps.sh`)

---

## 🚀 Pronto para Usar!

Agora você pode:

1. **Editar no projeto local:**
   ```bash
   # VS Code/Cursor → vps-code/codigo/message-handler.js
   ```

2. **Fazer deploy:**
   ```bash
   ./scripts/deploy-vps.sh
   ```

3. **Atualizar versão:**
   ```bash
   ssh root@38.242.148.169 'cd /home/whatsapp-webhook && ./atualizar-versao.sh "Descrição"'
   ```

4. **Sincronizar versão:**
   ```bash
   ./scripts/sincronizar-vps.sh
   ```

---

**Última atualização:** 2025-01-23

