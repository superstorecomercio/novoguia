'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

interface CitySuggestion {
  nome: string;
  estado: string;
  id: string;
}

interface CityAutocompleteProps {
  estado?: string;
  value: string;
  onChange: (value: string, estado?: string) => void;
  placeholder?: string;
  required?: boolean;
  label?: string;
  onEstadoDetected?: (estado: string) => void;
}

/**
 * Autocomplete inteligente de cidades com IA
 * - Busca cidades sem precisar selecionar estado primeiro
 * - Detecta estado automaticamente baseado na cidade
 * - Usa fuzzy search para encontrar cidades mesmo com erros de digitação
 * - Mostra estado junto com cidade nas sugestões
 */
export default function CityAutocomplete({
  estado,
  value,
  onChange,
  placeholder = 'Digite a cidade...',
  required = false,
  label,
  onEstadoDetected,
}: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedEstado, setDetectedEstado] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mapeamento de cidades conhecidas para estados (para detecção rápida)
  const cidadeEstadoMap: Record<string, string> = {
    'são paulo': 'SP',
    'sao paulo': 'SP',
    'rio de janeiro': 'RJ',
    'belo horizonte': 'MG',
    'brasília': 'DF',
    'brasilia': 'DF',
    'curitiba': 'PR',
    'porto alegre': 'RS',
    'recife': 'PE',
    'fortaleza': 'CE',
    'salvador': 'BA',
    'goiânia': 'GO',
    'goiania': 'GO',
    'manaus': 'AM',
    'belém': 'PA',
    'belem': 'PA',
    'florianópolis': 'SC',
    'florianopolis': 'SC',
    'vitória': 'ES',
    'vitoria': 'ES',
    'natal': 'RN',
    'joão pessoa': 'PB',
    'joao pessoa': 'PB',
    'maceió': 'AL',
    'maceio': 'AL',
    'aracaju': 'SE',
    'campo grande': 'MS',
    'cuiabá': 'MT',
    'cuiaba': 'MT',
    'teresina': 'PI',
    'são luís': 'MA',
    'sao luis': 'MA',
    'palmas': 'TO',
    'boavista': 'RR',
    'rio branco': 'AC',
    'macapá': 'AP',
    'macapa': 'AP',
    'porto velho': 'RO',
  };

  // Função de fuzzy search simples (calcula similaridade)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const s2 = str2.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    if (s1 === s2) return 1;
    if (s2.includes(s1) || s1.includes(s2)) return 0.8;
    
    // Levenshtein distance simplificado
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    const editDistance = levenshteinDistance(s1, s2);
    return 1 - editDistance / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) return;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const searchCities = async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        setDetectedEstado(null);
        return;
      }

      setIsLoading(true);
      
      // Normalizar query (remover acentos, lowercase)
      const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      // Tentar detectar estado baseado em cidades conhecidas
      const possibleEstado = cidadeEstadoMap[normalizedQuery] || estado;
      if (possibleEstado && onEstadoDetected && !estado) {
        setDetectedEstado(possibleEstado);
        onEstadoDetected(possibleEstado);
      }
      
      // Buscar cidades (com ou sem filtro de estado)
      let queryBuilder = supabase
        .from('cidades')
        .select('id, nome, estado')
        .ilike('nome', `%${query}%`)
        .limit(10);

      // Se tem estado definido ou detectado, filtrar por ele
      const estadoFiltro = estado || possibleEstado;
      if (estadoFiltro) {
        queryBuilder = queryBuilder.eq('estado', estadoFiltro);
      }

      const { data, error } = await queryBuilder;

      if (!error && data) {
        // Se não encontrou resultados com filtro de estado, tentar sem filtro
        if (data.length === 0 && estadoFiltro) {
          const { data: allData } = await supabase
            .from('cidades')
            .select('id, nome, estado')
            .ilike('nome', `%${query}%`)
            .limit(10);
          
          if (allData) {
            // Ordenar por similaridade e mostrar top 5
            const scored = allData
              .map((city) => ({
                ...city,
                score: calculateSimilarity(query, city.nome),
              }))
              .sort((a, b) => b.score - a.score)
              .slice(0, 5);
            
            setSuggestions(scored);
          }
        } else {
          // Ordenar por similaridade
          const scored = data
            .map((city) => ({
              ...city,
              score: calculateSimilarity(query, city.nome),
            }))
            .sort((a, b) => b.score - a.score);
          
          setSuggestions(scored);
        }
      } else {
        setSuggestions([]);
      }

      setIsLoading(false);
    };

    const timeoutId = setTimeout(() => {
      searchCities(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, estado, onEstadoDetected]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city: CitySuggestion) => {
    onChange(city.nome, city.estado);
    if (onEstadoDetected) {
      onEstadoDetected(city.estado);
    }
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
          {detectedEstado && !estado && (
            <span className="ml-2 text-xs text-blue-600 font-normal">
              🤖 Detectado: {detectedEstado}
            </span>
          )}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
          placeholder={placeholder}
          required={required}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
        {!isLoading && value.length >= 2 && suggestions.length === 0 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </div>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((city, index) => (
            <button
              key={`${city.id}-${index}`}
              type="button"
              onClick={() => handleSelect(city)}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{city.nome}</div>
              <div className="text-xs text-gray-500">{city.estado}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
