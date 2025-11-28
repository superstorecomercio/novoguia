/**
 * Script para criar/atualizar usuários admin iniciais
 * 
 * Uso:
 *   npx tsx scripts/setup-admin-users.ts
 * 
 * Este script cria os 2 usuários admin iniciais com senhas hashadas.
 * As senhas padrão são:
 * - junior@guiademudancas.com.br: Admin123!
 * - mauricio@guiademudancas.com.br: Admin123!
 */

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas')
  console.error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const ADMIN_USERS = [
  {
    email: 'junior@guiademudancas.com.br',
    senha: 'Admin123!',
    nome: 'Junior'
  },
  {
    email: 'mauricio@guiademudancas.com.br',
    senha: 'Admin123!',
    nome: 'Mauricio'
  }
]

async function setupAdminUsers() {
  console.log('🔐 Configurando usuários admin...\n')

  for (const user of ADMIN_USERS) {
    try {
      // Verificar se usuário já existe
      const { data: existing } = await supabase
        .from('admins')
        .select('id, email')
        .eq('email', user.email)
        .single()

      // Gerar hash da senha
      const senhaHash = await bcrypt.hash(user.senha, 10)

      if (existing) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('admins')
          .update({
            senha_hash: senhaHash,
            nome: user.nome,
            ativo: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (error) {
          console.error(`❌ Erro ao atualizar ${user.email}:`, error.message)
        } else {
          console.log(`✅ Usuário atualizado: ${user.email}`)
          console.log(`   Senha: ${user.senha}`)
        }
      } else {
        // Criar novo usuário
        const { error } = await supabase
          .from('admins')
          .insert({
            email: user.email,
            senha_hash: senhaHash,
            nome: user.nome,
            primeiro_login: true,
            ativo: true
          })

        if (error) {
          console.error(`❌ Erro ao criar ${user.email}:`, error.message)
        } else {
          console.log(`✅ Usuário criado: ${user.email}`)
          console.log(`   Senha: ${user.senha}`)
        }
      }
    } catch (error: any) {
      console.error(`❌ Erro ao processar ${user.email}:`, error.message)
    }
  }

  console.log('\n✨ Configuração concluída!')
  console.log('\n📝 Credenciais de acesso:')
  console.log('   Admin 1: junior@guiademudancas.com.br / Admin123!')
  console.log('   Admin 2: mauricio@guiademudancas.com.br / Admin123!')
  console.log('\n⚠️  IMPORTANTE: Altere as senhas após o primeiro login!')
}

setupAdminUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })

