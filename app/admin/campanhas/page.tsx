'use client';

import { useState, useEffect } from 'react';
import CampanhasList from '@/app/components/admin/CampanhasList';

export default function CampanhasPage() {
  const [filteredCampanhas, setFilteredCampanhas] = useState<any[]>([]);
  const [campanhasFormatadas, setCampanhasFormatadas] = useState<any[]>([]);
  const [hotsitesDisponiveis, setHotsitesDisponiveis] = useState<any[]>([]);
  const [planosDisponiveis, setPlanosDisponiveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando campanhas...');
      const response = await fetch('/api/admin/campanhas/list');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao carregar campanhas');
      }
      
      const data = await response.json();
      console.log('✅ Dados carregados:', {
        campanhas: data.campanhas?.length || 0,
        hotsites: data.hotsites?.length || 0,
        planos: data.planos?.length || 0,
      });

      if (!data.campanhas) {
        console.error('❌ Dados inválidos: campanhas não encontradas');
        return;
      }

      setCampanhasFormatadas(data.campanhas || []);
      setFilteredCampanhas(data.campanhas || []); // Inicialmente, todas as campanhas estão filtradas
      setHotsitesDisponiveis(data.hotsites || []);
      setPlanosDisponiveis(data.planos || []);
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados:', error);
      alert(`Erro ao carregar campanhas: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calcular totais baseados nas campanhas filtradas
  const total = filteredCampanhas.length;
  const ativas = filteredCampanhas.filter((c) => c.ativo).length;
  const inativas = filteredCampanhas.filter((c) => !c.ativo).length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-gray-600">Carregando campanhas...</p>
        </div>
      </div>
    );
  }

  // Verificar se há erro (campanhas vazias após carregar)
  if (!loading && campanhasFormatadas.length === 0 && filteredCampanhas.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p className="font-semibold">Nenhuma campanha encontrada</p>
          <p className="text-sm mt-1">Verifique se há campanhas cadastradas no sistema.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Campanhas</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Gerencie as campanhas ativas dos hotsites
          </p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm mb-1">Total de Campanhas</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {total}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
              📢
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm mb-1">Campanhas Ativas</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{ativas}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
              ✅
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm mb-1">Campanhas Inativas</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{inativas}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
              ❌
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Campanhas */}
      <CampanhasList 
        campanhas={campanhasFormatadas} 
        hotsites={hotsitesDisponiveis || []}
        planos={planosDisponiveis || []}
        onFilteredCampanhasChange={setFilteredCampanhas}
        onReload={loadData}
      />
    </div>
  );
}
