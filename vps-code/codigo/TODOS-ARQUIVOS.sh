#!/bin/bash
# Script para criar todos os arquivos de código comentados

# sessions.js
cat > sessions.js << 'EOF'
/**
 * SESSIONS.JS - Gerenciador de Sessões/Estados das Conversas
 * Mantém em memória o estado de cada conversa ativa
 */

// Map para armazenar sessões: userId => sessaoObj
const sessoes = new Map();

// Enum das perguntas (ordem fixa)
const PERGUNTAS = {
  ORIGEM: 'origem',
  DESTINO: 'destino',
  TIPO_IMOVEL: 'tipo_imovel',
  ELEVADOR: 'elevador',
  EMBALAGEM: 'embalagem',
  NOME: 'nome',
  EMAIL: 'email',
  DATA: 'data',
  LISTA_OBJETOS: 'lista_objetos',
  LISTA_TEXTO: 'lista_texto'
};

// Ordem das etapas
const ORDEM_ETAPAS = [
  PERGUNTAS.ORIGEM,
  PERGUNTAS.DESTINO,
  PERGUNTAS.TIPO_IMOVEL,
  PERGUNTAS.ELEVADOR,
  PERGUNTAS.EMBALAGEM,
  PERGUNTAS.NOME,
  PERGUNTAS.EMAIL,
  PERGUNTAS.DATA,
  PERGUNTAS.LISTA_OBJETOS,
  PERGUNTAS.LISTA_TEXTO
];

function criarSessao(userId) {
  const sessao = {
    userId,
    etapaAtual: PERGUNTAS.ORIGEM,
    dados: {},
    criado_em: new Date()
  };
  sessoes.set(userId, sessao);
  console.log(`Sessão criada para ${userId}`);
  return sessao;
}

function getSessao(userId) {
  return sessoes.get(userId);
}

function atualizarSessao(userId, novos_dados) {
  const sessao = sessoes.get(userId);
  if (sessao) {
    sessao.dados = { ...sessao.dados, ...novos_dados };
  }
}

function proximaEtapa(userId) {
  const sessao = sessoes.get(userId);
  if (sessao) {
    const indiceAtual = ORDEM_ETAPAS.indexOf(sessao.etapaAtual);
    if (indiceAtual < ORDEM_ETAPAS.length - 1) {
      sessao.etapaAtual = ORDEM_ETAPAS[indiceAtual + 1];
    }
  }
}

function limparSessao(userId) {
  sessoes.delete(userId);
  console.log(`Sessão limpa para ${userId}`);
}

module.exports = {
  PERGUNTAS,
  criarSessao,
  getSessao,
  atualizarSessao,
  proximaEtapa,
  limparSessao
};
EOF

# whatsapp.js
cat > whatsapp.js << 'EOF'
/**
 * WHATSAPP.JS - Cliente da API do WhatsApp Business
 * Responsável por enviar mensagens via Facebook Graph API
 */

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

module.exports = {
  enviarMensagem,
  enviarBotoes,
  enviarLista
};
EOF

# openai-service.js
cat > openai-service.js << 'EOF'
/**
 * OPENAI-SERVICE.JS - Integração com OpenAI para cálculo de orçamentos
 * Usa GPT-4o-mini para calcular distância e preços realistas
 */

