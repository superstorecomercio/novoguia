import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/campanhas
 * Cria uma nova campanha
 * Garante que sempre haja um hotsite_id
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createAdminClient();

    // Validar dados obrigatórios
    if (!body.empresa_id && !body.hotsite_id) {
      return NextResponse.json(
        { error: 'É necessário fornecer empresa_id ou hotsite_id' },
        { status: 400 }
      );
    }

    if (!body.plano_id) {
      return NextResponse.json(
        { error: 'É necessário fornecer plano_id' },
        { status: 400 }
      );
    }

    let hotsiteId = body.hotsite_id;

    // Se forneceu empresa_id mas não hotsite_id, buscar/criar hotsite
    if (body.empresa_id && !hotsiteId) {
      // Tentar encontrar hotsite existente
      const { data: hotsiteExistente } = await supabase
        .from('hotsites')
        .select('id')
        .eq('empresa_id', body.empresa_id)
        .single();

      if (hotsiteExistente) {
        hotsiteId = hotsiteExistente.id;
        console.log('✅ Hotsite existente encontrado:', hotsiteId);
      } else {
        // Criar novo hotsite a partir da empresa
        const { data: empresa } = await supabase
          .from('empresas')
          .select(`
            id,
            nome,
            telefones,
            endereco,
            descricao,
            cidade_id,
            cidades!inner(nome, estado)
          `)
          .eq('id', body.empresa_id)
          .single();

        if (!empresa) {
          return NextResponse.json(
            { error: 'Empresa não encontrada' },
            { status: 404 }
          );
        }

        const cidade = (empresa as any).cidades;
        const cidadeNome = cidade?.nome || 'Não informado';
        const estadoSigla = cidade?.estado || 'XX';

        const { data: novoHotsite, error: errorHotsite } = await supabase
          .from('hotsites')
          .insert({
            empresa_id: empresa.id,
            nome_exibicao: empresa.nome,
            descricao: empresa.descricao || `Empresa de mudanças e transportes em ${cidadeNome}/${estadoSigla}`,
            endereco: empresa.endereco,
            cidade: cidadeNome,
            estado: estadoSigla,
            cidade_id: empresa.cidade_id,
            telefone1: empresa.telefones?.[0] || null,
            telefone2: empresa.telefones?.[1] || null,
            servicos: ['Mudanças', 'Transportes'],
            formas_pagamento: ['Dinheiro', 'PIX', 'Cartão'],
          })
          .select('id')
          .single();

        if (errorHotsite || !novoHotsite) {
          return NextResponse.json(
            { error: 'Erro ao criar hotsite automático', details: errorHotsite?.message },
            { status: 500 }
          );
        }

        hotsiteId = novoHotsite.id;
        console.log('✅ Novo hotsite criado automaticamente:', hotsiteId);
      }
    }

    // Criar campanha com hotsite_id garantido
    const campanhaData = {
      hotsite_id: hotsiteId,
      empresa_id: body.empresa_id || null, // Manter por compatibilidade
      plano_id: body.plano_id,
      data_inicio: body.data_inicio || new Date().toISOString().split('T')[0],
      data_fim: body.data_fim || null,
      valor_total: body.valor_total || 0,
      ativo: false, // Nova campanha inicia inativa
    };

    const { data: campanha, error: errorCampanha } = await supabase
      .from('campanhas')
      .insert(campanhaData)
      .select()
      .single();

    if (errorCampanha) {
      return NextResponse.json(
        { error: 'Erro ao criar campanha', details: errorCampanha.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: campanha,
      message: 'Campanha criada com sucesso',
    });
  } catch (error: any) {
    console.error('❌ Erro ao criar campanha:', error);
    return NextResponse.json(
      { error: 'Erro interno ao criar campanha', details: error.message },
      { status: 500 }
    );
  }
}

