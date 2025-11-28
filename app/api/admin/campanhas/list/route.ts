import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🔄 [API] Buscando campanhas...');
    const supabase = createAdminClient();

    // Buscar campanhas com hotsites relacionados (usando hotsite_id)
    // Filtrar campanhas de e-mail manual (participa_cotacao = false) - não devem aparecer na lista
    const { data: campanhas, error } = await supabase
      .from('campanhas')
      .select(`
        id,
        hotsite_id,
        empresa_id,
        plano_id,
        data_inicio,
        data_fim,
        valor_mensal,
        ativo,
        participa_cotacao,
        limite_orcamentos_mes,
        envia_email_ativacao,
        created_at,
        hotsite:hotsites!hotsite_id(
          id,
          nome_exibicao,
          email,
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
          ordem,
          preco
        )
      `)
      .or('participa_cotacao.is.null,participa_cotacao.eq.true') // Excluir apenas campanhas de e-mail manual (participa_cotacao = false)
      .order('data_inicio', { ascending: false });

    if (error) {
      console.error('❌ [API] Erro ao buscar campanhas:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    console.log(`✅ [API] ${campanhas?.length || 0} campanhas encontradas`);

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
        plano_id: c.plano_id || null, // ID do plano para edição
        plano_nome: c.planos?.nome || 'Sem plano',
        plano_ordem: c.planos?.ordem || 999,
        cidade_nome: cidadeNome,
        tipoempresa: tipoEmpresa,
        email: hotsite?.email || '', // Email do hotsite
        telefone1: hotsite?.telefone1 || '', // Telefone1 do hotsite
        data_inicio: c.data_inicio,
        data_fim: c.data_fim,
        valor: c.valor_mensal || 0,
        ativo,
        participa_cotacao: c.participa_cotacao,
        limite_orcamentos_mes: c.limite_orcamentos_mes,
        envia_email_ativacao: c.envia_email_ativacao || false,
        created_at: c.created_at,
      };
    }) || [];

    // Buscar hotsites e planos para o formulário de nova campanha
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
        .select('id, nome_exibicao, email, telefone1, tipoempresa, cidade:cidades(nome, estado)')
        .order('nome_exibicao', { ascending: true })
        .range(start, end);
      
      if (hotsitesPage) {
        allHotsites = [...allHotsites, ...hotsitesPage];
      }
    }

    const { data: planos } = await supabase
      .from('planos')
      .select('id, nome, ordem, preco')
      .order('ordem', { ascending: true });

    console.log(`✅ [API] Retornando: ${campanhasFormatadas.length} campanhas, ${allHotsites.length} hotsites, ${planos?.length || 0} planos`);

    return NextResponse.json({
      campanhas: campanhasFormatadas,
      hotsites: allHotsites,
      planos: planos || [],
    });
  } catch (error: any) {
    console.error('❌ Erro inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

