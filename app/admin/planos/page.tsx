'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';

interface Plano {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  preco: number;
  periodicidade: 'mensal' | 'trimestral' | 'anual';
  created_at: string;
}

export default function PlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    carregarPlanos();
  }, []);

  async function carregarPlanos() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/planos');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar planos');
      }

      setPlanos(data.planos || []);
      setError('');
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao carregar planos:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Tem certeza que deseja deletar o plano "${nome}"?\n\nAtenção: Esta ação não pode ser desfeita!`)) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/admin/planos/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Erro ao deletar plano');
      }

      alert('Plano deletado com sucesso!');
      await carregarPlanos();
    } catch (err: any) {
      alert(`Erro ao deletar plano:\n${err.message}`);
      console.error('Erro ao deletar plano:', err);
    } finally {
      setDeletingId(null);
    }
  }

  function formatarPreco(preco: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco);
  }

  function formatarPeriodicidade(periodicidade: string) {
    const map: Record<string, string> = {
      mensal: 'Mensal',
      trimestral: 'Trimestral',
      anual: 'Anual',
    };
    return map[periodicidade] || periodicidade;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0073e6] mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando planos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planos de Publicidade</h1>
          <p className="text-gray-600 mt-2">
            Gerencie os planos disponíveis para campanhas
          </p>
        </div>
        <Link href="/admin/planos/novo">
          <Button className="bg-[#0073e6] hover:bg-[#005bb5] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Novo Plano
          </Button>
        </Link>
      </div>

      {/* Erro */}
      {error && (
        <Card className="bg-red-50 border-red-200 p-4 mb-6">
          <p className="text-red-800 font-medium">❌ {error}</p>
        </Card>
      )}

      {/* Lista de Planos */}
      {planos.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum plano cadastrado
            </h3>
            <p className="text-gray-600 mb-6">
              Crie seu primeiro plano de publicidade para começar.
            </p>
            <Link href="/admin/planos/novo">
              <Button className="bg-[#0073e6] hover:bg-[#005bb5] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Plano
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {planos.map((plano) => (
            <Card key={plano.id} className="p-6 hover:shadow-lg transition-shadow">
              {/* Badge de Ordem */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-[#0073e6] text-white rounded-full text-sm font-bold">
                    {plano.ordem}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{plano.nome}</h3>
                    <p className="text-sm text-gray-500">
                      {formatarPeriodicidade(plano.periodicidade)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              {plano.descricao && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {plano.descricao}
                </p>
              )}

              {/* Preço */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Preço</span>
                  <span className="text-xl font-bold text-green-700">
                    {formatarPreco(plano.preco)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  por {plano.periodicidade === 'mensal' ? 'mês' : 
                       plano.periodicidade === 'trimestral' ? 'trimestre' : 'ano'}
                </p>
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <Link href={`/admin/planos/${plano.id}`} className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full border-[#0073e6] text-[#0073e6] hover:bg-[#0073e6] hover:text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  onClick={() => handleDelete(plano.id, plano.nome)}
                  disabled={deletingId === plano.id}
                >
                  {deletingId === plano.id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Data de Criação */}
              <p className="text-xs text-gray-400 mt-3 text-center">
                Criado em {new Date(plano.created_at).toLocaleDateString('pt-BR')}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Rodapé */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 text-center">
          <strong>{planos.length}</strong> {planos.length === 1 ? 'plano cadastrado' : 'planos cadastrados'}
        </p>
      </div>
    </div>
  );
}


