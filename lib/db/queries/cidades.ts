import { createServerClient } from '../../supabase/server';
import { type City } from '../../../app/types';

/**
 * Gera slug a partir do nome da cidade
 */
function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Normaliza string removendo acentos para busca
 */
function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Busca todas as cidades baseadas nos hotsites
 * Retorna cidades únicas com contagem de empresas que têm hotsites nelas
 */
export const getCidades = async (): Promise<City[]> => {
  const supabase = createServerClient();
  
  // Buscar empresas com campanhas ativas
  const { data: empresasComCampanhasAtivas } = await supabase
    .from('campanhas')
    .select('empresa_id')
    .eq('ativo', true);
  
  const empresaIdsAtivas = [...new Set(empresasComCampanhasAtivas?.map(c => c.empresa_id) || [])];
  
  if (empresaIdsAtivas.length === 0) {
    return [];
  }
  
  // Buscar hotsites de empresas com campanhas ativas
  const { data: hotsites, error } = await supabase
    .from('hotsites')
    .select('cidade, estado, empresa_id')
    .in('empresa_id', empresaIdsAtivas)
    .not('cidade', 'is', null)
    .not('estado', 'is', null);

  if (error) {
    console.error('Erro ao buscar cidades dos hotsites:', error);
    throw error;
  }

  // Agrupar por cidade + estado e contar empresas únicas
  const cidadesMap = new Map<string, { nome: string; estado: string; empresas: Set<string> }>();
  
  hotsites?.forEach((hotsite: any) => {
    if (!hotsite.cidade || !hotsite.estado) return;
    
    const key = `${hotsite.cidade}-${hotsite.estado}`.toLowerCase();
    
    if (!cidadesMap.has(key)) {
      cidadesMap.set(key, {
        nome: hotsite.cidade,
        estado: hotsite.estado,
        empresas: new Set(),
      });
    }
    
    cidadesMap.get(key)!.empresas.add(hotsite.empresa_id);
  });

  // Converter para array e ordenar por quantidade de empresas (maior primeiro)
  const cidades: City[] = Array.from(cidadesMap.values())
    .map((cidade) => ({
      id: generateSlug(`${cidade.nome}-${cidade.estado}`), // Usar slug como ID temporário
      name: cidade.nome,
      slug: generateSlug(`${cidade.nome}-${cidade.estado}`),
      state: cidade.estado,
      description: undefined,
      region: undefined,
      createdAt: undefined,
      empresaCount: cidade.empresas.size, // Adicionar contagem
    }))
    .sort((a, b) => {
      // Ordenar por quantidade de empresas (maior primeiro), depois por nome
      if (b.empresaCount !== a.empresaCount) {
        return b.empresaCount - a.empresaCount;
      }
      return a.name.localeCompare(b.name);
    });

  return cidades;
};

/**
 * Busca cidade por slug (baseado nos hotsites)
 * Aceita formatos: "cidade-estado" (ex: "sao-paulo-sp") ou apenas "cidade" (ex: "sao-paulo")
 */
export const getCidadeBySlug = async (slug: string): Promise<City | null> => {
  try {
    const supabase = createServerClient();
    
    // 1. Buscar cidade na tabela cidades pelo slug
    const { data: cidade, error: cidadeError } = await supabase
      .from('cidades')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (cidadeError || !cidade) {
      console.error('Cidade não encontrada:', slug);
      return null;
    }
    
    // 2. Buscar campanhas ativas e vigentes
    const hoje = new Date().toISOString().split('T')[0];
    const { data: campanhasAtivas } = await supabase
      .from('campanhas')
      .select('hotsite_id')
      .eq('ativo', true)
      .lte('data_inicio', hoje)
      .or(`data_fim.is.null,data_fim.gte.${hoje}`);
    
    const hotsiteIdsAtivos = new Set<string>();
    campanhasAtivas?.forEach((c: any) => {
      if (c.hotsite_id) {
        hotsiteIdsAtivos.add(c.hotsite_id);
      }
    });
    
    // 3. Buscar hotsites da cidade
    const { data: hotsitesDaCidade } = await supabase
      .from('hotsites')
      .select('id')
      .eq('cidade_id', cidade.id);
    
    // 4. Filtrar hotsites que têm campanhas ativas
    const hotsitesComCampanha = hotsitesDaCidade?.filter(h => 
      hotsiteIdsAtivos.has(h.id)
    ) || [];
    
    // Contar hotsites únicos com campanhas ativas
    const hotsitesUnicos = new Set(hotsitesComCampanha.map(h => h.id));
    
    return {
      id: cidade.id,
      name: cidade.nome,
      slug: cidade.slug,
      state: cidade.estado,
      description: cidade.descricao || undefined,
      region: cidade.regiao || undefined,
      createdAt: cidade.created_at || undefined,
      empresaCount: hotsitesUnicos.size,
    };
  } catch (err: any) {
    console.error('Erro inesperado ao buscar cidade:', {
      error: err,
      message: err?.message,
      slug,
    });
    return null;
  }
};

/**
 * Busca cidades por estado
 */
export const getCidadesByEstado = async (estado: string): Promise<City[]> => {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('cidades')
    .select('*')
    .eq('estado', estado.toUpperCase())
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao buscar cidades por estado:', error);
    throw error;
  }

  return (data || []).map((cidade: any) => ({
    id: cidade.id,
    name: cidade.nome,
    slug: cidade.slug,
    state: cidade.estado,
    description: cidade.descricao,
    region: cidade.regiao,
    createdAt: cidade.created_at,
  }));
};

/**
 * Busca cidades por região
 */
export const getCidadesByRegiao = async (regiao: string): Promise<City[]> => {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('cidades')
    .select('*')
    .eq('regiao', regiao.toLowerCase())
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao buscar cidades por região:', error);
    throw error;
  }

  return (data || []).map((cidade: any) => ({
    id: cidade.id,
    name: cidade.nome,
    slug: cidade.slug,
    state: cidade.estado,
    description: cidade.descricao,
    region: cidade.regiao,
    createdAt: cidade.created_at,
  }));
};

