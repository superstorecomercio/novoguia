import { createAdminClient } from '@/lib/supabase/server';
import HotsitesList from '@/app/components/admin/HotsitesList';

// Desabilitar cache para sempre buscar dados atualizados
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HotsitesPage() {
  const supabase = createAdminClient();

  // Primeiro, contar total de registros
  const { count } = await supabase
    .from('hotsites')
    .select('*', { count: 'exact', head: true });

  console.log('📊 Total de hotsites no banco:', count);

  // Buscar TODOS os hotsites com paginação
  const pageSize = 1000;
  const totalPages = Math.ceil((count || 0) / pageSize);
  let allHotsites: any[] = [];

  for (let page = 0; page < totalPages; page++) {
    const start = page * pageSize;
    const end = start + pageSize - 1;

    const { data, error } = await supabase
      .from('hotsites')
      .select('id, nome_exibicao, descricao, endereco, cidade, estado, logo_url, foto1_url')
      .order('nome_exibicao', { ascending: true })
      .range(start, end);

    if (error) {
      console.error('❌ Erro ao buscar hotsites (página', page + 1, '):', error);
      return (
        <div className="container mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-semibold">Erro ao carregar hotsites</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        </div>
      );
    }

    if (data) {
      allHotsites = [...allHotsites, ...data];
    }
  }

  console.log('✅ Hotsites carregados:', allHotsites.length, 'de', count);

  const hotsites = allHotsites;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hotsites</h1>
          <p className="text-gray-600 mt-2">
            Gerencie todos os hotsites do sistema
          </p>
        </div>
        <a
          href="/admin/hotsites/novo"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + Criar Hotsite
        </a>
      </div>

      <HotsitesList hotsites={hotsites || []} />
    </div>
  );
}

