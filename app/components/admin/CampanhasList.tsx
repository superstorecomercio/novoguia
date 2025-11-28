'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Campanha {
  id: string;
  empresa_id: string;
  hotsite_id?: string;
  empresa_nome: string;
  plano_id?: string | null;
  plano_nome: string;
  plano_ordem: number;
  cidade_nome?: string;
  tipoempresa?: string;
  email?: string;
  telefone1?: string;
  data_inicio: string;
  data_fim?: string;
  valor: number;
  ativo: boolean;
  participa_cotacao?: boolean;
  limite_orcamentos_mes?: number;
  envia_email_ativacao?: boolean;
  created_at?: string;
}

interface Hotsite {
  id: string;
  nome_exibicao: string;
  email?: string;
  telefone1?: string;
  tipoempresa?: string;
  cidade?: {
    nome: string;
    estado: string;
  } | null;
}

interface Plano {
  id: string;
  nome: string;
  ordem: number;
  preco?: number;
}

interface CampanhasListProps {
  campanhas: Campanha[];
  hotsites: Hotsite[];
  planos: Plano[];
  onFilteredCampanhasChange?: (filtered: Campanha[]) => void;
  onReload?: () => void; // Callback para recarregar dados do componente pai
}

export default function CampanhasList({ campanhas: initialCampanhas, hotsites, planos, onFilteredCampanhasChange, onReload }: CampanhasListProps) {
  const router = useRouter();
  const [campanhas, setCampanhas] = useState<Campanha[]>(initialCampanhas);

  // Log para debug - verificar se hotsites têm os dados necessários
  useEffect(() => {
    if (hotsites.length > 0) {
      const primeiroHotsite = hotsites[0];
      console.log('📋 [CampanhasList] Hotsites carregados:', {
        total: hotsites.length,
        primeiroHotsite: {
          id: primeiroHotsite.id,
          nome: primeiroHotsite.nome_exibicao,
          temEmail: !!primeiroHotsite.email,
          temTelefone1: !!primeiroHotsite.telefone1,
          temTipoempresa: !!primeiroHotsite.tipoempresa,
          email: primeiroHotsite.email,
          telefone1: primeiroHotsite.telefone1,
          tipoempresa: primeiroHotsite.tipoempresa
        }
      });
    }
  }, [hotsites]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativas' | 'inativas'>('todos');
  const [filterPlano, setFilterPlano] = useState<string>('todos');
  const [filterCidade, setFilterCidade] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'cidade' | 'empresa' | 'plano' | 'data'>('cidade');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [hotsiteSearchTerm, setHotsiteSearchTerm] = useState('');
  const [telefone1Formatted, setTelefone1Formatted] = useState('');

  // Formatação de telefone brasileiro
  const formatPhone = (phone: string): string => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Atualizar estado quando initialCampanhas mudar (vindo do componente pai)
  useEffect(() => {
    setCampanhas(initialCampanhas);
  }, [initialCampanhas]);
  const [newCampanhaData, setNewCampanhaData] = useState({
    hotsite_id: '',
    plano_id: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    valor_total: 0, // Será convertido para valor_mensal no backend
    participa_cotacao: true,
    envia_email_ativacao: true, // Padrão: Sim
    email: '',
    telefone1: '',
    tipoempresa: 'Empresa de Mudança',
      // limite_orcamentos_mes removido do formulário (não usado por enquanto)
  });
  const [newTelefone1Formatted, setNewTelefone1Formatted] = useState('');

  // Extrair planos únicos
  const planosUnicos = useMemo(() => {
    const planos = new Set(initialCampanhas.map(c => c.plano_nome));
    return Array.from(planos).sort();
  }, [initialCampanhas]);

  // Filtrar hotsites pela busca
  const hotsitesFiltrados = useMemo(() => {
    if (!hotsiteSearchTerm.trim()) {
      return hotsites.slice(0, 50); // Mostrar apenas os primeiros 50 se não houver busca
    }
    
    const searchLower = hotsiteSearchTerm.toLowerCase();
    return hotsites.filter((hotsite) => {
      const nome = (hotsite.nome_exibicao || '').toLowerCase();
      const cidade = (hotsite.cidade?.nome || '').toLowerCase();
      const estado = (hotsite.cidade?.estado || '').toLowerCase();
      return nome.includes(searchLower) || cidade.includes(searchLower) || estado.includes(searchLower);
    }).slice(0, 100); // Limitar a 100 resultados
  }, [hotsites, hotsiteSearchTerm]);

  // Extrair cidades únicas
  const cidadesUnicas = useMemo(() => {
    const cidades = new Set(
      initialCampanhas
        .map(c => c.cidade_nome)
        .filter((cidade): cidade is string => cidade !== undefined && cidade !== null && cidade !== '')
    );
    return Array.from(cidades).sort();
  }, [initialCampanhas]);

  // Filtrar e ordenar campanhas
  const campanhasFiltradas = useMemo(() => {
    let filtered = initialCampanhas;

    // Filtro por status
    if (filterStatus === 'ativas') {
      filtered = filtered.filter((c) => c.ativo);
    } else if (filterStatus === 'inativas') {
      filtered = filtered.filter((c) => !c.ativo);
    }

    // Filtro por plano
    if (filterPlano !== 'todos') {
      filtered = filtered.filter((c) => c.plano_nome === filterPlano);
    }

    // Filtro por cidade
    if (filterCidade !== 'todos') {
      filtered = filtered.filter((c) => c.cidade_nome === filterCidade);
    }

    // Filtro por busca (empresa ou cidade)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((campanha) => {
        const empresa = (campanha.empresa_nome || '').toLowerCase();
        const cidade = (campanha.cidade_nome || '').toLowerCase();
        return empresa.includes(term) || cidade.includes(term);
      });
    }

    // Ordenação
    filtered = [...filtered].sort((a, b) => {
      // Primeiro, ordenar por status: ativas primeiro, inativas no final
      if (a.ativo !== b.ativo) {
        return a.ativo ? -1 : 1; // Ativas primeiro (retorna -1), inativas depois (retorna 1)
      }

      // Se ambas têm o mesmo status, ordenar pelo critério selecionado
      let compareA: any;
      let compareB: any;

      switch (sortBy) {
        case 'cidade':
          compareA = (a.cidade_nome || 'ZZZ').toLowerCase();
          compareB = (b.cidade_nome || 'ZZZ').toLowerCase();
          break;
        case 'empresa':
          compareA = (a.empresa_nome || '').toLowerCase();
          compareB = (b.empresa_nome || '').toLowerCase();
          break;
        case 'plano':
          compareA = a.plano_ordem;
          compareB = b.plano_ordem;
          break;
        case 'data':
          compareA = new Date(a.data_inicio).getTime();
          compareB = new Date(b.data_inicio).getTime();
          break;
        default:
          return 0;
      }

      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [initialCampanhas, searchTerm, filterStatus, filterPlano, filterCidade, sortBy, sortOrder]);

  // Notificar componente pai sobre campanhas filtradas
  useEffect(() => {
    console.log('📊 [CampanhasList] Campanhas filtradas:', campanhasFiltradas.length);
    if (onFilteredCampanhasChange) {
      onFilteredCampanhasChange(campanhasFiltradas);
    }
  }, [campanhasFiltradas, onFilteredCampanhasChange]);

  const handleSort = (column: 'cidade' | 'empresa' | 'plano' | 'data') => {
    if (sortBy === column) {
      // Se já está ordenando por essa coluna, inverte a ordem
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Se é uma nova coluna, ordena ascendente
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleEdit = (campanha: Campanha) => {
    setEditingId(campanha.id);
    const telefone1Raw = campanha.telefone1 || '';
    const telefone1Numbers = telefone1Raw.replace(/\D/g, '');
    setEditData({
      hotsite_id: campanha.hotsite_id,
      plano_id: campanha.plano_id || '', // Plano da campanha
      email: campanha.email || '', // Email do hotsite
      telefone1: telefone1Numbers, // Telefone1 do hotsite (apenas números)
      data_fim: normalizeDateForInput(campanha.data_fim), // Normalizar data para evitar problemas de timezone
      valor: campanha.valor,
      // Status (ativo) é alterado apenas pelo botão na lista, não no formulário de edição
      tipoempresa: campanha.tipoempresa || 'Empresa de Mudança',
      participa_cotacao: campanha.participa_cotacao !== false,
      envia_email_ativacao: campanha.envia_email_ativacao || false,
      // limite_orcamentos_mes removido do formulário (não usado por enquanto)
    });
    setTelefone1Formatted(formatPhone(telefone1Numbers));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
    setTelefone1Formatted('');
  };

  const handleSave = async (id: string) => {
    setLoading(id);
    try {
      const response = await fetch(`/api/admin/campanhas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editData,
          limite_orcamentos_mes: null, // Sempre ilimitado por enquanto
          envia_email_ativacao: editData.envia_email_ativacao || false,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar campanha');
      }

      setEditingId(null);
      setEditData({});
      setTelefone1Formatted('');
      
      // Recarregar dados: primeiro tenta callback do pai, senão recarrega diretamente
      if (onReload) {
        onReload();
      } else {
        // Recarregar dados diretamente
        try {
          const reloadResponse = await fetch('/api/admin/campanhas/list');
          if (reloadResponse.ok) {
            const reloadData = await reloadResponse.json();
            if (reloadData.campanhas) {
              setCampanhas(reloadData.campanhas);
            }
          }
        } catch (reloadError) {
          console.error('Erro ao recarregar lista:', reloadError);
        }
      }
      
      // Também fazer refresh do router para garantir
      router.refresh();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar campanha');
    } finally {
      setLoading(null);
    }
  };

  const handleToggleAtivo = async (
    id: string, 
    ativo: boolean, 
    email?: string, 
    telefone1?: string, 
    dataFim?: string,
    participaCotacao?: boolean
  ) => {
    // Se está tentando ativar (ativo atual é false, então vai virar true), validar todos os campos obrigatórios
    // Mas não validar se for campanha de e-mail manual (participa_cotacao = false)
    if (!ativo && participaCotacao !== false) {
      const erros: string[] = [];
      
      if (!email || !isValidEmail(email)) {
        erros.push('Email está vazio ou inválido');
      }
      
      if (!telefone1 || !isValidPhone(telefone1)) {
        erros.push('Telefone 1 está vazio ou inválido');
      }
      
      if (!dataFim || dataFim.trim() === '') {
        erros.push('Data de vencimento não pode estar vazia');
      }
      
      if (erros.length > 0) {
        alert(`❌ Não é possível ativar a campanha:\n\n${erros.map(e => `• ${e}`).join('\n')}\n\nPor favor, edite a campanha e preencha todos os campos obrigatórios.`);
        return;
      }
    }

    setLoading(id);
    try {
      const response = await fetch(`/api/admin/campanhas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !ativo }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      // Recarregar dados após atualizar
      if (onReload) {
        onReload();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status da campanha');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string, empresaNome: string) => {
    if (!confirm(`Tem certeza que deseja excluir a campanha de "${empresaNome}"?`)) {
      return;
    }

    setLoading(id);
    try {
      const response = await fetch(`/api/admin/campanhas/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir campanha');
      }

      alert('✅ Campanha excluída com sucesso!');
      
      // Remover a campanha da lista localmente para atualização imediata
      const campanhasAtualizadas = campanhas.filter(c => c.id !== id);
      setCampanhas(campanhasAtualizadas);
      
      // Se estiver editando a campanha deletada, cancelar edição
      if (editingId === id) {
        setEditingId(null);
        setEditData({});
      }
      
      // Recarregar a página para garantir que os dados estejam sincronizados com o servidor
      window.location.reload();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('❌ Erro ao excluir campanha');
    } finally {
      setLoading(null);
    }
  };

  const handleCreateCampanha = async () => {
    if (!newCampanhaData.hotsite_id || !newCampanhaData.plano_id) {
      alert('Por favor, selecione um hotsite e um plano');
      return;
    }

    if (!newCampanhaData.email || !newCampanhaData.telefone1) {
      alert('Por favor, preencha o email e telefone da empresa');
      return;
    }

    setLoading('creating');
    try {
      const response = await fetch('/api/admin/campanhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCampanhaData,
          limite_orcamentos_mes: null, // Sempre ilimitado por enquanto
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar campanha');
      }

      alert('✅ Campanha criada com sucesso!');
      setShowNewModal(false);
      setHotsiteSearchTerm('');
      setNewCampanhaData({
        hotsite_id: '',
        plano_id: '',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: '',
        valor_total: 0,
        participa_cotacao: true,
        envia_email_ativacao: true,
        email: '',
        telefone1: '',
        tipoempresa: 'Empresa de Mudança',
        // limite_orcamentos_mes removido do formulário (não usado por enquanto)
      });
      setNewTelefone1Formatted('');
      
      // Recarregar dados: primeiro tenta callback do pai, senão recarrega diretamente
      if (onReload) {
        onReload();
      } else {
        // Recarregar dados diretamente
        try {
          const reloadResponse = await fetch('/api/admin/campanhas/list');
          if (reloadResponse.ok) {
            const reloadData = await reloadResponse.json();
            if (reloadData.campanhas) {
              setCampanhas(reloadData.campanhas);
            }
          }
        } catch (reloadError) {
          console.error('Erro ao recarregar lista:', reloadError);
        }
      }
      
      // Também fazer refresh do router para garantir
      router.refresh();
    } catch (error: any) {
      console.error('Erro ao criar campanha:', error);
      alert(`❌ ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  /**
   * Normaliza uma data string do banco para exibição no input type="date"
   * Garante que a data seja tratada como local, não UTC
   * IMPORTANTE: Para strings no formato YYYY-MM-DD, retorna diretamente
   * para evitar conversão de timezone pelo JavaScript
   */
  const normalizeDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    
    const trimmed = dateString.trim();
    
    // Se já está no formato YYYY-MM-DD, retornar diretamente
    // Isso evita que o JavaScript interprete como UTC e converta para local
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    
    // Se não está no formato esperado, tentar parsear
    // Mas usar componentes separados para evitar conversão de timezone
    try {
      // Se a string contém apenas data (sem hora), extrair componentes diretamente
      const dateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        // Validar se os valores são válidos
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        const dayNum = parseInt(day, 10);
        
        if (yearNum >= 1900 && yearNum <= 2100 && monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
          return `${year}-${month}-${day}`;
        }
      }
      
      // Se não conseguiu extrair diretamente, tentar com Date (último recurso)
      const date = new Date(trimmed);
      if (isNaN(date.getTime())) {
        return '';
      }
      
      // Usar métodos locais para evitar conversão de timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    // Para exibição, usar a data normalizada e formatar
    const normalized = normalizeDateForInput(dateString);
    if (!normalized) return '-';
    
    // Converter YYYY-MM-DD para DD/MM/YYYY para exibição
    const [year, month, day] = normalized.split('-');
    return `${day}/${month}/${year}`;
  };

  // Verificar se a data está vencida
  const isDateExpired = (dateString: string | null | undefined): boolean => {
    if (!dateString) return false;
    // Normalizar a data antes de comparar
    const normalizedDate = normalizeDateForInput(dateString);
    if (!normalizedDate) return false;
    
    // Comparar strings no formato YYYY-MM-DD diretamente (evita problemas de timezone)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    return normalizedDate < todayStr;
  };

  const getBadgeColor = (plano: string) => {
    const colors: Record<string, string> = {
      top: 'bg-purple-100 text-purple-800',
      quality: 'bg-blue-100 text-blue-800',
      standard: 'bg-green-100 text-green-800',
      intermediario: 'bg-yellow-100 text-yellow-800',
    };
    return colors[plano.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Validar email
  const isValidEmail = (email: string | undefined | null): boolean => {
    if (!email || email.trim() === '') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Validar telefone brasileiro (deve ter pelo menos 10 dígitos - fixo ou 11 - celular)
  const isValidPhone = (phone: string | undefined | null): boolean => {
    if (!phone || phone.trim() === '') return false;
    const numbers = phone.replace(/\D/g, '');
    // Telefone brasileiro: mínimo 10 dígitos (fixo) ou 11 dígitos (celular com DDD)
    return numbers.length >= 10 && numbers.length <= 11;
  };

  const hasEmailIssue = (campanha: Campanha): boolean => {
    return !isValidEmail(campanha.email);
  };

  // Obter status da campanha para exibição
  const getStatusCampanha = (campanha: Campanha): { label: string; className: string } => {
    if (campanha.ativo) {
      return {
        label: 'Ativa',
        className: 'bg-green-100 text-green-800'
      };
    } else {
      // Verificar se é uma campanha nova (criada hoje) que nunca foi ativada
      // "Aguardando ativação" apenas para campanhas recém-criadas (hoje)
      const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const dataCriacao = campanha.created_at ? new Date(campanha.created_at).toISOString().split('T')[0] : null;
      
      // Se foi criada hoje, é "Aguardando ativação" (campanha nova)
      // Caso contrário, é "Inativa" (foi desativada)
      if (dataCriacao === hoje) {
        return {
          label: 'Aguardando ativação',
          className: 'bg-yellow-100 text-yellow-800'
        };
      }
      
      // Campanha desativada (já existia antes e foi desativada)
      return {
        label: 'Inativa',
        className: 'bg-red-100 text-red-800'
      };
    }
  };

  return (
    <div>
      {/* Botão Nova Campanha */}
      <div className="mb-4 sm:mb-6 flex justify-end">
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <span>➕</span> Nova Campanha
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Busca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Empresa
            </label>
            <input
              type="text"
              placeholder="Digite o nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
            />
          </div>

          {/* Cidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cidade
            </label>
            <select
              value={filterCidade}
              onChange={(e) => setFilterCidade(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
            >
              <option value="todos">Todas as Cidades</option>
              {cidadesUnicas.map((cidade) => (
                <option key={cidade} value={cidade}>
                  {cidade}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
            >
              <option value="todos">Todas</option>
              <option value="ativas">Apenas Ativas</option>
              <option value="inativas">Apenas Inativas</option>
            </select>
          </div>

          {/* Plano */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plano
            </label>
            <select
              value={filterPlano}
              onChange={(e) => setFilterPlano(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
            >
              <option value="todos">Todos os Planos</option>
              {planosUnicos.map((plano) => (
                <option key={plano} value={plano}>
                  {plano}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resultados */}
        <div className="mt-4 text-sm text-gray-600">
          Mostrando <span className="font-semibold">{campanhasFiltradas.length}</span> de{' '}
          <span className="font-semibold">{initialCampanhas.length}</span> campanhas
        </div>
      </div>

      {/* Tabela - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('empresa')}
                    className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    Empresa
                    {sortBy === 'empresa' && (
                      <span className="text-blue-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('cidade')}
                    className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    Cidade
                    {sortBy === 'cidade' && (
                      <span className="text-blue-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('plano')}
                    className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    Plano
                    {sortBy === 'plano' && (
                      <span className="text-blue-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('data')}
                    className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    Período
                    {sortBy === 'data' && (
                      <span className="text-blue-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campanhasFiltradas.length > 0 ? (
                campanhasFiltradas.map((campanha) => (
                  <tr key={campanha.id} className="hover:bg-gray-50">
                    {editingId === campanha.id ? (
                      <>
                        {/* Modo Edição */}
                        <td className="px-6 py-4 whitespace-nowrap" colSpan={8}>
                          <div className="space-y-4">
                            <div className="text-sm font-medium text-gray-900 mb-2">
                              Editando: {campanha.empresa_nome}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Email da Empresa *
                                </label>
                                <input
                                  type="email"
                                  value={editData.email || ''}
                                  onChange={(e) =>
                                    setEditData({ ...editData, email: e.target.value })
                                  }
                                  placeholder="email@empresa.com.br"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Email do hotsite (será atualizado no hotsite)
                                </p>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Telefone 1
                                </label>
                                <input
                                  type="tel"
                                  value={telefone1Formatted}
                                  onChange={(e) => {
                                    const inputValue = e.target.value;
                                    const numbers = inputValue.replace(/\D/g, '');
                                    // Limitar a 11 dígitos
                                    if (numbers.length <= 11) {
                                      const formatted = formatPhone(numbers);
                                      setTelefone1Formatted(formatted);
                                      setEditData({ ...editData, telefone1: numbers });
                                    }
                                  }}
                                  placeholder="(11) 98765-4321"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Telefone do hotsite (será atualizado no hotsite)
                                </p>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Plano
                                </label>
                                <select
                                  value={editData.plano_id || ''}
                                  onChange={(e) =>
                                    setEditData({ ...editData, plano_id: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                                >
                                  <option value="">Selecione um plano</option>
                                  {planos.map((plano) => (
                                    <option key={plano.id} value={plano.id}>
                                      {plano.nome}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Tipo de Empresa
                                </label>
                                <select
                                  value={editData.tipoempresa || 'Empresa de Mudança'}
                                  onChange={(e) =>
                                    setEditData({ ...editData, tipoempresa: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                                >
                                  <option value="Empresa de Mudança">Empresa de Mudança</option>
                                  <option value="Carretos">Carretos</option>
                                  <option value="Guarda-Móveis">Guarda-Móveis</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Data de Vencimento
                                </label>
                                <input
                                  type="date"
                                  value={editData.data_fim}
                                  onChange={(e) =>
                                    setEditData({ ...editData, data_fim: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Envia Email Ativação/Desativação?
                                </label>
                                <select
                                  value={editData.envia_email_ativacao ? 'sim' : 'nao'}
                                  onChange={(e) =>
                                    setEditData({ ...editData, envia_email_ativacao: e.target.value === 'sim' })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                                >
                                  <option value="nao">Não</option>
                                  <option value="sim">Sim</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                  Se Sim, envia email automaticamente ao ativar/desativar a campanha
                                </p>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Valor Mensal (R$)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editData.valor}
                                  onChange={(e) =>
                                    setEditData({ ...editData, valor: parseFloat(e.target.value) })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                                />
                              </div>
                            </div>
                            <div className="mt-4">
                              <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={editData.participa_cotacao !== false}
                                  onChange={(e) =>
                                    setEditData({ ...editData, participa_cotacao: e.target.checked })
                                  }
                                  className="w-4 h-4 text-[#0073e6] focus:ring-[#0073e6] border-gray-300 rounded"
                                />
                                <span className="font-medium">Participa de Cotação</span>
                              </label>
                              <p className="text-xs text-gray-500 ml-6 mt-1">
                                Se marcado, esta campanha receberá orçamentos automaticamente
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSave(campanha.id)}
                                disabled={loading === campanha.id}
                                className="px-4 py-2 bg-[#0073e6] text-white rounded-lg hover:bg-[#005bb5] transition-colors text-sm disabled:opacity-50"
                              >
                                {loading === campanha.id ? 'Salvando...' : 'Salvar'}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={loading === campanha.id}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Modo Visualização */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {campanha.empresa_nome}
                          </div>
                          {campanha.email ? (
                            <div className={`text-xs mt-1 flex items-center gap-1 ${
                              isValidEmail(campanha.email) 
                                ? 'text-gray-500' 
                                : 'text-red-600 font-medium'
                            }`}>
                              {!isValidEmail(campanha.email) && (
                                <span title="Email inválido">⚠️</span>
                              )}
                              {campanha.email}
                            </div>
                          ) : (
                            <div className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                              <span title="Email não cadastrado">⚠️</span>
                              Sem email cadastrado
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {campanha.cidade_nome || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {campanha.tipoempresa || 'Empresa de Mudança'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeColor(
                              campanha.plano_nome
                            )}`}
                          >
                            {campanha.plano_nome}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(campanha.data_inicio)}
                          </div>
                          {campanha.data_fim && (
                            <div className={`text-xs ${
                              isDateExpired(campanha.data_fim) 
                                ? 'text-red-600 font-semibold' 
                                : 'text-gray-500'
                            }`}>
                              até {formatDate(campanha.data_fim)}
                              {isDateExpired(campanha.data_fim) && ' ⚠️'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(campanha.valor)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const status = getStatusCampanha(campanha);
                            return (
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.className}`}
                              >
                                {status.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(campanha)}
                              className="px-3 py-1 text-[#0073e6] hover:text-[#005bb5] border border-[#0073e6] rounded hover:bg-blue-50 transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleToggleAtivo(
                                campanha.id, 
                                campanha.ativo, 
                                campanha.email, 
                                campanha.telefone1, 
                                campanha.data_fim,
                                campanha.participa_cotacao
                              )}
                              disabled={loading === campanha.id}
                              className={`px-3 py-1 border rounded transition-colors disabled:opacity-50 ${
                                campanha.ativo
                                  ? 'text-red-600 hover:text-red-900 border-red-600 hover:bg-red-50'
                                  : 'text-green-600 hover:text-green-900 border-green-600 hover:bg-green-50'
                              }`}
                            >
                              {loading === campanha.id
                                ? '...'
                                : campanha.ativo
                                ? 'Desativar'
                                : 'Ativar'}
                            </button>
                            <button
                              onClick={() => handleDelete(campanha.id, campanha.empresa_nome)}
                              disabled={loading === campanha.id}
                              className="px-3 py-1 text-red-600 hover:text-red-900 border border-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      {searchTerm || filterStatus !== 'todos' || filterPlano !== 'todos' ? (
                        <>
                          <p className="font-medium">Nenhuma campanha encontrada</p>
                          <p className="text-sm mt-1">Tente ajustar os filtros de busca</p>
                        </>
                      ) : (
                        <p>Nenhuma campanha cadastrada</p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {campanhasFiltradas.length > 0 ? (
          campanhasFiltradas.map((campanha) => (
            <div key={campanha.id} className="bg-white rounded-lg shadow-md p-4">
              {editingId === campanha.id ? (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    Editando: {campanha.empresa_nome}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Email da Empresa *
                      </label>
                      <input
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) =>
                          setEditData({ ...editData, email: e.target.value })
                        }
                        placeholder="email@empresa.com.br"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email do hotsite (será atualizado no hotsite)
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Telefone 1
                      </label>
                      <input
                        type="tel"
                        value={telefone1Formatted}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          const numbers = inputValue.replace(/\D/g, '');
                          // Limitar a 11 dígitos
                          if (numbers.length <= 11) {
                            const formatted = formatPhone(numbers);
                            setTelefone1Formatted(formatted);
                            setEditData({ ...editData, telefone1: numbers });
                          }
                        }}
                        placeholder="(11) 98765-4321"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Telefone do hotsite (será atualizado no hotsite)
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Plano
                      </label>
                      <select
                        value={editData.plano_id || ''}
                        onChange={(e) =>
                          setEditData({ ...editData, plano_id: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                      >
                        <option value="">Selecione um plano</option>
                        {planos.map((plano) => (
                          <option key={plano.id} value={plano.id}>
                            {plano.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tipo de Empresa
                      </label>
                      <select
                        value={editData.tipoempresa || 'Empresa de Mudança'}
                        onChange={(e) =>
                          setEditData({ ...editData, tipoempresa: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                      >
                        <option value="Empresa de Mudança">Empresa de Mudança</option>
                        <option value="Carretos">Carretos</option>
                        <option value="Guarda-Móveis">Guarda-Móveis</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Data de Vencimento
                      </label>
                      <input
                        type="date"
                        value={editData.data_fim}
                        onChange={(e) =>
                          setEditData({ ...editData, data_fim: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Valor Mensal (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editData.valor}
                        onChange={(e) =>
                          setEditData({ ...editData, valor: parseFloat(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Envia Email Ativação/Desativação?
                      </label>
                      <select
                        value={editData.envia_email_ativacao ? 'sim' : 'nao'}
                        onChange={(e) =>
                          setEditData({ ...editData, envia_email_ativacao: e.target.value === 'sim' })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                      >
                        <option value="nao">Não</option>
                        <option value="sim">Sim</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Se Sim, envia email automaticamente ao ativar/desativar a campanha
                      </p>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={editData.participa_cotacao !== false}
                          onChange={(e) =>
                            setEditData({ ...editData, participa_cotacao: e.target.checked })
                          }
                          className="w-4 h-4 text-[#0073e6] focus:ring-[#0073e6] border-gray-300 rounded"
                        />
                        <span className="font-medium">Participa de Cotação</span>
                      </label>
                      <p className="text-xs text-gray-500 ml-6 mt-1">
                        Se marcado, esta campanha receberá orçamentos automaticamente
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleSave(campanha.id)}
                        disabled={loading === campanha.id}
                        className="flex-1 px-4 py-2 bg-[#0073e6] text-white rounded-lg hover:bg-[#005bb5] transition-colors text-sm disabled:opacity-50"
                      >
                        {loading === campanha.id ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={loading === campanha.id}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        {campanha.empresa_nome}
                      </h3>
                      {campanha.email ? (
                        <p className={`text-sm mt-1 flex items-center gap-1 ${
                          isValidEmail(campanha.email) 
                            ? 'text-gray-500' 
                            : 'text-red-600 font-medium'
                        }`}>
                          {!isValidEmail(campanha.email) && (
                            <span title="Email inválido">⚠️</span>
                          )}
                          {campanha.email}
                        </p>
                      ) : (
                        <p className="text-sm text-red-600 font-medium mt-1 flex items-center gap-1">
                          <span title="Email não cadastrado">⚠️</span>
                          Sem email cadastrado
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        {campanha.cidade_nome || 'Sem cidade'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getBadgeColor(
                        campanha.plano_nome
                      )}`}
                    >
                      {campanha.plano_nome}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium text-gray-900">
                        {campanha.tipoempresa || 'Empresa de Mudança'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Plano:</span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getBadgeColor(
                          campanha.plano_nome
                        )}`}
                      >
                        {campanha.plano_nome}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Período:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(campanha.data_inicio)}
                        {campanha.data_fim && (
                          <span className={isDateExpired(campanha.data_fim) ? 'text-red-600 font-semibold' : ''}>
                            {' - '}{formatDate(campanha.data_fim)}
                            {isDateExpired(campanha.data_fim) && ' ⚠️'}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Valor:</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(campanha.valor)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      {(() => {
                        const status = getStatusCampanha(campanha);
                        return (
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${status.className}`}
                          >
                            {status.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t">
                    <button
                      onClick={() => handleEdit(campanha)}
                      className="w-full px-4 py-2 text-[#0073e6] border border-[#0073e6] rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleAtivo(
                        campanha.id, 
                        campanha.ativo, 
                        campanha.email, 
                        campanha.telefone1, 
                        campanha.data_fim
                      )}
                      disabled={loading === campanha.id}
                      className={`w-full px-4 py-2 border rounded-lg transition-colors disabled:opacity-50 text-sm font-medium ${
                        campanha.ativo
                          ? 'text-red-600 border-red-600 hover:bg-red-50'
                          : 'text-green-600 border-green-600 hover:bg-green-50'
                      }`}
                    >
                      {loading === campanha.id
                        ? '...'
                        : campanha.ativo
                        ? 'Desativar'
                        : 'Ativar'}
                    </button>
                    <button
                      onClick={() => handleDelete(campanha.id, campanha.empresa_nome)}
                      disabled={loading === campanha.id}
                      className="w-full px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-500">
              {searchTerm || filterStatus !== 'todos' || filterPlano !== 'todos' ? (
                <>
                  <p className="font-medium">Nenhuma campanha encontrada</p>
                  <p className="text-sm mt-1">Tente ajustar os filtros de busca</p>
                </>
              ) : (
                <p>Nenhuma campanha cadastrada</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Nova Campanha */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nova Campanha</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Hotsite
                </label>
                <input
                  type="text"
                  placeholder="Digite o nome da empresa, cidade ou estado..."
                  value={hotsiteSearchTerm}
                  onChange={(e) => setHotsiteSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] mb-2"
                />
                <p className="text-xs text-gray-500">
                  {hotsiteSearchTerm ? 
                    `${hotsitesFiltrados.length} resultado(s) encontrado(s)` : 
                    `Mostrando primeiros 50 hotsites. Use a busca para encontrar mais.`
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hotsite *
                </label>
                <select
                  value={newCampanhaData.hotsite_id}
                  onChange={(e) => {
                    const hotsiteId = e.target.value;
                    // Buscar no array completo de hotsites (não apenas nos filtrados)
                    const hotsiteSelecionado = hotsites.find(h => h.id === hotsiteId);
                    
                    console.log('🔍 Hotsite selecionado:', {
                      hotsiteId,
                      encontrado: !!hotsiteSelecionado,
                      email: hotsiteSelecionado?.email,
                      telefone1: hotsiteSelecionado?.telefone1,
                      tipoempresa: hotsiteSelecionado?.tipoempresa
                    });
                    
                    if (hotsiteSelecionado) {
                      const telefone1Numbers = (hotsiteSelecionado.telefone1 || '').replace(/\D/g, '');
                      const telefoneFormatted = formatPhone(telefone1Numbers);
                      
                      console.log('✅ Preenchendo campos:', {
                        email: hotsiteSelecionado.email || '',
                        telefone1: telefone1Numbers,
                        telefoneFormatted,
                        tipoempresa: hotsiteSelecionado.tipoempresa || 'Empresa de Mudança'
                      });
                      
                      setNewTelefone1Formatted(telefoneFormatted);
                      setNewCampanhaData({
                        ...newCampanhaData,
                        hotsite_id: hotsiteId,
                        email: hotsiteSelecionado.email || '',
                        telefone1: telefone1Numbers,
                        tipoempresa: hotsiteSelecionado.tipoempresa || 'Empresa de Mudança'
                      });
                    } else {
                      console.warn('⚠️ Hotsite não encontrado no array');
                      setNewCampanhaData({ ...newCampanhaData, hotsite_id: hotsiteId });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
                  required
                  size={Math.min(hotsitesFiltrados.length + 1, 10)}
                >
                  <option value="">Selecione um hotsite</option>
                  {hotsitesFiltrados.map((hotsite) => (
                    <option key={hotsite.id} value={hotsite.id}>
                      {hotsite.nome_exibicao} - {hotsite.cidade?.nome || 'Sem cidade'} - {hotsite.cidade?.estado || ''}
                    </option>
                  ))}
                </select>
                {hotsitesFiltrados.length === 0 && hotsiteSearchTerm && (
                  <p className="text-sm text-red-600 mt-1">Nenhum hotsite encontrado com esse termo</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plano *
                </label>
                <select
                  value={newCampanhaData.plano_id}
                  onChange={(e) => {
                    const planoId = e.target.value;
                    const planoSelecionado = planos.find(p => p.id === planoId);
                    
                    setNewCampanhaData({
                      ...newCampanhaData,
                      plano_id: planoId,
                      valor_total: planoSelecionado?.preco || 0
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
                  required
                >
                  <option value="">Selecione um plano</option>
                  {planos.map((plano) => (
                    <option key={plano.id} value={plano.id}>
                      {plano.nome} {plano.preco ? `- R$ ${plano.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={newCampanhaData.data_inicio}
                    onChange={(e) => setNewCampanhaData({ ...newCampanhaData, data_inicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    value={newCampanhaData.data_fim}
                    onChange={(e) => setNewCampanhaData({ ...newCampanhaData, data_fim: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email da Empresa *
                  </label>
                  <input
                    type="email"
                    value={newCampanhaData.email}
                    onChange={(e) => setNewCampanhaData({ ...newCampanhaData, email: e.target.value })}
                    placeholder="email@empresa.com.br"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email do hotsite (será atualizado no hotsite se alterado)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone 1 *
                  </label>
                  <input
                    type="tel"
                    value={newTelefone1Formatted}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      const numbers = inputValue.replace(/\D/g, '');
                      if (numbers.length <= 11) {
                        const formatted = formatPhone(numbers);
                        setNewTelefone1Formatted(formatted);
                        setNewCampanhaData({ ...newCampanhaData, telefone1: numbers });
                      }
                    }}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Telefone do hotsite (será atualizado no hotsite se alterado)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Empresa
                </label>
                <select
                  value={newCampanhaData.tipoempresa}
                  onChange={(e) => setNewCampanhaData({ ...newCampanhaData, tipoempresa: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                >
                  <option value="Empresa de Mudança">Empresa de Mudança</option>
                  <option value="Carretos">Carretos</option>
                  <option value="Guarda-Móveis">Guarda-Móveis</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Tipo do hotsite (será atualizado no hotsite se alterado)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Mensal (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newCampanhaData.valor_total}
                  onChange={(e) => setNewCampanhaData({ ...newCampanhaData, valor_total: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Configurações de Cotação</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={newCampanhaData.participa_cotacao}
                        onChange={(e) => setNewCampanhaData({ ...newCampanhaData, participa_cotacao: e.target.checked })}
                        className="w-4 h-4 text-[#0073e6] focus:ring-[#0073e6] border-gray-300 rounded"
                      />
                      <span className="font-medium">Participa de Cotação</span>
                    </label>
                    <p className="text-xs text-gray-500 ml-6 mt-1">
                      Se marcado, esta campanha receberá orçamentos automaticamente
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Envia Email Ativação/Desativação?
                    </label>
                    <select
                      value={newCampanhaData.envia_email_ativacao ? 'sim' : 'nao'}
                      onChange={(e) => setNewCampanhaData({ ...newCampanhaData, envia_email_ativacao: e.target.value === 'sim' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                    >
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Se Sim, envia email automaticamente ao ativar/desativar a campanha
                    </p>
                  </div>

                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowNewModal(false);
                  setHotsiteSearchTerm('');
                  setNewCampanhaData({
                    hotsite_id: '',
                    plano_id: '',
                    data_inicio: new Date().toISOString().split('T')[0],
                    data_fim: '',
                    valor_total: 0,
                    participa_cotacao: true,
                    envia_email_ativacao: true,
                    email: '',
                    telefone1: '',
                    tipoempresa: 'Empresa de Mudança',
                    // limite_orcamentos_mes removido do formulário (não usado por enquanto)
                  });
                  setNewTelefone1Formatted('');
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={loading === 'creating'}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCampanha}
                disabled={loading === 'creating'}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading === 'creating' ? 'Criando...' : 'Criar Campanha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

