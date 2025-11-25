const axios = require('axios');
require('dotenv').config();

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const API_URL = `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`;

async function enviarMensagem(to, texto) {
  try {
    const response = await axios.post(
      API_URL,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: texto }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Mensagem enviada:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error.response?.data || error.message);
    throw error;
  }
}

async function enviarBotoes(to, texto, botoes) {
  try {
    const response = await axios.post(
      API_URL,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: texto },
          action: {
            buttons: botoes.map((btn, idx) => ({
              type: 'reply',
              reply: {
                id: btn.id || `btn_${idx}`,
                title: btn.title
              }
            }))
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Botões enviados:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar botões:', error.response?.data || error.message);
    throw error;
  }
}

async function enviarLista(to, texto, botaoTexto, secoes) {
  try {
    const response = await axios.post(
      API_URL,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: texto },
          action: {
            button: botaoTexto,
            sections: secoes
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Lista enviada:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar lista:', error.response?.data || error.message);
    throw error;
  }
}

async function enviarTyping(to) {
  try {
    await axios.post(
      API_URL,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: '⏳' }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 1000
      }
    );
  } catch (error) {
    // Silenciosamente ignorar erros de typing
  }
}

module.exports = {
  enviarMensagem,
  enviarBotoes,
  enviarLista,
  enviarTyping
};
