// Armazenamento de sessões em memória
const sessions = new Map();

// ✅ NOVA ORDEM DE PERGUNTAS
const PERGUNTAS = {
  ORIGEM: 'origem',
  DESTINO: 'destino',
  TIPO_IMOVEL: 'tipo_imovel',
  ELEVADOR: 'elevador',
  EMBALAGEM: 'embalagem',
  NOME: 'nome',
  EMAIL: 'email',
  DATA: 'data',
  LISTA_OBJETOS: 'lista_objetos_opcao',
  LISTA_TEXTO: 'lista_objetos_texto',
  CONCLUIDO: 'concluido'
};

const ORDEM_PERGUNTAS = [
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
  sessions.set(userId, sessao);
  return sessao;
}

function getSessao(userId) {
  return sessions.get(userId);
}

function atualizarSessao(userId, dados) {
  const sessao = sessions.get(userId);
  if (sessao) {
    sessao.dados = { ...sessao.dados, ...dados };
    sessions.set(userId, sessao);
  }
  return sessao;
}

function proximaEtapa(userId) {
  const sessao = sessions.get(userId);
  if (!sessao) return null;

  const indiceAtual = ORDEM_PERGUNTAS.indexOf(sessao.etapaAtual);
  
  // Se não quer lista de objetos, pula para concluído
  if (sessao.etapaAtual === PERGUNTAS.LISTA_OBJETOS && sessao.dados.quer_lista === false) {
    sessao.etapaAtual = PERGUNTAS.CONCLUIDO;
  }
  else if (indiceAtual < ORDEM_PERGUNTAS.length - 1) {
    sessao.etapaAtual = ORDEM_PERGUNTAS[indiceAtual + 1];
  } else {
    sessao.etapaAtual = PERGUNTAS.CONCLUIDO;
  }
  
  sessions.set(userId, sessao);
  return sessao.etapaAtual;
}

function limparSessao(userId) {
  sessions.delete(userId);
}

module.exports = {
  PERGUNTAS,
  criarSessao,
  getSessao,
  atualizarSessao,
  proximaEtapa,
  limparSessao
};
