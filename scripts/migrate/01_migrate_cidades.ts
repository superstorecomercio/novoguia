/**
 * Script de Migração: Cidades
 * 
 * Migra dados de cidades do banco legado para o Supabase
 * 
 * Uso:
 *   npm run migrate:cidades
 *   ou
 *   npx tsx scripts/migrate/01_migrate_cidades.ts
 */

import { createServerClient } from '../../lib/supabase/server';

interface LegacyCity {
  id: number;
  nome: string;
  estado: string;
  descricao?: string;
  regiao?: string;
}

interface NewCity {
  nome: string;
  estado: string;
  slug: string;
  descricao?: string;
  regiao?: string;
}

/**
 * Gera slug a partir do nome da cidade
 */
function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
    .replace(/^-+|-+$/g, ''); // Remove hífens do início/fim
}

/**
 * Busca cidades do banco legado
 * 
 * IMPORTANTE: Você precisa adaptar esta função para conectar ao seu banco legado
 */
async function fetchLegacyCities(): Promise<LegacyCity[]> {
  // TODO: Implementar conexão com banco legado
  // Exemplo usando SQL Server:
  /*
  const sql = require('mssql');
  const config = {
    server: 'seu-servidor',
    database: 'seu-banco',
    user: 'seu-usuario',
    password: 'sua-senha',
  };
  
  await sql.connect(config);
  const result = await sql.query`
    SELECT id, nome, estado, descricao, regiao
    FROM cidades
    ORDER BY nome
  `;
  
  return result.recordset;
  */
  
  // Por enquanto, retorna array vazio
  // Substitua por sua implementação
  return [];
}

/**
 * Verifica se cidade já existe no Supabase
 */
async function cityExists(supabase: any, slug: string): Promise<boolean> {
  const { data } = await supabase
    .from('cidades')
    .select('id')
    .eq('slug', slug)
    .single();
  
  return !!data;
}

/**
 * Migra uma cidade e salva mapeamento de ID
 */
async function migrateCity(
  supabase: any,
  legacyCity: LegacyCity,
  dryRun: boolean = false
): Promise<{ success: boolean; message: string; cidadeId?: string }> {
  const slug = generateSlug(legacyCity.nome);
  
  // Verificar se já existe
  const exists = await cityExists(supabase, slug);
  if (exists) {
    // Buscar ID existente para salvar no mapeamento
    const { data: existingCity } = await supabase
      .from('cidades')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (existingCity && !dryRun) {
      // Salvar mapeamento mesmo se já existe
      await supabase.from('migration_cidades_map').upsert({
        id_legado: legacyCity.id,
        id_novo: existingCity.id,
        nome: legacyCity.nome,
      });
    }
    
    return {
      success: false,
      message: `Cidade ${legacyCity.nome} já existe (slug: ${slug})`,
      cidadeId: existingCity?.id,
    };
  }
  
  if (dryRun) {
    return {
      success: true,
      message: `[DRY RUN] Criaria cidade: ${legacyCity.nome} (${slug})`,
    };
  }
  
  // Inserir no Supabase
  const { data: cidade, error } = await supabase
    .from('cidades')
    .insert({
      nome: legacyCity.nome,
      estado: legacyCity.estado.toUpperCase(),
      slug: slug,
      descricao: legacyCity.descricao || null,
      regiao: legacyCity.regiao?.toLowerCase() || null,
    })
    .select('id')
    .single();
  
  if (error) {
    return {
      success: false,
      message: `Erro ao inserir ${legacyCity.nome}: ${error.message}`,
    };
  }
  
  // Salvar mapeamento de ID legado → novo UUID
  await supabase.from('migration_cidades_map').insert({
    id_legado: legacyCity.id,
    id_novo: cidade.id,
    nome: legacyCity.nome,
  });
  
  return {
    success: true,
    message: `✅ Migrada: ${legacyCity.nome} (${slug})`,
    cidadeId: cidade.id,
  };
}

/**
 * Função principal de migração
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.log('🚀 Iniciando migração de cidades...');
  if (dryRun) {
    console.log('⚠️  MODO DRY RUN - Nenhum dado será inserido\n');
  }
  
  try {
    // Buscar cidades do banco legado
    console.log('📥 Buscando cidades do banco legado...');
    const legacyCities = await fetchLegacyCities();
    
    if (legacyCities.length === 0) {
      console.log('⚠️  Nenhuma cidade encontrada no banco legado.');
      console.log('   Verifique a função fetchLegacyCities() e configure a conexão.');
      return;
    }
    
    console.log(`✅ Encontradas ${legacyCities.length} cidades\n`);
    
    // Conectar ao Supabase
    const supabase = createServerClient();
    
    // Migrar cada cidade
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const city of legacyCities) {
      const result = await migrateCity(supabase, city, dryRun);
      
      if (result.success) {
        console.log(result.message);
        successCount++;
      } else {
        if (result.message.includes('já existe')) {
          skippedCount++;
          console.log(`⏭️  ${result.message}`);
        } else {
          errorCount++;
          console.error(`❌ ${result.message}`);
        }
      }
    }
    
    // Resumo
    console.log('\n📊 Resumo da Migração:');
    console.log(`   ✅ Sucesso: ${successCount}`);
    console.log(`   ⏭️  Ignoradas (já existem): ${skippedCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📦 Total: ${legacyCities.length}`);
    
  } catch (error: any) {
    console.error('❌ Erro durante migração:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

export { migrateCity, fetchLegacyCities, generateSlug };

