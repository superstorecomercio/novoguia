'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from './ImageUpload';
import ArrayInput from './ArrayInput';

interface HotsiteEditFormProps {
  hotsite: any;
  cidades: Array<{ cidade: string; estado: string }>;
}

export default function HotsiteEditForm({ hotsite, cidades }: HotsiteEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [hotsiteData, setHotsiteData] = useState({
    nome_exibicao: hotsite.nome_exibicao || '',
    descricao: hotsite.descricao || '',
    endereco: hotsite.endereco || '',
    cidade: hotsite.cidade || '',
    estado: hotsite.estado || '',
    tipoempresa: hotsite.tipoempresa || 'Empresa de Mudança',
    telefone1: hotsite.telefone1 || '',
    telefone2: hotsite.telefone2 || '',
    verificado: hotsite.verificado || false,
    logo_url: hotsite.logo_url || '',
    foto1_url: hotsite.foto1_url || '',
    foto2_url: hotsite.foto2_url || '',
    foto3_url: hotsite.foto3_url || '',
    servicos: hotsite.servicos || [],
    descontos: hotsite.descontos || [],
    formas_pagamento: hotsite.formas_pagamento || [],
    highlights: hotsite.highlights || [],
  });

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('📤 Enviando atualização do hotsite:', hotsiteData);

      const response = await fetch(`/api/admin/hotsites/${hotsite.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hotsiteData),
      });

      const result = await response.json();
      console.log('📥 Resposta da API:', { status: response.status, result });

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar hotsite');
      }

      setSuccess(true);
      alert('✅ Hotsite salvo com sucesso!');
      router.refresh();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao salvar hotsite';
      console.error('❌ Erro ao salvar hotsite:', errorMsg);
      setError(errorMsg);
      alert('❌ ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleArrayChange = (field: string, values: string[]) => {
    setHotsiteData((prev) => ({
      ...prev,
      [field]: values,
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Informações do Hotsite</h2>
      
      {/* Mensagens de Erro/Sucesso */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">Erro ao salvar</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          <p className="font-semibold">✅ Hotsite salvo com sucesso!</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome de Exibição
          </label>
          <input
            type="text"
            value={hotsiteData.nome_exibicao}
            onChange={(e) => setHotsiteData({ ...hotsiteData, nome_exibicao: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cidade
          </label>
          <input
            type="text"
            value={hotsiteData.cidade}
            onChange={(e) => setHotsiteData({ ...hotsiteData, cidade: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
            list="cidades-list"
          />
          <datalist id="cidades-list">
            {cidades.map((c, i) => (
              <option key={i} value={`${c.cidade}-${c.estado}`} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <input
            type="text"
            value={hotsiteData.estado}
            onChange={(e) => setHotsiteData({ ...hotsiteData, estado: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
            maxLength={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Empresa
          </label>
          <select
            value={hotsiteData.tipoempresa}
            onChange={(e) => setHotsiteData({ ...hotsiteData, tipoempresa: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
          >
            <option value="Empresa de Mudança">Empresa de Mudança</option>
            <option value="Carretos">Carretos</option>
            <option value="Guarda-Móveis">Guarda-Móveis</option>
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hotsiteData.verificado}
              onChange={(e) => setHotsiteData({ ...hotsiteData, verificado: e.target.checked })}
              className="w-4 h-4 text-[#0073e6] border-gray-300 rounded focus:ring-[#0073e6]"
            />
            <span className="text-sm font-medium text-gray-700">
              Empresa Verificada
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Marque esta opção para exibir o badge "Verificada" no site
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Endereço
          </label>
          <input
            type="text"
            value={hotsiteData.endereco}
            onChange={(e) => setHotsiteData({ ...hotsiteData, endereco: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone 1
          </label>
          <input
            type="tel"
            value={hotsiteData.telefone1}
            onChange={(e) => setHotsiteData({ ...hotsiteData, telefone1: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
            placeholder="(11) 98765-4321"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone 2
          </label>
          <input
            type="tel"
            value={hotsiteData.telefone2}
            onChange={(e) => setHotsiteData({ ...hotsiteData, telefone2: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
            placeholder="(11) 3456-7890"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            value={hotsiteData.descricao}
            onChange={(e) => setHotsiteData({ ...hotsiteData, descricao: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
          />
        </div>

        <div className="md:col-span-2">
          <ImageUpload
            label="Logo"
            currentUrl={hotsiteData.logo_url}
            onUploadComplete={(url) => setHotsiteData({ ...hotsiteData, logo_url: url })}
            folder={`hotsites/${hotsite.id}`}
          />
        </div>

        <div className="md:col-span-2">
          <ImageUpload
            label="Foto 1"
            currentUrl={hotsiteData.foto1_url}
            onUploadComplete={(url) => setHotsiteData({ ...hotsiteData, foto1_url: url })}
            folder={`hotsites/${hotsite.id}`}
          />
        </div>

        <div className="md:col-span-2">
          <ImageUpload
            label="Foto 2"
            currentUrl={hotsiteData.foto2_url}
            onUploadComplete={(url) => setHotsiteData({ ...hotsiteData, foto2_url: url })}
            folder={`hotsites/${hotsite.id}`}
          />
        </div>

        <div className="md:col-span-2">
          <ImageUpload
            label="Foto 3"
            currentUrl={hotsiteData.foto3_url}
            onUploadComplete={(url) => setHotsiteData({ ...hotsiteData, foto3_url: url })}
            folder={`hotsites/${hotsite.id}`}
          />
        </div>
      </div>

      {/* Arrays dinâmicos usando componente reutilizável */}
      <div className="space-y-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Detalhes do Hotsite</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ArrayInput
            label="Serviços"
            values={hotsiteData.servicos}
            onChange={(values) => handleArrayChange('servicos', values)}
            placeholder="Ex: Mudanças residenciais"
            helpText="Adicione os serviços oferecidos"
          />

          <ArrayInput
            label="Descontos"
            values={hotsiteData.descontos}
            onChange={(values) => handleArrayChange('descontos', values)}
            placeholder="Ex: 10% na primeira mudança"
            helpText="Adicione promoções e descontos"
          />

          <ArrayInput
            label="Formas de Pagamento"
            values={hotsiteData.formas_pagamento}
            onChange={(values) => handleArrayChange('formas_pagamento', values)}
            placeholder="Ex: Dinheiro, PIX, Cartão"
            helpText="Adicione as formas de pagamento aceitas"
          />

          <ArrayInput
            label="Destaques / Diferenciais"
            values={hotsiteData.highlights}
            onChange={(values) => handleArrayChange('highlights', values)}
            placeholder="Ex: Mais de 20 anos de experiência"
            helpText="Adicione os diferenciais da empresa"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-[#0073e6] text-white rounded-lg hover:bg-[#005bb5] transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar Hotsite'}
        </button>
      </div>
    </div>
  );
}

