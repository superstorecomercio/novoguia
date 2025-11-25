'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { ArrowLeft, Save } from 'lucide-react';

export default function NovoPlanoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ordem: 1,
    preco: 0,
    periodicidade: 'mensal' as 'mensal' | 'trimestral' | 'anual',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    // Validações
    if (!formData.nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }

    if (formData.ordem < 0) {
      setErro('Ordem deve ser um número positivo');
      return;
    }

    if (formData.preco < 0) {
      setErro('Preço deve ser um número positivo');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/admin/planos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim() || null,
          ordem: formData.ordem,
          preco: formData.preco,
          periodicidade: formData.periodicidade,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Erro ao criar plano');
      }

      alert('✅ Plano criado com sucesso!');
      router.push('/admin/planos');
    } catch (err: any) {
      setErro(err.message);
      console.error('Erro ao criar plano:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/planos"
          className="inline-flex items-center text-[#0073e6] hover:text-[#005bb5] mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Planos
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Criar Novo Plano</h1>
        <p className="text-gray-600 mt-2">
          Preencha as informações do novo plano de publicidade
        </p>
      </div>

      {/* Erro */}
      {erro && (
        <Card className="bg-red-50 border-red-200 p-4 mb-6">
          <p className="text-red-800 font-medium">❌ {erro}</p>
        </Card>
      )}

      {/* Formulário */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Plano <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              maxLength={50}
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Plano Premium"
              required
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Máximo 50 caracteres ({formData.nome.length}/50)
            </p>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva as características deste plano..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
            />
          </div>

          {/* Ordem e Preço */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ordem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordem de Exibição <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                required
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ordem crescente (1, 2, 3...)
              </p>
            </div>

            {/* Preço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço (R$) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) || 0 })}
                required
                className="w-full"
              />
            </div>
          </div>

          {/* Periodicidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periodicidade <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, periodicidade: 'mensal' })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.periodicidade === 'mensal'
                    ? 'border-[#0073e6] bg-[#0073e6]/10 text-[#0073e6] font-semibold'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">📅</div>
                  <div className="text-sm">Mensal</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, periodicidade: 'trimestral' })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.periodicidade === 'trimestral'
                    ? 'border-[#0073e6] bg-[#0073e6]/10 text-[#0073e6] font-semibold'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">📆</div>
                  <div className="text-sm">Trimestral</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, periodicidade: 'anual' })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.periodicidade === 'anual'
                    ? 'border-[#0073e6] bg-[#0073e6]/10 text-[#0073e6] font-semibold'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">🗓️</div>
                  <div className="text-sm">Anual</div>
                </div>
              </button>
            </div>
          </div>

          {/* Preview */}
          <Card className="bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              📋 Pré-visualização
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nome:</span>
                <span className="font-medium">{formData.nome || '(vazio)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ordem:</span>
                <span className="font-medium">#{formData.ordem}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Preço:</span>
                <span className="font-medium text-green-700">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(formData.preco)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Periodicidade:</span>
                <span className="font-medium capitalize">{formData.periodicidade}</span>
              </div>
            </div>
          </Card>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <Link href="/admin/planos" className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              className="flex-1 bg-[#0073e6] hover:bg-[#005bb5] text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Criando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Criar Plano
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}








