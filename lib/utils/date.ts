// Utilitários para formatação de datas no timezone do Brasil

/**
 * Formata uma data para o timezone do Brasil (America/Sao_Paulo)
 * @param dateString - Data em formato ISO string ou Date object
 * @param options - Opções de formatação (Intl.DateTimeFormatOptions)
 * @returns String formatada no timezone do Brasil
 */
export function formatDateBR(
  dateString: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return '-'

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString

    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return '-'
    }

    // Opções padrão
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Sao_Paulo',
      ...options
    }

    return new Intl.DateTimeFormat('pt-BR', defaultOptions).format(date)
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return '-'
  }
}

/**
 * Formata data e hora no formato brasileiro
 * @param dateString - Data em formato ISO string ou Date object
 * @returns String formatada: "DD/MM/AAAA HH:MM"
 */
export function formatDateTimeBR(dateString: string | Date | null | undefined): string {
  return formatDateBR(dateString, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  })
}

/**
 * Formata apenas a data no formato brasileiro
 * @param dateString - Data em formato ISO string ou Date object
 * @returns String formatada: "DD/MM/AAAA"
 */
export function formatDateOnlyBR(dateString: string | Date | null | undefined): string {
  return formatDateBR(dateString, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo'
  })
}

/**
 * Formata apenas a hora no formato brasileiro
 * @param dateString - Data em formato ISO string ou Date object
 * @returns String formatada: "HH:MM"
 */
export function formatTimeOnlyBR(dateString: string | Date | null | undefined): string {
  return formatDateBR(dateString, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  })
}

/**
 * Formata data e hora completa no formato brasileiro
 * @param dateString - Data em formato ISO string ou Date object
 * @returns String formatada: "DD/MM/AAAA às HH:MM"
 */
export function formatDateTimeFullBR(dateString: string | Date | null | undefined): string {
  return formatDateBR(dateString, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Sao_Paulo'
  }).replace(',', ' às')
}

/**
 * Converte uma data para o timezone do Brasil antes de salvar no banco
 * Útil quando você precisa garantir que a data está no timezone correto
 * @param dateString - Data em formato ISO string ou Date object
 * @returns Date object ajustado para o timezone do Brasil
 */
export function toBrazilTimezone(dateString: string | Date): Date {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  // Criar uma string no formato do Brasil e converter de volta
  const brazilDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  
  return brazilDate
}

/**
 * Obtém a data atual no timezone do Brasil
 * @returns Date object no timezone do Brasil
 */
export function getNowBrazil(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
}

