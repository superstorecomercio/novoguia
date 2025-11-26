'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface OrcamentosFilterProps {
  search: string
  setSearch: (value: string) => void
  searchType: 'nome' | 'codigo' | 'data'
  setSearchType: (type: 'nome' | 'codigo' | 'data') => void
  onSearch: () => void
}

export default function OrcamentosFilter({
  search,
  setSearch,
  searchType,
  setSearchType,
  onSearch
}: OrcamentosFilterProps) {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  const handleSearch = (value: string, type: 'nome' | 'codigo' | 'data') => {
    // Limpar timer anterior
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Atualizar estado local imediatamente
    setSearch(value)
    setSearchType(type)

    // Debounce: aguardar 500ms antes de buscar
    debounceTimer.current = setTimeout(() => {
      onSearch()
    }, 500)
  }

  const handleTypeChange = (type: 'nome' | 'codigo' | 'data') => {
    setSearchType(type)
    if (search.trim()) {
      onSearch()
    }
  }

  const clearSearch = () => {
    setSearch('')
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    onSearch()
  }

  // Converter data para formato YYYY-MM-DD para input type="date"
  const formatDateForInput = (dateStr: string): string => {
    if (!dateStr) return ''
    
    // Tentar parsear DD/MM/AAAA ou DD-MM-AAAA
    const dateMatch = dateStr.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/)
    if (dateMatch) {
      const [, day, month, year] = dateMatch
      return `${year}-${month}-${day}`
    }
    
    // Se já estiver em formato YYYY-MM-DD
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr
    }
    
    return ''
  }

  // Converter data de YYYY-MM-DD para DD/MM/AAAA
  const formatDateFromInput = (dateStr: string): string => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    if (dateValue) {
      const formattedDate = formatDateFromInput(dateValue)
      handleSearch(formattedDate, 'data')
    } else {
      clearSearch()
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            {searchType !== 'data' && (
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            )}
            {searchType === 'data' ? (
              <input
                type="date"
                value={formatDateForInput(search)}
                onChange={handleDateChange}
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value, searchType)}
                placeholder={
                  searchType === 'nome' 
                    ? 'Buscar por nome do cliente...'
                    : 'Buscar por código (ex: MD-XXXX-XXXX)...'
                }
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            )}
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleTypeChange('nome')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchType === 'nome'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            type="button"
          >
            Nome
          </button>
          <button
            onClick={() => handleTypeChange('codigo')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchType === 'codigo'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            type="button"
          >
            Código
          </button>
          <button
            onClick={() => handleTypeChange('data')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchType === 'data'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            type="button"
          >
            Data
          </button>
        </div>
      </div>
      {search && (
        <div className="mt-2 text-sm text-gray-600">
          Buscando por {searchType === 'nome' ? 'nome' : searchType === 'codigo' ? 'código' : 'data'}: <span className="font-medium">{search}</span>
        </div>
      )}
    </div>
  )
}

