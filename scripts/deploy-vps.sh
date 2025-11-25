#!/bin/bash
# Script para fazer deploy do código local para VPS

VPS_USER="root"
VPS_IP="38.242.148.169"
VPS_PATH="/home/whatsapp-webhook"
LOCAL_PATH="./vps-code/codigo"

echo "🚀 Fazendo deploy para VPS..."

# Verificar se arquivos existem
if [ ! -d "$LOCAL_PATH" ]; then
    echo "❌ Erro: Diretório $LOCAL_PATH não encontrado!"
    exit 1
fi

# Verificar se há arquivos .js
if [ -z "$(ls -A $LOCAL_PATH/*.js 2>/dev/null)" ]; then
    echo "❌ Erro: Nenhum arquivo .js encontrado em $LOCAL_PATH!"
    exit 1
fi

# Fazer backup na VPS antes de fazer deploy
echo "📦 Fazendo backup na VPS..."
ssh $VPS_USER@$VPS_IP "cd $VPS_PATH && tar -czf backup-pre-deploy-$(date +%Y%m%d-%H%M%S).tar.gz *.js package.json 2>/dev/null" || echo "   ⚠️  Não foi possível fazer backup (continuando...)"

# Enviar arquivos JavaScript
echo "📤 Enviando arquivos .js..."
scp -q $LOCAL_PATH/*.js $VPS_USER@$VPS_IP:$VPS_PATH/ || {
    echo "❌ Erro ao enviar arquivos .js!"
    exit 1
}

# Enviar package.json (se existir)
if [ -f "$LOCAL_PATH/package.json" ]; then
    echo "📦 Enviando package.json..."
    scp -q $LOCAL_PATH/package.json $VPS_USER@$VPS_IP:$VPS_PATH/ || echo "   ⚠️  Não foi possível enviar package.json"
fi

# Reiniciar aplicação
echo "🔄 Reiniciando aplicação..."
ssh $VPS_USER@$VPS_IP "cd $VPS_PATH && pm2 restart whatsapp-webhook" || {
    echo "❌ Erro ao reiniciar aplicação!"
    exit 1
}

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Verificar logs: ssh $VPS_USER@$VPS_IP 'pm2 logs whatsapp-webhook --lines 50'"
echo "   2. Atualizar versão: ssh $VPS_USER@$VPS_IP 'cd $VPS_PATH && ./atualizar-versao.sh \"Descrição da alteração\"'"
echo "   3. Sincronizar versão: ./scripts/sincronizar-vps.sh"

