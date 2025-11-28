import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { processEmailTemplate } from '@/lib/email/template-service'
import { getEmailConfig } from '@/lib/email/config'
import { importEmailService } from '@/lib/email/dynamic-import'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const { email_destinatario } = body

    if (!email_destinatario || !email_destinatario.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Buscar orçamento
    const { data: orcamento, error: orcamentoError } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', resolvedParams.id)
      .single()

    if (orcamentoError || !orcamento) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      )
    }

    // Buscar um hotsite para usar como referência (ou criar um temporário)
    // Se não houver hotsites, vamos criar um registro temporário em orcamentos_campanhas
    const { data: hotsitesExistentes } = await supabase
      .from('orcamentos_campanhas')
      .select('hotsite_id, campanha_id')
      .eq('orcamento_id', resolvedParams.id)
      .limit(1)
      .maybeSingle()

    let hotsiteId: string | null = null
    let campanhaId: string | null = null

    if (hotsitesExistentes) {
      hotsiteId = hotsitesExistentes.hotsite_id
      campanhaId = hotsitesExistentes.campanha_id
    } else {
      // Buscar qualquer hotsite ativo para usar como referência
      const { data: hotsiteRef } = await supabase
        .from('hotsites')
        .select('id')
        .eq('ativo', true)
        .limit(1)
        .maybeSingle()

      if (hotsiteRef) {
        hotsiteId = hotsiteRef.id
      }
    }

    // Buscar configuração de email
    const emailConfig = await getEmailConfig()
    const { isTestMode } = await import('@/lib/email/test-mode')
    const testMode = await isTestMode()

    if (!emailConfig) {
      return NextResponse.json(
        { error: 'Configuração de email não encontrada' },
        { status: 400 }
      )
    }

    // Em modo teste, usar provider padrão se não tiver
    if (testMode && (!emailConfig.provider || emailConfig.provider === null)) {
      emailConfig.provider = 'socketlabs'
    }

    if (!testMode && (!emailConfig.provider || !emailConfig.api_key || !emailConfig.from_email)) {
      return NextResponse.json(
        { error: 'Configuração de email incompleta' },
        { status: 400 }
      )
    }

    // Usar um único hotsite especial para emails manuais (criar uma vez, reutilizar)
    // Para cada email manual, criamos uma nova campanha para permitir múltiplos registros
    let hotsiteIdFinal: string | null = null
    let campanhaIdFinal: string | null = null

    // Buscar ou criar hotsite especial para emails manuais
    const { data: hotsiteManual } = await supabase
      .from('hotsites')
      .select('id')
      .ilike('nome_exibicao', 'E-mail Manual%')
      .limit(1)
      .maybeSingle()

    if (hotsiteManual) {
      hotsiteIdFinal = hotsiteManual.id
    } else {
      // Criar hotsite especial para emails manuais (apenas uma vez)
      const { data: empresaRef } = await supabase
        .from('empresas')
        .select('id')
        .eq('ativo', true)
        .limit(1)
        .maybeSingle()

      if (empresaRef) {
        const { data: novoHotsite, error: hotsiteError } = await supabase
          .from('hotsites')
          .insert({
            empresa_id: empresaRef.id,
            nome_exibicao: 'E-mail Manual',
            email: email_destinatario, // Usar o primeiro email como referência
            ativo: true
          })
          .select('id')
          .single()

        if (novoHotsite && !hotsiteError) {
          hotsiteIdFinal = novoHotsite.id
        }
      }
    }

    // Para cada email manual, criar uma nova campanha (permite múltiplos registros)
    // IMPORTANTE: participa_cotacao = false para que não seja incluída em envios automáticos
    if (hotsiteIdFinal) {
      const { data: novaCampanha, error: campanhaError } = await supabase
        .from('campanhas')
        .insert({
          hotsite_id: hotsiteIdFinal,
          ativo: false, // Campanha inativa (não participa de envios automáticos)
          participa_cotacao: false, // CRÍTICO: não participa de cotação automática
          data_inicio: new Date().toISOString().split('T')[0]
        })
        .select('id')
        .single()

      if (novaCampanha && !campanhaError) {
        campanhaIdFinal = novaCampanha.id
      }
    }

    // Validar que temos hotsite e campanha antes de continuar
    if (!hotsiteIdFinal || !campanhaIdFinal) {
      return NextResponse.json(
        { error: 'Não foi possível criar ou encontrar hotsite/campanha para o email manual' },
        { status: 500 }
      )
    }

    // Atualizar o email do hotsite manual (pode ser o último email usado)
    // Mas manter o nome genérico "E-mail Manual"
    if (hotsiteIdFinal) {
      await supabase
        .from('hotsites')
        .update({
          email: email_destinatario
        })
        .eq('id', hotsiteIdFinal)
    }

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

    // Preparar variáveis para o template (igual ao envio automático)
    const tipoImovelLabels: Record<string, string> = {
      casa: 'Casa',
      apartamento: 'Apartamento',
      empresa: 'Empresa',
      '1_quarto': '1 Quarto',
      '2_quartos': '2 Quartos',
      '3_quartos': '3 Quartos',
      '4_quartos': '4 Quartos'
    }

    const tipoImovel = tipoImovelLabels[orcamento.tipo_imovel || ''] || orcamento.tipo_imovel || 'Não informado'

    // Preparar número do WhatsApp do cliente para o link
    const whatsappCliente = orcamento.telefone_cliente || orcamento.whatsapp || ''
    // Remover caracteres não numéricos e garantir formato internacional
    const whatsappNumeros = whatsappCliente.replace(/\D/g, '')
    // Se não começar com 55 (código do Brasil), adicionar
    const whatsappFormatado = whatsappNumeros.startsWith('55') 
      ? whatsappNumeros 
      : `55${whatsappNumeros}`
    
    // Formatar origem e destino para mensagem WhatsApp e variáveis do email
    const origemFormatada = (() => {
      const origem = orcamento.origem_completo || '';
      const cidadeEstado = (orcamento as any).cidade_origem && (orcamento as any).estado_origem 
        ? `${(orcamento as any).cidade_origem}, ${(orcamento as any).estado_origem}` 
        : '';
      if (origem && cidadeEstado && origem.trim() !== cidadeEstado.trim()) {
        return `${origem} (${cidadeEstado})`;
      }
      return origem || cidadeEstado || 'Não informado';
    })();
    const destinoFormatado = (() => {
      const destino = orcamento.destino_completo || '';
      const cidadeEstado = (orcamento as any).cidade_destino && (orcamento as any).estado_destino 
        ? `${(orcamento as any).cidade_destino}, ${(orcamento as any).estado_destino}` 
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
      metragem: formatarMetragem((orcamento as any).metragem),
      distancia_km: orcamento.distancia_km?.toString() || '0',
      preco_min: orcamento.preco_min?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00',
      preco_max: orcamento.preco_max?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00',
      data_estimada: formatarData(orcamento.data_estimada),
      lista_objetos: orcamento.lista_objetos || '',
      url_whatsapp: urlWhatsApp,
      empresa_nome: 'E-mail Manual',
      empresa_email: email_destinatario
    }

    // Processar template do email
    const templateResult = await processEmailTemplate(
      'orcamento_empresa',
      variables,
      {
        orcamento_id: orcamento.id,
        hotsite_id: hotsiteIdFinal,
        tipo_email: 'orcamento_empresa'
      }
    )

    if (!templateResult) {
      return NextResponse.json(
        { error: 'Template de email não encontrado ou inativo' },
        { status: 400 }
      )
    }

    // Importar serviço de email baseado no provider
    const emailService = await importEmailService((emailConfig.provider || 'socketlabs') as 'socketlabs' | 'resend' | 'sendgrid' | 'nodemailer')
    if (!emailService) {
      return NextResponse.json(
        { error: `Serviço de email ${emailConfig.provider} não disponível` },
        { status: 400 }
      )
    }

    // Preparar configuração do serviço
    const serviceConfig: any = {
      apiKey: emailConfig.api_key,
      from: emailConfig.from_email,
      fromName: emailConfig.from_name,
      replyTo: emailConfig.reply_to || emailConfig.from_email
    }

    // Adicionar serverId se for SocketLabs
    if (emailConfig.provider === 'socketlabs' && emailConfig.server_id) {
      serviceConfig.serverId = emailConfig.server_id
    }

    // Enviar email imediatamente (não vai para a fila)
    const sendResult = await emailService.sendEmail(
      {
        to: email_destinatario,
        subject: templateResult.assunto,
        html: templateResult.html,
        from: emailConfig.from_email || 'contato@mudatech.com.br',
        fromName: emailConfig.from_name || 'MudaTech',
        replyTo: emailConfig.reply_to || emailConfig.from_email,
        metadata: {
          orcamento_id: orcamento.id,
          hotsite_id: hotsiteIdFinal,
          campanha_id: campanhaIdFinal
        }
      },
      serviceConfig
    )

    // Determinar status baseado no resultado do envio
    const statusEnvio = sendResult.success ? 'enviado' : 'erro'

    // Criar novo registro em orcamentos_campanhas para email manual
    // Para emails manuais, sempre criamos um novo registro (nunca atualizamos existentes)
    if (hotsiteIdFinal && campanhaIdFinal) {
      const insertData: any = {
        orcamento_id: resolvedParams.id,
        hotsite_id: hotsiteIdFinal,
        campanha_id: campanhaIdFinal,
        status_envio_email: statusEnvio,
        tentativas_envio: 1,
        ultimo_erro_envio: statusEnvio === 'erro' ? (sendResult.error || 'Erro desconhecido') : null,
        email_enviado_em: statusEnvio === 'enviado' ? new Date().toISOString() : null
      }

      // Sempre inserir um novo registro (nunca atualizar)
      // Como cada email manual tem seu próprio hotsite único, não haverá conflito
      await supabase
        .from('orcamentos_campanhas')
        .insert(insertData)
    }

    // Se o envio falhou, retornar erro
    if (!sendResult.success) {
      return NextResponse.json(
        { 
          error: sendResult.error || 'Erro ao enviar email',
          status: statusEnvio
        },
        { status: 500 }
      )
    }

    // Atualizar status do orçamento se estava 'sem_empresas'
    if (orcamento.status_envio_email === 'sem_empresas') {
      await supabase
        .from('orcamentos')
        .update({ status_envio_email: 'na_fila' })
        .eq('id', resolvedParams.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Email enviado com sucesso',
      status: statusEnvio
    })
  } catch (error) {
    console.error('❌ [Enviar Email Manual] Erro completo:', error)
    console.error('❌ [Enviar Email Manual] Stack:', error instanceof Error ? error.stack : 'N/A')
    return NextResponse.json(
      { 
        error: 'Erro ao enviar email', 
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

