// Importação dinâmica do logger para evitar problemas de inicialização
let logger: any = null;
function getLogger() {
  if (!logger) {
    try {
      logger = require('./logger').logger;
    } catch (error) {
      // Fallback se logger não estiver disponível
      logger = {
        warn: (...args: any[]) => console.warn(...args),
        debug: (...args: any[]) => console.debug(...args),
        error: (...args: any[]) => console.error(...args),
        info: (...args: any[]) => console.log(...args),
      };
    }
  }
  return logger;
}

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil?: number;
}

// Armazenamento em memória (para desenvolvimento)
// Em produção, considere usar Redis ou banco de dados
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configurações
const RATE_LIMIT_CONFIG = {
  // Máximo de requisições por janela de tempo
  maxRequests: 5,
  // Janela de tempo em milissegundos (15 minutos)
  windowMs: 15 * 60 * 1000,
  // Bloqueio após exceder limite (30 minutos)
  blockDurationMs: 30 * 60 * 1000,
  // Limpar entradas antigas a cada 1 hora
  cleanupIntervalMs: 60 * 60 * 1000,
};

/**
 * Verifica se um IP ou email está bloqueado ou excedeu o limite
 * @param identifier IP ou email do usuário
 * @returns { allowed: boolean, reason?: string, retryAfter?: number }
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Se não existe entrada, permitir
  if (!entry) {
    return { allowed: true };
  }

  // Verificar se está bloqueado
  if (entry.blockedUntil && now < entry.blockedUntil) {
    const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000 / 60); // minutos
    return {
      allowed: false,
      reason: `Muitas tentativas. Tente novamente em ${retryAfter} minutos.`,
      retryAfter: entry.blockedUntil - now,
    };
  }

  // Se passou o bloqueio, resetar
  if (entry.blockedUntil && now >= entry.blockedUntil) {
    rateLimitStore.delete(identifier);
    return { allowed: true };
  }

  // Verificar se está dentro da janela de tempo
  const timeSinceFirst = now - entry.firstAttempt;

  if (timeSinceFirst > RATE_LIMIT_CONFIG.windowMs) {
    // Janela expirou, resetar
    rateLimitStore.delete(identifier);
    return { allowed: true };
  }

  // Verificar se excedeu o limite
  if (entry.count >= RATE_LIMIT_CONFIG.maxRequests) {
    // Bloquear por 30 minutos
    entry.blockedUntil = now + RATE_LIMIT_CONFIG.blockDurationMs;
    rateLimitStore.set(identifier, entry);

    getLogger().warn('rate-limiter', `Rate limit excedido para: ${identifier}`, {
      count: entry.count,
      blockedUntil: new Date(entry.blockedUntil).toISOString(),
    });

    const retryAfter = Math.ceil(RATE_LIMIT_CONFIG.blockDurationMs / 1000 / 60);
    return {
      allowed: false,
      reason: `Muitas tentativas. Tente novamente em ${retryAfter} minutos.`,
      retryAfter: RATE_LIMIT_CONFIG.blockDurationMs,
    };
  }

  // Dentro do limite, permitir
  return { allowed: true };
}

/**
 * Registra uma tentativa de requisição
 * @param identifier IP ou email do usuário
 */
export function recordAttempt(identifier: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    // Primeira tentativa
    rateLimitStore.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
  } else {
    // Incrementar contador
    entry.count += 1;
    entry.lastAttempt = now;
    rateLimitStore.set(identifier, entry);
  }
}

/**
 * Limpa entradas antigas do store
 */
function cleanupOldEntries(): void {
  const now = Date.now();
  const entriesToDelete: string[] = [];

  rateLimitStore.forEach((entry, identifier) => {
    const timeSinceLast = now - entry.lastAttempt;
    
    // Se passou mais de 1 hora desde a última tentativa e não está bloqueado
    if (timeSinceLast > RATE_LIMIT_CONFIG.cleanupIntervalMs && !entry.blockedUntil) {
      entriesToDelete.push(identifier);
    }
    
    // Se o bloqueio expirou há mais de 1 hora
    if (entry.blockedUntil && now > entry.blockedUntil + RATE_LIMIT_CONFIG.cleanupIntervalMs) {
      entriesToDelete.push(identifier);
    }
  });

  entriesToDelete.forEach(identifier => {
    rateLimitStore.delete(identifier);
  });

  if (entriesToDelete.length > 0) {
    getLogger().debug('rate-limiter', `Limpeza: ${entriesToDelete.length} entradas antigas removidas`);
  }
}

// Limpar entradas antigas a cada hora (apenas no servidor)
// Usar lazy initialization para evitar problemas de inicialização
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanupInterval() {
  if (typeof window === 'undefined' && typeof setInterval !== 'undefined' && !cleanupInterval) {
    cleanupInterval = setInterval(cleanupOldEntries, RATE_LIMIT_CONFIG.cleanupIntervalMs);
  }
}

// Iniciar limpeza apenas quando necessário (lazy)
if (typeof window === 'undefined') {
  // Usar setTimeout para evitar problemas de inicialização
  if (typeof setTimeout !== 'undefined') {
    setTimeout(startCleanupInterval, 1000);
  }
}

/**
 * Obtém identificador único do usuário (IP ou email)
 */
export function getIdentifier(request: { headers: Headers }, email?: string): string {
  // Priorizar email se disponível (mais preciso)
  if (email) {
    return `email:${email.toLowerCase().trim()}`;
  }

  // Fallback para IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Verifica se há orçamento duplicado recente (mesmo email, mesma origem/destino)
 */
export async function checkDuplicateOrcamento(
  email: string,
  origem: string,
  destino: string,
  maxAgeMinutes: number = 5
): Promise<{ isDuplicate: boolean; existingId?: string }> {
  try {
    const { createServerClient } = await import('../supabase/server');
    const supabase = createServerClient();

    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - maxAgeMinutes);

    const { data, error } = await supabase
      .from('orcamentos')
      .select('id, created_at')
      .eq('email_cliente', email.toLowerCase().trim())
      .eq('origem_completo', origem.trim())
      .eq('destino_completo', destino.trim())
      .gte('created_at', cutoffTime.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      getLogger().error('rate-limiter', 'Erro ao verificar duplicata', error);
      // Em caso de erro, permitir (fail open)
      return { isDuplicate: false };
    }

    if (data && data.length > 0) {
      return {
        isDuplicate: true,
        existingId: data[0].id,
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    getLogger().error('rate-limiter', 'Erro ao verificar duplicata', error instanceof Error ? error : new Error(String(error)));
    // Em caso de erro, permitir (fail open)
    return { isDuplicate: false };
  }
}

