'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NovaCidadePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    estado: '',
  });

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
      const response = await fetch('/api/admin/cidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao criar cidade');
      }

      alert('Cidade criada com sucesso!');
      router.push('/admin/cidades');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
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

      <h1 className="text-3xl font-bold mb-6">Nova Cidade</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
        <p className="font-semibold">ℹ️ Dicas para cadastrar uma cidade:</p>
        <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
          <li>Use o nome completo com acentuação correta (ex: São Paulo, Goiânia)</li>
          <li>O estado deve ser a sigla com 2 letras maiúsculas (ex: SP, GO, RJ)</li>
          <li>Nunca use "XX" como estado</li>
          <li>O slug será gerado automaticamente no formato: cidade-estado</li>
        </ul>
      </div>

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
            {saving ? 'Criando...' : 'Criar Cidade'}
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


