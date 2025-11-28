import { NextRequest, NextResponse } from 'next/server'
import { validateSession, updateAdminPassword } from '@/lib/auth/admin-auth'

/**
 * POST /api/admin/auth/change-password
 * Atualiza senha do admin (obrigatório no primeiro login)
 */
export async function POST(request: NextRequest) {
  try {
    const { token, newPassword, confirmPassword } = await request.json()
    
    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Token, nova senha e confirmação são obrigatórios' },
        { status: 400 }
      )
    }
    
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'As senhas não coincidem' },
        { status: 400 }
      )
    }
    
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      )
    }
    
    // Validar sessão
    const session = await validateSession(token)
    
    if (!session.success || !session.admin) {
      return NextResponse.json(
        { error: 'Sessão inválida' },
        { status: 401 }
      )
    }
    
    // Atualizar senha
    const result = await updateAdminPassword(session.admin.id, newPassword)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao atualizar senha' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Senha atualizada com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao alterar senha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

