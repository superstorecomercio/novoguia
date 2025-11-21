/**
 * Script de Migração: Empresas
 * 
 * Migra dados de empresas do banco legado para o Supabase
 * 
 * Uso:
 *   npm run migrate:empresas
 *   ou
 *   npx tsx scripts/migrate/02_migrate_empresas.ts
 */

import { createServerClient } from '../../lib/supabase/server';

interface LegacyEmpresa {
  id: number;
  nome: string;
  cnpj?: string;
  responsavel?: string;
  email?: string;
  telefone?: string; // Pode ser string separada por vírgula/ponto e vírgula
  telefone2?: string;
  telefone3?: string;
  website?: string;
  endereco?: string;
  complemento?: string;
  cidade_id?: number; // ID da cidade no banco legado
  cidade_nome?: string; // Nome da cidade (para lookup)
  estado?: string;
  descricao?: string;
  ativo: boolean;
  
  // Campos de serviços (formato legado)
  servico1?: string;
  servico2?: string;
  servico3?: string;
  // ... até servico10
  
  // Campos de planos (formato legado)
  plano_publicidade?: string; // 'TOP', 'QUALITY', 'STANDARD', etc.
}

interface NewEmpresa {
  nome: string;
  slug: string;
  cnpj?: string;
  responsavel?: string;
  email?: string;
  telefones: string[];
  website?: string;
  endereco?: string;
  complemento?: string;
  cidade_id: string; // UUID da cidade no Supabase
  estado?: string;
  descricao?: string;
  ativo: boolean;
}

/**
 * Gera slug a partir do nome da empresa
 */
function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Converte telefones do formato legado para array
 */
function parseTelefones(
  telefone?: string,
  telefone2?: string,
  telefone3?: string
): string[] {
  const telefones: string[] = [];
  
  // Processar telefone principal
  if (telefone) {
    // Pode ser separado por vírgula ou ponto e vírgula
    const parts = telefone.split(/[,;]/).map(t => t.trim()).filter(t => t);
    telefones.push(...parts);
  }
  
  // Adicionar telefones adicionais
  if (telefone2) telefones.push(telefone2.trim());
  if (telefone3) telefones.push(telefone3.trim());
  
  // Remover duplicatas e vazios
  return [...new Set(telefones.filter(t => t.length > 0))];
}

/**
 * Mapeia plano legado para novo formato
 */
function mapPlano(planoLegado?: string): string | null {
  if (!planoLegado) return null;
  
  const mapping: Record<string, string> = {
    'TOP': 'top',
    'QUALITY': 'quality',
    'STANDARD': 'standard',
    'INTERMEDIARIO': 'intermediario',
    'INTERMEDIÁRIO': 'intermediario',
  };
  
  return mapping[planoLegado.toUpperCase()] || null;
}

/**
 * Mapeia tipo de serviço legado para novo formato
 */
function mapServiceType(servicoLegado?: string): string | null {
  if (!servicoLegado) return null;
  
  const mapping: Record<string, string> = {
    'MUDANÇA': 'mudanca',
    'MUDANCA': 'mudanca',
    'CARRETO': 'carreto',
    'GUARDA-MÓVEIS': 'guardamoveis',
    'GUARDA-MOVEIS': 'guardamoveis',
    'GUARDAMOVEIS': 'guardamoveis',
    'TRANSPORTADORA': 'transportadora',
    'MONTADOR': 'montador',
  };
  
  return mapping[servicoLegado.toUpperCase()] || null;
}

/**
 * Busca ID da cidade no Supabase usando tabela de mapeamento
 */
async function findCityId(
  supabase: any,
  cidadeIdLegado?: number,
  cidadeNome?: string
): Promise<string | null> {
  if (!cidadeIdLegado) {
    // Tentar buscar por nome como fallback
    if (cidadeNome) {
      const slug = generateSlug(cidadeNome);
      const { data } = await supabase
        .from('cidades')
        .select('id')
        .eq('slug', slug)
        .single();
      
      if (data) return data.id;
    }
    return null;
  }
  
  // Buscar na tabela de mapeamento
  const { data } = await supabase
    .from('migration_cidades_map')
    .select('id_novo')
    .eq('id_legado', cidadeIdLegado)
    .single();
  
  if (data) {
    return data.id_novo;
  }
  
  // Fallback: tentar por nome
  if (cidadeNome) {
    const slug = generateSlug(cidadeNome);
    const { data: cidadeData } = await supabase
      .from('cidades')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (cidadeData) {
      // Salvar mapeamento para próxima vez
      await supabase.from('migration_cidades_map').insert({
        id_legado: cidadeIdLegado,
        id_novo: cidadeData.id,
        nome: cidadeNome,
      });
      return cidadeData.id;
    }
  }
  
  console.warn(`⚠️  Não foi possível encontrar cidade para ID legado: ${cidadeIdLegado}`);
  return null;
}

/**
 * Busca empresas do banco legado
 */
