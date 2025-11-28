// Serviço para buscar e processar templates de email

import { createAdminClient } from '@/lib/supabase/server'
import { processTemplate, generateTrackingCode, TemplateVariables } from './template-engine'

export interface EmailTemplate {
  id: string
  tipo: string
  nome: string
  assunto: string
  corpo_html: string
  variaveis: string[]
  ativo: boolean
}

/**
 * Busca um template por tipo
 */
export async function getTemplate(tipo: string): Promise<EmailTemplate | null> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('tipo', tipo)
      .eq('ativo', true)
      .single()

    if (error || !data) {
      console.error(`Template ${tipo} não encontrado:`, error)
      return null
    }

    return data as EmailTemplate
  } catch (error) {
    console.error('Erro ao buscar template:', error)
    return null
  }
}

/**
 * Busca código de rastreamento existente para um orcamento/campanha + hotsite + tipo
 * Retorna o código existente ou null se não existir
 */
export async function getExistingTrackingCode(
  orcamento_id?: string,
  hotsite_id?: string,
  tipo_email?: string,
  campanha_id?: string
): Promise<string | null> {
  if ((!orcamento_id && !campanha_id) || !hotsite_id || !tipo_email) {
    return null
  }

  try {
    const supabase = createAdminClient()
    let query = supabase
      .from('email_tracking')
      .select('codigo_rastreamento')
      .eq('hotsite_id', hotsite_id)
      .eq('tipo_email', tipo_email)

    if (orcamento_id) {
      query = query.eq('orcamento_id', orcamento_id)
    }
    
    if (campanha_id) {
      query = query.eq('campanha_id', campanha_id)
    }

    const { data } = await query.maybeSingle()

    return data?.codigo_rastreamento || null
  } catch (error) {
    console.error('Erro ao buscar código de rastreamento existente:', error)
    return null
  }
}

/**
 * Processa um template com variáveis e retorna assunto e corpo HTML
 * IMPORTANTE: Se orcamento_id e hotsite_id forem fornecidos, verifica se já existe um código de rastreamento
 * e reutiliza o mesmo código para evitar duplicatas
 */
export async function processEmailTemplate(
  tipo: string,
  variables: TemplateVariables,
  options?: {
    orcamento_id?: string
    hotsite_id?: string
    tipo_email?: string
    campanha_id?: string
  }
): Promise<{ assunto: string; html: string; codigoRastreamento: string } | null> {
  const template = await getTemplate(tipo)
  
  if (!template) {
    return null
  }

  // Verificar se já existe um código de rastreamento para este orcamento/campanha + hotsite + tipo
  let codigoRastreamento: string
  if ((options?.orcamento_id || options?.campanha_id) && options?.hotsite_id && options?.tipo_email) {
    const existingCode = await getExistingTrackingCode(
      options.orcamento_id,
      options.hotsite_id,
      options.tipo_email,
      options.campanha_id
    )
    
    if (existingCode) {
      console.log('✅ Reutilizando código de rastreamento existente:', existingCode)
      codigoRastreamento = existingCode
    } else {
      codigoRastreamento = generateTrackingCode()
      console.log('🆕 Gerando novo código de rastreamento:', codigoRastreamento)
    }
  } else {
    // Se não tiver informações para verificar, gerar novo código
    codigoRastreamento = generateTrackingCode()
  }
  
  // Adicionar código de rastreamento às variáveis
  const varsComRastreamento = {
    ...variables,
    codigo_rastreamento: codigoRastreamento
  }

  // Processar template
  const assunto = processTemplate(template.assunto, varsComRastreamento)
  const html = processTemplate(template.corpo_html, varsComRastreamento)

  return {
    assunto,
    html,
    codigoRastreamento
  }
}

/**
 * Salva registro de tracking do email enviado
 * Evita duplicatas verificando se já existe um tracking para o mesmo orcamento_id + hotsite_id + tipo_email
 */
