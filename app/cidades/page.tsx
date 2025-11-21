import { type City } from '../types';
import CityCard from '../components/CityCard';

// Mock data - será substituído por dados do Supabase
const mockCities: City[] = [
  {
    id: '1',
    name: 'São Paulo',
    slug: 'sao-paulo',
    state: 'SP',
    description: 'Capital do estado de São Paulo, maior cidade do Brasil.',
  },
  {
    id: '2',
    name: 'Rio de Janeiro',
    slug: 'rio-de-janeiro',
    state: 'RJ',
    description: 'Cidade maravilhosa, capital do estado do Rio de Janeiro.',
  },
  {
    id: '3',
    name: 'Belo Horizonte',
    slug: 'belo-horizonte',
    state: 'MG',
    description: 'Capital de Minas Gerais, conhecida por sua arquitetura moderna.',
  },
  {
    id: '4',
    name: 'Brasília',
    slug: 'brasilia',
    state: 'DF',
    description: 'Capital do Brasil, cidade planejada e patrimônio da humanidade.',
  },
  {
    id: '5',
    name: 'Curitiba',
    slug: 'curitiba',
    state: 'PR',
    description: 'Capital do Paraná, conhecida por seu planejamento urbano.',
  },
  {
    id: '6',
    name: 'Porto Alegre',
    slug: 'porto-alegre',
    state: 'RS',
    description: 'Capital do Rio Grande do Sul, importante centro econômico do sul.',
  },
];

const CitiesPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Cidades Atendidas
        </h1>
        <p className="text-xl text-gray-600">
          Encontre empresas de mudança na sua cidade
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCities.map((city) => (
          <CityCard key={city.id} city={city} />
        ))}
      </div>
    </div>
  );
};

export default CitiesPage;

