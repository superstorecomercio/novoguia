'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface Campanha {
  id: string;
  empresa_id: string;
  hotsite_id?: string;
  empresa_nome: string;
  plano_nome: string;
  plano_ordem: number;
  cidade_nome?: string;
  tipoempresa?: string;
  data_inicio: string;
  data_fim?: string;
  valor: number;
  ativo: boolean;
}

interface Hotsite {
  id: string;
  nome_exibicao: string;
  cidade: string;
  estado: string;
}

interface Plano {
  id: string;
  nome: string;
  ordem: number;
}

interface CampanhasListProps {
  campanhas: Campanha[];
  hotsites: Hotsite[];
  planos: Plano[];
}

export default function CampanhasList({ campanhas: initialCampanhas, hotsites, planos }: CampanhasListProps) {
  const router = useRouter();
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
  const [newCampanhaData, setNewCampanhaData] = useState({
    hotsite_id: '',
    plano_id: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    valor_total: 0,
  });

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
      const cidade = (hotsite.cidade || '').toLowerCase();
      const estado = (hotsite.estado || '').toLowerCase();
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
    setEditData({
      hotsite_id: campanha.hotsite_id,
      data_fim: campanha.data_fim || '',
      valor: campanha.valor,
      ativo: campanha.ativo,
      tipoempresa: campanha.tipoempresa || 'Empresa de Mudança',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async (id: string) => {
    setLoading(id);
    try {
      const response = await fetch(`/api/admin/campanhas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar campanha');
      }

      setEditingId(null);
      setEditData({});
      router.refresh();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar campanha');
    } finally {
      setLoading(null);
    }
  };

  const handleToggleAtivo = async (id: string, ativo: boolean) => {
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

      router.refresh();
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
      router.refresh();
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

    setLoading('creating');
    try {
      const response = await fetch('/api/admin/campanhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampanhaData),
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
      });
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
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

  return (
    <div>
      {/* Botão Nova Campanha */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowNewModal(true)}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
        >
          <span>➕</span> Nova Campanha
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                  Valor (R$)
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
                                  Status
                                </label>
                                <select
                                  value={editData.ativo ? 'ativa' : 'inativa'}
                                  onChange={(e) =>
                                    setEditData({ ...editData, ativo: e.target.value === 'ativa' })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] text-sm"
                                >
                                  <option value="ativa">Ativa</option>
                                  <option value="inativa">Inativa</option>
                                </select>
                              </div>
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
                            {campanha.cidade_nome || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {campanha.tipoempresa || 'Empresa de Mudança'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(campanha.data_inicio)}
                          </div>
                          {campanha.data_fim && (
                            <div className="text-xs text-gray-500">
                              até {formatDate(campanha.data_fim)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(campanha.valor)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              campanha.ativo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {campanha.ativo ? 'Ativa' : 'Inativa'}
                          </span>
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
                              onClick={() => handleToggleAtivo(campanha.id, campanha.ativo)}
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

      {/* Modal Nova Campanha */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                  onChange={(e) => setNewCampanhaData({ ...newCampanhaData, hotsite_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
                  required
                  size={Math.min(hotsitesFiltrados.length + 1, 10)}
                >
                  <option value="">Selecione um hotsite</option>
                  {hotsitesFiltrados.map((hotsite) => (
                    <option key={hotsite.id} value={hotsite.id}>
                      {hotsite.nome_exibicao} - {hotsite.cidade}/{hotsite.estado}
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
                  onChange={(e) => setNewCampanhaData({ ...newCampanhaData, plano_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
                  required
                >
                  <option value="">Selecione um plano</option>
                  {planos.map((plano) => (
                    <option key={plano.id} value={plano.id}>
                      {plano.nome}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Total (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newCampanhaData.valor_total}
                  onChange={(e) => setNewCampanhaData({ ...newCampanhaData, valor_total: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
                />
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
                  });
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

