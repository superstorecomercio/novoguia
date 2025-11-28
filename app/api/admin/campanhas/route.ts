import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Normaliza uma data string para evitar problemas de timezone
 * Garante que a data seja tratada como DATE local, não como TIMESTAMP
 */
function normalizeDate(dateString: string | null | undefined): string | null {
  if (!dateString || dateString.trim() === '') {
    return null;
  }

  const trimmed = dateString.trim();

  // Se já está no formato YYYY-MM-DD, retornar diretamente
  // O PostgreSQL interpreta strings no formato YYYY-MM-DD como DATE (sem timezone)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Se não está no formato esperado, tentar parsear e converter
  try {
    // Criar uma data local a partir da string
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    // Usar métodos locais (getFullYear, getMonth, getDate) para evitar conversão de timezone
    // Isso garante que a data seja a mesma que o usuário selecionou
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

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

    // Normalizar datas para evitar problemas de timezone
    const dataInicioNormalizada = body.data_inicio 
      ? normalizeDate(body.data_inicio) 
      : new Date().toISOString().split('T')[0];
    const dataFimNormalizada = normalizeDate(body.data_fim);

    // Criar campanha com hotsite_id garantido
    const campanhaData = {
      hotsite_id: hotsiteId,
      empresa_id: body.empresa_id || null, // Manter por compatibilidade
      plano_id: body.plano_id,
      data_inicio: dataInicioNormalizada,
      data_fim: dataFimNormalizada,
      valor_mensal: body.valor_total || body.valor_mensal || 0, // Aceita ambos para compatibilidade
      participa_cotacao: body.participa_cotacao !== undefined ? body.participa_cotacao : true,
      limite_orcamentos_mes: body.limite_orcamentos_mes || null,
      envia_email_ativacao: body.envia_email_ativacao !== undefined ? body.envia_email_ativacao : true,
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

    // Se email, telefone1 ou tipoempresa foram enviados, atualizar o hotsite
    if (hotsiteId && (body.email !== undefined || body.telefone1 !== undefined || body.tipoempresa !== undefined)) {
      const hotsiteUpdateData: any = {};
      
      if (body.email !== undefined) {
        hotsiteUpdateData.email = body.email;
      }
      
      if (body.telefone1 !== undefined) {
        hotsiteUpdateData.telefone1 = body.telefone1 || null;
      }
      
      if (body.tipoempresa !== undefined) {
        hotsiteUpdateData.tipoempresa = body.tipoempresa;
      }
      
      if (Object.keys(hotsiteUpdateData).length > 0) {
        console.log('📝 [API Campanhas] Atualizando hotsite ao criar campanha:', hotsiteId, hotsiteUpdateData);
        
        const { error: hotsiteError } = await supabase
          .from('hotsites')
          .update(hotsiteUpdateData)
          .eq('id', hotsiteId);

        if (hotsiteError) {
          console.error('❌ [API Campanhas] Erro ao atualizar hotsite:', hotsiteError);
          // Não retorna erro fatal, apenas loga
        } else {
          console.log('✅ [API Campanhas] Hotsite atualizado ao criar campanha!', hotsiteUpdateData);
        }
      }
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

