// ============================================
// TIPOS BASE E ENUMS
// ============================================

export type ServiceType = 'mudanca' | 'carreto' | 'guardamoveis' | 'transportadora' | 'montador';

export type PropertyType = 'casa' | 'apartamento' | 'comercial';

export type ContactPreference = 'whatsapp' | 'email' | 'telefone';

export type OrcamentoStatus = 'pendente' | 'enviado' | 'respondido';

export type PublicidadePlano = 'top' | 'quality' | 'standard' | 'intermediario';

export type LifestyleType = 'minimalista' | 'padrao' | 'luxo' | 'comercial';

// ============================================
// CIDADE
// ============================================

export interface City {
  id: string;
  name: string;
  slug: string;
  state: string;
  description?: string;
  region?: string; // 'sudeste' | 'sul' | 'nordeste' | 'norte' | 'centro-oeste'
  createdAt?: string;
  empresaCount?: number; // Quantidade de empresas com hotsites nesta cidade
}

// ============================================
// PLANOS (antiga: planos_publicidade)
// ============================================

export interface Plano {
  id: string;
  nome: PublicidadePlano;
  descricao?: string;
  ordem: number; // Para ordenação (menor número = maior prioridade)
  preco: number; // Preço do plano
  periodicidade: string; // 'mensal' | 'trimestral' | 'anual'
  createdAt?: string;
}

/**
 * @deprecated Use Plano ao invés de PublicidadePlanoType
 */
export interface PublicidadePlanoType extends Plano {}

export interface EmpresaPlano {
  id: string;
  empresaId: string;
  planoId: string;
  cidadeId?: string;
  dataInicio: string;
  dataFim?: string;
  valor?: number;
  ativo: boolean;
  createdAt?: string;
}

// ============================================
// EMPRESA (DEPRECATED - Usar Hotsite diretamente)
// ============================================

/**
 * @deprecated Use Hotsite diretamente no lugar de Company
 * Mantido apenas para compatibilidade com código legado
 */
export interface Company {
  id: string;
  name: string;
  slug: string;
  cnpj?: string;
  responsavel?: string;
  email?: string;
  phones: string[];
  website?: string;
  endereco?: string;
  complemento?: string;
  cidadeId: string;
  cidadeName?: string;
  estado?: string;
  description: string;
  ativo: boolean;
  
  // Planos e Publicidade
  featured: boolean; // Deprecated - usar plano de publicidade
  planoPublicidade?: PublicidadePlano;
  planoOrdem?: number; // Ordem baseada no plano (para ordenação)
  
  // Serviços oferecidos
  serviceTypes?: ServiceType[];
  serviceAreas?: string[]; // Bairros/cidades atendidas
  
  // Hotsite (detalhes expandidos)
  hotsite?: Hotsite;
  
  // Metadados
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// HOTSITE (Detalhes Expandidos da Empresa)
// ============================================

export interface Hotsite {
  id: string;
  empresaId?: string; // Opcional para compatibilidade
  cidadeId?: string; // Cidade onde este hotsite é exibido (IMPORTANTE: uma empresa pode ter múltiplos hotsites)
  nomeExibicao?: string;
  descricao?: string;
  endereco?: string;
  cidade?: string; // Nome da cidade (para exibição)
  estado?: string;
  tipoempresa?: string; // Tipo da empresa: "Empresa de Mudança", "Carretos" ou "Guarda-Móveis"
  verificado?: boolean; // Indica se a empresa foi verificada pelo administrador
  
  // Imagens
  logoUrl?: string;
  foto1Url?: string;
  foto2Url?: string;
  foto3Url?: string;
  
  // Serviços, Descontos e Formas de Pagamento
  servicos?: string[]; // Array de serviços oferecidos
  descontos?: string[]; // Array de descontos disponíveis
  formasPagamento?: string[]; // Array de formas de pagamento
  
  // Diferenciais e Highlights
  highlights?: string[];
  
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// ORÇAMENTO
// ============================================

export interface Orcamento {
  id?: string;
  
  // Tipo de serviço
  tipo: ServiceType;
  
  // Dados do Cliente
  nomeCliente: string;
  emailCliente: string;
  telefoneCliente: string;
  preferenciaContato?: ContactPreference[];
  
  // Origem
  estadoOrigem?: string;
  cidadeOrigem: string;
  enderecoOrigem?: string;
  bairroOrigem?: string;
  tipoOrigem?: PropertyType;
  
  // Destino
  estadoDestino?: string;
  cidadeDestino: string;
  cidadeId?: string; // FK para cidades (baseado em estado_destino/cidade_destino)
  enderecoDestino?: string;
  bairroDestino?: string;
  tipoDestino?: PropertyType;
  
