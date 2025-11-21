'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ServiceType } from '../types';

interface ServiceTypeFilterProps {
  cidadeSlug: string;
  currentType?: string;
  counts?: {
    mudanca: number;
    carreto: number;
    guardamoveis: number;
  };
}

const ServiceTypeFilter = ({
  cidadeSlug,
  currentType = 'todos',
  counts,
}: ServiceTypeFilterProps) => {
  const pathname = usePathname();

  const tipos = [
    {
      slug: 'todos',
      label: 'Todos',
      tipo: 'todos' as const,
      tipoEmpresa: 'todos',
      count: Object.values(counts || {}).reduce((a, b) => a + b, 0),
    },
    {
      slug: 'mudancas',
      label: 'Empresas de Mudanças',
      tipo: 'mudancas' as const,
      tipoEmpresa: 'Empresa de Mudança',
      count: counts?.mudanca || 0,
    },
    {
      slug: 'carretos',
      label: 'Carretos',
      tipo: 'carretos' as const,
      tipoEmpresa: 'Carretos',
      count: counts?.carreto || 0,
    },
    {
      slug: 'guarda-moveis',
      label: 'Guarda-Móveis',
      tipo: 'guarda-moveis' as const,
      tipoEmpresa: 'Guarda-Móveis',
      count: counts?.guardamoveis || 0,
    },
  ];

  const getHref = (slug: string) => {
    if (slug === 'todos') {
      return `/cidades/${cidadeSlug}`;
    }
    return `/cidades/${cidadeSlug}/${slug}`;
  };

  const isActive = (slug: string) => {
    if (slug === 'todos' && currentType === 'todos') return true;
    if (slug === 'mudancas' && (currentType === 'mudancas' || currentType === 'Empresa de Mudança')) return true;
    if (slug === 'carretos' && (currentType === 'carretos' || currentType === 'Carretos')) return true;
    if (slug === 'guarda-moveis' && (currentType === 'guarda-moveis' || currentType === 'Guarda-Móveis')) return true;
    return false;
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tipos.map((tipo) => {
        const active = isActive(tipo.slug);
        return (
          <Link
            key={tipo.slug}
            href={getHref(tipo.slug)}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {tipo.label}
            {tipo.count > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded text-xs ${
                  active ? 'bg-blue-700' : 'bg-gray-200'
                }`}
              >
                {tipo.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default ServiceTypeFilter;

