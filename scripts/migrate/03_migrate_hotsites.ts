/**
 * Script de Migração: Hotsites
 * 
 * Migra dados de hotsites do banco legado para o Supabase
 */

import { createServerClient } from '../../lib/supabase/server';

interface LegacyHotsite {
  codHotsite: number;
  codEmpresa: number;
  hotEmpresa?: string; // Nome de exibição
  hotEndereco?: string;
  hotCidade?: string; // Cidade onde o hotsite é exibido
  hotEstado?: string; // Estado onde o hotsite é exibido
  hotDescricao?: string;
  hotLogotipo?: string;
  hotFoto1?: string;
  hotFoto2?: string;
  hotFoto3?: string;
  hotServico1?: string;
  hotServico2?: string;
  hotServico3?: string;
  hotServico4?: string;
  hotServico5?: string;
  hotServico6?: string;
  hotServico7?: string;
  hotServico8?: string;
  hotServico9?: string;
  hotServico10?: string;
  hotDesconto1?: string;
  hotDesconto2?: string;
  hotDesconto3?: string;
  hotFormaPagto1?: string;
  hotFormaPagto2?: string;
  hotFormaPagto3?: string;
  hotFormaPagto4?: string;
  hotFormaPagto5?: string;
}

/**
 * Busca hotsites do banco legado
 * IMPORTANTE: Cada hotsite está vinculado a uma cidade específica (hotCidade)
 */
async function fetchLegacyHotsites(): Promise<LegacyHotsite[]> {
  try {
    let config;
    try {
      config = require('./config').legacyDbConfig;
    } catch {
      console.error('❌ Arquivo config.ts não encontrado!');
      return [];
    }
    
    const sql = require('mssql');
    
    console.log('🔌 Conectando ao banco legado...');
    await sql.connect(config);
    
    const result = await sql.query`
      SELECT 
        codHotsite, codEmpresa,
        hotEmpresa, hotEndereco, hotCidade, hotEstado, hotDescricao,
        hotLogotipo, hotFoto1, hotFoto2, hotFoto3,
        hotServico1, hotServico2, hotServico3, hotServico4, hotServico5,
        hotServico6, hotServico7, hotServico8, hotServico9, hotServico10,
        hotDesconto1, hotDesconto2, hotDesconto3,
        hotFormaPagto1, hotFormaPagto2, hotFormaPagto3, hotFormaPagto4, hotFormaPagto5
      FROM guiaHotsite
      WHERE hotCidade IS NOT NULL
      ORDER BY codEmpresa, hotCidade
    `;
    
    await sql.close();
    return result.recordset;
  } catch (error: any) {
    console.error('❌ Erro ao buscar hotsites:', error.message);
    return [];
  }
}

/**
 * Busca empresa no Supabase usando tabela de mapeamento
 */
async function findEmpresaId(
  supabase: any,
  codEmpresaLegado: number
): Promise<string | null> {
  // Buscar na tabela de mapeamento
  const { data } = await supabase
    .from('migration_empresas_map')
    .select('id_novo')
    .eq('id_legado', codEmpresaLegado)
    .single();
  
  if (data) {
    return data.id_novo;
  }
  
  console.warn(`⚠️  Empresa legada ${codEmpresaLegado} não encontrada no mapeamento`);
  return null;
}

/**
 * Converte serviços para array JSONB
 */
function parseServicos(hotsite: LegacyHotsite): string[] {
  const servicos = [
    hotsite.hotServico1,
    hotsite.hotServico2,
    hotsite.hotServico3,
    hotsite.hotServico4,
    hotsite.hotServico5,
    hotsite.hotServico6,
    hotsite.hotServico7,
    hotsite.hotServico8,
    hotsite.hotServico9,
    hotsite.hotServico10,
  ].filter(Boolean) as string[];
  
  return servicos;
}

/**
 * Converte descontos para array JSONB
 */
function parseDescontos(hotsite: LegacyHotsite): string[] {
  return [
    hotsite.hotDesconto1,
    hotsite.hotDesconto2,
    hotsite.hotDesconto3,
  ].filter(Boolean) as string[];
}

/**
 * Converte formas de pagamento para array JSONB
 */
function parseFormasPagamento(hotsite: LegacyHotsite): string[] {
  return [
    hotsite.hotFormaPagto1,
    hotsite.hotFormaPagto2,
    hotsite.hotFormaPagto3,
    hotsite.hotFormaPagto4,
    hotsite.hotFormaPagto5,
  ].filter(Boolean) as string[];
}

/**
 * Busca cidade no Supabase pelo nome
 */
