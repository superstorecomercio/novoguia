/**
 * Queries para Hotsites
 * 
 * IMPORTANTE: Hotsites são vinculados a empresas E cidades
 * Uma empresa pode ter múltiplos hotsites (um por cidade)
 */

import { createServerClient } from '../../supabase/server';
import { type Hotsite } from '../../../app/types';

/**
 * Busca hotsite de uma empresa para uma cidade específica
 */
export const getHotsiteByEmpresaECidade = async (
  empresaId: string,
  cidadeId: string
): Promise<Hotsite | null> => {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('hotsites')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('cidade_id', cidadeId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Não encontrado
      }
      console.error('Erro ao buscar hotsite:', error);
      throw error;
    }
    
    if (!data) return null;
    
    return {
      id: data.id,
      empresaId: data.empresa_id,
      cidadeId: data.cidade_id,
      nomeExibicao: data.nome_exibicao,
      descricao: data.descricao,
      endereco: data.endereco,
      cidade: data.cidade,
      estado: data.estado,
      logoUrl: data.logo_url,
      foto1Url: data.foto1_url,
      foto2Url: data.foto2_url,
      foto3Url: data.foto3_url,
      servicos: data.servicos || [],
      descontos: data.descontos || [],
      formasPagamento: data.formas_pagamento || [],
      highlights: data.highlights || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err: any) {
    console.error('Erro inesperado ao buscar hotsite:', err);
    return null;
  }
};

/**
 * Busca todos os hotsites de uma empresa
 */
