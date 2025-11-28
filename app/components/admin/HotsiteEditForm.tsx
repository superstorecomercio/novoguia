'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
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
  const [gerandoDescricao, setGerandoDescricao] = useState(false);
  const [gerandoLogo, setGerandoLogo] = useState(false);

  // Formatação de telefone brasileiro
  const formatPhone = (phone: string): string => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Validar telefone brasileiro (10 ou 11 dígitos)
  const validatePhone = (phone: string): boolean => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length === 10 || numbers.length === 11;
  };

  // Form state
  const [hotsiteData, setHotsiteData] = useState({
    nome_exibicao: hotsite.nome_exibicao || '',
    email: hotsite.email || '',
    descricao: hotsite.descricao || '',
    endereco: hotsite.endereco || '',
    cidade: hotsite.cidade || '',
    estado: hotsite.estado || '',
    tipoempresa: hotsite.tipoempresa || 'Empresa de Mudança',
    telefone1: hotsite.telefone1 || '',
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

  // Inicializar telefone formatado (pode vir com ou sem formatação do banco)
  const initialPhone = hotsite.telefone1 || '';
  const initialPhoneNumbers = initialPhone.replace(/\D/g, '');
  const [phoneFormatted, setPhoneFormatted] = useState(formatPhone(initialPhoneNumbers));
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numbers = inputValue.replace(/\D/g, '');
    
    // Limitar a 11 dígitos
    if (numbers.length <= 11) {
      const formatted = formatPhone(numbers);
      setPhoneFormatted(formatted);
      setHotsiteData({ ...hotsiteData, telefone1: numbers });
      setPhoneError(null);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setPhoneError(null);

    // Validar telefone
    if (hotsiteData.telefone1 && !validatePhone(hotsiteData.telefone1)) {
      setPhoneError('Telefone inválido. Use o formato (11) 98765-4321 ou (11) 3456-7890');
      setLoading(false);
      return;
    }

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

  const handleGerarDescricao = async () => {
    if (!hotsiteData.nome_exibicao || hotsiteData.nome_exibicao.trim() === '') {
      alert('Por favor, preencha o nome de exibição antes de gerar a descrição');
      return;
    }

    setGerandoDescricao(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/hotsites/gerar-descricao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_exibicao: hotsiteData.nome_exibicao,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar descrição');
      }

      // Preencher o campo descrição com a descrição gerada
      setHotsiteData(prev => ({
        ...prev,
        descricao: data.descricao || ''
      }));

      console.log('✅ Descrição gerada com sucesso!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao gerar descrição';
      console.error('❌ Erro ao gerar descrição:', errorMsg);
      setError(errorMsg);
      alert(`Erro ao gerar descrição: ${errorMsg}`);
    } finally {
      setGerandoDescricao(false);
    }
  };

  const handleGerarLogo = async () => {
    if (!hotsiteData.nome_exibicao || hotsiteData.nome_exibicao.trim() === '') {
      alert('Por favor, preencha o nome de exibição antes de gerar o logo');
      return;
    }

    setGerandoLogo(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/hotsites/gerar-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_exibicao: hotsiteData.nome_exibicao,
          tipoempresa: hotsiteData.tipoempresa || 'Empresa de Mudança',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar logo');
      }

      // Preencher o campo logo_url com a URL do logo gerado
      setHotsiteData(prev => ({
        ...prev,
        logo_url: data.url || ''
      }));

      console.log('✅ Logo gerado com sucesso!', data.url);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao gerar logo';
      console.error('❌ Erro ao gerar logo:', errorMsg);
      setError(errorMsg);
      alert(`Erro ao gerar logo: ${errorMsg}`);
    } finally {
      setGerandoLogo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com título e botão de salvar */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/admin/hotsites"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Editar Hotsite
              </h1>
            </div>
            <div className="ml-8">
              <p className="text-lg font-medium text-gray-900">
                {hotsite.nome_exibicao || 'Sem nome'}
              </p>
              {hotsite.cidade && hotsite.estado && (
                <p className="text-sm text-gray-600">
                  {hotsite.cidade} - {hotsite.estado}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/hotsites"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-[#0073e6] text-white rounded-lg hover:bg-[#005bb5] transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Salvando...' : 'Salvar Hotsite'}
            </button>
          </div>
        </div>
      </div>

      {/* Mensagens de Erro/Sucesso */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-semibold">Erro ao salvar</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <p className="font-semibold">✅ Hotsite salvo com sucesso!</p>
        </div>
      )}

      {/* Formulário Principal */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">Informações Básicas</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
            Email *
          </label>
          <input
            type="email"
            value={hotsiteData.email}
            onChange={(e) => setHotsiteData({ ...hotsiteData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
            placeholder="email@empresa.com.br"
          />
          <p className="text-xs text-gray-500 mt-1">
            Email para receber orçamentos e notificações
          </p>
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

          <div className="lg:col-span-2">
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
              WhatsApp *
            </label>
            <input
              type="tel"
              value={phoneFormatted}
              onChange={handlePhoneChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] ${
                phoneError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300'
              }`}
              placeholder="(11) 98765-4321"
              maxLength={15}
            />
            {phoneError && (
              <p className="text-xs text-red-600 mt-1">{phoneError}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Telefone/WhatsApp da empresa (10 ou 11 dígitos)
            </p>
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Descrição
              </label>
              <button
                type="button"
                onClick={handleGerarDescricao}
                disabled={gerandoDescricao || !hotsiteData.nome_exibicao}
                className="text-xs px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                title="Gerar descrição sugerida usando IA baseada no nome da empresa"
              >
                {gerandoDescricao ? (
                  <>
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Gerando...
                  </>
                ) : (
                  <>
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Gerar com IA
                  </>
                )}
              </button>
            </div>
            <textarea
              value={hotsiteData.descricao}
              onChange={(e) => setHotsiteData({ ...hotsiteData, descricao: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
            />
            <p className="text-xs text-gray-500 mt-1">
              {hotsiteData.nome_exibicao 
                ? 'Clique em "Gerar com IA" para criar uma descrição sugerida baseada no nome da empresa'
                : 'Preencha o nome de exibição para habilitar a geração automática de descrição'}
            </p>
          </div>
        </div>
      </div>

      {/* Seção de Imagens */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">Imagens</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Logo
              </label>
              <button
                type="button"
                onClick={handleGerarLogo}
                disabled={gerandoLogo || !hotsiteData.nome_exibicao}
                className="text-xs px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                title="Gerar logo usando IA baseado no nome e tipo da empresa"
              >
                {gerandoLogo ? (
                  <>
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Gerando...
                  </>
                ) : (
                  <>
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Gerar Logo com IA
                  </>
                )}
              </button>
            </div>
            <ImageUpload
              label=""
              currentUrl={hotsiteData.logo_url}
              onUploadComplete={(url) => setHotsiteData({ ...hotsiteData, logo_url: url })}
              bucket="empresas-imagens"
              folder={`hotsites/${hotsite.id}`}
            />
            <p className="text-xs text-gray-500 mt-1">
              {hotsiteData.nome_exibicao 
                ? 'Clique em "Gerar Logo com IA" para criar um logo profissional baseado no nome e tipo da empresa (133x100px, otimizado para web)'
                : 'Preencha o nome de exibição para habilitar a geração automática de logo'}
            </p>
          </div>

          <ImageUpload
            label="Foto 1"
            currentUrl={hotsiteData.foto1_url}
            onUploadComplete={(url) => setHotsiteData({ ...hotsiteData, foto1_url: url })}
            bucket="empresas-imagens"
            folder={`hotsites/${hotsite.id}`}
          />

          <ImageUpload
            label="Foto 2"
            currentUrl={hotsiteData.foto2_url}
            onUploadComplete={(url) => setHotsiteData({ ...hotsiteData, foto2_url: url })}
            bucket="empresas-imagens"
            folder={`hotsites/${hotsite.id}`}
          />

          <ImageUpload
            label="Foto 3"
            currentUrl={hotsiteData.foto3_url}
            onUploadComplete={(url) => setHotsiteData({ ...hotsiteData, foto3_url: url })}
            bucket="empresas-imagens"
            folder={`hotsites/${hotsite.id}`}
          />
        </div>
      </div>

      {/* Arrays dinâmicos usando componente reutilizável */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">Detalhes do Hotsite</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      {/* Botão de salvar no rodapé (para mobile) */}
      <div className="lg:hidden bg-white rounded-lg shadow-md p-6 sticky bottom-0 z-10 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full px-6 py-3 bg-[#0073e6] text-white rounded-lg hover:bg-[#005bb5] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Salvando...' : 'Salvar Hotsite'}
        </button>
      </div>
    </div>
  );
}

