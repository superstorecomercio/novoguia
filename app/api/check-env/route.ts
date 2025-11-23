import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks = {
    SUPABASE_URL: {
      exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      value: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
    },
    SUPABASE_ANON_KEY: {
      exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
    },
    OPENAI_API_KEY: {
      exists: !!process.env.OPENAI_API_KEY,
      value: process.env.OPENAI_API_KEY ? 'sk-...' : 'NÃO DEFINIDA'
    }
  }
  
  const allOk = checks.SUPABASE_URL.exists && checks.SUPABASE_ANON_KEY.exists
  
  return NextResponse.json({ 
    status: allOk ? 'OK' : 'ERRO',
    checks,
    message: allOk 
      ? 'Variáveis de ambiente configuradas!' 
      : 'Faltam variáveis de ambiente!'
  })
}