export const getHotsitesByEmpresa = async (
  empresaId: string
): Promise<Hotsite[]> => {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('hotsites')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('cidade', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar hotsites:', error);
      throw error;
    }
    
    return (data || []).map((item: any) => ({
      id: item.id,
      empresaId: item.empresa_id,
      cidadeId: item.cidade_id,
      nomeExibicao: item.nome_exibicao,
      descricao: item.descricao,
      endereco: item.endereco,
      cidade: item.cidade,
      estado: item.estado,
      logoUrl: item.logo_url,
      foto1Url: item.foto1_url,
      foto2Url: item.foto2_url,
      foto3Url: item.foto3_url,
      servicos: item.servicos || [],
      descontos: item.descontos || [],
      formasPagamento: item.formas_pagamento || [],
      highlights: item.highlights || [],
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (err: any) {
    console.error('Erro inesperado ao buscar hotsites:', err);
    return [];
  }
};

/**
 * Busca hotsites por slug da cidade (ex: "sao-paulo-sp")
 * NOVA LÓGICA SEM EMPRESA_ID: Usa apenas hotsite_id nas campanhas
 * Ordena por plano de publicidade
 */
export const getHotsitesByCidadeSlug = async (
  cidadeSlug: string,
  tipoEmpresa?: string
): Promise<Array<Hotsite & { plano?: { nome: string; ordem: number }; telefone1?: string; telefone2?: string }>> => {
  try {
    const supabase = createServerClient();
    
    // 1. Parse cidade/estado do slug
    const parts = cidadeSlug.split('-');
    const estadosBR = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
    
    const estadoNome = parts.length >= 2 && estadosBR.includes(parts[parts.length - 1].toUpperCase())
      ? parts[parts.length - 1].toUpperCase()
      : null;
    const cidadeNome = estadoNome ? parts.slice(0, -1).join(' ') : parts.join(' ');
    
    // Normalizar para busca
    const normalizeForSearch = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cidadeNomeNormalizado = normalizeForSearch(cidadeNome);
    
    // 2. Buscar campanhas ativas (usando hotsite_id OU empresa_id para compatibilidade)
    const { data: campanhasAtivas } = await supabase
      .from('campanhas')
      .select('hotsite_id, empresa_id, plano_id, plano:planos_publicidade(nome, ordem)')
      .eq('ativo', true);
    
    if (!campanhasAtivas || campanhasAtivas.length === 0) {
      return [];
    }
    
    // Criar mapa hotsite_id -> plano (usando hotsite_id OU empresa_id)
    const hotsitePlanoMap = new Map<string, { nome: string; ordem: number }>();
    const empresaIdsAtivas = new Set<string>();
    
    campanhasAtivas?.forEach((c: any) => {
      if (c.plano) {
        // Priorizar hotsite_id se existir
        if (c.hotsite_id) {
          const planoExistente = hotsitePlanoMap.get(c.hotsite_id);
          if (!planoExistente || c.plano.ordem < planoExistente.ordem) {
            hotsitePlanoMap.set(c.hotsite_id, {
              nome: c.plano.nome,
              ordem: c.plano.ordem,
            });
          }
        }
        // Fallback para empresa_id (compatibilidade temporária)
        else if (c.empresa_id) {
          empresaIdsAtivas.add(c.empresa_id);
        }
      }
    });
    
    // 3. Buscar hotsites da cidade
    let query = supabase
      .from('hotsites')
      .select('*');
    
    if (estadoNome) {
      query = query.eq('estado', estadoNome);
    }
    
    const { data: todosHotsites, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar hotsites:', error);
      return [];
    }
    
    // Filtrar por cidade (normalizado)
    const hotsitesDaCidade = todosHotsites?.filter(h => 
      h.cidade && normalizeForSearch(h.cidade).includes(cidadeNomeNormalizado)
    ) || [];
    
    // 4. Filtrar hotsites com campanhas ativas
    // Aceitar hotsite se: tem campanha via hotsite_id OU via empresa_id (temporário)
    const hotsitesFiltrados = hotsitesDaCidade.filter(h => 
      hotsitePlanoMap.has(h.id) || (h.empresa_id && empresaIdsAtivas.has(h.empresa_id))
    );
    
    // Criar mapa empresa_id -> plano (para fallback)
    const empresaPlanoMap = new Map<string, { nome: string; ordem: number }>();
    campanhasAtivas?.forEach((c: any) => {
      if (c.plano && c.empresa_id && !c.hotsite_id) {
        const planoExistente = empresaPlanoMap.get(c.empresa_id);
        if (!planoExistente || c.plano.ordem < planoExistente.ordem) {
          empresaPlanoMap.set(c.empresa_id, {
            nome: c.plano.nome,
            ordem: c.plano.ordem,
          });
        }
      }
    });
    
    // 4. Filtrar por tipo de empresa (se especificado)
    let resultado = hotsitesFiltrados;
    if (tipoEmpresa && tipoEmpresa !== 'todos') {
      resultado = resultado.filter(h => h.tipoempresa === tipoEmpresa);
    }
    
    // 5. Adicionar plano e converter para formato esperado
    const hotsitesComPlano = resultado.map((item: any) => ({
      id: item.id,
      empresaId: item.empresa_id,
      cidadeId: item.cidade_id,
      nomeExibicao: item.nome_exibicao,
      descricao: item.descricao,
      endereco: item.endereco,
      cidade: item.cidade,
      estado: item.estado,
      tipoempresa: item.tipoempresa,
      telefone1: item.telefone1,
      telefone2: item.telefone2,
      logoUrl: item.logo_url,
      foto1Url: item.foto1_url,
      foto2Url: item.foto2_url,
      foto3Url: item.foto3_url,
      servicos: item.servicos || [],
      descontos: item.descontos || [],
      formasPagamento: item.formas_pagamento || [],
      highlights: item.highlights || [],
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      // Priorizar plano do hotsite_id, fallback para empresa_id
      plano: hotsitePlanoMap.get(item.id) || (item.empresa_id ? empresaPlanoMap.get(item.empresa_id) : undefined),
    }));
    
    // 6. Ordenar por plano
    hotsitesComPlano.sort((a, b) => {
      const ordemA = a.plano?.ordem ?? 999;
      const ordemB = b.plano?.ordem ?? 999;
      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }
      // Se mesmo plano, ordenar por nome
      return (a.nomeExibicao || '').localeCompare(b.nomeExibicao || '');
    });
    
    return hotsitesComPlano;
  } catch (err: any) {
    console.error('Erro inesperado ao buscar hotsites por cidade slug:', err);
    return [];
  }
};

/**
 * Conta hotsites por tipo de empresa em uma cidade
 */
export const getHotsitesCountByTipo = async (
  cidadeSlug: string
): Promise<{ mudanca: number; carreto: number; guardamoveis: number }> => {
  try {
    const supabase = createServerClient();
    
    // Buscar campanhas ativas (usando hotsite_id OU empresa_id)
    const { data: campanhasAtivas } = await supabase
      .from('campanhas')
      .select('hotsite_id, empresa_id')
      .eq('ativo', true);
    
    const hotsiteIdsAtivos = new Set<string>();
    const empresaIdsAtivas = new Set<string>();
    
    campanhasAtivas?.forEach((c: any) => {
      if (c.hotsite_id) {
        hotsiteIdsAtivos.add(c.hotsite_id);
      } else if (c.empresa_id) {
        empresaIdsAtivas.add(c.empresa_id);
      }
    });
    
    if (hotsiteIdsAtivos.size === 0 && empresaIdsAtivas.size === 0) {
      return { mudanca: 0, carreto: 0, guardamoveis: 0 };
    }
    
    // Parse cidade/estado
    const parts = cidadeSlug.split('-');
    const estadosBR = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
    const estadoNome = parts.length >= 2 && estadosBR.includes(parts[parts.length - 1].toUpperCase())
      ? parts[parts.length - 1].toUpperCase()
      : null;
    const cidadeNome = estadoNome ? parts.slice(0, -1).join(' ') : parts.join(' ');
    
    const normalizeForSearch = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cidadeNomeNormalizado = normalizeForSearch(cidadeNome);
    
    // Buscar hotsites (buscar TODOS da cidade, filtrar depois)
    let query = supabase
      .from('hotsites')
      .select('id, empresa_id, tipoempresa, cidade');
    
    if (estadoNome) {
      query = query.eq('estado', estadoNome);
    }
    
    const { data: todosHotsites } = await query;
    
    // Filtrar por cidade e por campanha ativa
    const hotsitesFiltrados = todosHotsites?.filter((h: any) => 
      h.cidade && 
      normalizeForSearch(h.cidade).includes(cidadeNomeNormalizado) &&
      (hotsiteIdsAtivos.has(h.id) || (h.empresa_id && empresaIdsAtivas.has(h.empresa_id)))
    ) || [];
    
    // Contar por tipo de empresa
    const counts = {
      mudanca: 0,
      carreto: 0,
      guardamoveis: 0,
    };
    
    hotsitesFiltrados.forEach((h: any) => {
      const tipo = h.tipoempresa;
      if (tipo === 'Empresa de Mudança') {
        counts.mudanca++;
      } else if (tipo === 'Carretos') {
        counts.carreto++;
      } else if (tipo === 'Guarda-Móveis') {
        counts.guardamoveis++;
      }
    });
    
    return counts;
  } catch (err: any) {
    console.error('Erro inesperado ao contar hotsites:', err);
    return { mudanca: 0, carreto: 0, guardamoveis: 0 };
  }
};