async function findCidadeByNome(
  supabase: any,
  cidadeNome?: string,
  estado?: string
): Promise<string | null> {
  if (!cidadeNome) return null;
  
  // Gerar slug da cidade
  const slug = cidadeNome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  let query = supabase
    .from('cidades')
    .select('id')
    .eq('slug', slug);
  
  if (estado) {
    query = query.eq('estado', estado.toUpperCase());
  }
  
  const { data } = await query.single();
  
  return data?.id || null;
}

/**
 * Migra um hotsite vinculado a uma cidade específica
 */
async function migrateHotsite(
  supabase: any,
  legacyHotsite: LegacyHotsite,
  empresaId: string,
  dryRun: boolean = false
): Promise<{ success: boolean; message: string }> {
  // Buscar cidade onde o hotsite é exibido
  const cidadeId = await findCidadeByNome(
    supabase,
    legacyHotsite.hotCidade,
    legacyHotsite.hotEstado
  );
  
  if (!cidadeId) {
    return {
      success: false,
      message: `Cidade não encontrada: ${legacyHotsite.hotCidade} - ${legacyHotsite.hotEstado}`,
    };
  }
  
  // Verificar se hotsite já existe para esta empresa + cidade
  const { data: existing } = await supabase
    .from('hotsites')
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('cidade_id', cidadeId)
    .single();
  
  const hotsiteData = {
    empresa_id: empresaId,
    cidade_id: cidadeId, // IMPORTANTE: Vincular à cidade onde é exibido
    nome_exibicao: legacyHotsite.hotEmpresa || null,
    descricao: legacyHotsite.hotDescricao || null,
    endereco: legacyHotsite.hotEndereco || null,
    cidade: legacyHotsite.hotCidade || null, // Nome da cidade (para exibição)
    estado: legacyHotsite.hotEstado?.toUpperCase() || null,
    logo_url: legacyHotsite.hotLogotipo || null,
    foto1_url: legacyHotsite.hotFoto1 || null,
    foto2_url: legacyHotsite.hotFoto2 || null,
    foto3_url: legacyHotsite.hotFoto3 || null,
    servicos: parseServicos(legacyHotsite),
    descontos: parseDescontos(legacyHotsite),
    formas_pagamento: parseFormasPagamento(legacyHotsite),
    highlights: [], // Pode ser preenchido depois
  };
  
  if (dryRun) {
    return {
      success: true,
      message: `[DRY RUN] Criaria hotsite para empresa ${empresaId} em ${legacyHotsite.hotCidade}`,
    };
  }
  
  if (existing) {
    // Atualizar existente
    const { error } = await supabase
      .from('hotsites')
      .update(hotsiteData)
      .eq('empresa_id', empresaId)
      .eq('cidade_id', cidadeId);
    
    if (error) {
      return {
        success: false,
        message: `Erro ao atualizar hotsite: ${error.message}`,
      };
    }
    
    return {
      success: true,
      message: `✅ Atualizado hotsite para empresa ${empresaId} em ${legacyHotsite.hotCidade}`,
    };
  } else {
    // Criar novo
    const { error } = await supabase.from('hotsites').insert(hotsiteData);
    
    if (error) {
      return {
        success: false,
        message: `Erro ao criar hotsite: ${error.message}`,
      };
    }
    
    return {
      success: true,
      message: `✅ Criado hotsite para empresa ${empresaId} em ${legacyHotsite.hotCidade}`,
    };
  }
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.log('🚀 Iniciando migração de hotsites...');
  if (dryRun) {
    console.log('⚠️  MODO DRY RUN - Nenhum dado será inserido\n');
  }
  
  try {
    const legacyHotsites = await fetchLegacyHotsites();
    
    if (legacyHotsites.length === 0) {
      console.log('⚠️  Nenhum hotsite encontrado.');
      return;
    }
    
    console.log(`✅ Encontrados ${legacyHotsites.length} hotsites\n`);
    
    const supabase = createServerClient();
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const hotsite of legacyHotsites) {
      // Buscar empresa no Supabase
      const empresaId = await findEmpresaId(supabase, hotsite.codEmpresa);
      
      if (!empresaId) {
        console.log(`⏭️  Empresa ${hotsite.codEmpresa} não encontrada no Supabase`);
        errorCount++;
        continue;
      }
      
      const result = await migrateHotsite(supabase, hotsite, empresaId, dryRun);
      
      if (result.success) {
        console.log(result.message);
        successCount++;
      } else {
        console.error(`❌ ${result.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 Resumo:');
    console.log(`   ✅ Sucesso: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { migrateHotsite, fetchLegacyHotsites };

