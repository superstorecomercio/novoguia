'use client';

import { useState, useEffect } from 'react';

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

const EMAIL_DOMAINS = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'uol.com.br', 'bol.com.br'];

export default function EmailInput({ value, onChange, label, required = false }: EmailInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Validar email em tempo real
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value.length > 0) {
      setIsValid(emailRegex.test(value));
    } else {
      setIsValid(null);
    }

    // Sugerir domínios quando usuário digita @
    if (value.includes('@') && !value.includes('.')) {
      const [localPart] = value.split('@');
      if (localPart && localPart.length > 0) {
        const domainSuggestions = EMAIL_DOMAINS.map(domain => `${localPart}@${domain}`);
        setSuggestions(domainSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  const handleSelect = (email: string) => {
    onChange(email);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="email"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder="seu@email.com"
          required={required}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
            isValid === false && value.length > 0
              ? 'border-red-500 focus:ring-red-200'
              : isValid === true
              ? 'border-green-500 focus:ring-green-200'
              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
          }`}
        />
        {isValid === true && value.length > 0 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            ✓
          </div>
        )}
        {isValid === false && value.length > 0 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
            ✗
          </div>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {suggestions.map((email, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(email)}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
            >
              {email}
            </button>
          ))}
        </div>
      )}
      
      {isValid === false && value.length > 0 && (
        <p className="mt-1 text-sm text-red-600">Email inválido</p>
      )}
    </div>
  );
}

