'use client';

import { useState } from 'react';

interface ArrayInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  helpText?: string;
}

export default function ArrayInput({ 
  label, 
  values, 
  onChange, 
  placeholder = 'Adicionar item',
  helpText 
}: ArrayInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    onChange([...values, inputValue.trim()]);
    setInputValue('');
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleEdit = (index: number, newValue: string) => {
    const newValues = [...values];
    newValues[index] = newValue;
    onChange(newValues);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {helpText && (
        <p className="text-xs text-gray-500 mb-2">{helpText}</p>
      )}

      {/* Lista de itens existentes */}
      <div className="space-y-2 mb-2">
        {values.map((value, index) => (
          <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
            <input
              type="text"
              value={value}
              onChange={(e) => handleEdit(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6] bg-white"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex-shrink-0"
              title="Remover"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Input para adicionar novo item */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#0073e6] focus:border-[#0073e6]"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex-shrink-0"
          title="Adicionar"
        >
          + Adicionar
        </button>
      </div>

      {/* Contador */}
      {values.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          {values.length} {values.length === 1 ? 'item' : 'itens'}
        </p>
      )}
    </div>
  );
}