export async function saveEmailTracking(data: {
  codigo_rastreamento: string
  orcamento_id?: string
  campanha_id?: string
  hotsite_id: string
  tipo_email: string
  email_destinatario: string
  assunto: string
  metadata?: any
}): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Garantir que o código está em MAIÚSCULAS antes de salvar
    const codigoNormalizado = data.codigo_rastreamento.trim().toUpperCase()

    // Verificar se já existe um tracking para este orcamento/campanha + hotsite + tipo_email
    // Isso previne duplicatas quando o processo de envio é executado múltiplas vezes
    if (data.hotsite_id) {
      let query = supabase
        .from('email_tracking')
        .select('id, codigo_rastreamento')
        .eq('hotsite_id', data.hotsite_id)
        .eq('tipo_email', data.tipo_email)
      
      // Se tem orcamento_id, filtrar por ele
      if (data.orcamento_id) {
        query = query.eq('orcamento_id', data.orcamento_id)
      }
      // Se tem campanha_id (e não tem orcamento_id), filtrar por ele
      else if (data.campanha_id) {
        query = query.eq('campanha_id', data.campanha_id)
      }
      
      const { data: existingTracking } = await query.maybeSingle()

      if (existingTracking) {
        console.log('⚠️ Tracking já existe para este orcamento/hotsite/tipo. Usando código existente:', existingTracking.codigo_rastreamento)
        // Atualizar o registro existente com os novos dados (assunto, metadata podem ter mudado)
        const { error: updateError } = await supabase
          .from('email_tracking')
          .update({
            assunto: data.assunto,
            email_destinatario: data.email_destinatario,
            metadata: data.metadata || null,
            enviado_em: new Date().toISOString() // Atualizar timestamp do envio
          })
          .eq('id', existingTracking.id)

        if (updateError) {
          console.error('Erro ao atualizar tracking existente:', updateError)
        } else {
          console.log('✅ Tracking existente atualizado:', existingTracking.codigo_rastreamento)
        }
        return // Não criar novo registro
      }
    }

    // Se não existe, criar novo registro
    const { error } = await supabase
      .from('email_tracking')
      .insert({
        codigo_rastreamento: codigoNormalizado,
        orcamento_id: data.orcamento_id || null,
        campanha_id: data.campanha_id || null,
        hotsite_id: data.hotsite_id,
        tipo_email: data.tipo_email,
        email_destinatario: data.email_destinatario,
        assunto: data.assunto,
        metadata: data.metadata || null
      })

    if (error) {
      // Se o erro for de código duplicado, tentar buscar o existente
      if (error.code === '23505' && error.message.includes('codigo_rastreamento')) {
        console.warn('⚠️ Código de rastreamento já existe. Buscando registro existente...')
        const { data: existingByCode } = await supabase
          .from('email_tracking')
          .select('id, codigo_rastreamento, orcamento_id, hotsite_id')
          .eq('codigo_rastreamento', codigoNormalizado)
          .maybeSingle()

        if (existingByCode) {
          console.log('✅ Código já existe no banco:', codigoNormalizado)
          return
        }
      }
      console.error('Erro ao salvar tracking:', error)
      console.error('Código que tentou salvar:', codigoNormalizado)
    } else {
      console.log('✅ Tracking salvo com sucesso:', codigoNormalizado)
    }
  } catch (error) {
    console.error('Erro ao salvar tracking:', error)
  }
}

/**
 * Busca tracking por código de rastreamento
 */
export async function getTrackingByCode(codigo: string) {
  try {
    const supabase = createAdminClient()

    // Normalizar código para maiúsculas e usar busca case-insensitive
    const codigoNormalizado = codigo.trim().toUpperCase()

    const { data, error } = await supabase
      .from('email_tracking')
      .select(`
        *,
        orcamentos(*),
        campanhas(*),
        hotsites(*)
      `)
      .ilike('codigo_rastreamento', codigoNormalizado)
      .single()

    if (error) {
      console.error('Erro ao buscar tracking:', error)
      console.error('Código buscado:', codigoNormalizado)
      return null
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar tracking:', error)
    return null
  }
}


