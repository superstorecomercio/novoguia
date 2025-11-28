import { NextRequest, NextResponse } from 'next/server'
import { validateSession, isDevBypassEnabled } from '@/lib/auth/admin-auth'

/**
 * GET /api/admin/auth/me
 * Retorna dados do admin logado
 */
export async function GET(request: NextRequest) {
  try {
    // Bypass para desenvolvimento
    if (isDevBypassEnabled()) {
      return NextResponse.json({
        success: true,
        admin: {
          id: 'dev-bypass',
          email: 'dev@mudatech.com.br',
          nome: 'Dev Admin (Bypass)',
          primeiro_login: false,
          ativo: true
        },
        bypass: true
      })
    }
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('admin_session')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      )
    }
    
    const session = await validateSession(token)
    
    if (!session.success || !session.admin) {
      return NextResponse.json(
        { error: session.error || 'Sessão inválida' },
        { status: 401 }
      )
    }
    
    return NextResponse.json({
      success: true,
      admin: session.admin
    })
  } catch (error: any) {
    console.error('Erro ao buscar dados do admin:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

