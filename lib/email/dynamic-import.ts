/**
 * Helper para importações dinâmicas opcionais
 * Tenta importar um módulo e retorna null se não encontrar
 * Suprime warnings do Next.js/Turbopack sobre módulos não encontrados
 */

export async function tryDynamicImport<T = any>(
  moduleName: string
): Promise<{ module: T; error: null } | { module: null; error: string }> {
  try {
    // Usar eval para evitar que o bundler tente resolver o módulo em tempo de build
    const importFn = new Function('moduleName', 'return import(moduleName)')
    const module = await importFn(moduleName)
    
    return { module, error: null }
  } catch (error: any) {
    // Se o módulo não existe, retornar null sem gerar warning
    if (error.code === 'MODULE_NOT_FOUND' || error.message?.includes('Cannot find module')) {
      return { module: null, error: `Módulo "${moduleName}" não instalado` }
    }
    
    // Outros erros são propagados
    return { module: null, error: error.message || 'Erro ao importar módulo' }
  }
}

