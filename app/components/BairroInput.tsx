'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

interface BairroInputProps {
  cidade: string;
  estado?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

const COMMON_BAIRROS: Record<string, string[]> = {
  'são paulo': ['Centro', 'Vila Madalena', 'Pinheiros', 'Jardins', 'Moema', 'Vila Olímpia', 'Itaim Bibi', 'Brooklin'],
  'rio de janeiro': ['Copacabana', 'Ipanema', 'Leblon', 'Barra da Tijuca', 'Botafogo', 'Flamengo', 'Centro'],
  'belo horizonte': ['Savassi', 'Centro', 'Lourdes', 'Funcionários', 'Pampulha', 'Boa Viagem'],
  'curitiba': ['Batel', 'Centro', 'Água Verde', 'Boa Vista', 'Mercês', 'Bigorrilho'],
  'porto alegre': ['Moinhos de Vento', 'Bela Vista', 'Centro', 'Bom Fim', 'Cidade Baixa'],
};

export default function BairroInput({
  cidade,
  estado,
  value,
  onChange,
  label,
  placeholder = 'Digite o bairro...',
}: BairroInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value.length >= 2 && cidade) {
      const cidadeLower = cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      // Buscar bairros conhecidos da cidade
      const commonBairros = COMMON_BAIRROS[cidadeLower] || [];
      
      // Filtrar por similaridade
      const filtered = commonBairros.filter(bairro =>
        bairro.toLowerCase().includes(value.toLowerCase())
      );
      
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [value, cidade]);

  const handleSelect = (bairro: string) => {
    onChange(bairro);
    setShowSuggestions(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(suggestions.length > 0)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {suggestions.map((bairro, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(bairro)}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
            >
              {bairro}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