const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function calcularOrcamentoComIA(dados) {
  try {
    const prompt = `
Você é um especialista em mudanças residenciais e comerciais no Brasil.

Dados da mudança:
- Origem: ${dados.origem}
- Destino: ${dados.destino}
- Tipo de imóvel: ${dados.tipo_imovel}
- Tem elevador: ${dados.tem_elevador ? 'Sim' : 'Não'}
${!dados.tem_elevador ? `- Andar: ${dados.andar}º` : ''}
- Precisa embalagem: ${dados.precisa_embalagem ? 'Sim' : 'Não'}
${dados.lista_objetos ? `- Lista de objetos: ${dados.lista_objetos}` : ''}

REGRAS DE PRECIFICAÇÃO (mercado brasileiro real):

1. BASE POR TIPO DE IMÓVEL:
   - kitnet: R$ 600 - R$ 1.200
   - 1_quarto: R$ 800 - R$ 2.000
   - 2_quartos: R$ 1.200 - R$ 3.500
   - 3_mais: R$ 2.000 - R$ 6.000
   - comercial: R$ 1.500 - R$ 8.000

2. ADICIONAL POR DISTÂNCIA:
   - Até 50km: +R$ 0 (incluído na base)
   - 51-200km: +R$ 8 a R$ 12 por km adicional
   - 201-500km: +R$ 10 a R$ 15 por km adicional
   - 501km+: +R$ 12 a R$ 18 por km adicional

3. AJUSTES:
   - SEM elevador: +20% a +30%
   - COM embalagem profissional: +R$ 300 a R$ 800
   - Lista de objetos grande: +10% a +25%

4. LIMITES REALISTAS:
   - Mínimo absoluto: R$ 600
   - Máximo para residencial: R$ 15.000
   - Máximo para comercial: R$ 25.000

IMPORTANTE: Retorne APENAS um JSON válido, sem texto adicional, markdown ou código. O JSON deve ter exatamente esta estrutura:

{
  "distanciaKm": número (distância em km entre origem e destino),
  "precoMin": número (preço mínimo REALISTA em reais),
  "precoMax": número (preço máximo REALISTA em reais),
  "explicacao": "string (máximo 3 frases explicando o cálculo de forma clara)",
  "cidadeOrigem": "string (nome da cidade de origem corrigido)",
  "estadoOrigem": "string (sigla do estado de origem, ex: SP)",
  "cidadeDestino": "string (nome da cidade de destino corrigido)",
  "estadoDestino": "string (sigla do estado de destino, ex: SP)"
}

CALCULE valores REALISTAS baseados nas regras acima. Não use multiplicação simples de km × valor fixo.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em calcular orçamentos de mudanças no Brasil. Retorne APENAS JSON válido, sem formatação markdown. Use valores realistas do mercado brasileiro.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    let resultado = completion.choices[0].message.content.trim();
    
    // Remover markdown se houver
    resultado = resultado.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const json = JSON.parse(resultado);
    
    console.log('Resultado da IA:', json);
    return json;
    
  } catch (error) {
    console.error('Erro ao calcular com IA:', error);
    throw error;
  }
}

module.exports = {
  calcularOrcamentoComIA
};
EOF

# supabase-service.js
cat > supabase-service.js << 'EOF'
/**
 * SUPABASE-SERVICE.JS - Integração com Supabase (PostgreSQL)
 * Salva orçamentos e notifica empresas via função SQL
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function salvarOrcamento(dados, resultadoIA) {
  try {
    // Mapeamento correto dos campos para o banco
    const payload = {
      nome_cliente: dados.nome,
      email_cliente: dados.email,
      telefone_cliente: dados.whatsapp,
      whatsapp: dados.whatsapp,
      data_estimada: dados.data_estimada,
      origem_completo: dados.origem,
      destino_completo: dados.destino,
      estado_origem: resultadoIA.estadoOrigem,
      cidade_origem: resultadoIA.cidadeOrigem,
      estado_destino: resultadoIA.estadoDestino,
      cidade_destino: resultadoIA.cidadeDestino,
      tipo_imovel: dados.tipo_imovel,
      tem_elevador: dados.tem_elevador,
      andar: dados.andar || 1,
      precisa_embalagem: dados.precisa_embalagem,
      distancia_km: resultadoIA.distanciaKm,
      preco_min: resultadoIA.precoMin,
      preco_max: resultadoIA.precoMax,
      mensagem_ia: resultadoIA.explicacao,
      lista_objetos: dados.lista_objetos || null,
      origem_formulario: 'whatsapp',
      user_agent: 'WhatsApp Bot API',
      ip_cliente: null
    };

    console.log('Chamando função SQL com payload:', payload);

    // Chama função SQL que salva e notifica empresas
    const { data, error } = await supabase.rpc('criar_orcamento_e_notificar', {
      p_orcamento_data: payload
    });

    if (error) {
      console.error('Erro ao salvar orçamento:', error);
      throw error;
    }

    console.log('Orçamento salvo com sucesso:', data);
    return data;
    
  } catch (error) {
    console.error('Erro ao salvar orçamento:', error);
    throw error;
  }
}

module.exports = {
  salvarOrcamento
};
EOF

# .env.example
cat > .env.example << 'EOF'
# ════════════════════════════════════════════════════════════════
# VARIÁVEIS DE AMBIENTE - WHATSAPP BOT JULIA
# ════════════════════════════════════════════════════════════════
# IMPORTANTE: Copie este arquivo para .env e preencha com valores reais
# NUNCA commite o arquivo .env (adicione ao .gitignore)

# ═══ SERVIDOR ═══
PORT=3000
VERIFY_TOKEN=meu_token_secreto_12345

# ═══ WHATSAPP BUSINESS API ═══
WHATSAPP_TOKEN=EAAMQy...seu_token_aqui
WHATSAPP_PHONE_ID=871455159388695

# ═══ SUPABASE ═══
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbG...sua_anon_key_aqui
SUPABASE_SERVICE_KEY=eyJhbG...sua_service_key_aqui

# ═══ OPENAI ═══
OPENAI_API_KEY=sk-proj-...sua_key_aqui
EOF

# package.json
cat > package.json << 'EOF'
{
  "name": "whatsapp-bot-julia",
  "version": "1.0.0",
  "description": "Bot de WhatsApp para cotação de mudanças",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": ["whatsapp", "bot", "mudanças"],
  "author": "Guia de Mudanças",
  "license": "ISC",
  "dependencies": {
    "express": "^4.18.2",
    "body-parser": "^1.20.2",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1",
    "openai": "^4.20.0",
    "@supabase/supabase-js": "^2.38.0"
  }
}
EOF

echo "✅ Todos os arquivos criados com sucesso!"
ls -lah
