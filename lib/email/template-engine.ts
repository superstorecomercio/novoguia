// Engine para processar templates de email com variáveis

export interface TemplateVariables {
  [key: string]: string | number | boolean | null | undefined
}

/**
 * Processa um template HTML substituindo variáveis
 * Suporta sintaxe {{variavel}} e {{#if variavel}}...{{/if}}
 */
export function processTemplate(template: string, variables: TemplateVariables): string {
  let processed = template

  // Substituir variáveis simples {{variavel}}
  Object.keys(variables).forEach(key => {
    const value = variables[key]
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    
    if (value !== null && value !== undefined) {
      processed = processed.replace(regex, String(value))
    } else {
      // Remover blocos vazios se a variável não existir
      processed = processed.replace(regex, '')
    }
  })

  // Processar condicionais {{#if variavel}}...{{/if}}
  const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g
  processed = processed.replace(ifRegex, (match, varName, content) => {
    const value = variables[varName]
    if (value && value !== 'false' && value !== '0' && value !== '') {
      return content
    }
    return ''
  })

  // Limpar linhas vazias excessivas
  processed = processed.replace(/\n\s*\n\s*\n/g, '\n\n')

  return processed
}

/**
 * Gera um código de rastreamento único
 */
export function generateTrackingCode(): string {
  // Formato: MT-XXXXXXXX onde X é alfanumérico
  // Garantir que sempre retorne em MAIÚSCULAS para consistência
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'MT-'
  
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  // Garantir que está em maiúsculas (já está, mas garantir)
  return code.toUpperCase()
}


