import { createAdminClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export interface AdminUser {
  id: string
  email: string
  nome: string
  primeiro_login: boolean
  ativo: boolean
}

/**
 * Gera hash de senha usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * Verifica se a senha está correta
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Gera um código de verificação de 6 dígitos
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Gera um token de sessão único
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Busca admin por email
 */
export async function getAdminByEmail(email: string): Promise<AdminUser | null> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('admins')
    .select('id, email, nome, primeiro_login, ativo, senha_hash')
    .eq('email', email.toLowerCase().trim())
    .eq('ativo', true)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return {
    id: data.id,
    email: data.email,
    nome: data.nome,
    primeiro_login: data.primeiro_login,
    ativo: data.ativo
  }
}

/**
 * Verifica credenciais de login
 */
export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; admin?: AdminUser; error?: string }> {
  const supabase = createAdminClient()
  const normalizedEmail = email.toLowerCase().trim()
  
  console.log('[Auth] Verificando credenciais para:', normalizedEmail)
  
  const { data, error } = await supabase
    .from('admins')
    .select('id, email, nome, primeiro_login, ativo, senha_hash')
    .eq('email', normalizedEmail)
    .eq('ativo', true)
    .single()
  
  if (error) {
    console.error('[Auth] Erro ao buscar admin:', error)
    // Se for erro de "not found", dar mensagem mais específica
    if (error.code === 'PGRST116') {
      console.log('[Auth] Admin não encontrado no banco:', normalizedEmail)
      return { success: false, error: 'Email não encontrado. Verifique se o usuário foi criado executando: npx tsx scripts/setup-admin-users.ts' }
    }
    return { success: false, error: 'Erro ao verificar credenciais. Tente novamente.' }
  }
  
  if (!data) {
    console.log('[Auth] Admin não encontrado:', normalizedEmail)
    return { success: false, error: 'Email não encontrado. Execute o script setup-admin-users.ts para criar os usuários.' }
  }
  
  // Verificar se o hash é placeholder
  if (data.senha_hash.includes('placeholder')) {
    console.error('[Auth] Senha não foi configurada (placeholder encontrado). Execute o script setup-admin-users.ts')
    return { success: false, error: 'Usuário não configurado. Execute: npx tsx scripts/setup-admin-users.ts' }
  }
  
  // Verificar senha
  console.log('[Auth] Verificando senha para:', normalizedEmail)
  const isValid = await verifyPassword(password, data.senha_hash)
  console.log('[Auth] Resultado da verificação:', isValid ? 'VÁLIDA' : 'INVÁLIDA')
  
  if (!isValid) {
    console.log('[Auth] Senha incorreta para:', normalizedEmail)
    return { success: false, error: 'Email ou senha incorretos' }
  }
  
  console.log('[Auth] Credenciais válidas para:', normalizedEmail)
  
  return {
    success: true,
    admin: {
      id: data.id,
      email: data.email,
      nome: data.nome,
      primeiro_login: data.primeiro_login,
      ativo: data.ativo
    }
  }
}

/**
 * Cria código de verificação e salva no banco
 */
export async function createVerificationCode(adminId: string): Promise<string> {
  const supabase = createAdminClient()
  const code = generateVerificationCode()
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 10) // Expira em 10 minutos
  
  // Limpar códigos antigos do mesmo admin
  await supabase
    .from('admin_verification_codes')
    .delete()
    .eq('admin_id', adminId)
    .eq('used', false)
  
  // Criar novo código
  const { error } = await supabase
    .from('admin_verification_codes')
    .insert({
      admin_id: adminId,
      code,
      expires_at: expiresAt.toISOString(),
      used: false
    })
  
  if (error) {
    throw new Error('Erro ao criar código de verificação')
  }
  
  return code
}

/**
 * Verifica código de verificação
 */
export async function verifyCode(
  adminId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('admin_verification_codes')
    .select('*')
    .eq('admin_id', adminId)
    .eq('code', code)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single()
  
  if (error || !data) {
    return { success: false, error: 'Código inválido ou expirado' }
  }
  
  // Marcar código como usado
  await supabase
    .from('admin_verification_codes')
    .update({ used: true })
    .eq('id', data.id)
  
  return { success: true }
}

/**
 * Cria sessão de admin
 */
export async function createAdminSession(
  adminId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const supabase = createAdminClient()
  const token = generateSessionToken()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24) // Expira em 24 horas
  
  const { error } = await supabase
    .from('admin_sessions')
    .insert({
      admin_id: adminId,
      session_token: token,
      expires_at: expiresAt.toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent
    })
  
  if (error) {
    throw new Error('Erro ao criar sessão')
  }
  
  // Atualizar último login
  await supabase
    .from('admins')
    .update({ ultimo_login: new Date().toISOString() })
    .eq('id', adminId)
  
  return token
}

/**
 * Valida sessão e retorna dados do admin
 */
export async function validateSession(
  token: string
): Promise<{ success: boolean; admin?: AdminUser; error?: string }> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('admin_sessions')
    .select(`
      id,
      admin_id,
      expires_at,
      admins:admin_id (
        id,
        email,
        nome,
        primeiro_login,
        ativo
      )
    `)
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .single()
  
  if (error || !data) {
    return { success: false, error: 'Sessão inválida ou expirada' }
  }
  
  const admin = Array.isArray(data.admins) ? data.admins[0] : data.admins
  
  if (!admin || !admin.ativo) {
    return { success: false, error: 'Admin inativo' }
  }
  
  return {
    success: true,
    admin: {
      id: admin.id,
      email: admin.email,
      nome: admin.nome,
      primeiro_login: admin.primeiro_login,
      ativo: admin.ativo
    }
  }
}

/**
 * Remove sessão (logout)
 */
export async function deleteSession(token: string): Promise<void> {
  const supabase = createAdminClient()
  
  await supabase
    .from('admin_sessions')
    .delete()
    .eq('session_token', token)
}

/**
 * Atualiza senha do admin
 */
export async function updateAdminPassword(
  adminId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const hash = await hashPassword(newPassword)
  
  const { error } = await supabase
    .from('admins')
    .update({
      senha_hash: hash,
      primeiro_login: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', adminId)
  
  if (error) {
    return { success: false, error: 'Erro ao atualizar senha' }
  }
  
  return { success: true }
}

/**
 * Bypass de autenticação para desenvolvimento
 */
export function isDevBypassEnabled(): boolean {
  return process.env.NODE_ENV === 'development' && 
         process.env.ADMIN_BYPASS_AUTH === 'true'
}

