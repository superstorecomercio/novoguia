#!/bin/bash
# Script de configuração inicial OTIMIZADO (menos conexões SSH)

VPS_USER="root"
VPS_IP="38.242.148.169"
VPS_PATH="/home/whatsapp-webhook"

echo "⚙️  Configurando sistema de edição local → deploy VPS..."
echo ""

# Verificar se está no diretório do projeto
if [ ! -d "vps-code" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto!"
    exit 1
fi

# Verificar conexão SSH sem senha
echo "🔐 Verificando conexão SSH..."
if ssh -o BatchMode=yes -o ConnectTimeout=5 $VPS_USER@$VPS_IP "echo 'OK'" > /dev/null 2>&1; then
    echo "✅ SSH configurado (sem senha)"
else
    echo "⚠️  SSH ainda pede senha!"
    echo ""
    echo "📝 Configure chave SSH primeiro:"
    echo "   1. ssh-keygen -t rsa -b 4096"
    echo "   2. ssh-copy-id $VPS_USER@$VPS_IP"
    echo ""
    read -p "Continuar mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# ============================================
# PASSO 1: Verificar scripts locais
# ============================================
echo ""
echo "📝 Passo 1: Verificando scripts locais..."

if [ ! -f "scripts/deploy-vps.sh" ]; then
    echo "❌ Erro: scripts/deploy-vps.sh não encontrado!"
    exit 1
fi

if [ ! -f "scripts/sincronizar-vps.sh" ]; then
    echo "❌ Erro: scripts/sincronizar-vps.sh não encontrado!"
    exit 1
fi

chmod +x scripts/deploy-vps.sh scripts/sincronizar-vps.sh
echo "✅ Scripts locais configurados"

# ============================================
# PASSO 2-5: TUDO EM UMA ÚNICA CONEXÃO SSH
# ============================================
echo ""
echo "📝 Passo 2-5: Configurando VPS (uma única conexão SSH)..."

ssh $VPS_USER@$VPS_IP bash << 'ENDSSH'
cd /home/whatsapp-webhook

# 2. Configurar Git
echo "   Configurando Git..."
if git status > /dev/null 2>&1; then
    echo "   ✅ Git já está inicializado"
else
    git init
    git config user.name "VPS Bot"
    git config user.email "vps@mudatech.com"
    echo "   ✅ Git inicializado"
fi

# Criar .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
*.log
.DS_Store
backup-*.tar.gz
EOF

# 3. Criar arquivos de versão
echo "   Criando arquivos de versão..."
if [ ! -f VERSION.txt ]; then
    echo "1.0.0" > VERSION.txt
    echo "   ✅ VERSION.txt criado"
else
    echo "   ✅ VERSION.txt já existe"
fi

if [ ! -f CHANGELOG.md ]; then
    cat > CHANGELOG.md << 'EOF'
# Changelog - VPS WhatsApp Bot

## [1.0.0] - 2025-01-23
### Inicial
- Versão inicial do sistema
- Bot conversacional completo
- Integração OpenAI + Supabase
EOF
    echo "   ✅ CHANGELOG.md criado"
else
    echo "   ✅ CHANGELOG.md já existe"
fi

# 4. Criar script de atualização
echo "   Criando script de atualização..."
cat > atualizar-versao.sh << 'EOFSCRIPT'
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
EOFSCRIPT

chmod +x atualizar-versao.sh
echo "   ✅ Script atualizar-versao.sh criado"

# 5. Primeiro commit (se necessário)
if [ -z "$(git log --oneline 2>/dev/null)" ]; then
    git add .
    git commit -m "Versão inicial - $(date +%Y-%m-%d)" > /dev/null 2>&1
    echo "   ✅ Primeiro commit criado"
else
    echo "   ✅ Já existe histórico de commits"
fi

echo ""
echo "✅ Configuração da VPS concluída!"
ENDSSH

# ============================================
# PASSO 6: Sincronizar código inicial
# ============================================
echo ""
echo "📝 Passo 6: Sincronizando código inicial da VPS..."

mkdir -p vps-code/codigo
./scripts/sincronizar-vps.sh

# ============================================
# RESUMO
# ============================================
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ CONFIGURAÇÃO CONCLUÍDA!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Editar código no projeto local:"
echo "   VS Code/Cursor → vps-code/codigo/message-handler.js"
echo ""
echo "2. Fazer deploy:"
echo "   ./scripts/deploy-vps.sh"
echo ""
echo "3. Atualizar versão na VPS:"
echo "   ssh $VPS_USER@$VPS_IP 'cd $VPS_PATH && ./atualizar-versao.sh \"Descrição\"'"
echo ""
echo "4. Sincronizar versão:"
echo "   ./scripts/sincronizar-vps.sh"
echo ""
echo "📚 Documentação:"
echo "   - docs/FLUXO_EDICAO_LOCAL.md - Fluxo completo"
echo "   - docs/METODOS_EDICAO_VPS.md - Métodos de edição"
echo "   - docs/INTEGRACAO_VPS_NEXTJS_COMPLETA.md - Documentação completa"
echo ""

