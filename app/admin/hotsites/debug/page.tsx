import { createServerClient } from '@/lib/supabase/server';

export default async function HotsitesDebugPage() {
  const supabase = createServerClient();

  // Query igual da página de hotsites
  const { data: hotsites, error } = await supabase
    .from('hotsites')
    .select(`
      id,
      nome_exibicao,
      descricao,
      endereco,
      cidade,
      estado,
      logo_url,
      foto1_url
    `)
    .order('nome_exibicao', { ascending: true })
    .limit(10000);

  // LOG: Ver o que está sendo retornado
  console.log('=== HOTSITES DEBUG ===');
  console.log('Total hotsites:', hotsites?.length);
  console.log('Primeiros 5:', hotsites?.slice(0, 5).map(h => h.nome_exibicao));

  // Buscar especificamente hotsites começando com "TR"
  const { data: hotsitesTR, error: errorTR } = await supabase
    .from('hotsites')
    .select('id, nome_exibicao, cidade, estado')
    .ilike('nome_exibicao', 'TR%');

  // Buscar especificamente "TR MUDANÇAS" (com espaço)
  const { data: hotsitesTRMudancas, error: errorTRMudancas } = await supabase
    .from('hotsites')
    .select('id, nome_exibicao, cidade, estado')
    .ilike('nome_exibicao', 'TR MUDANÇAS%');

  console.log('Hotsites começando com TR:', hotsitesTR?.length);
  console.log('Nomes começando com TR:', hotsitesTR?.map(h => h.nome_exibicao));
  console.log('Hotsites com "TR MUDANÇAS":', hotsitesTRMudancas?.length);
  console.log('TR MUDANÇAS - DETALHES COMPLETOS:', JSON.stringify(hotsitesTRMudancas, null, 2));

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">🔍 Debug: Hotsites</h1>

      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="p-4 border rounded-lg bg-blue-50">
          <h2 className="text-xl font-semibold mb-2">Estatísticas</h2>
          <p><strong>Total retornado pela query principal:</strong> {hotsites?.length || 0}</p>
          <p><strong>Hotsites com "TR" no nome:</strong> {hotsitesTR?.length || 0}</p>
          <p><strong>Hotsites com "TR MUDANÇAS":</strong> {hotsitesTRMudancas?.length || 0}</p>
        </div>

        {/* Erro */}
        {error && (
          <div className="p-4 border rounded-lg bg-red-50">
            <h2 className="text-xl font-semibold mb-2 text-red-700">❌ Erro</h2>
            <pre className="text-sm">{JSON.stringify(error, null, 2)}</pre>
          </div>
        )}

        {/* Hotsites com TR */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Busca específica: Começando com "TR"</h2>
          {errorTR ? (
            <div className="text-red-600">
              <p>❌ Erro: {errorTR.message}</p>
            </div>
          ) : hotsitesTR && hotsitesTR.length > 0 ? (
            <div>
              <p className="text-green-600 mb-3">✅ Encontrado {hotsitesTR.length} hotsite(s) começando com TR</p>
              {hotsitesTR.map((hot: any) => (
                <div key={hot.id} className="p-3 bg-gray-50 rounded mt-2">
                  <p><strong>ID:</strong> {hot.id}</p>
                  <p><strong>Nome:</strong> {hot.nome_exibicao}</p>
                  <p><strong>Cidade:</strong> {hot.cidade} - {hot.estado}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-yellow-600">⚠️ Nenhum hotsite com "TR" no nome</p>
          )}
        </div>

        {/* Lista completa */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Lista Completa (primeiros 50)</h2>
          {hotsites && hotsites.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-1 text-left">Nome</th>
                    <th className="px-2 py-1 text-left">Cidade</th>
                    <th className="px-2 py-1 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {hotsites.slice(0, 50).map((hot: any) => (
                    <tr key={hot.id} className="border-t">
                      <td className="px-2 py-1">{hot.nome_exibicao || 'N/A'}</td>
                      <td className="px-2 py-1">{hot.cidade || 'N/A'}</td>
                      <td className="px-2 py-1">{hot.estado || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hotsites.length > 50 && (
                <p className="mt-2 text-gray-500">... e mais {hotsites.length - 50} hotsites</p>
              )}
            </div>
          ) : (
            <p className="text-yellow-600">⚠️ Nenhum hotsite retornado</p>
          )}
        </div>

        {/* JSON completo de hotsites com TR */}
        {hotsitesTR && hotsitesTR.length > 0 && (
          <div className="p-4 border rounded-lg bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">JSON Completo (Hotsites com TR)</h2>
            <pre className="text-xs overflow-auto max-h-96 bg-white p-3 rounded">
              {JSON.stringify(hotsitesTR, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
