/**
 * Script para verificar configuração das variáveis de ambiente
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🔍 Verificando variáveis de ambiente...\n');

const checks = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
};

let allOk = true;

for (const [key, value] of Object.entries(checks)) {
  if (value) {
    const preview = value.length > 50 ? `${value.substring(0, 50)}...` : value;
    console.log(`✅ ${key}: ${preview}`);
  } else {
    console.log(`❌ ${key}: NÃO CONFIGURADO`);
    allOk = false;
  }
}

console.log('\n' + '='.repeat(60));

if (!allOk) {
  console.log('\n⚠️  Algumas variáveis estão faltando!\n');
  
  if (!checks.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('📝 Para configurar SUPABASE_SERVICE_ROLE_KEY:');
    console.log('   1. Acesse: https://supabase.com/dashboard');
    console.log('   2. Selecione seu projeto');
    console.log('   3. Vá em Settings → API');
    console.log('   4. Copie a chave "service_role" (secret)');
    console.log('   5. Adicione no .env.local:');
    console.log('      SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui');
    console.log('\n   ⚠️  IMPORTANTE: A service_role key bypassa RLS!');
    console.log('      Use apenas para scripts administrativos.\n');
  }
  
  if (!checks.NEXT_PUBLIC_SUPABASE_URL || !checks.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('📝 Para configurar NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY:');
    console.log('   1. Acesse: https://supabase.com/dashboard');
    console.log('   2. Selecione seu projeto');
    console.log('   3. Vá em Settings → API');
    console.log('   4. Copie "Project URL" e "anon public" key');
    console.log('   5. Adicione no .env.local:\n');
    console.log('      NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co');
    console.log('      NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui\n');
  }
  
  console.log('📄 Arquivo .env.local deve estar na raiz do projeto.');
  console.log('   Após adicionar, execute este script novamente.\n');
} else {
  console.log('\n✅ Todas as variáveis estão configuradas!');
  console.log('\n💡 Para migração de imagens, você precisa:');
  console.log('   1. ✅ Variáveis configuradas (OK)');
  console.log('   2. ⏳ Bucket criado no Supabase');
  console.log('   3. ⏳ Políticas RLS configuradas\n');
  console.log('   Execute: npx tsx scripts/migrate/images/02_migrate_images_from_server.ts\n');
}

process.exit(allOk ? 0 : 1);

