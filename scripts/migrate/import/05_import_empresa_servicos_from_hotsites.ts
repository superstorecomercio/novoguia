/**
 * Extrai tipos de serviço dos hotsites e popula a tabela empresa_servicos
 * 
 * Os serviços estão armazenados no campo JSONB 'servicos' da tabela hotsites.
 * Este script mapeia os serviços descritivos para os tipos padronizados.
 * 
 * Uso:
 *   npx tsx scripts/migrate/import/05_import_empresa_servicos_from_hotsites.ts
 */

// Carregar variáveis de ambiente ANTES de qualquer importação
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Mapeia serviço descritivo para tipo padronizado
 */
function mapServicoToTipo(servico: string): string | null {
  if (!servico) return null;
  
  const servicoLower = servico.toLowerCase().trim();
  
  // Mapeamento de serviços descritivos para tipos padronizados
  const mapping: Record<string, string> = {
    // Mudanças
    'mudança': 'mudanca',
    'mudanca': 'mudanca',
    'mudanças': 'mudanca',
    'mudancas': 'mudanca',
    'mudança residencial': 'mudanca',
    'mudança comercial': 'mudanca',
    'mudança industrial': 'mudanca',
    
    // Carretos
    'carreto': 'carreto',
    'carretos': 'carreto',
    'transporte': 'carreto',
    'transporte de móveis': 'carreto',
    
    // Guarda-Móveis
    'guarda-móveis': 'guardamoveis',
    'guarda-moveis': 'guardamoveis',
    'guardamoveis': 'guardamoveis',
    'armazenamento': 'guardamoveis',
    'self storage': 'guardamoveis',
    
    // Transportadora
    'transportadora': 'transportadora',
    'frete': 'transportadora',
    
    // Montador
    'montador': 'montador',
    'montagem': 'montador',
    'montagem de móveis': 'montador',
  };
  
  // Tentar mapeamento direto
  if (mapping[servicoLower]) {
    return mapping[servicoLower];
  }
  
  // Tentar mapeamento parcial (contém a palavra)
  for (const [key, value] of Object.entries(mapping)) {
    if (servicoLower.includes(key)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Mapeia posição do campo para tipo de serviço
 * Assumindo mapeamento padrão baseado na posição:
 * hotServico1 = Mudança
 * hotServico2 = Carreto
 * hotServico3 = Guarda-Móveis
 * hotServico4 = Transportadora
 * hotServico5 = Montador
 */
function mapPosicaoToTipo(posicao: number): string | null {
  const mapping: Record<number, string> = {
    0: 'mudanca',      // hotServico1
    1: 'carreto',      // hotServico2
    2: 'guardamoveis', // hotServico3
    3: 'transportadora', // hotServico4
    4: 'montador',     // hotServico5
    // Campos 5-9 podem ser variações ou serviços adicionais
    // Por padrão, vamos mapear para os tipos mais comuns se "S"
  };
  
  return mapping[posicao] || null;
}

/**
 * Extrai tipos únicos de serviço de um array de serviços
 * Os serviços vêm como flags "N" ou "S" na ordem dos campos
 */
function extractTiposServico(servicos: string[] | null): string[] {
  if (!servicos || !Array.isArray(servicos)) {
    return [];
  }
  
  const tipos: string[] = [];
  
  servicos.forEach((servico, index) => {
    // Se o serviço é "S" (Sim), mapear para tipo baseado na posição
    if (servico === 'S' || servico === 's') {
      const tipo = mapPosicaoToTipo(index);
      if (tipo && !tipos.includes(tipo)) {
        tipos.push(tipo);
      } else if (!tipo && index < 5) {
        // Se não tem mapeamento mas está nas primeiras 5 posições,
        // tentar mapear para tipos comuns baseado na posição
        const fallbackMapping: Record<number, string> = {
          0: 'mudanca',
          1: 'carreto',
          2: 'guardamoveis',
          3: 'transportadora',
          4: 'montador',
        };
        const fallbackTipo = fallbackMapping[index];
        if (fallbackTipo && !tipos.includes(fallbackTipo)) {
          tipos.push(fallbackTipo);
        }
      }
    } else if (servico && servico !== 'N' && servico !== 'n' && servico !== '') {
      // Se não é flag, tentar mapear como texto descritivo
      const tipo = mapServicoToTipo(servico);
      if (tipo && !tipos.includes(tipo)) {
        tipos.push(tipo);
      }
    }
  });
  
  return tipos;
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Extraindo tipos de serviço dos hotsites...\n');
  
  try {
    // Buscar todos os hotsites com seus serviços
    const { data: hotsites, error: hotsitesError } = await supabase
      .from('hotsites')
      .select('empresa_id, servicos');
    
    if (hotsitesError) {
      console.error('❌ Erro ao buscar hotsites:', hotsitesError.message);
      process.exit(1);
    }
    
    if (!hotsites || hotsites.length === 0) {
      console.log('⚠️  Nenhum hotsite encontrado.');
      return;
    }
    
    console.log(`📦 Encontrados ${hotsites.length} hotsites\n`);
    
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Processar cada hotsite
    for (const hotsite of hotsites) {
      const tiposServico = extractTiposServico(hotsite.servicos as string[]);
      
      if (tiposServico.length === 0) {
        skippedCount++;
        continue;
      }
      
      // Inserir cada tipo de serviço na tabela empresa_servicos
      for (const tipoServico of tiposServico) {
        // Verificar se já existe
        const { data: existing } = await supabase
          .from('empresa_servicos')
          .select('id')
          .eq('empresa_id', hotsite.empresa_id)
          .eq('tipo_servico', tipoServico)
          .single();
        
        if (existing) {
          // Já existe, pular
          continue;
        }
        
        // Inserir novo
        const { error: insertError } = await supabase
          .from('empresa_servicos')
          .insert({
            empresa_id: hotsite.empresa_id,
            tipo_servico: tipoServico,
            areas_atendidas: [], // Pode ser preenchido depois
          });
        
        if (insertError) {
          // Se erro for de constraint única, ignorar (já existe)
          if (insertError.code === '23505') {
            continue;
          }
          console.error(`❌ Erro ao inserir serviço ${tipoServico} para empresa ${hotsite.empresa_id}: ${insertError.message}`);
          errorCount++;
        } else {
          successCount++;
        }
      }
    }
    
    console.log('\n📊 Resumo da Importação:');
    console.log(`   ✅ Criados: ${successCount}`);
    console.log(`   ⏭️  Já existiam: ${skippedCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    
    // Mostrar estatísticas
    const { data: stats } = await supabase
      .from('empresa_servicos')
      .select('tipo_servico');
    
    if (stats) {
      const tiposCount: Record<string, number> = {};
      stats.forEach(s => {
        tiposCount[s.tipo_servico] = (tiposCount[s.tipo_servico] || 0) + 1;
      });
      
      console.log('\n📈 Tipos de Serviço Cadastrados:');
      Object.entries(tiposCount).forEach(([tipo, count]) => {
        console.log(`   ${tipo}: ${count} empresas`);
      });
    }
    
    console.log('\n✅ Processo concluído!');
    
  } catch (error: any) {
    console.error('❌ Erro durante processamento:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export {};

