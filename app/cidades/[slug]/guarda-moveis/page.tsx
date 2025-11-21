import { notFound } from 'next/navigation';
import { getCidadeBySlug, getHotsitesByCidadeSlug, getHotsitesCountByTipo } from '../../../../lib/db/queries';
import Breadcrumbs from '../../../components/Breadcrumbs';
import ServiceTypeFilter from '../../../components/ServiceTypeFilter';
import HotsiteListItem from '../../../components/HotsiteListItem';
import Button from '../../../components/Button';
import type { Metadata } from 'next';

interface GuardaMoveisPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: GuardaMoveisPageProps): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCidadeBySlug(slug);
  
  if (!city) {
    return {
      title: 'Cidade não encontrada',
    };
  }

  return {
    title: `Guarda-Móveis em ${city.name} - ${city.state} | Guia de Mudanças`,
    description: `Encontre empresas de guarda-móveis e self storage em ${city.name}, ${city.state}. Armazenamento seguro para seus pertences.`,
  };
}

const GuardaMoveisPage = async ({ params }: GuardaMoveisPageProps) => {
  const { slug } = await params;
  const city = await getCidadeBySlug(slug);
  const hotsites = await getHotsitesByCidadeSlug(slug, 'Guarda-Móveis');
  const counts = await getHotsitesCountByTipo(slug);

  if (!city) {
    notFound();
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Cidades', href: '/cidades' },
    { label: city.name, href: `/cidades/${slug}` },
    { label: 'Guarda-Móveis' },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <Breadcrumbs items={breadcrumbs} />

      <div className="mb-8 bg-gradient-to-r from-[#003366] to-[#004080] text-white rounded-2xl p-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-2">
          Guarda-Móveis em {city.name}
        </h1>
        <p className="text-xl text-white/90">
          {city.state}
          {hotsites.length > 0 && ` • ${hotsites.length} empresa${hotsites.length > 1 ? 's' : ''} disponível${hotsites.length > 1 ? 'eis' : ''}`}
        </p>
        <p className="text-white/80 mt-2">
          Encontre empresas especializadas em armazenamento e guarda-móveis.
        </p>
      </div>

      {/* Filtros por Tipo de Serviço */}
      <ServiceTypeFilter
        cidadeSlug={slug}
        currentType="guarda-moveis"
        counts={counts}
      />

      {hotsites.length > 0 ? (
        <>
          <div className="space-y-4 mb-8">
            {hotsites.map((hotsite) => (
              <HotsiteListItem key={hotsite.id} hotsite={hotsite} />
            ))}
          </div>
          <div className="text-center">
            <Button
              href={`/orcamento?cidade=${slug}&tipo=guardamoveis`}
              variant="primary"
            >
              Solicitar Orçamento de Guarda-Móveis
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-6">
            Ainda não temos empresas de guarda-móveis cadastradas nesta cidade.
          </p>
          <Button href={`/orcamento?cidade=${slug}&tipo=guardamoveis`} variant="primary">
            Solicitar Orçamento
          </Button>
        </div>
      )}
    </div>
  );
};

export default GuardaMoveisPage;

