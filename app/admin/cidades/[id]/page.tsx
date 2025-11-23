'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Cidade {
  id: string;
  nome: string;
  slug: string;
  estado: string;
  total_hotsites: number;
  total_orcamentos: number;
}

export default function EditarCidadePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [cidadeId, setCidadeId] = useState<string>('');
  const [cidade, setCidade] = useState<Cidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    estado: '',
  });

  useEffect(() => {
    params.then(({ id }) => {
      setCidadeId(id);
      fetchCidade(id);
    });
  }, []);

  async function fetchCidade(id: string) {
    try {
      const response = await fetch(`/api/admin/cidades/${id}`);
      if (!response.ok) throw new Error('Erro ao buscar cidade');
      
      const data = await response.json();
      setCidade(data);
      setFormData({
        nome: data.nome,
        slug: data.slug,
        estado: data.estado,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-gerar slug baseado no nome e estado
    if (name === 'nome' || name === 'estado') {
      const nome = name === 'nome' ? value : formData.nome;
      const estado = name === 'estado' ? value : formData.estado;
      
      if (nome && estado) {
        const slugGerado = nome
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          + '-' + estado.toLowerCase();
        
        setFormData(prev => ({
          ...prev,
          slug: slugGerado
        }));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/cidades/${cidadeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar cidade');
      }

      alert('Cidade atualizada com sucesso!');
      router.push('/admin/cidades');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Tem certeza que deseja deletar a cidade "${cidade?.nome}"?\n\nEsta ação não pode ser desfeita!`)) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/cidades/${cidadeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao deletar cidade');
      }

      alert('Cidade deletada com sucesso!');
      router.push('/admin/cidades');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!cidade) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-red-600">Cidade não encontrada</p>
        <Link href="/admin/cidades">
          <Button className="mt-4">Voltar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/cidades">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Editar Cidade</h1>
          <p className="text-gray-600 mt-1">
            {cidade.total_hotsites} hotsites • {cidade.total_orcamentos} orçamentos
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={deleting || cidade.total_hotsites > 0 || cidade.total_orcamentos > 0}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {deleting ? 'Deletando...' : 'Deletar'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {cidade.estado === 'XX' && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
          <p className="font-semibold">⚠️ Esta cidade tem estado incorreto (XX)</p>
          <p className="text-sm mt-1">
            Atualize o campo "Estado" para a sigla correta (ex: SP, RJ, MG).
          </p>
        </div>
      )}

      {(cidade.total_hotsites > 0 || cidade.total_orcamentos > 0) && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-4">
          <p className="text-sm">
            ℹ️ Esta cidade não pode ser deletada pois possui {cidade.total_hotsites} hotsites e {cidade.total_orcamentos} orçamentos vinculados.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
            Nome da Cidade *
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            required
            value={formData.nome}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: São Paulo"
          />
          <p className="text-sm text-gray-500 mt-1">
            Nome completo da cidade com acentuação correta
          </p>
        </div>

        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
            Estado *
          </label>
          <input
            type="text"
            id="estado"
            name="estado"
            required
            value={formData.estado}
            onChange={handleChange}
            maxLength={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder="Ex: SP"
          />
          <p className="text-sm text-gray-500 mt-1">
            Sigla do estado com 2 letras maiúsculas (ex: SP, RJ, MG). Não use "XX".
          </p>
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            Slug *
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            required
            value={formData.slug}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: sao-paulo-sp"
          />
          <p className="text-sm text-gray-500 mt-1">
            URL da cidade (gerado automaticamente). Formato: cidade-estado
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
          <Link href="/admin/cidades">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}



