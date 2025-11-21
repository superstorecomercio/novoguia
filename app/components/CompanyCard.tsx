'use client';

import Link from 'next/link';
import { type Company } from '../types';
import PlanoBadge from './PlanoBadge';
import { getImageUrl } from '../../lib/storage/getImageUrl';

interface CompanyCardProps {
  company: Company;
}

const CompanyCard = ({ company }: CompanyCardProps) => {
  return (
    <Link
      href={`/empresas/${company.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-gray-200"
    >
      {/* Image/Logo - Estilo Airbnb */}
      <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {(() => {
          const logoUrl = company.hotsite?.logoUrl ? getImageUrl(company.hotsite.logoUrl) : null;
          const fotoUrl = company.hotsite?.foto1Url ? getImageUrl(company.hotsite.foto1Url) : null;
          
          if (logoUrl) {
            return (
              <div className="w-full h-full flex items-center justify-center bg-white p-6">
                <img
                  src={logoUrl}
                  alt={`Logo ${company.name}`}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.parentElement?.querySelector('.fallback');
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              </div>
            );
          }
          
          if (fotoUrl) {
            return (
              <img
                src={fotoUrl}
                alt={company.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.parentElement?.querySelector('.fallback');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
            );
          }
          
          return null;
        })()}
        {/* Fallback quando não tem imagem ou imagem não carrega */}
        <div className={`fallback absolute inset-0 flex items-center justify-center ${company.hotsite?.logoUrl || company.hotsite?.foto1Url ? 'hidden' : ''}`}>
          <div className="text-6xl opacity-20">🚚</div>
        </div>
        {company.planoPublicidade && (
          <div className="absolute top-4 left-4">
            <PlanoBadge plano={company.planoPublicidade} />
          </div>
        )}
        {company.featured && !company.planoPublicidade && (
          <div className="absolute top-4 left-4">
            <span className="inline-block bg-gradient-to-r from-[#FF385C] to-[#E61E4D] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
              ⭐ Destaque
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#FF385C] transition-colors line-clamp-1">
          {company.name}
        </h3>
        
        {company.cidadeName && (
          <p className="text-gray-600 text-sm mb-4 flex items-center">
            <span className="mr-1">📍</span>
            {company.cidadeName}
            {company.estado && `, ${company.estado}`}
          </p>
        )}

        {company.description && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-2 leading-relaxed">
            {company.description}
          </p>
        )}

        {company.serviceTypes && company.serviceTypes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {company.serviceTypes.slice(0, 3).map((service, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors"
              >
                {service === 'mudanca' && 'Mudança'}
                {service === 'carreto' && 'Carreto'}
                {service === 'guardamoveis' && 'Guarda-Móveis'}
                {service === 'transportadora' && 'Transportadora'}
                {service === 'montador' && 'Montador'}
              </span>
            ))}
            {company.serviceTypes.length > 3 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                +{company.serviceTypes.length - 3}
              </span>
            )}
          </div>
        )}

        {company.phones.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center text-[#FF385C] font-semibold text-sm">
              <span className="mr-2">📞</span>
              {company.phones[0]}
            </div>
            <span className="text-gray-400 group-hover:text-[#FF385C] transition-colors">
              Ver detalhes →
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default CompanyCard;
