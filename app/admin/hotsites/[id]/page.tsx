import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import HotsiteEditForm from '@/app/components/admin/HotsiteEditForm';

// Desabilitar cache para sempre buscar dados atualizados
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HotsiteEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function HotsiteEditPage({ params }: HotsiteEditPageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Buscar hotsite (sem JOIN com empresas)
  const { data: hotsite, error: hotsiteError } = await supabase
    .from('hotsites')
    .select('*')
    .eq('id', id)
    .single();

  if (hotsiteError || !hotsite) {
    notFound();
  }

  // Buscar cidades para o select
  const { data: cidades } = await supabase
    .from('hotsites')
    .select('cidade, estado')
    .not('cidade', 'is', null)
    .not('estado', 'is', null);

  const cidadesUnicas = Array.from(
    new Set(
      cidades?.map((c: any) => `${c.cidade}-${c.estado}`) || []
    )
  ).map((cidadeEstado) => {
    const [cidade, estado] = cidadeEstado.split('-');
    return { cidade, estado };
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Editar Hotsite: {hotsite.nome_exibicao || 'Sem nome'}
        </h1>
        <p className="text-gray-600">
          {hotsite.cidade && hotsite.estado && (
            <>{hotsite.cidade} - {hotsite.estado}</>
          )}
        </p>
      </div>

      <HotsiteEditForm
        hotsite={hotsite}
        cidades={cidadesUnicas}
      />
    </div>
  );
}
