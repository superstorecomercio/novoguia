import { createServerClient } from '../../lib/supabase/server';

export default async function TestDBPage() {
  const supabase = createServerClient();
  
  // Teste 1: Verificar conexão básica
  const { data: testData, error: testError } = await supabase
    .from('cidades')
    .select('id')
    .limit(1);

  // Teste 2: Buscar todas as cidades
  const { data: cidades, error: cidadesError } = await supabase
    .from('cidades')
    .select('*')
    .order('nome', { ascending: true });

  // Teste 3: Buscar cidade específica por slug
  const { data: cidadeSaoPaulo, error: cidadeSPError } = await supabase
    .from('cidades')
    .select('*')
    .eq('slug', 'sao-paulo')
    .single();

  // Teste 4: Verificar se tabela empresas existe
  const { data: empresas, error: empresasError } = await supabase
    .from('empresas')
    .select('id')
    .limit(1);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">🔍 Diagnóstico de Conexão Supabase</h1>
      
      <div className="space-y-6">
        {/* Variáveis de Ambiente */}
        <div className="p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-3">1. Variáveis de Ambiente</h2>
          <div className="space-y-2">
            <p>
              <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
                <span className="text-green-600">✅ Definida</span>
              ) : (
                <span className="text-red-600">❌ Não definida</span>
              )}
            </p>
            <p>
              <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
                <span className="text-green-600">✅ Definida</span>
              ) : (
                <span className="text-red-600">❌ Não definida</span>
              )}
            </p>
            {process.env.NEXT_PUBLIC_SUPABASE_URL && (
              <div className="mt-2 p-2 bg-white rounded border">
                <p className="text-sm font-semibold mb-1">URL Configurada:</p>
                <p className="text-xs font-mono break-all">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL}
                </p>
                {process.env.NEXT_PUBLIC_SUPABASE_URL.includes('localhost') && (
                  <p className="text-red-600 text-sm mt-2 font-semibold">
                    ⚠️ ERRO CRÍTICO: A URL está apontando para localhost! Deve ser a URL do Supabase (ex: https://seu-projeto.supabase.co)
                  </p>
                )}
                {!process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') && (
                  <p className="text-red-600 text-sm mt-2 font-semibold">
                    ⚠️ ERRO: A URL deve começar com https://
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Teste de Conexão Básica */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">2. Teste de Conexão Básica</h2>
          {testError ? (
            <div className="text-red-600 space-y-2">
              <p><strong>❌ Erro na conexão</strong></p>
              <p><strong>Mensagem:</strong> {testError.message || 'Sem mensagem'}</p>
              <p><strong>Código:</strong> {testError.code || 'Sem código'}</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm">Ver detalhes completos</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(testError, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div className="text-green-600">
              ✅ Conexão estabelecida com sucesso!
            </div>
          )}
        </div>

        {/* Buscar Todas as Cidades */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">3. Buscar Todas as Cidades</h2>
          {cidadesError ? (
            <div className="text-red-600 space-y-2">
              <p><strong>❌ Erro ao buscar cidades</strong></p>
              <p><strong>Mensagem:</strong> {cidadesError.message || 'Sem mensagem'}</p>
              <p><strong>Código:</strong> {cidadesError.code || 'Sem código'}</p>
              {cidadesError.code === 'PGRST301' && (
                <p className="text-yellow-600 mt-2">
                  ⚠️ Possível causa: Tabela 'cidades' não existe ou RLS está bloqueando acesso
                </p>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer text-sm">Ver detalhes completos</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(cidadesError, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div>
              <p className="text-green-600 mb-2">✅ Query executada com sucesso</p>
              <p className="font-semibold">Cidades encontradas: {cidades?.length || 0}</p>
              {cidades && cidades.length > 0 ? (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Primeiras 5 cidades:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {cidades.slice(0, 5).map((cidade: any) => (
                      <li key={cidade.id} className="text-sm">
                        <strong>{cidade.nome}</strong> ({cidade.slug}) - {cidade.estado}
                      </li>
                    ))}
                  </ul>
                  {cidades.length > 5 && (
                    <p className="text-sm text-gray-500 mt-2">
                      ... e mais {cidades.length - 5} cidades
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-yellow-600 mt-2">
                  ⚠️ Tabela existe mas está vazia. Execute o script de seed no Supabase.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Buscar Cidade Específica */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">4. Buscar Cidade por Slug (sao-paulo)</h2>
          {cidadeSPError ? (
            <div className="text-red-600 space-y-2">
              <p><strong>❌ Erro ao buscar cidade específica</strong></p>
              <p><strong>Mensagem:</strong> {cidadeSPError.message || 'Sem mensagem'}</p>
              <p><strong>Código:</strong> {cidadeSPError.code || 'Sem código'}</p>
              {cidadeSPError.code === 'PGRST116' && (
                <p className="text-yellow-600 mt-2">
                  ⚠️ Cidade 'sao-paulo' não encontrada. Verifique se o slug está correto.
                </p>
              )}
            </div>
          ) : cidadeSaoPaulo ? (
            <div className="text-green-600">
              ✅ Cidade encontrada: <strong>{cidadeSaoPaulo.nome}</strong> ({cidadeSaoPaulo.slug})
            </div>
          ) : (
            <div className="text-yellow-600">
              ⚠️ Cidade não encontrada (pode não existir no banco)
            </div>
          )}
        </div>

        {/* Verificar Tabela Empresas */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">5. Verificar Tabela Empresas</h2>
          {empresasError ? (
            <div className="text-red-600 space-y-2">
              <p><strong>❌ Erro ao acessar tabela empresas</strong></p>
              <p><strong>Mensagem:</strong> {empresasError.message || 'Sem mensagem'}</p>
              <p><strong>Código:</strong> {empresasError.code || 'Sem código'}</p>
            </div>
          ) : (
            <div className="text-green-600">
              ✅ Tabela 'empresas' existe e está acessível
            </div>
          )}
        </div>

        {/* Resumo e Próximos Passos */}
        <div className="p-4 border rounded-lg bg-blue-50">
          <h2 className="text-xl font-semibold mb-2">📋 Resumo</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              Conexão: {testError ? '❌ Falhou' : '✅ OK'}
            </li>
            <li>
              Tabela cidades: {cidadesError ? '❌ Erro' : '✅ OK'} ({cidades?.length || 0} registros)
            </li>
            <li>
              Tabela empresas: {empresasError ? '❌ Erro' : '✅ OK'}
            </li>
          </ul>
          {cidades && cidades.length === 0 && (
            <div className="mt-4 p-3 bg-yellow-100 rounded">
              <p className="font-semibold text-yellow-800">⚠️ Ação Necessária:</p>
              <p className="text-sm text-yellow-700 mt-1">
                A tabela 'cidades' está vazia. Execute o script de seed no Supabase SQL Editor para popular os dados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


