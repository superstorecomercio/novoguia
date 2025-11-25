#!/bin/bash
# Script para sincronizar código da VPS com projeto local

VPS_USER="root"
VPS_IP="38.242.148.169"
VPS_PATH="/home/whatsapp-webhook"
LOCAL_PATH="./vps-code/codigo"

echo "🔄 Sincronizando código da VPS..."

# Criar diretório se não existir
mkdir -p $LOCAL_PATH

# Baixar arquivos JavaScript
echo "📥 Baixando arquivos .js..."
scp -q $VPS_USER@$VPS_IP:$VPS_PATH/*.js $LOCAL_PATH/ 2>/dev/null

# Baixar package.json
echo "📦 Baixando package.json..."
scp -q $VPS_USER@$VPS_IP:$VPS_PATH/package.json $LOCAL_PATH/ 2>/dev/null

# Baixar VERSION.txt (se existir)
echo "📋 Baixando VERSION.txt..."
scp -q $VPS_USER@$VPS_IP:$VPS_PATH/VERSION.txt $LOCAL_PATH/ 2>/dev/null || echo "   ⚠️  VERSION.txt não encontrado na VPS"

# Baixar CHANGELOG.md (se existir)
echo "📝 Baixando CHANGELOG.md..."
scp -q $VPS_USER@$VPS_IP:$VPS_PATH/CHANGELOG.md $LOCAL_PATH/ 2>/dev/null || echo "   ⚠️  CHANGELOG.md não encontrado na VPS"

# Pegar versão atual
VERSION=$(ssh $VPS_USER@$VPS_IP "cat $VPS_PATH/VERSION.txt 2>/dev/null || echo '1.0.0'")

echo ""
echo "✅ Sincronização concluída!"
echo "📦 Versão atual da VPS: $VERSION"
echo ""
echo "📝 Próximos passos:"
echo "   1. Verificar diferenças: git diff $LOCAL_PATH/"
echo "   2. Commit se necessário: git add $LOCAL_PATH/ && git commit -m 'Sincronizado VPS v$VERSION'"

