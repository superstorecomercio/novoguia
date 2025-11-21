'use client';

import Link from 'next/link';
import { type Company } from '../types';
import { getImageUrl } from '../../lib/storage/getImageUrl';

interface CompanyListItemProps {
  company: Company;
}

const CompanyListItem = ({ company }: CompanyListItemProps) => {
  const logoUrl = company.hotsite?.logoUrl ? getImageUrl(company.hotsite.logoUrl) : null;
  const fotoUrl = company.hotsite?.foto1Url ? getImageUrl(company.hotsite.foto1Url) : null;

  return (
    <Link
      href={`/empresas/${company.slug}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-[#0073e6]"
    >
      <div className="flex flex-col md:flex-row">
        {/* Imagem/Logo - Lado esquerdo */}
        <div className="relative w-full md:w-64 h-48 md:h-auto bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
          {logoUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-white p-4">
              <img
                src={logoUrl}
                alt={`Logo ${company.name}`}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.parentElement?.querySelector('.fallback');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
            </div>
          ) : fotoUrl ? (
            <img
              src={fotoUrl}
              alt={company.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.parentElement?.querySelector('.fallback');
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
          ) : null}
          
          {/* Fallback quando não tem imagem */}
          <div className={`fallback absolute inset-0 flex items-center justify-center ${logoUrl || fotoUrl ? 'hidden' : ''}`}>
            <div className="text-5xl opacity-20">🚚</div>
          </div>
        </div>

        {/* Conteúdo - Lado direito */}
        <div className="flex-1 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            {/* Informações principais */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-2xl font-bold text-[#003366] group-hover:text-[#0073e6] transition-colors">
                  {company.name}
                </h3>
                {company.planoPublicidade && company.planoPublicidade !== 'standard' && (
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                    company.planoPublicidade === 'top' ? 'bg-yellow-400 text-yellow-900' :
                    company.planoPublicidade === 'quality' ? 'bg-blue-400 text-blue-900' :
                    company.planoPublicidade === 'intermediario' ? 'bg-green-400 text-green-900' :
                    'bg-gray-400 text-gray-900'
                  }`}>
                    {company.planoPublicidade === 'top' ? 'TOP' :
                     company.planoPublicidade === 'quality' ? 'QUALITY' :
                     company.planoPublicidade === 'intermediario' ? 'INTERMEDIÁRIO' : ''}
                  </span>
                )}
              </div>

              {/* Localização */}
              {(company.cidadeName || company.hotsite?.cidade) && (
                <p className="text-gray-600 text-sm mb-3 flex items-center">
                  <span className="mr-2">📍</span>
                  {company.hotsite?.endereco && (
                    <span className="mr-2">{company.hotsite.endereco}</span>
                  )}
                  {company.hotsite?.cidade || company.cidadeName}
                  {(company.hotsite?.estado || company.estado) && `, ${company.hotsite?.estado || company.estado}`}
                </p>
              )}

              {/* Descrição */}
              {(company.description || company.hotsite?.descricao) && (
                <p className="text-gray-700 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {company.hotsite?.descricao || company.description}
                </p>
              )}

              {/* Serviços */}
              {company.serviceTypes && company.serviceTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {company.serviceTypes.map((service, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#0073e6]/10 text-[#0073e6] rounded-full text-xs font-semibold"
                    >
                      {service === 'mudanca' && 'Mudança'}
                      {service === 'carreto' && 'Carreto'}
                      {service === 'guardamoveis' && 'Guarda-Móveis'}
                      {service === 'transportadora' && 'Transportadora'}
                      {service === 'montador' && 'Montador'}
                    </span>
                  ))}
                </div>
              )}

              {/* Highlights/Diferenciais */}
              {company.hotsite?.highlights && company.hotsite.highlights.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {company.hotsite.highlights.slice(0, 3).map((highlight, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium"
                    >
                      ✓ {highlight}
                    </span>
                  ))}
                </div>
              )}

              {/* Descontos */}
              {company.hotsite?.descontos && company.hotsite.descontos.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Descontos disponíveis:</p>
                  <div className="flex flex-wrap gap-2">
                    {company.hotsite.descontos.slice(0, 2).map((desconto, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium"
                      >
                        🎁 {desconto}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Informações de contato - Lado direito */}
            <div className="md:w-48 flex-shrink-0 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
              {/* Telefones */}
              {company.phones.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Contato:</p>
                  <div className="space-y-1">
                    {company.phones.slice(0, 3).map((phone, index) => (
                      <span
                        key={index}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `tel:${phone.replace(/\D/g, '')}`;
                        }}
                        className="block text-[#0073e6] font-semibold text-sm hover:underline cursor-pointer"
                      >
                        📞 {phone}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Email */}
              {company.email && (
                <div className="mb-4">
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.location.href = `mailto:${company.email}`;
                    }}
                    className="block text-gray-600 text-sm hover:text-[#0073e6] transition-colors cursor-pointer"
                  >
                    ✉️ {company.email}
                  </span>
                </div>
              )}

              {/* Website */}
              {company.website && (
                <div className="mb-4">
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (company.website) {
                        const url = company.website.startsWith('http') ? company.website : `https://${company.website}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="block text-gray-600 text-sm hover:text-[#0073e6] transition-colors cursor-pointer"
                  >
                    🌐 Website
                  </span>
                </div>
              )}

              {/* Formas de pagamento */}
              {company.hotsite?.formasPagamento && company.hotsite.formasPagamento.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium">Pagamento:</p>
                  <p className="text-xs text-gray-600">
                    {company.hotsite.formasPagamento.slice(0, 3).join(', ')}
                    {company.hotsite.formasPagamento.length > 3 && '...'}
                  </p>
                </div>
              )}

              {/* Botão ver detalhes */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-[#0073e6] font-semibold text-sm group-hover:underline inline-flex items-center">
                  Ver detalhes completos
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CompanyListItem;