  // Detalhes do Serviço
  descricao?: string; // Também serve como campo "detalhes"
  detalhes?: string; // Alias para descricao
  
  // Campos específicos para Mudança
  comodos?: number;
  precisaEmbalagem?: boolean;
  
  // Campos específicos para Carreto
  pecas?: number;
  
  // Campos específicos para Guarda-Móveis
  tempoArmazenamento?: string;
  oQuePrecisa?: string;
  
  // Data e Metadados
  dataEstimada: string;
  ipCliente?: string;
  status?: OrcamentoStatus;
  
  // Relacionamento com Empresa (deprecated)
  empresaId?: string; // @deprecated Não use mais - orçamentos são relacionados via orcamentos_campanhas
  
  // Metadados
  createdAt?: string;
}

// ============================================
// ORÇAMENTO CAMPANHA (Relacionamento N:N)
// ============================================
// Tabela de junção entre orçamentos e campanhas
// (antiga: orcamento_hotsites, antes: orcamento_empresas)
// ============================================

export interface OrcamentoCampanha {
  id: string;
  orcamentoId: string;
  campanhaId: string;
  hotsiteId: string; // Denormalizado para performance
  status: string; // 'pendente' | 'visualizado' | 'respondido' | 'fechado'
  createdAt?: string; // Data/hora que o orçamento foi enviado para a campanha
  respondidoEm?: string; // @deprecated Use status
}

/**
 * @deprecated Use OrcamentoCampanha ao invés de OrcamentoEmpresa
 */
export interface OrcamentoEmpresa {
  id: string;
  orcamentoId: string;
  empresaId: string; // @deprecated Use campanhaId e hotsiteId
  enviadoEm?: string; // @deprecated Use createdAt
  respondidoEm?: string;
}

// ============================================
// CAMPANHA
// ============================================
// Campanhas controlam o status ativo/inativo,
// vencimentos, valores e planos de publicidade das empresas
// ============================================

export interface Campanha {
  id: string;
  hotsiteId: string; // Hotsite vinculado à campanha (obrigatório)
  planoId?: string; // Plano de publicidade (opcional)
  cidadeId?: string; // Cidade onde a campanha é válida (opcional)
  dataInicio: string; // Data de início (padrão: hoje)
  dataFim?: string; // Data de fim (opcional)
  valorMensal?: number; // Valor mensal da campanha (antes: valorTotal)
  dataCobranca?: string; // Data de cobrança
  ativo: boolean; // Status da campanha (ativa/inativa)
  participaCotacao: boolean; // Se participa do sistema de cotação de orçamentos
  limiteOrcamentosMes?: number; // Limite de orçamentos por mês (NULL = ilimitado)
  observacoes?: string; // Notas administrativas
  createdAt?: string;
  updatedAt?: string;
  
  // Campos deprecated (compatibilidade)
  empresaId?: string; // @deprecated Use hotsiteId
}

// ============================================
// TIPOS PARA FORMULÁRIOS E UI
// ============================================

export interface OrcamentoFormData {
  // Passo 1 - Origem
  estadoOrigem?: string;
  cidadeOrigem: string;
  enderecoOrigem?: string;
  bairroOrigem?: string;
  tipoOrigem?: PropertyType;
  
  // Passo 2 - Destino
  estadoDestino?: string;
  cidadeDestino: string;
  enderecoDestino?: string;
  bairroDestino?: string;
  tipoDestino?: PropertyType;
  
  // Passo 3 - Tipo de Serviço
  tipo: ServiceType;
  
  // Passo 4 - Detalhes (varia conforme tipo)
  comodos?: number;
  precisaEmbalagem?: boolean;
  pecas?: number;
  tempoArmazenamento?: string;
  oQuePrecisa?: string;
  descricao?: string;
  
  // Passo 5 - Dados Pessoais
  nomeCliente: string;
  emailCliente: string;
  telefoneCliente: string;
  preferenciaContato?: ContactPreference[];
  
  // Data
  dataEstimada: string;
  
  // Empresa específica (opcional)
  empresaId?: string;
}

// ============================================
// TIPOS PARA FILTROS E BUSCA
// ============================================

export interface CompanyFilters {
  cidadeId?: string;
  estado?: string;
  serviceType?: ServiceType;
  bairro?: string;
  planoPublicidade?: PublicidadePlano;
  search?: string; // Busca por nome
}

export interface CityFilters {
  estado?: string;
  region?: string;
  search?: string;
}
