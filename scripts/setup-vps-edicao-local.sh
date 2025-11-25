#!/bin/bash
# Script de configuração inicial para edição local → deploy VPS

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
    SSH_SEM_SENHA=true
else
    echo "⚠️  SSH ainda pede senha!"
    echo "   O script vai pedir senha algumas vezes."
    echo "   Para evitar isso, configure chave SSH:"
    echo "   1. ssh-keygen -t rsa -b 4096"
    echo "   2. ssh-copy-id $VPS_USER@$VPS_IP"
    echo ""
    SSH_SEM_SENHA=false
fi
echo ""

# ============================================
# PASSO 1: Verificar/Criar scripts locais
# ============================================
echo "📝 Passo 1: Verificando scripts locais..."

if [ ! -f "scripts/deploy-vps.sh" ]; then
    echo "❌ Erro: scripts/deploy-vps.sh não encontrado!"
    exit 1
fi

if [ ! -f "scripts/sincronizar-vps.sh" ]; then
    echo "❌ Erro: scripts/sincronizar-vps.sh não encontrado!"
    exit 1
fi

# Dar permissão de execução
chmod +x scripts/deploy-vps.sh
chmod +x scripts/sincronizar-vps.sh
echo "✅ Scripts locais configurados"

# ============================================
# PASSO 2: Configurar Git na VPS
# ============================================
echo ""
echo "📝 Passo 2: Configurando Git na VPS..."

# Verificar se Git já está inicializado
if ssh $VPS_USER@$VPS_IP "cd $VPS_PATH && git status > /dev/null 2>&1"; then
    echo "✅ Git já está inicializado na VPS"
else
    echo "   Inicializando Git na VPS..."
    ssh $VPS_USER@$VPS_IP "cd $VPS_PATH && \
        git init && \
        git config user.name 'VPS Bot' && \
        git config user.email 'vps@mudatech.com' && \
        echo '✅ Git inicializado'"
fi

# Criar .gitignore na VPS
echo "   Criando .gitignore na VPS..."
ssh $VPS_USER@$VPS_IP "cd $VPS_PATH && cat > .gitignore << 'EOF'
node_modules/
.env
*.log
.DS_Store
backup-*.tar.gz
EOF
"

# ============================================
# PASSO 3: Criar arquivos de versão na VPS
# ============================================
echo ""
echo "📝 Passo 3: Criando arquivos de versão na VPS..."

# Criar VERSION.txt se não existir
ssh $VPS_USER@$VPS_IP "cd $VPS_PATH && \
    if [ ! -f VERSION.txt ]; then \
        echo '1.0.0' > VERSION.txt && \
        echo '   ✅ VERSION.txt criado'; \
    else \
        echo '   ✅ VERSION.txt já existe'; \
    fi"

# Criar CHANGELOG.md se não existir
ssh $VPS_USER@$VPS_IP "cd $VPS_PATH && \
    if [ ! -f CHANGELOG.md ]; then \
        cat > CHANGELOG.md << 'EOF'
# Changelog - VPS WhatsApp Bot

## [1.0.0] - 2025-01-23
### Inicial
- Versão inicial do sistema
- Bot conversacional completo
- Integração OpenAI + Supabase
EOF
        echo '   ✅ CHANGELOG.md criado'; \
    else \
        echo '   ✅ CHANGELOG.md já existe'; \
    fi"

# ============================================
# PASSO 4: Criar script de atualização de versão na VPS
# ============================================
echo ""
echo "📝 Passo 4: Criando script de atualização de versão na VPS..."

ssh $VPS_USER@$VPS_IP "cd $VPS_PATH && cat > atualizar-versao.sh << 'EOF'
#!/bin/bash
# Script para atualizar versão e fazer commit

VERSION_FILE=\"VERSION.txt\"
CHANGELOG_FILE=\"CHANGELOG.md\"

# Ler versão atual
if [ -f \"\$VERSION_FILE\" ]; then
    CURRENT_VERSION=\$(cat \$VERSION_FILE)
    MAJOR=\$(echo \$CURRENT_VERSION | cut -d. -f1)
    MINOR=\$(echo \$CURRENT_VERSION | cut -d. -f2)
    PATCH=\$(echo \$CURRENT_VERSION | cut -d. -f3)
    PATCH=\$((PATCH + 1))
    NEW_VERSION=\"\$MAJOR.\$MINOR.\$PATCH\"
else
    NEW_VERSION=\"1.0.0\"
fi

# Atualizar versão
echo \$NEW_VERSION > \$VERSION_FILE

# Atualizar changelog
if [ ! -f \"\$CHANGELOG_FILE\" ]; then
    cat > \$CHANGELOG_FILE << 'CHANGELOG'
# Changelog - VPS WhatsApp Bot

## [1.0.0] - 2025-01-23
### Inicial
- Versão inicial do sistema
CHANGELOG
fi

echo \"\" >> \$CHANGELOG_FILE
echo \"## [\$NEW_VERSION] - \$(date +%Y-%m-%d)\" >> \$CHANGELOG_FILE
echo \"### Alterações\" >> \$CHANGELOG_FILE
echo \"- \$1\" >> \$CHANGELOG_FILE

# Commit
git add .
git commit -m \"v\$NEW_VERSION: \$1\"

echo \"✅ Versão atualizada para \$NEW_VERSION\"
echo \"📝 Commit criado: \$1\"
EOF
chmod +x atualizar-versao.sh"

echo "✅ Script atualizar-versao.sh criado na VPS"

# ============================================
# PASSO 5: Primeiro commit na VPS (se necessário)
# ============================================
echo ""
echo "📝 Passo 5: Fazendo primeiro commit na VPS (se necessário)..."

ssh $VPS_USER@$VPS_IP "cd $VPS_PATH && \
    if [ -z \"\$(git log --oneline 2>/dev/null)\" ]; then \
        git add . && \
        git commit -m 'Versão inicial - $(date +%Y-%m-%d)' && \
        echo '   ✅ Primeiro commit criado'; \
    else \
        echo '   ✅ Já existe histórico de commits'; \
    fi"

# ============================================
# PASSO 6: Sincronizar código inicial
# ============================================
echo ""
echo "📝 Passo 6: Sincronizando código inicial da VPS..."

# Criar diretório se não existir
mkdir -p vps-code/codigo

# Sincronizar
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

