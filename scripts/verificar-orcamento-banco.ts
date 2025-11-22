/**
 * Script para verificar se o orçamento foi salvo no banco
 */

async function verificarOrcamentoNoBanco() {
  const emailTeste = 'teste@exemplo.com';
  
  console.log('🔍 Verificando orçamento no banco de dados...');
  console.log(`   Email: ${emailTeste}\n`);

  // Instruções para verificar manualmente
  console.log('Para verificar no Supabase Dashboard:');
  console.log('1. Acesse o Supabase Dashboard');
  console.log('2. Vá em Table Editor → orcamentos');
  console.log('3. Filtre por email_cliente = "teste@exemplo.com"');
  console.log('4. Verifique se o orçamento foi criado');
  console.log('\n');

  console.log('Ou execute esta query SQL no SQL Editor:');
  console.log(`
SELECT 
  id,
  nome_cliente,
  email_cliente,
  origem_completo,
  destino_completo,
  estado_origem,
  cidade_origem,
  estado_destino,
  cidade_destino,
  tipo_imovel,
  hotsites_notificados,
  created_at
FROM orcamentos
WHERE email_cliente = '${emailTeste}'
ORDER BY created_at DESC
LIMIT 1;
  `);
  console.log('\n');

  console.log('Para verificar os vínculos com campanhas:');
  console.log(`
SELECT 
  oc.*,
  h.nome_exibicao,
  h.cidade,
  h.estado
FROM orcamentos_campanhas oc
INNER JOIN hotsites h ON h.id = oc.hotsite_id
WHERE oc.orcamento_id = (
  SELECT id FROM orcamentos 
  WHERE email_cliente = '${emailTeste}' 
  ORDER BY created_at DESC 
  LIMIT 1
);
  `);
}

verificarOrcamentoNoBanco();

