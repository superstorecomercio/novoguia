/**
 * Script para reimportar hotsites de empresas que estão no CSV mas não foram importadas
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface HotsiteCSV {
  id_legado: number;
  empresa_id_legado: number;
  nome_exibicao?: string;
  endereco?: string;
  cidade_nome?: string;
  estado?: string;
  descricao?: string;
  logo_url?: string;
  foto1_url?: string;
  foto2_url?: string;
  foto3_url?: string;
  email?: string;
  sms_numero?: string;
  regiao?: string;
  tipoempresa?: string;
  slugbairro?: string;
  telefone1?: string;
  telefone2?: string;
  telefone3?: string;
}

function readCSV(filePath: string): HotsiteCSV[] {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return [];

  const separator = lines[0].includes(';') ? ';' : ',';
  const firstLineParts = lines[0].split(separator);
  const isHeader = firstLineParts[0]?.toLowerCase().includes('id_legado') || 
                   firstLineParts[0]?.toLowerCase().includes('empresa_id');
  
  const startIndex = isHeader ? 1 : 0;
  const hotsites: HotsiteCSV[] = [];
  
  for (let i = startIndex; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
    
    if (values.length < 11) continue;
    
    const idLegado = parseInt(values[0] || '0', 10);
    const empresaIdLegado = parseInt(values[1] || '0', 10);
    
    if (!empresaIdLegado || isNaN(empresaIdLegado)) continue;
    
    hotsites.push({
      id_legado: idLegado,
      empresa_id_legado: empresaIdLegado,
      nome_exibicao: values[2] || undefined,
      endereco: values[3] || undefined,
      cidade_nome: values[4] || undefined,
      estado: values[5] || undefined,
      descricao: values[6] || undefined,
      logo_url: values[7] && values[7] !== 'NULL' && values[7] !== 'null' ? values[7] : undefined,
      foto1_url: values[8] && values[8] !== 'NULL' && values[8] !== 'null' ? values[8] : undefined,
      foto2_url: values[9] && values[9] !== 'NULL' && values[9] !== 'null' ? values[9] : undefined,
      foto3_url: values[10] && values[10] !== 'NULL' && values[10] !== 'null' ? values[10] : undefined,
      email: values[11] && values[11] !== 'NULL' && values[11] !== 'null' ? values[11] : undefined,
      sms_numero: values[12] && values[12] !== 'NULL' && values[12] !== 'null' ? values[12] : undefined,
      regiao: values[13] && values[13] !== 'NULL' && values[13] !== 'null' ? values[13] : undefined,
      tipoempresa: values[14] && values[14] !== 'NULL' && values[14] !== 'null' ? values[14] : undefined,
      slugbairro: values[15] && values[15] !== 'NULL' && values[15] !== 'null' ? values[15] : undefined,
      telefone1: values[16] && values[16] !== 'NULL' && values[16] !== 'null' ? values[16] : undefined,
      telefone2: values[17] && values[17] !== 'NULL' && values[17] !== 'null' ? values[17] : undefined,
      telefone3: values[18] && values[18] !== 'NULL' && values[18] !== 'null' ? values[18] : undefined,
    });
  }
  
  return hotsites;
}

async function findEmpresaId(supabase: any, empresaIdLegado: number): Promise<string | null> {
  // Buscar no mapeamento
  const { data: map } = await supabase
    .from('migration_empresas_map')
    .select('id_novo')
    .eq('id_legado', empresaIdLegado)
    .single();
  
  if (map?.id_novo) {
    return map.id_novo;
  }
  
  return null;
}

async function findCidadeByNome(supabase: any, cidadeNome?: string, estado?: string): Promise<string | null> {
  if (!cidadeNome || !estado) {
    return null;
  }
  
  // Normalizar nome da cidade (remover acentos, converter para minúsculas)
  const normalize = (str: string) => str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  
  const cidadeNormalizada = normalize(cidadeNome);
  
  // Buscar todas as cidades do estado
  const { data: cidades } = await supabase
    .from('cidades')
    .select('id, nome')
    .eq('estado', estado.toUpperCase());
  
  if (!cidades || cidades.length === 0) {
    return null;
  }
  
  // Tentar busca exata primeiro (case-insensitive)
  const cidadeExata = cidades.find(c => 
    normalize(c.nome) === cidadeNormalizada
  );
  
  if (cidadeExata) {
    return cidadeExata.id;
  }
  
  // Tentar busca parcial
  const cidadeParcial = cidades.find(c => 
    normalize(c.nome).includes(cidadeNormalizada) ||
    cidadeNormalizada.includes(normalize(c.nome))
  );
  
  if (cidadeParcial) {
    console.log(`  ⚠️  Cidade encontrada por busca parcial: "${cidadeNome}" → "${cidadeParcial.nome}"`);
    return cidadeParcial.id;
  }
  
  return null;
}

async function reimportHotsite(supabase: any, hotsite: HotsiteCSV): Promise<{ success: boolean; message: string }> {
  console.log(`\n🔄 Processando hotsite ID ${hotsite.id_legado} para empresa ${hotsite.empresa_id_legado}...`);
  
  // Buscar empresa
  const empresaId = await findEmpresaId(supabase, hotsite.empresa_id_legado);
  if (!empresaId) {
    return {
      success: false,
      message: `❌ Empresa legada ${hotsite.empresa_id_legado} não encontrada no mapeamento`,
    };
  }
  
  // Buscar nome da empresa para log
  const { data: empresa } = await supabase
    .from('empresas')
    .select('nome')
    .eq('id', empresaId)
    .single();
  
  console.log(`  📋 Empresa: ${empresa?.nome || empresaId}`);
  
  // Buscar cidade
  const cidadeId = await findCidadeByNome(supabase, hotsite.cidade_nome, hotsite.estado);
  if (!cidadeId) {
    return {
      success: false,
      message: `❌ Cidade não encontrada: ${hotsite.cidade_nome} - ${hotsite.estado}`,
    };
  }
  
  // Buscar nome da cidade para log
  const { data: cidade } = await supabase
    .from('cidades')
    .select('nome')
    .eq('id', cidadeId)
    .single();
  
  console.log(`  📍 Cidade: ${cidade?.nome || hotsite.cidade_nome} - ${hotsite.estado}`);
  
  // Verificar se já existe
  const { data: existing } = await supabase
    .from('hotsites')
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('cidade_id', cidadeId)
    .maybeSingle();
  
  if (existing) {
    console.log(`  ⚠️  Hotsite já existe, atualizando...`);
  }
  
  // Preparar dados do hotsite
  const hotsiteData = {
    empresa_id: empresaId,
    cidade_id: cidadeId,
    nome_exibicao: hotsite.nome_exibicao || null,
    descricao: hotsite.descricao || null,
    endereco: hotsite.endereco || null,
    cidade: hotsite.cidade_nome || null,
    estado: hotsite.estado?.toUpperCase() || null,
    logo_url: hotsite.logo_url || null,
    foto1_url: hotsite.foto1_url || null,
    foto2_url: hotsite.foto2_url || null,
    foto3_url: hotsite.foto3_url || null,
    email: hotsite.email || null,
    sms_numero: hotsite.sms_numero || null,
    regiao: hotsite.regiao || null,
    tipoempresa: hotsite.tipoempresa || null,
    slugbairro: hotsite.slugbairro || null,
    telefone1: hotsite.telefone1 || null,
    telefone2: hotsite.telefone2 || null,
    telefone3: hotsite.telefone3 || null,
    servicos: [],
    descontos: [],
    formas_pagamento: [],
    highlights: [],
  };
  
  // Importar tipo de serviço se tipoempresa estiver preenchido
  if (hotsite.tipoempresa) {
    const tipoMap: Record<string, string> = {
      'Empresa de Mudança': 'mudanca',
      'Empresa de Carreto': 'carreto',
      'Guarda Móveis': 'guardamoveis',
      'Transportadora': 'transportadora',
      'Montador': 'montador',
    };
    
    const tipoServico = tipoMap[hotsite.tipoempresa] || hotsite.tipoempresa.toLowerCase();
    
    await supabase
      .from('empresa_servicos')
      .upsert({
        empresa_id: empresaId,
        tipo_servico: tipoServico,
      }, {
        onConflict: 'empresa_id,tipo_servico',
      });
    
    console.log(`  ✅ Tipo de serviço importado: ${tipoServico}`);
  }
  
  // Salvar hotsite
  const { error } = await supabase
    .from('hotsites')
    .upsert(hotsiteData, {
      onConflict: 'empresa_id,cidade_id',
      ignoreDuplicates: false,
    });
  
  if (error) {
    return {
      success: false,
      message: `❌ Erro ao salvar hotsite: ${error.message}`,
    };
  }
  
  return {
    success: true,
    message: `✅ Hotsite ${existing ? 'atualizado' : 'criado'} com sucesso`,
  };
}

async function main() {
  console.log('🔍 Verificando e reimportando hotsites faltantes...\n');

  // Empresas que sabemos que têm hotsites no CSV mas não foram importadas
  const empresasParaVerificar = [
    '1001-mudancas',
    'agiliza-mudancas-ms',
    'alexandre-mudancas-niteroi',
    'brasil-mudancas-niteroi',
    'dard-mudancas-praia-grande',
  ];

  // Buscar IDs das empresas
  const { data: empresas } = await supabase
    .from('empresas')
    .select('id, nome, slug')
    .in('slug', empresasParaVerificar);

  console.log(`✅ ${empresas?.length || 0} empresas encontradas para verificar\n`);

  if (!empresas || empresas.length === 0) {
    console.log('❌ Nenhuma empresa encontrada');
    return;
  }

  // Buscar mapeamento de empresas
  const { data: empresaMap } = await supabase
    .from('migration_empresas_map')
    .select('id_legado, id_novo');

  const mapNovoParaLegado = new Map(
    empresaMap?.map(m => [m.id_novo, m.id_legado]) || []
  );

  // Ler CSV
  const csvPath = path.join(process.cwd(), 'data', 'hotsites_export.csv');
  console.log(`📖 Lendo CSV: ${csvPath}`);
  const hotsitesCSV = readCSV(csvPath);
  console.log(`✅ ${hotsitesCSV.length} hotsites encontrados no CSV\n`);

  // Filtrar hotsites das empresas que queremos reimportar
  const hotsitesParaReimportar: HotsiteCSV[] = [];
  
  for (const empresa of empresas) {
    const empresaIdLegado = mapNovoParaLegado.get(empresa.id);
    if (!empresaIdLegado) {
      console.log(`⚠️  Empresa ${empresa.nome} não tem mapeamento legado`);
      continue;
    }
    
    const hotsitesDaEmpresa = hotsitesCSV.filter(h => h.empresa_id_legado === empresaIdLegado);
    
    // Verificar se já existe no banco
    const { data: hotsitesExistentes } = await supabase
      .from('hotsites')
      .select('id, cidade_id')
      .eq('empresa_id', empresa.id);
    
    const cidadesExistentes = new Set(hotsitesExistentes?.map(h => h.cidade_id) || []);
    
    for (const hotsite of hotsitesDaEmpresa) {
      const cidadeId = await findCidadeByNome(supabase, hotsite.cidade_nome, hotsite.estado);
      
      if (!cidadeId) {
        console.log(`⚠️  Hotsite da empresa ${empresa.nome} em ${hotsite.cidade_nome} - ${hotsite.estado} não pode ser importado (cidade não encontrada)`);
        continue;
      }
      
      if (!cidadesExistentes.has(cidadeId)) {
        hotsitesParaReimportar.push(hotsite);
        console.log(`✅ Encontrado hotsite para ${empresa.nome} em ${hotsite.cidade_nome} - ${hotsite.estado}`);
      }
    }
  }

  console.log(`\n📊 Total de hotsites para reimportar: ${hotsitesParaReimportar.length}\n`);

  if (hotsitesParaReimportar.length === 0) {
    console.log('✅ Todos os hotsites já estão importados!');
    return;
  }

  // Reimportar hotsites
  let sucesso = 0;
  let erros = 0;

  for (const hotsite of hotsitesParaReimportar) {
    const resultado = await reimportHotsite(supabase, hotsite);
    
    if (resultado.success) {
      sucesso++;
      console.log(`  ${resultado.message}`);
    } else {
      erros++;
      console.log(`  ${resultado.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Reimportação concluída!');
  console.log(`   Sucesso: ${sucesso}`);
  console.log(`   Erros: ${erros}`);
  console.log('='.repeat(60));
}

main().catch(console.error);

