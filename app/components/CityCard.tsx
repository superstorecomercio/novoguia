import Link from 'next/link';
import { type City } from '../types';

interface CityCardProps {
  city: City;
}

const CityCard = ({ city }: CityCardProps) => {
  return (
    <Link
      href={`/cidades/${city.slug}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
    >
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {city.name}
      </h3>
      <p className="text-gray-600 text-sm mb-2">{city.state}</p>
      {city.description && (
        <p className="text-gray-500 text-sm line-clamp-2">{city.description}</p>
      )}
    </Link>
  );
};

export default CityCard;

