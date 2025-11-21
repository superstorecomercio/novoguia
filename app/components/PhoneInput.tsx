'use client';

import { useState, useEffect } from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

export default function PhoneInput({ value, onChange, label, required = false }: PhoneInputProps) {
  const [formattedValue, setFormattedValue] = useState(value);

  useEffect(() => {
    // Formatar telefone automaticamente: (11) 98765-4321
    const formatPhone = (phone: string) => {
      // Remove tudo que não é número
      const numbers = phone.replace(/\D/g, '');
      
      if (numbers.length === 0) return '';
      if (numbers.length <= 2) return `(${numbers}`;
      if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    };

    setFormattedValue(formatPhone(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numbers = inputValue.replace(/\D/g, '');
    
    // Limitar a 11 dígitos
    if (numbers.length <= 11) {
      onChange(numbers);
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type="tel"
        value={formattedValue}
        onChange={handleChange}
        placeholder="(11) 98765-4321"
        required={required}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
      />
    </div>
  );
}

