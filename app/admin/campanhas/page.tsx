import { createAdminClient } from '@/lib/supabase/server';
import CampanhasList from '@/app/components/admin/CampanhasList';

// Desabilitar cache para sempre buscar dados atualizados
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CampanhasPage() {
  const supabase = createAdminClient();

  // Buscar campanhas com hotsites relacionados (usando hotsite_id)
  const { data: campanhas, error } = await supabase
    .from('campanhas')
    .select(`
      id,
      hotsite_id,
      empresa_id,
      data_inicio,
      data_fim,
      valor_mensal,
      ativo,
      participa_cotacao,
      limite_orcamentos_mes,
      hotsite:hotsites!hotsite_id(
        id,
        nome_exibicao,
        telefone1,
        tipoempresa,
        cidade:cidades(nome, estado)
      ),
      empresas(
        id,
        nome,
        hotsites(
          id, 
          nome_exibicao, 
          tipoempresa,
          cidade:cidades(nome, estado)
        )
      ),
      planos(
        id,
        nome,
        ordem
      )
    `)
    .order('data_inicio', { ascending: false });

  if (error) {
    console.error('❌ Erro ao buscar campanhas:', error);
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">Erro ao carregar campanhas</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  // Formatar dados para o componente (priorizando hotsite_id)
  const campanhasFormatadas = campanhas?.map((c: any) => {
    // Status ativo vem diretamente do campo booleano
    const ativo = c.ativo === true;

    // Priorizar hotsite vinculado diretamente (via hotsite_id)
    let hotsite = c.hotsite; // Vínculo direto via hotsite_id
    
    // Fallback: buscar via empresa_id (compatibilidade temporária)
    if (!hotsite && c.empresas?.hotsites && c.empresas.hotsites.length > 0) {
      hotsite = c.empresas.hotsites[0];
    }

    // Nome da empresa vem do hotsite
    const empresaNome = hotsite?.nome_exibicao || c.empresas?.nome || 'Sem vínculo';
    
    // Cidade vem do hotsite (agora via JOIN com tabela cidades)
    const cidadeNome = hotsite?.cidade?.nome && hotsite?.cidade?.estado
      ? `${hotsite.cidade.nome} - ${hotsite.cidade.estado}`
      : undefined;
    
    // Tipo de empresa vem do hotsite
    const tipoEmpresa = hotsite?.tipoempresa || 'Empresa de Mudança';

    return {
      id: c.id,
      hotsite_id: c.hotsite_id,
      empresa_id: c.empresa_id,
      empresa_nome: empresaNome,
      plano_nome: c.planos?.nome || 'Sem plano',
      plano_ordem: c.planos?.ordem || 999,
      cidade_nome: cidadeNome,
      tipoempresa: tipoEmpresa,
      data_inicio: c.data_inicio,
      data_fim: c.data_fim,
      valor: c.valor_mensal || 0,
      ativo,
      participa_cotacao: c.participa_cotacao,
      limite_orcamentos_mes: c.limite_orcamentos_mes,
    };
  }) || [];

  console.log('✅ Campanhas carregadas:', campanhasFormatadas.length);

  // Contar ativas e inativas
  const ativas = campanhasFormatadas.filter((c) => c.ativo).length;
  const inativas = campanhasFormatadas.filter((c) => !c.ativo).length;

  // Buscar hotsites e planos para o formulário de nova campanha
  // Buscar total de hotsites para paginação
  const { count: totalHotsites } = await supabase
    .from('hotsites')
    .select('*', { count: 'exact', head: true });

  // Buscar todos os hotsites em lotes (limite de 1000 por vez)
  const pageSize = 1000;
  const totalPages = Math.ceil((totalHotsites || 0) / pageSize);
  let allHotsites: any[] = [];

  for (let page = 0; page < totalPages; page++) {
    const start = page * pageSize;
    const end = start + pageSize - 1;
    
    const { data: hotsitesPage } = await supabase
      .from('hotsites')
      .select('id, nome_exibicao, cidade:cidades(nome, estado)')
      .order('nome_exibicao', { ascending: true })
      .range(start, end);
    
    if (hotsitesPage) {
      allHotsites = [...allHotsites, ...hotsitesPage];
    }
  }

  const hotsitesDisponiveis = allHotsites;

  const { data: planosDisponiveis } = await supabase
    .from('planos')
    .select('id, nome, ordem')
    .order('ordem', { ascending: true });

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campanhas</h1>
          <p className="text-gray-600 mt-2">
            Gerencie as campanhas ativas dos hotsites
          </p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total de Campanhas</p>
              <p className="text-3xl font-bold text-gray-900">
                {campanhasFormatadas.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-2xl">
              📢
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Campanhas Ativas</p>
              <p className="text-3xl font-bold text-green-600">{ativas}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-2xl">
              ✅
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Campanhas Inativas</p>
              <p className="text-3xl font-bold text-red-600">{inativas}</p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-2xl">
              ❌
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Campanhas */}
      <CampanhasList 
        campanhas={campanhasFormatadas} 
        hotsites={hotsitesDisponiveis || []}
        planos={planosDisponiveis || []}
      />
    </div>
  );
}

