/**
 * Script para verificar usuários admin existentes no banco
 * 
 * Uso:
 *   npx tsx scripts/check-admin-users.ts
 */

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas')
  console.error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAdminUsers() {
  console.log('🔍 Verificando usuários admin no banco...\n')

  try {
    const { data: admins, error } = await supabase
      .from('admins')
      .select('id, email, nome, primeiro_login, ativo, created_at')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ Erro ao buscar admins:', error.message)
      process.exit(1)
    }

    if (!admins || admins.length === 0) {
      console.log('⚠️  Nenhum usuário admin encontrado no banco!')
      console.log('\n📝 Execute o script de setup para criar os usuários:')
      console.log('   npx tsx scripts/setup-admin-users.ts')
      process.exit(0)
    }

    console.log(`✅ Encontrados ${admins.length} usuário(s) admin:\n`)

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.nome}`)
      console.log(`   Email: ${admin.email}`)
      console.log(`   Ativo: ${admin.ativo ? '✅' : '❌'}`)
      console.log(`   Primeiro Login: ${admin.primeiro_login ? 'Sim' : 'Não'}`)
      console.log(`   Criado em: ${new Date(admin.created_at).toLocaleString('pt-BR')}`)
      console.log('')
    })

    // Verificar se os emails esperados existem
    const expectedEmails = [
      'junior@guiademudancas.com.br',
      'mauricio@guiademudancas.com.br'
    ]

    console.log('🔍 Verificando emails esperados:\n')
    expectedEmails.forEach(email => {
      const found = admins.find(a => a.email.toLowerCase() === email.toLowerCase())
      if (found) {
        console.log(`✅ ${email} - Encontrado`)
      } else {
        console.log(`❌ ${email} - NÃO encontrado`)
      }
    })

  } catch (error: any) {
    console.error('❌ Erro fatal:', error.message)
    process.exit(1)
  }
}

checkAdminUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })

