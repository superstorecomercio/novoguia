# ⚙️ Configuração Inicial - Edição Local → Deploy VPS

**Objetivo:** Configurar tudo para trabalhar com edições no projeto local

---

## 🎯 Resumo Rápido

Execute este comando para configurar tudo automaticamente:

```bash
# No Git Bash ou WSL
./scripts/setup-vps-edicao-local.sh
```

Ou siga os passos manuais abaixo.

---

## 📋 Configuração Passo a Passo

### ✅ Passo 1: Verificar Scripts (Projeto Local)

**No Git Bash ou WSL:**

```bash
# Verificar se scripts existem
ls -la scripts/deploy-vps.sh
ls -la scripts/sincronizar-vps.sh

# Dar permissão de execução
chmod +x scripts/deploy-vps.sh
chmod +x scripts/sincronizar-vps.sh
chmod +x scripts/setup-vps-edicao-local.sh
```

**No Windows PowerShell (alternativa):**
- Os scripts funcionarão no Git Bash mesmo sem chmod
- Ou use WSL (Windows Subsystem for Linux)

---

### ✅ Passo 2: Configurar Git na VPS

**Conectar na VPS e executar:**

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

---

### ✅ Passo 3: Criar Script de Atualização de Versão na VPS

**Na VPS, criar script:**

```bash
# Conectar na VPS
ssh root@38.242.148.169

# Criar script
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

# Testar
cd /home/whatsapp-webhook
./atualizar-versao.sh "Teste de configuração"
```

---

### ✅ Passo 4: Sincronizar Código Inicial da VPS

**No projeto local (Git Bash ou WSL):**

```bash
# Sincronizar código atual da VPS
./scripts/sincronizar-vps.sh

# Verificar se arquivos foram copiados
ls -la vps-code/codigo/

# Ver versão atual
cat vps-code/codigo/VERSION.txt

# Commit inicial no projeto (opcional)
git add vps-code/
git commit -m "Sincronizado código inicial da VPS"
```

---

### ✅ Passo 5: Testar Deploy

**No projeto local:**

```bash
# Fazer um teste de deploy
./scripts/deploy-vps.sh

# Verificar logs na VPS
ssh root@38.242.148.169 'pm2 logs whatsapp-webhook --lines 20'
```

---

## 🚀 Usar Script Automático (Recomendado)

**Execute tudo de uma vez:**

```bash
# No Git Bash ou WSL
./scripts/setup-vps-edicao-local.sh
```

Este script faz tudo automaticamente:
- ✅ Verifica scripts locais
- ✅ Configura Git na VPS
- ✅ Cria arquivos de versão
- ✅ Cria script de atualização
- ✅ Sincroniza código inicial

---

## 📝 Verificação Final

### Checklist:

- [ ] Scripts têm permissão de execução
- [ ] Git inicializado na VPS (`git status` funciona)
- [ ] Script `atualizar-versao.sh` existe na VPS
- [ ] `VERSION.txt` existe na VPS
- [ ] `CHANGELOG.md` existe na VPS
- [ ] Código sincronizado no projeto local (`vps-code/codigo/`)
- [ ] Deploy funciona (`./scripts/deploy-vps.sh`)

### Comandos de Verificação:

```bash
# Verificar Git na VPS
ssh root@38.242.148.169 'cd /home/whatsapp-webhook && git status'

# Verificar versão na VPS
ssh root@38.242.148.169 'cat /home/whatsapp-webhook/VERSION.txt'

# Verificar script na VPS
ssh root@38.242.148.169 'ls -la /home/whatsapp-webhook/atualizar-versao.sh'

# Verificar código local
ls -la vps-code/codigo/
```

---

## 🎯 Pronto para Usar!

Agora você pode trabalhar assim:

### 1. Editar no Projeto Local

```bash
# Abrir no VS Code/Cursor
code vps-code/codigo/message-handler.js

# Ou usar qualquer editor
# Fazer alterações...
```

### 2. Fazer Deploy

```bash
# Deploy para VPS
./scripts/deploy-vps.sh
```

### 3. Testar

```bash
# Ver logs
ssh root@38.242.148.169 'pm2 logs whatsapp-webhook --lines 50'
```

### 4. Atualizar Versão

```bash
# Atualizar versão na VPS
ssh root@38.242.148.169 'cd /home/whatsapp-webhook && ./atualizar-versao.sh "Descrição da alteração"'
```

### 5. Sincronizar Versão

```bash
# Sincronizar versão de volta
./scripts/sincronizar-vps.sh
```

---

## 📚 Documentação

- `docs/FLUXO_EDICAO_LOCAL.md` - Fluxo completo passo a passo
- `docs/METODOS_EDICAO_VPS.md` - Métodos de edição
- `docs/INTEGRACAO_VPS_NEXTJS_COMPLETA.md` - Documentação completa

---

## ⚠️ Notas Importantes

### Windows

- Use **Git Bash** ou **WSL** para executar scripts
- Scripts `.sh` não funcionam no PowerShell nativo
- Ou use WSL2 (recomendado)

### SSH

- Certifique-se de ter acesso SSH configurado
- Chave SSH configurada ou senha do root

### Permissões

- Scripts precisam de permissão de execução
- No Windows, use Git Bash ou WSL

---

**Última atualização:** 2025-01-23

