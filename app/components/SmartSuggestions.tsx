'use client';

import { useState, useEffect } from 'react';

interface SmartSuggestionsProps {
  currentStep: number;
  formData: any;
  onSuggestionClick?: (suggestion: string) => void;
}

/**
 * Componente que mostra sugestões inteligentes baseadas no contexto
 * do formulário e no que o usuário já preencheu
 */
export default function SmartSuggestions({ currentStep, formData, onSuggestionClick }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const newSuggestions: string[] = [];

    switch (currentStep) {
      case 1:
        // Sugestões baseadas em histórico ou contexto
        break;
      
      case 2:
        // Sugestões para origem
        if (formData.cidadeOrigem) {
          newSuggestions.push(`📍 Você está em ${formData.cidadeOrigem}`);
        }
        break;
      
      case 3:
        // Sugestões para destino
        if (formData.cidadeOrigem && formData.cidadeDestino) {
          if (formData.cidadeOrigem === formData.cidadeDestino) {
            newSuggestions.push('⚠️ Origem e destino são iguais. Verifique se está correto.');
          } else {
            newSuggestions.push(`✅ Mudança de ${formData.cidadeOrigem} para ${formData.cidadeDestino}`);
          }
        }
        break;
      
      case 4:
        // Sugestões para detalhes
        if (formData.tipo === 'mudanca' && formData.comodos) {
          if (formData.comodos <= 2) {
            newSuggestions.push('💡 Mudança pequena - considere carreto para economizar');
          } else if (formData.comodos >= 5) {
            newSuggestions.push('💡 Mudança grande - empresas especializadas podem oferecer melhor preço');
          }
        }
        break;
      
      case 5:
        // Sugestões para contato
        if (formData.emailCliente && formData.telefoneCliente) {
          newSuggestions.push('✅ Dados completos! Você receberá orçamentos em breve.');
        }
        break;
    }

    setSuggestions(newSuggestions);
  }, [currentStep, formData]);

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start">
        <span className="text-xl mr-2">🤖</span>
        <div className="flex-1">
          <h4 className="font-semibold text-blue-900 mb-2">Sugestões Inteligentes</h4>
          <ul className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-blue-800">
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

