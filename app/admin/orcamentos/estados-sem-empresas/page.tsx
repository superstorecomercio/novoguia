'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { AlertTriangle, MapPin } from 'lucide-react'
import { formatDateTimeBR } from '@/lib/utils/date'

interface EstadoSemEmpresas {
  estado: string
  estado_nome: string
  total_orcamentos: number
  ultimo_orcamento: string
}

export default function EstadosSemEmpresasPage() {
  const [estados, setEstados] = useState<EstadoSemEmpresas[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEstados()
  }, [])

  const loadEstados = async () => {
    try {
      setLoading(true)
      const supabase = getSupabase()
      
      const { data, error } = await supabase.rpc('relatorio_estados_sem_empresas')
      
      if (error) {
        console.error('Erro ao carregar estados:', error)
        alert('Erro ao carregar relatório de estados sem empresas')
        return
      }
      
      setEstados(data || [])
    } catch (error) {
      console.error('Erro ao carregar estados:', error)
      alert('Erro ao carregar relatório de estados sem empresas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Estados Sem Empresas</h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">
          Relatório de estados que receberam orçamentos mas não têm empresas ativas disponíveis
        </p>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <AlertTriangle className="w-8 h-8 animate-pulse mx-auto mb-4" />
            Carregando...
          </div>
        ) : estados.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="font-medium">Nenhum estado sem empresas encontrado</p>
            <p className="text-sm mt-1">Todos os estados têm empresas ativas disponíveis</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total de Orçamentos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Orçamento
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {estados.map((estado) => (
                  <tr key={estado.estado} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {estado.estado_nome}
                          </div>
                          <div className="text-xs text-gray-500">
                            {estado.estado}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-800 text-sm font-bold">
                        {estado.total_orcamentos}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTimeBR(estado.ultimo_orcamento)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resumo */}
      {!loading && estados.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">
                Oportunidade de Expansão
              </h3>
              <p className="text-sm text-yellow-800">
                {estados.length} estado(s) {estados.length === 1 ? 'recebeu' : 'receberam'} orçamentos mas não {estados.length === 1 ? 'tem' : 'têm'} empresas ativas disponíveis. 
                Considere criar campanhas nesses estados para capturar essas oportunidades.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

