import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { processEmailTemplate } from '@/lib/email/template-service'
import { htmlToTextServer } from '@/lib/utils/html-to-text'

export async function POST(request: NextRequest) {
  try {
    const { orcamentoId, empresaId } = await request.json()

    if (!orcamentoId || !empresaId) {
      return NextResponse.json(
        { error: 'ID do orçamento e empresa são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Buscar orçamento completo
    const { data: orcamento, error: orcamentoError } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', orcamentoId)
      .single()

    if (orcamentoError || !orcamento) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      )
    }

    // Buscar vínculo empresa-orçamento
    const { data: vinculo, error: vinculoError } = await supabase
      .from('orcamentos_campanhas')
      .select('*, hotsites(*)')
      .eq('id', empresaId)
      .eq('orcamento_id', orcamentoId)
      .single()

    if (vinculoError || !vinculo) {
      return NextResponse.json(
        { error: 'Vínculo empresa-orçamento não encontrado' },
        { status: 404 }
      )
    }

    const hotsite = vinculo.hotsites

    // Funções auxiliares de formatação
    const formatarTelefone = (telefone: string | null | undefined): string => {
      if (!telefone) return 'Não informado'
      // Remover todos os caracteres não numéricos
      const numeros = telefone.replace(/\D/g, '')
      if (numeros.length === 0) return 'Não informado'
      
      // Se já está formatado, retornar como está (mas garantir formato correto)
      if (telefone.includes('(') && telefone.includes(')')) {
        // Já está formatado, mas vamos garantir que está no formato correto
        const nums = numeros
        if (nums.length === 10) {
          return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`
        } else if (nums.length === 11) {
          return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
        }
      }
      
      // Formatar baseado no número de dígitos
      if (numeros.length === 10) {
        // Telefone fixo: (XX) XXXX-XXXX
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`
      } else if (numeros.length === 11) {
        // Celular: (XX) XXXXX-XXXX
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
      } else if (numeros.length > 11) {
        // Pode ter código do país, remover e formatar
        const semPais = numeros.slice(-11) // Últimos 11 dígitos
        return `(${semPais.slice(0, 2)}) ${semPais.slice(2, 7)}-${semPais.slice(7)}`
      }
      
      return telefone // Retorna original se não conseguir formatar
    }

    const formatarMetragem = (metragem: number | string | null | undefined): string => {
      if (!metragem) return 'Não informado'
      const num = typeof metragem === 'string' ? parseFloat(metragem) : metragem
      if (isNaN(num) || num <= 0) return 'Não informado'
      return `${num.toLocaleString('pt-BR')} m²`
    }

    const formatarData = (data: string | Date | null | undefined): string => {
      if (!data) return 'Não informado'
      
      // Se for string no formato YYYY-MM-DD (data DATE do PostgreSQL), tratar como data local
      if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
        const [ano, mes, dia] = data.split('-').map(Number)
        return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`
      }
      
      // Para outros formatos, usar conversão padrão
      try {
        const dataObj = typeof data === 'string' ? new Date(data) : data
        if (isNaN(dataObj.getTime())) return 'Não informado'
        return dataObj.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      } catch {
        return 'Não informado'
      }
    }

    // Preparar variáveis para o template
    const tipoImovelLabels: Record<string, string> = {
      casa: 'Casa',
      apartamento: 'Apartamento',
      empresa: 'Empresa',
      '1_quarto': '1 Quarto',
      '2_quartos': '2 Quartos',
      '3_quartos': '3 Quartos',
      '4_quartos': '4 Quartos'
    }

    const tipoImovel = tipoImovelLabels[orcamento.tipo_imovel] || orcamento.tipo_imovel

    // Preparar número do WhatsApp do cliente para o link
    const whatsappCliente = orcamento.telefone_cliente || orcamento.whatsapp || ''
    // Remover caracteres não numéricos e garantir formato internacional
    const whatsappNumeros = whatsappCliente.replace(/\D/g, '')
    // Se não começar com 55 (código do Brasil), adicionar
    const whatsappFormatado = whatsappNumeros.startsWith('55') 
      ? whatsappNumeros 
      : `55${whatsappNumeros}`
    // Formatar origem e destino para mensagem WhatsApp
    const origemFormatada = (() => {
      const origem = orcamento.origem_completo || '';
      const cidadeEstado = orcamento.cidade_origem && orcamento.estado_origem 
        ? `${orcamento.cidade_origem}, ${orcamento.estado_origem}` 
        : '';
      if (origem && cidadeEstado && origem.trim() !== cidadeEstado.trim()) {
        return `${origem} (${cidadeEstado})`;
      }
      return origem || cidadeEstado || 'Não informado';
    })();
    const destinoFormatado = (() => {
      const destino = orcamento.destino_completo || '';
      const cidadeEstado = orcamento.cidade_destino && orcamento.estado_destino 
        ? `${orcamento.cidade_destino}, ${orcamento.estado_destino}` 
        : '';
      if (destino && cidadeEstado && destino.trim() !== cidadeEstado.trim()) {
        return `${destino} (${cidadeEstado})`;
      }
      return destino || cidadeEstado || 'Não informado';
    })();
    
    // Criar URL do WhatsApp com mensagem pré-formatada
    const mensagemWhatsApp = encodeURIComponent(
      `Olá ${orcamento.nome_cliente}! Vi seu orçamento de mudança de ${origemFormatada} para ${destinoFormatado} e gostaria de ajudar.`
    )
    const urlWhatsApp = whatsappNumeros 
      ? `https://wa.me/${whatsappFormatado}?text=${mensagemWhatsApp}`
      : '#'

    const variables = {
      codigo_orcamento: orcamento.codigo_orcamento || '',
      nome_cliente: orcamento.nome_cliente,
      email_cliente: orcamento.email_cliente,
      telefone_cliente: formatarTelefone(whatsappCliente),
      origem_completo: origemFormatada,
      destino_completo: destinoFormatado,
      tipo_imovel: tipoImovel,
      metragem: formatarMetragem(orcamento.metragem),
      distancia_km: orcamento.distancia_km?.toString() || '0',
      preco_min: orcamento.preco_min?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00',
      preco_max: orcamento.preco_max?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00',
      data_estimada: formatarData(orcamento.data_estimada),
      lista_objetos: orcamento.lista_objetos || '',
      url_whatsapp: urlWhatsApp,
      empresa_nome: hotsite?.nome_exibicao || '',
      empresa_email: hotsite?.email || ''
    }

    // Processar template
    // IMPORTANTE: Passar orcamento_id e hotsite_id para reutilizar código de rastreamento existente
    const resultado = await processEmailTemplate('orcamento_empresa', variables, {
      orcamento_id: orcamentoId,
      hotsite_id: hotsite?.id,
      tipo_email: 'orcamento_empresa'
    })

    if (!resultado) {
      return NextResponse.json(
        { error: 'Template de email não encontrado ou inativo' },
        { status: 404 }
      )
    }

    // Converter HTML para texto puro
    const texto = htmlToTextServer(resultado.html)
    
    // Log para debug
    console.log('📧 [Preview] HTML length:', resultado.html.length)
    console.log('📧 [Preview] Texto length:', texto.length)
    console.log('📧 [Preview] Texto preview:', texto.substring(0, 200))

    return NextResponse.json({
      success: true,
      assunto: resultado.assunto,
      html: resultado.html,
      texto: texto || 'Erro ao converter HTML para texto',
      codigo_rastreamento: resultado.codigoRastreamento,
      destinatario: hotsite?.email,
      empresa: hotsite?.nome_exibicao
    })

  } catch (error: any) {
    console.error('Erro ao gerar preview do email:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar preview do email' },
      { status: 500 }
    )
  }
}

