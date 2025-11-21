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
    
    // Buscar campanhas ativas (usando hotsite_id ou empresa_id)
    const { data: campanhasAtivas } = await supabase
      .from('campanhas')
      .select('hotsite_id, empresa_id')
      .eq('ativo', true);
    
    if (!campanhasAtivas || campanhasAtivas.length === 0) {
      return null;
    }

    // Coletar IDs de hotsites e empresas com campanhas ativas
    const hotsiteIdsAtivos = new Set<string>();
    const empresaIdsAtivas = new Set<string>();
    
    campanhasAtivas.forEach(c => {
      if (c.hotsite_id) hotsiteIdsAtivos.add(c.hotsite_id);
      if (c.empresa_id) empresaIdsAtivas.add(c.empresa_id);
    });
    
    if (hotsiteIdsAtivos.size === 0 && empresaIdsAtivas.size === 0) {
      return null;
    }
    
    // Parse do slug para extrair cidade e estado
    const parts = slug.split('-');
    let cidadeNome: string;
    let estado: string | null = null;
    
    // Estados brasileiros conhecidos (2 letras)
    const estadosBR = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
    
    // Se a última parte é um estado conhecido (2 letras), separar cidade e estado
    if (parts.length >= 2 && estadosBR.includes(parts[parts.length - 1].toUpperCase())) {
      estado = parts[parts.length - 1].toUpperCase();
      cidadeNome = parts.slice(0, -1).join(' ');
    } else {
      // Caso contrário, assumir que todo o slug é o nome da cidade
      cidadeNome = parts.join(' ');
    }
    
    // Normalizar nome da cidade para busca (remover acentos)
    const cidadeNomeNormalizado = normalizeForSearch(cidadeNome);
    
    // Buscar TODOS os hotsites da cidade primeiro
    let query = supabase
      .from('hotsites')
      .select('id, cidade, estado, empresa_id');
    
    if (estado) {
      query = query.eq('estado', estado);
    }
    
    const { data: todosHotsites, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar cidade dos hotsites:', error);
      return null;
    }
    
    if (error) {
      console.error('Erro ao buscar cidade dos hotsites:', error);
      return null;
    }

    // Filtrar localmente por nome normalizado (sem acentos) E que tenham campanha ativa
    const hotsites = todosHotsites?.filter(h => 
      h.cidade && 
      normalizeForSearch(h.cidade).includes(cidadeNomeNormalizado) &&
      (hotsiteIdsAtivos.has(h.id) || (h.empresa_id && empresaIdsAtivas.has(h.empresa_id)))
    ) || [];

    if (hotsites.length === 0) {
      return null;
    }

    const primeiroHotsite = hotsites[0];
    const estadoFinal = estado || primeiroHotsite.estado;
    
    // Contar hotsites únicos nesta cidade com campanhas ativas
    const hotsitesUnicos = new Set(hotsites.map(h => h.id));

    // Gerar slug correto com estado
    const slugCorreto = generateSlug(`${primeiroHotsite.cidade}-${estadoFinal}`);

    return {
      id: slugCorreto,
      name: primeiroHotsite.cidade,
      slug: slugCorreto,
      state: estadoFinal,
      description: undefined,
      region: undefined,
      createdAt: undefined,
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

