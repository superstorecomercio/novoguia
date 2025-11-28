import { NextRequest, NextResponse } from 'next/server'
import { verifyCode, createAdminSession } from '@/lib/auth/admin-auth'

/**
 * POST /api/admin/auth/verify-code
 * Segunda etapa: Verifica código e cria sessão
 */
export async function POST(request: NextRequest) {
  try {
    const { adminId, code } = await request.json()
    
    if (!adminId || !code) {
      return NextResponse.json(
        { error: 'Admin ID e código são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Verificar código
    const result = await verifyCode(adminId, code)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Código inválido' },
        { status: 401 }
      )
    }
    
    // Criar sessão
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    const sessionToken = await createAdminSession(adminId, ipAddress, userAgent)
    
    return NextResponse.json({
      success: true,
      token: sessionToken
    })
  } catch (error: any) {
    console.error('Erro na verificação de código:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

