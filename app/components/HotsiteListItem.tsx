import Link from 'next/link';
import PlanoBadge from './PlanoBadge';

interface HotsiteListItemProps {
  hotsite: {
    id: string;
    nomeExibicao?: string;
    descricao?: string;
    cidade?: string;
    estado?: string;
    telefone1?: string;
    telefone2?: string;
    endereco?: string;
    logoUrl?: string;
    foto1Url?: string;
    servicos?: string[];
    descontos?: string[];
    formasPagamento?: string[];
    highlights?: string[];
    plano?: {
      nome: string;
      ordem: number;
    };
  };
}

export default function HotsiteListItem({ hotsite }: HotsiteListItemProps) {
  // Gerar slug do hotsite baseado no nome (simplificado)
  const hotsiteSlug = (hotsite.nomeExibicao || 'hotsite')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const cidadeSlug = `${(hotsite.cidade || 'cidade')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')}-${(hotsite.estado || '').toLowerCase()}`;

  return (
    <Link
      href={`/cidades/${cidadeSlug}/${hotsiteSlug}`}
      className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-[#0073e6] group"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#0073e6] transition-colors">
                {hotsite.nomeExibicao}
              </h3>
              {hotsite.plano && (
                <PlanoBadge plano={hotsite.plano.nome as any} />
              )}
            </div>
            <p className="text-gray-600 text-sm">
              {hotsite.cidade} - {hotsite.estado}
              {hotsite.endereco && ` • ${hotsite.endereco}`}
            </p>
          </div>
          
          {hotsite.logoUrl && (
            <div className="flex-shrink-0 ml-4">
              <img
                src={hotsite.logoUrl}
                alt={hotsite.nomeExibicao}
                className="w-16 h-16 object-contain rounded-lg"
              />
            </div>
          )}
        </div>

        {hotsite.descricao && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-2">
            {hotsite.descricao}
          </p>
        )}

        {/* Serviços */}
        {hotsite.servicos && hotsite.servicos.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {hotsite.servicos.slice(0, 3).map((servico, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                >
                  {servico}
                </span>
              ))}
              {hotsite.servicos.length > 3 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                  +{hotsite.servicos.length - 3} mais
                </span>
              )}
            </div>
          </div>
        )}

        {/* Highlights */}
        {hotsite.highlights && hotsite.highlights.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {hotsite.highlights.slice(0, 2).map((highlight, index) => (
                <div key={index} className="flex items-center text-xs text-gray-600">
                  <span className="text-green-600 mr-1">✓</span>
                  {highlight}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Descontos */}
        {hotsite.descontos && hotsite.descontos.length > 0 && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs font-semibold text-green-800">
              🎉 {hotsite.descontos[0]}
            </p>
          </div>
        )}

        {/* Footer - Contato */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {hotsite.telefone1 && (
              <div className="flex items-center gap-1">
                <span>📞</span>
                <span>{hotsite.telefone1}</span>
              </div>
            )}
            {hotsite.formasPagamento && hotsite.formasPagamento.length > 0 && (
              <div className="flex items-center gap-1">
                <span>💳</span>
                <span>{hotsite.formasPagamento.length} forma(s)</span>
              </div>
            )}
          </div>
          
          <div className="text-[#0073e6] font-semibold text-sm group-hover:translate-x-1 transition-transform">
            Ver detalhes →
          </div>
        </div>
      </div>
    </Link>
  );
}

