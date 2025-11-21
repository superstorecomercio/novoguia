import { createServerClient } from '../../../lib/supabase/server';

export default async function TestTRMudancasPage() {
  const supabase = createServerClient();

  // Buscar empresa TR MUDANÇAS
  const { data: empresaTR, error: empresaError } = await supabase
    .from('empresas')
    .select('*')
    .ilike('nome', '%TR%MUDANÇAS%');

  // Buscar hotsites com TR MUDANÇAS no nome
  const { data: hotsitesTR, error: hotsitesError } = await supabase
    .from('hotsites')
    .select(`
      id,
      empresa_id,
      nome_exibicao,
      cidade,
      estado,
      empresa:empresas(id, nome, slug)
    `)
    .ilike('nome_exibicao', '%TR%MUDANÇAS%');

  // Buscar todas as empresas com "TR" no nome
  const { data: empresasComTR, error: trError } = await supabase
    .from('empresas')
    .select('id, nome, slug, ativo')
    .ilike('nome', '%TR%');

  // Buscar todos os hotsites (para debug)
  const { data: todosHotsites, error: todosError } = await supabase
    .from('hotsites')
    .select(`
      id,
      empresa_id,
      nome_exibicao,
      empresa:empresas(id, nome)
    `)
    .limit(100);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">🔍 Debug: TR MUDANÇAS</h1>

      <div className="space-y-6">
        {/* Empresas com TR MUDANÇAS */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">1. Empresas: "TR MUDANÇAS"</h2>
          {empresaError ? (
            <div className="text-red-600">
              <p>❌ Erro: {empresaError.message}</p>
            </div>
          ) : empresaTR && empresaTR.length > 0 ? (
            <div>
              <p className="text-green-600 mb-2">✅ Encontrado {empresaTR.length} empresa(s)</p>
              {empresaTR.map((emp: any) => (
                <div key={emp.id} className="p-3 bg-gray-50 rounded mt-2">
                  <p><strong>ID:</strong> {emp.id}</p>
                  <p><strong>Nome:</strong> {emp.nome}</p>
                  <p><strong>Slug:</strong> {emp.slug}</p>
                  <p><strong>Ativo:</strong> {emp.ativo ? 'Sim' : 'Não'}</p>
                  <p><strong>Email:</strong> {emp.email || 'N/A'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-yellow-600">⚠️ Nenhuma empresa encontrada com "TR MUDANÇAS"</p>
          )}
        </div>

        {/* Hotsites com TR MUDANÇAS */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">2. Hotsites: "TR MUDANÇAS"</h2>
          {hotsitesError ? (
            <div className="text-red-600">
              <p>❌ Erro: {hotsitesError.message}</p>
            </div>
          ) : hotsitesTR && hotsitesTR.length > 0 ? (
            <div>
              <p className="text-green-600 mb-2">✅ Encontrado {hotsitesTR.length} hotsite(s)</p>
              {hotsitesTR.map((hot: any) => (
                <div key={hot.id} className="p-3 bg-gray-50 rounded mt-2">
                  <p><strong>ID:</strong> {hot.id}</p>
                  <p><strong>Nome Exibição:</strong> {hot.nome_exibicao}</p>
                  <p><strong>Cidade:</strong> {hot.cidade} - {hot.estado}</p>
                  <p><strong>Empresa ID:</strong> {hot.empresa_id || 'N/A'}</p>
                  {hot.empresa && (
                    <div className="mt-2 p-2 bg-blue-50 rounded">
                      <p><strong>Empresa Vinculada:</strong> {hot.empresa.nome}</p>
                      <p><strong>Slug:</strong> {hot.empresa.slug}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-yellow-600">⚠️ Nenhum hotsite encontrado com "TR MUDANÇAS"</p>
          )}
        </div>

        {/* Todas empresas com TR */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">3. Todas Empresas com "TR"</h2>
          {trError ? (
            <div className="text-red-600">
              <p>❌ Erro: {trError.message}</p>
            </div>
          ) : empresasComTR && empresasComTR.length > 0 ? (
            <div>
              <p className="text-green-600 mb-2">✅ Encontrado {empresasComTR.length} empresa(s)</p>
              <ul className="list-disc list-inside">
                {empresasComTR.map((emp: any) => (
                  <li key={emp.id} className="text-sm">
                    <strong>{emp.nome}</strong> (slug: {emp.slug}, ativo: {emp.ativo ? 'sim' : 'não'})
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-yellow-600">⚠️ Nenhuma empresa com "TR" no nome</p>
          )}
        </div>

        {/* Todos os hotsites (primeiros 100) */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">4. Todos os Hotsites (primeiros 100)</h2>
          {todosError ? (
            <div className="text-red-600">
              <p>❌ Erro: {todosError.message}</p>
            </div>
          ) : todosHotsites ? (
            <div>
              <p className="text-green-600 mb-2">✅ Total: {todosHotsites.length} hotsites</p>
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left">Nome Hotsite</th>
                      <th className="px-2 py-1 text-left">Empresa Vinculada</th>
                      <th className="px-2 py-1 text-left">Empresa ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todosHotsites.map((hot: any) => (
                      <tr key={hot.id} className="border-t">
                        <td className="px-2 py-1">{hot.nome_exibicao || 'N/A'}</td>
                        <td className="px-2 py-1">{hot.empresa?.nome || 'Sem empresa'}</td>
                        <td className="px-2 py-1">{hot.empresa_id || 'null'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-yellow-600">⚠️ Nenhum hotsite encontrado</p>
          )}
        </div>
      </div>
    </div>
  );
}
