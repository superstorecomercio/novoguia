'use client';

import { useState } from 'react';

interface Hotsite {
  id: string;
  nome_exibicao?: string;
  cidade?: string;
  estado?: string;
}

interface RawDataTableProps {
  hotsites: Hotsite[];
}

export default function RawDataTable({ hotsites }: RawDataTableProps) {
  const [filter, setFilter] = useState('');

  const hotsitesFiltrados = hotsites.filter((h) => {
    if (!filter) return true;
    const nome = h.nome_exibicao || '';
    return nome.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filtrar por nome..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg w-full max-w-md"
        />
        <p className="text-sm text-gray-600 mt-2">
          Mostrando {hotsitesFiltrados.length} de {hotsites.length} hotsites
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">ID</th>
              <th className="border px-2 py-1">Nome (EXATO)</th>
              <th className="border px-2 py-1">Cidade</th>
              <th className="border px-2 py-1">Estado</th>
              <th className="border px-2 py-1">Length</th>
              <th className="border px-2 py-1">Bytes</th>
            </tr>
          </thead>
          <tbody>
            {hotsitesFiltrados.map((h) => (
              <tr key={h.id} className="hotsite-row hover:bg-yellow-50">
                <td className="border px-2 py-1 font-mono text-xs">{h.id}</td>
                <td className="border px-2 py-1">
                  <div className="font-bold">{h.nome_exibicao}</div>
                  <div className="text-xs text-gray-500 font-mono">
                    "{h.nome_exibicao}"
                  </div>
                </td>
                <td className="border px-2 py-1">{h.cidade}</td>
                <td className="border px-2 py-1">{h.estado}</td>
                <td className="border px-2 py-1 text-center">{h.nome_exibicao?.length || 0}</td>
                <td className="border px-2 py-1 font-mono text-xs">
                  {h.nome_exibicao ? Array.from(h.nome_exibicao).map((c: string) => c.charCodeAt(0)).join(',') : 'null'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
