import { createServerClient } from '../../../lib/supabase/server';

export default async function HotsitesDebugPage() {
  const supabase = createServerClient();

  // Query exata da página de hotsites
  const { data: hotsites, error } = await supabase
    .from('hotsites')
    .select(`
      id,
      empresa_id,
      nome_exibicao,
      descricao,
      endereco,
      cidade,
      estado,
      logo_url,
      foto1_url,
      created_at,
      empresa:empresas(id, nome, slug, email, telefones, ativo)
    `)
    .order('created_at', { ascending: false })
    .limit(10000);

  // Buscar especificamente hotsites com "TR"
  const { data: hotsitesTR, error: errorTR } = await supabase
    .from('hotsites')
    .select(`
      id,
      empresa_id,
      nome_exibicao,
      cidade,
      estado,
      created_at
    `)
    .ilike('nome_exibicao', 'TR%');

  // Total de hotsites
  const { count: totalHotsites } = await supabase
    .from('hotsites')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">🔍 Debug: Lista de Hotsites</h1>

      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="p-4 border rounded-lg bg-blue-50">
          <h2 className="text-xl font-semibold mb-2">Estatísticas</h2>
          <p><strong>Total de hotsites no banco:</strong> {totalHotsites || 0}</p>
          <p><strong>Hotsites retornados pela query principal:</strong> {hotsites?.length || 0}</p>
          <p><strong>Hotsites começando com "TR":</strong> {hotsitesTR?.length || 0}</p>
        </div>

        {/* Erro na query principal */}
        {error && (
          <div className="p-4 border rounded-lg bg-red-50">
            <h2 className="text-xl font-semibold mb-2 text-red-700">❌ Erro na Query Principal</h2>
            <p><strong>Mensagem:</strong> {error.message}</p>
            <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}

        {/* Hotsites com TR */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Hotsites começando com "TR"</h2>
          {errorTR ? (
            <div className="text-red-600">
              <p>❌ Erro: {errorTR.message}</p>
            </div>
          ) : hotsitesTR && hotsitesTR.length > 0 ? (
            <div>
              <p className="text-green-600 mb-3">✅ Encontrado {hotsitesTR.length} hotsite(s)</p>
              {hotsitesTR.map((hot: any) => (
                <div key={hot.id} className="p-3 bg-gray-50 rounded mt-2">
                  <p><strong>ID:</strong> {hot.id}</p>
                  <p><strong>Nome:</strong> {hot.nome_exibicao}</p>
                  <p><strong>Cidade:</strong> {hot.cidade} - {hot.estado}</p>
                  <p><strong>Empresa ID:</strong> {hot.empresa_id || 'null'}</p>
                  <p><strong>Created At:</strong> {hot.created_at}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-yellow-600">⚠️ Nenhum hotsite encontrado com "TR"</p>
          )}
        </div>

        {/* Primeiros 20 hotsites da query principal */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Primeiros 20 Hotsites (Query Principal)</h2>
          {hotsites && hotsites.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-1 text-left">Nome Hotsite</th>
                    <th className="px-2 py-1 text-left">Cidade</th>
                    <th className="px-2 py-1 text-left">Empresa</th>
                    <th className="px-2 py-1 text-left">Empresa ID</th>
                    <th className="px-2 py-1 text-left">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {hotsites.slice(0, 20).map((hot: any) => (
                    <tr key={hot.id} className="border-t">
                      <td className="px-2 py-1">{hot.nome_exibicao || 'N/A'}</td>
                      <td className="px-2 py-1">{hot.cidade || 'N/A'}</td>
                      <td className="px-2 py-1">{hot.empresa?.nome || 'Sem empresa'}</td>
                      <td className="px-2 py-1">{hot.empresa_id || 'null'}</td>
                      <td className="px-2 py-1 text-xs">{hot.created_at || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-yellow-600">⚠️ Nenhum hotsite retornado</p>
          )}
        </div>

        {/* Verificar se TR está na lista completa */}
        {hotsites && hotsites.length > 0 && (
          <div className="p-4 border rounded-lg bg-yellow-50">
            <h2 className="text-xl font-semibold mb-2">Verificação: "TR MUDANÇAS" está na lista?</h2>
            {hotsites.find((h: any) => h.nome_exibicao?.toUpperCase().includes('TR')) ? (
              <div className="text-green-600">
                ✅ SIM! Encontrado na lista completa
                <div className="mt-2 p-2 bg-white rounded">
                  {hotsites
                    .filter((h: any) => h.nome_exibicao?.toUpperCase().includes('TR'))
                    .map((h: any) => (
                      <div key={h.id} className="mb-2">
                        <p><strong>Nome:</strong> {h.nome_exibicao}</p>
                        <p><strong>Empresa:</strong> {h.empresa?.nome || 'Sem empresa'}</p>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <p className="text-red-600">❌ NÃO encontrado na lista retornada pela query</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
