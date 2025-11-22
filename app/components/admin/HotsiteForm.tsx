'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from './ImageUpload';
import ArrayInput from './ArrayInput';
import { supabase } from '@/lib/supabaseClient';

interface Cidade {
  id: string;
  nome: string;
  estado: string;
  slug: string;
}

export default function HotsiteForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(true);

  const [formData, setFormData] = useState({
    nome_exibicao: '',
    descricao: '',
    endereco: '',
    cidade_id: '',
    tipoempresa: 'Empresa de Mudança',
    telefone1: '',
    telefone2: '',
    logo_url: '',
    foto1_url: '',
    foto2_url: '',
    foto3_url: '',
    servicos: [] as string[],
    descontos: [] as string[],
    formas_pagamento: [] as string[],
    highlights: [] as string[],
  });

  // Buscar cidades ao carregar o componente
  useEffect(() => {
    async function fetchCidades() {
      try {
        const { data, error } = await supabase
          .from('cidades')
          .select('id, nome, estado, slug')
          .order('nome', { ascending: true });

        if (error) throw error;
        setCidades(data || []);
      } catch (err) {
        console.error('Erro ao buscar cidades:', err);
        setError('Erro ao carregar lista de cidades');
      } finally {
        setLoadingCidades(false);
      }
    }

    fetchCidades();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Converter arrays vazios para null
      const payload = {
        ...formData,
        servicos: formData.servicos.length > 0 ? formData.servicos : null,
        descontos: formData.descontos.length > 0 ? formData.descontos : null,
        formas_pagamento: formData.formas_pagamento.length > 0 ? formData.formas_pagamento : null,
        highlights: formData.highlights.length > 0 ? formData.highlights : null,
      };

      console.log('📤 Enviando hotsite:', payload);

      const response = await fetch('/api/admin/hotsites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('📥 Resposta da API:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar hotsite');
      }

      console.log('✅ Hotsite criado com sucesso! ID:', data.data?.id);

      // Mostrar mensagem de sucesso
      alert(`✅ Hotsite "${formData.nome_exibicao}" criado com sucesso!\n\nID: ${data.data?.id}`);

      // Redirecionar com hard reload para limpar cache
      window.location.href = '/admin/hotsites';
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao criar hotsite';
      console.error('❌ Erro ao criar hotsite:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Informações Básicas */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Informações Básicas</h2>

        <div>
          <label htmlFor="nome_exibicao" className="block text-sm font-medium text-gray-700 mb-1">
            Nome de Exibição *
          </label>
          <input
            type="text"
            id="nome_exibicao"
            name="nome_exibicao"
            required
            value={formData.nome_exibicao}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Mudanças São Paulo"
          />
        </div>

        <div>
          <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            id="descricao"
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descrição do hotsite"
          />
        </div>

        <div>
          <label htmlFor="tipoempresa" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Empresa *
          </label>
          <select
            id="tipoempresa"
            name="tipoempresa"
            required
            value={formData.tipoempresa}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Empresa de Mudança">Empresa de Mudança</option>
            <option value="Carretos">Carretos</option>
            <option value="Guarda-Móveis">Guarda-Móveis</option>
          </select>
        </div>
      </div>

      {/* Localização */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Localização</h2>

        <div>
          <label htmlFor="cidade_id" className="block text-sm font-medium text-gray-700 mb-1">
            Cidade *
          </label>
          {loadingCidades ? (
            <p className="text-sm text-gray-500">Carregando cidades...</p>
          ) : (
            <select
              id="cidade_id"
              name="cidade_id"
              required
              value={formData.cidade_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma cidade</option>
              {cidades.map((cidade) => (
                <option key={cidade.id} value={cidade.id}>
                  {cidade.nome} - {cidade.estado}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 mb-1">
            Endereço
          </label>
          <input
            type="text"
            id="endereco"
            name="endereco"
            value={formData.endereco}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Rua, número, bairro"
          />
        </div>
      </div>

      {/* Contato */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Contato</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="telefone1" className="block text-sm font-medium text-gray-700 mb-1">
              Telefone 1
            </label>
            <input
              type="tel"
              id="telefone1"
              name="telefone1"
              value={formData.telefone1}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(11) 98765-4321"
            />
          </div>

          <div>
            <label htmlFor="telefone2" className="block text-sm font-medium text-gray-700 mb-1">
              Telefone 2
            </label>
            <input
              type="tel"
              id="telefone2"
              name="telefone2"
              value={formData.telefone2}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(11) 3456-7890"
            />
          </div>
        </div>
      </div>

      {/* Imagens */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Imagens</h2>

        <ImageUpload
          label="Logo"
          currentUrl={formData.logo_url}
          onUploadComplete={(url) => setFormData(prev => ({ ...prev, logo_url: url }))}
          bucket="empresas-imagens"
          folder="logos"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ImageUpload
            label="Foto 1"
            currentUrl={formData.foto1_url}
            onUploadComplete={(url) => setFormData(prev => ({ ...prev, foto1_url: url }))}
            bucket="empresas-imagens"
            folder="fotos"
          />

          <ImageUpload
            label="Foto 2"
            currentUrl={formData.foto2_url}
            onUploadComplete={(url) => setFormData(prev => ({ ...prev, foto2_url: url }))}
            bucket="empresas-imagens"
            folder="fotos"
          />

          <ImageUpload
            label="Foto 3"
            currentUrl={formData.foto3_url}
            onUploadComplete={(url) => setFormData(prev => ({ ...prev, foto3_url: url }))}
            bucket="empresas-imagens"
            folder="fotos"
          />
        </div>
      </div>

      {/* Detalhes Adicionais */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Detalhes Adicionais</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ArrayInput
            label="Serviços"
            values={formData.servicos}
            onChange={(values) => setFormData(prev => ({ ...prev, servicos: values }))}
            placeholder="Ex: Mudanças residenciais"
            helpText="Adicione os serviços oferecidos"
          />

          <ArrayInput
            label="Descontos"
            values={formData.descontos}
            onChange={(values) => setFormData(prev => ({ ...prev, descontos: values }))}
            placeholder="Ex: 10% na primeira mudança"
            helpText="Adicione promoções e descontos"
          />

          <ArrayInput
            label="Formas de Pagamento"
            values={formData.formas_pagamento}
            onChange={(values) => setFormData(prev => ({ ...prev, formas_pagamento: values }))}
            placeholder="Ex: Dinheiro, PIX, Cartão"
            helpText="Adicione as formas de pagamento aceitas"
          />

          <ArrayInput
            label="Destaques"
            values={formData.highlights}
            onChange={(values) => setFormData(prev => ({ ...prev, highlights: values }))}
            placeholder="Ex: Mais de 20 anos de experiência"
            helpText="Adicione os diferenciais da empresa"
          />
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Criando...' : 'Criar Hotsite'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/hotsites')}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
