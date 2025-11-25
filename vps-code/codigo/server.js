const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const { processarMensagem } = require('./message-handler');

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'meu_token_secreto_12345';

app.use(bodyParser.json());

// Rota de verificação do webhook (GET)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Rota para receber mensagens (POST)
app.post('/webhook', async (req, res) => {
    const body = req.body;

    console.log('Webhook recebido:', JSON.stringify(body, null, 2));

    if (body.object === 'whatsapp_business_account') {
        if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
            const message = body.entry[0].changes[0].value.messages[0];
            const from = message.from; // Número do usuário
            
            let mensagemTexto = '';
            
            // Processar diferentes tipos de mensagem
            if (message.type === 'text') {
                mensagemTexto = message.text.body;
            } else if (message.type === 'interactive') {
                // Resposta de botão ou lista
                if (message.interactive.type === 'button_reply') {
                    mensagemTexto = message.interactive.button_reply.id;
                } else if (message.interactive.type === 'list_reply') {
                    mensagemTexto = message.interactive.list_reply.id;
                }
            }
            
            console.log(`Mensagem de ${from}: ${mensagemTexto}`);
            
            // Processar mensagem de forma assíncrona
            processarMensagem(from, mensagemTexto).catch(err => {
                console.error('Erro ao processar mensagem:', err);
            });
        }
        
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// Rota de teste
app.get('/', (req, res) => {
    res.send('WhatsApp Webhook Bot está rodando! ✅');
});

// Rota de health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Webhook URL: https://mudancas.duckdns.org/webhook`);
});
