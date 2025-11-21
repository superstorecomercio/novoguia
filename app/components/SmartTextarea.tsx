'use client';

import { useState, useEffect, useRef } from 'react';

interface SmartTextareaProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  tipoServico?: 'mudanca' | 'carreto' | 'guardamoveis';
  suggestions?: string[];
}

const KEYWORD_SUGGESTIONS: Record<string, string[]> = {
  mudanca: [
    'móveis de cozinha',
    'eletrodomésticos',
    'móveis de sala',
    'quarto completo',
    'escritório',
    'piano',
    'quadros',
    'objetos frágeis',
  ],
  carreto: [
    'sofá',
    'geladeira',
    'fogão',
    'máquina de lavar',
    'mesa',
    'cadeiras',
    'armário',
  ],
  guardamoveis: [
    'móveis antigos',
    'documentos',
    'objetos pessoais',
    'equipamentos',
    'estofados',
    'eletrônicos',
  ],
};

export default function SmartTextarea({
  value,
  onChange,
  label,
  placeholder,
  rows = 4,
  tipoServico,
  suggestions: customSuggestions,
}: SmartTextareaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    // Mostrar sugestões de palavras-chave quando usuário digita
    if (value.length > 0 && tipoServico) {
      const keywords = KEYWORD_SUGGESTIONS[tipoServico] || [];
      const filtered = keywords.filter(keyword =>
        keyword.toLowerCase().includes(value.toLowerCase()) ||
        value.toLowerCase().includes(keyword.toLowerCase())
      );
      setKeywordSuggestions(filtered.slice(0, 3));
    } else {
      setKeywordSuggestions([]);
    }
  }, [value, tipoServico]);

  const handleInsertKeyword = (keyword: string) => {
    const currentValue = value || '';
    const newValue = currentValue ? `${currentValue}, ${keyword}` : keyword;
    onChange(newValue);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const suggestions = customSuggestions || keywordSuggestions;

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(suggestions.length > 0)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b">
            💡 Sugestões:
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleInsertKeyword(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors text-sm"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}
      
      {tipoServico && value.length === 0 && (
        <div className="mt-2 text-xs text-gray-500">
          💡 Dica: Mencione itens específicos como móveis, eletrodomésticos, etc.
        </div>
      )}
    </div>
  );
}

