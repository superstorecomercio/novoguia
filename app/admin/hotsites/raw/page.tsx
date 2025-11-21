import { createServerClient } from '@/lib/supabase/server';
import RawDataTable from './RawDataTable';

export default async function RawDataPage() {
  const supabase = createServerClient();

  const { data: hotsites, error } = await supabase
    .from('hotsites')
    .select('id, nome_exibicao, cidade, estado')
    .order('nome_exibicao', { ascending: true });

  // LOG
  console.log('===== RAW DATA PAGE =====');
  console.log('Total hotsites:', hotsites?.length);
  console.log('Error:', error);
  console.log('Primeiros 5:', hotsites?.slice(0, 5));
  console.log('========================');

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Dados RAW do Banco</h1>
        <div className="text-red-600">
          <p>Erro: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Dados RAW do Banco</h1>
      <p className="mb-4"><strong>Total de hotsites:</strong> {hotsites?.length || 0}</p>
      <RawDataTable hotsites={hotsites || []} />
    </div>
  );
}
