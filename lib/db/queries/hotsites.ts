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
      verificado: data.verificado || false,
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
      verificado: item.verificado || false,
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
 * LÓGICA SIMPLIFICADA: Busca campanhas ativas da cidade e extrai hotsites únicos
 * Usa a mesma query do admin de campanhas para consistência
 */
export const getHotsitesByCidadeSlug = async (
  cidadeSlug: string,
  tipoEmpresa?: string
): Promise<Array<Hotsite & { plano?: { nome: string; ordem: number }; telefone1?: string; telefone2?: string }>> => {
  try {
    const supabase = createServerClient();
    
    // Buscar campanhas ativas da cidade (mesma lógica do admin)
    const hoje = new Date().toISOString().split('T')[0];
    
    // Primeiro, buscar a cidade para pegar o ID
    const { data: cidade, error: cidadeError } = await supabase
      .from('cidades')
      .select('id')
      .eq('slug', cidadeSlug)
      .single();
    
    if (cidadeError || !cidade) {
      return [];
    }
    
    // Agora buscar campanhas filtrando por cidade_id diretamente nos hotsites
    const { data: campanhas, error } = await supabase
      .from('campanhas')
      .select(`
        id,
        hotsite_id,
        ativo,
        data_inicio,
        data_fim,
        hotsite:hotsites!hotsite_id(
          id,
          empresa_id,
          cidade_id,
          nome_exibicao,
          descricao,
          endereco,
          cidade,
          estado,
          tipoempresa,
          telefone1,
          telefone2,
          telefone3,
          logo_url,
          foto1_url,
          foto2_url,
          foto3_url,
          servicos,
          descontos,
          formas_pagamento,
          highlights,
          verificado,
          created_at,
          updated_at
        ),
        planos(nome, ordem)
      `)
      .eq('ativo', true)
      .eq('hotsite.cidade_id', cidade.id)
      .lte('data_inicio', hoje);
      // REMOVIDO: .or(`data_fim.is.null,data_fim.gte.${hoje}`)
      // Agora apenas verifica se ativo = true, ignorando data de vencimento
    
    if (error || !campanhas || campanhas.length === 0) {
      return [];
    }
    
    // Extrair hotsites únicos e associar ao melhor plano
    const hotsitesMap = new Map<string, any>();
    
    campanhas.forEach((campanha: any) => {
      const hotsite = campanha.hotsite;
      if (!hotsite) return;
      
      const hotsiteId = hotsite.id;
      const plano = campanha.planos || { nome: 'Padrão', ordem: 999 };
      
      // Se já existe, manter o plano de menor ordem (melhor)
      const existente = hotsitesMap.get(hotsiteId);
      if (!existente || plano.ordem < existente.plano.ordem) {
        hotsitesMap.set(hotsiteId, {
          hotsite,
          plano,
        });
      }
    });
    
    // Converter para array e formatar
    let resultado = Array.from(hotsitesMap.values()).map(({ hotsite, plano }) => ({
      id: hotsite.id,
      empresaId: hotsite.empresa_id,
      cidadeId: hotsite.cidade_id,
      nomeExibicao: hotsite.nome_exibicao,
      descricao: hotsite.descricao,
      endereco: hotsite.endereco,
      cidade: hotsite.cidade,
      estado: hotsite.estado,
      tipoempresa: hotsite.tipoempresa,
      telefone1: hotsite.telefone1,
      telefone2: hotsite.telefone2,
      verificado: hotsite.verificado || false,
      logoUrl: hotsite.logo_url,
      foto1Url: hotsite.foto1_url,
      foto2Url: hotsite.foto2_url,
      foto3Url: hotsite.foto3_url,
      servicos: hotsite.servicos || [],
      descontos: hotsite.descontos || [],
      formasPagamento: hotsite.formas_pagamento || [],
      highlights: hotsite.highlights || [],
      createdAt: hotsite.created_at,
      updatedAt: hotsite.updated_at,
      plano,
    }));
    
    // Filtrar por tipo de empresa (se especificado)
    if (tipoEmpresa && tipoEmpresa !== 'todos') {
      resultado = resultado.filter(h => h.tipoempresa === tipoEmpresa);
    }
    
    // Ordenar por plano (ordem) e depois por nome
    resultado.sort((a, b) => {
      const ordemA = a.plano?.ordem ?? 999;
      const ordemB = b.plano?.ordem ?? 999;
      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }
      return (a.nomeExibicao || '').localeCompare(b.nomeExibicao || '');
    });
    
    return resultado;
  } catch (err: any) {
    console.error('Erro inesperado ao buscar hotsites por cidade slug:', err);
    return [];
  }
};

/**
 * Conta hotsites por tipo de empresa em uma cidade
 * LÓGICA SIMPLIFICADA: Usa mesma query de campanhas ativas
 */
export const getHotsitesCountByTipo = async (
  cidadeSlug: string
): Promise<{ mudanca: number; carreto: number; guardamoveis: number }> => {
  try {
    const supabase = createServerClient();
    
    // Primeiro, buscar a cidade para pegar o ID
    const { data: cidade, error: cidadeError } = await supabase
      .from('cidades')
      .select('id')
      .eq('slug', cidadeSlug)
      .single();
    
    if (cidadeError || !cidade) {
      return { mudanca: 0, carreto: 0, guardamoveis: 0 };
    }
    
    // Buscar campanhas ativas da cidade
    const hoje = new Date().toISOString().split('T')[0];
    
    const { data: campanhas, error } = await supabase
      .from('campanhas')
      .select(`
        hotsite_id,
        hotsite:hotsites!hotsite_id(
          id,
          tipoempresa,
          cidade_id
        )
      `)
      .eq('ativo', true)
      .eq('hotsite.cidade_id', cidade.id)
      .lte('data_inicio', hoje);
      // REMOVIDO: .or(`data_fim.is.null,data_fim.gte.${hoje}`)
      // Agora apenas verifica se ativo = true, ignorando data de vencimento
    
    if (error || !campanhas || campanhas.length === 0) {
      return { mudanca: 0, carreto: 0, guardamoveis: 0 };
    }
    
    // Extrair hotsites únicos
    const hotsitesUnicos = new Map<string, string>();
    campanhas.forEach((c: any) => {
      if (c.hotsite?.id && c.hotsite?.tipoempresa) {
        hotsitesUnicos.set(c.hotsite.id, c.hotsite.tipoempresa);
      }
    });
    
    // Contar por tipo
    const counts = {
      mudanca: 0,
      carreto: 0,
      guardamoveis: 0,
    };
    
    hotsitesUnicos.forEach((tipoempresa) => {
      if (tipoempresa === 'Empresa de Mudança') {
        counts.mudanca++;
      } else if (tipoempresa === 'Carretos') {
        counts.carreto++;
      } else if (tipoempresa === 'Guarda-Móveis') {
        counts.guardamoveis++;
      }
    });
    
    return counts;
  } catch (err: any) {
    console.error('Erro inesperado ao contar hotsites:', err);
    return { mudanca: 0, carreto: 0, guardamoveis: 0 };
  }
};

