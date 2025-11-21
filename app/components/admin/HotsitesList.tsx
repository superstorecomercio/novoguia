'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface Hotsite {
  id: string;
  nome_exibicao?: string;
  descricao?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  logo_url?: string;
  foto1_url?: string;
}

interface HotsitesListProps {
  hotsites: Hotsite[];
}

export default function HotsitesList({ hotsites: initialHotsites }: HotsitesListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const hotsitesFiltrados = useMemo(() => {
    if (!searchTerm.trim()) {
      return initialHotsites;
    }

    const searchLower = searchTerm.toLowerCase();

    return initialHotsites.filter((hotsite) => {
      const nome = (hotsite.nome_exibicao || '').toLowerCase();
      return nome.includes(searchLower);
    });
  }, [initialHotsites, searchTerm]);

  return (
    <div>
      {/* Busca */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar por nome
          </label>
          <input
            type="text"
            placeholder="Digite o nome do hotsite..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
            autoComplete="off"
          />
          <p className="text-xs text-gray-500 mt-1">
            A busca ignora maiúsculas e minúsculas
          </p>
        </div>

        <div className="text-sm text-gray-600">
          Mostrando <span className="font-semibold">{hotsitesFiltrados.length}</span> de{' '}
          <span className="font-semibold">{initialHotsites.length}</span> hotsites
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hotsite
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Localização
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Imagens
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {hotsitesFiltrados.length > 0 ? (
              hotsitesFiltrados.map((hotsite) => (
                <tr key={hotsite.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {hotsite.nome_exibicao || 'Sem nome'}
                    </div>
                    {hotsite.descricao && (
                      <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {hotsite.descricao.substring(0, 100)}
                        {hotsite.descricao.length > 100 && '...'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {hotsite.cidade || '-'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {hotsite.estado || '-'}
                    </div>
                    {hotsite.endereco && (
                      <div className="text-xs text-gray-400 mt-1">
                        {hotsite.endereco.substring(0, 40)}
                        {hotsite.endereco.length > 40 && '...'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {hotsite.logo_url && (
                        <span className="text-xs text-green-600">✓ Logo</span>
                      )}
                      {hotsite.foto1_url && (
                        <span className="text-xs text-green-600">✓ Foto1</span>
                      )}
                      {!hotsite.logo_url && !hotsite.foto1_url && (
                        <span className="text-xs text-gray-400">Sem imagens</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/hotsites/${hotsite.id}`}
                      className="text-[#0073e6] hover:text-[#005bb5]"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="text-gray-500">
                    {searchTerm ? (
                      <>
                        <p className="font-medium">Nenhum hotsite encontrado</p>
                        <p className="text-sm mt-1">
                          Tente ajustar sua busca
                        </p>
                      </>
                    ) : (
                      <p>Nenhum hotsite cadastrado</p>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
