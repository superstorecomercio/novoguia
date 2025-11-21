import { notFound } from 'next/navigation';
import { getCidadeBySlug, getHotsitesByCidadeSlug, getHotsitesCountByTipo } from '../../../../lib/db/queries';
import Breadcrumbs from '../../../components/Breadcrumbs';
import ServiceTypeFilter from '../../../components/ServiceTypeFilter';
import HotsiteListItem from '../../../components/HotsiteListItem';
import Button from '../../../components/Button';
import type { Metadata } from 'next';

interface CarretosPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: CarretosPageProps): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCidadeBySlug(slug);
  
  if (!city) {
    return {
      title: 'Cidade não encontrada',
    };
  }

  return {
    title: `Empresas de Carreto em ${city.name} - ${city.state} | Guia de Mudanças`,
    description: `Encontre empresas de carreto em ${city.name}, ${city.state}. Transporte rápido e seguro para seus móveis e objetos.`,
  };
}

const CarretosPage = async ({ params }: CarretosPageProps) => {
  const { slug } = await params;
  const city = await getCidadeBySlug(slug);
  const hotsites = await getHotsitesByCidadeSlug(slug, 'Carretos');
  const counts = await getHotsitesCountByTipo(slug);

  if (!city) {
    notFound();
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Cidades', href: '/cidades' },
    { label: city.name, href: `/cidades/${slug}` },
    { label: 'Carretos' },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <Breadcrumbs items={breadcrumbs} />

      <div className="mb-8 bg-gradient-to-r from-[#003366] to-[#004080] text-white rounded-2xl p-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-2">
          Empresas de Carreto em {city.name}
        </h1>
        <p className="text-xl text-white/90">
          {city.state}
          {hotsites.length > 0 && ` • ${hotsites.length} empresa${hotsites.length > 1 ? 's' : ''} disponível${hotsites.length > 1 ? 'eis' : ''}`}
        </p>
        <p className="text-white/80 mt-2">
          Encontre empresas especializadas em transporte de móveis e objetos.
        </p>
      </div>

      {/* Filtros por Tipo de Serviço */}
      <ServiceTypeFilter
        cidadeSlug={slug}
        currentType="carretos"
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
              href={`/orcamento?cidade=${slug}&tipo=carreto`}
              variant="primary"
            >
              Solicitar Orçamento de Carreto
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-6">
            Ainda não temos empresas de carreto cadastradas nesta cidade.
          </p>
          <Button href={`/orcamento?cidade=${slug}&tipo=carreto`} variant="primary">
            Solicitar Orçamento
          </Button>
        </div>
      )}
    </div>
  );
};

export default CarretosPage;

