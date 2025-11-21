'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

interface AddressInputProps {
  cidade: string;
  estado?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export default function AddressInput({
  cidade,
  estado,
  value,
  onChange,
  label,
  placeholder = 'Digite o endereço...',
}: AddressInputProps) {
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
    // Sugerir endereços comuns quando usuário digita
    if (value.length >= 3 && cidade) {
      const commonAddresses = [
        `Rua Principal, ${cidade}`,
        `Avenida Central, ${cidade}`,
        `Centro, ${cidade}`,
        `Bairro Novo, ${cidade}`,
      ];
      
      const filtered = commonAddresses.filter(addr =>
        addr.toLowerCase().includes(value.toLowerCase())
      );
      
      setSuggestions(filtered.slice(0, 3));
    } else {
      setSuggestions([]);
    }
  }, [value, cidade]);

  const handleSelect = (address: string) => {
    onChange(address);
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
          {suggestions.map((address, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(address)}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
            >
              {address}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

