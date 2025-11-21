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
// PLANOS DE PUBLICIDADE
// ============================================

export interface PublicidadePlanoType {
  id: string;
  nome: PublicidadePlano;
  descricao?: string;
  ordem: number; // Para ordenação (menor número = maior prioridade)
  createdAt?: string;
}

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
  enderecoDestino?: string;
  bairroDestino?: string;
  tipoDestino?: PropertyType;
  
  // Detalhes do Serviço
  descricao?: string;
  
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
  
  // Relacionamento com Empresa
  empresaId?: string; // Se for orçamento para empresa específica
  
  // Metadados
  createdAt?: string;
}

// ============================================
// ORÇAMENTO EMPRESA (Relacionamento N:N)
// ============================================

export interface OrcamentoEmpresa {
  id: string;
  orcamentoId: string;
  empresaId: string;
  enviadoEm?: string;
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
  empresaId: string;
  planoId: string;
  cidadeId?: string; // Cidade onde a campanha é válida (opcional)
  hotsiteId?: string; // Hotsite específico vinculado à campanha (opcional)
  dataInicio: string;
  dataFim?: string;
  valorTotal?: number;
  dataCobranca?: string;
  ativo: boolean; // Status da campanha (ativa/inativa)
  observacoes?: string; // Notas administrativas
  createdAt?: string;
  updatedAt?: string;
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