async function fetchLegacyEmpresas(): Promise<LegacyEmpresa[]> {
  // TODO: Implementar conexão com banco legado
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
    SELECT 
      id, nome, cnpj, responsavel, email,
      telefone, telefone2, telefone3,
      website, endereco, complemento,
      cidade_id, estado, descricao, ativo,
      plano_publicidade,
      servico1, servico2, servico3, servico4, servico5,
      servico6, servico7, servico8, servico9, servico10
    FROM empresas
    ORDER BY nome
  `;
  
  return result.recordset;
  */
  
  return [];
}

/**
 * Verifica se empresa já existe no Supabase
 */
async function empresaExists(supabase: any, slug: string): Promise<boolean> {
  const { data } = await supabase
    .from('empresas')
    .select('id')
    .eq('slug', slug)
    .single();
  
  return !!data;
}

/**
 * Migra uma empresa
 */
async function migrateEmpresa(
  supabase: any,
  legacyEmpresa: LegacyEmpresa,
  dryRun: boolean = false
): Promise<{ success: boolean; message: string; empresaId?: string }> {
  const slug = generateSlug(legacyEmpresa.nome);
  
  // Verificar se já existe
  const exists = await empresaExists(supabase, slug);
  if (exists) {
    return {
      success: false,
      message: `Empresa ${legacyEmpresa.nome} já existe (slug: ${slug})`,
    };
  }
  
  // Buscar ID da cidade
  const cidadeId = await findCityId(
    supabase,
    legacyEmpresa.cidade_id,
    legacyEmpresa.cidade_nome
  );
  
  if (!cidadeId) {
    return {
      success: false,
      message: `Cidade não encontrada para empresa ${legacyEmpresa.nome}`,
    };
  }
  
  // Preparar dados
  const telefones = parseTelefones(
    legacyEmpresa.telefone,
    legacyEmpresa.telefone2,
    legacyEmpresa.telefone3
  );
  
  const empresaData: any = {
    nome: legacyEmpresa.nome,
    slug: slug,
    cnpj: legacyEmpresa.cnpj || null,
    responsavel: legacyEmpresa.responsavel || null,
    email: legacyEmpresa.email || null,
    telefones: telefones.length > 0 ? telefones : [],
    website: legacyEmpresa.website || null,
    endereco: legacyEmpresa.endereco || null,
    complemento: legacyEmpresa.complemento || null,
    cidade_id: cidadeId,
    estado: legacyEmpresa.estado?.toUpperCase() || null,
    descricao: legacyEmpresa.descricao || null,
    ativo: legacyEmpresa.ativo,
  };
  
  if (dryRun) {
    return {
      success: true,
      message: `[DRY RUN] Criaria empresa: ${legacyEmpresa.nome} (${slug})`,
    };
  }
  
  // Inserir empresa
  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .insert(empresaData)
    .select('id')
    .single();
  
  if (empresaError) {
    return {
      success: false,
      message: `Erro ao inserir empresa ${legacyEmpresa.nome}: ${empresaError.message}`,
    };
  }
  
  const empresaId = empresa.id;
  
  // Salvar mapeamento de ID legado → novo UUID
  await supabase.from('migration_empresas_map').insert({
    id_legado: legacyEmpresa.id,
    id_novo: empresaId,
    nome: legacyEmpresa.nome,
  });
  
  // Migrar serviços
  const servicos = [
    legacyEmpresa.servico1,
    legacyEmpresa.servico2,
    legacyEmpresa.servico3,
    // ... adicionar até servico10 se necessário
  ].filter(Boolean);
  
  for (const servico of servicos) {
    const tipoServico = mapServiceType(servico);
    if (tipoServico) {
      await supabase.from('empresa_servicos').insert({
        empresa_id: empresaId,
        tipo_servico: tipoServico,
        areas_atendidas: [], // Pode ser migrado depois
      });
    }
  }
  
  // Migrar plano de publicidade
  const plano = mapPlano(legacyEmpresa.plano_publicidade);
  if (plano) {
    // Buscar ID do plano
    const { data: planoData } = await supabase
      .from('planos_publicidade')
      .select('id')
      .eq('nome', plano)
      .single();
    
    if (planoData) {
      await supabase.from('empresa_planos').insert({
        empresa_id: empresaId,
        plano_id: planoData.id,
        ativo: true,
      });
    }
  }
  
  return {
    success: true,
    message: `✅ Migrada: ${legacyEmpresa.nome} (${slug})`,
    empresaId,
  };
}

/**
 * Função principal de migração
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.log('🚀 Iniciando migração de empresas...');
  if (dryRun) {
    console.log('⚠️  MODO DRY RUN - Nenhum dado será inserido\n');
  }
  
  try {
    // Buscar empresas do banco legado
    console.log('📥 Buscando empresas do banco legado...');
    const legacyEmpresas = await fetchLegacyEmpresas();
    
    if (legacyEmpresas.length === 0) {
      console.log('⚠️  Nenhuma empresa encontrada no banco legado.');
      console.log('   Verifique a função fetchLegacyEmpresas() e configure a conexão.');
      return;
    }
    
    console.log(`✅ Encontradas ${legacyEmpresas.length} empresas\n`);
    
    // Conectar ao Supabase
    const supabase = createServerClient();
    
    // Migrar cada empresa
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const empresa of legacyEmpresas) {
      const result = await migrateEmpresa(supabase, empresa, dryRun);
      
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
    console.log(`   📦 Total: ${legacyEmpresas.length}`);
    
  } catch (error: any) {
    console.error('❌ Erro durante migração:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

export { migrateEmpresa, fetchLegacyEmpresas, generateSlug, parseTelefones, mapPlano, mapServiceType };

