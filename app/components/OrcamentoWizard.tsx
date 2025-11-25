'use client';

import { useState, useEffect, useRef } from 'react';
import { type OrcamentoFormData, type ServiceType } from '../types';
import Button from './Button';
import CityAutocomplete from './CityAutocomplete';
import PhoneInput from './PhoneInput';
import EmailInput from './EmailInput';
import AddressInput from './AddressInput';
import BairroInput from './BairroInput';
import SmartTextarea from './SmartTextarea';
import SmartSuggestions from './SmartSuggestions';

interface OrcamentoWizardProps {
  initialData?: Partial<OrcamentoFormData>;
  onComplete?: (data: OrcamentoFormData) => void;
}

interface ChatMessage {
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

const STEPS = [
  { id: 1, title: 'Tipo de Serviço' },
  { id: 2, title: 'Origem' },
  { id: 3, title: 'Destino' },
  { id: 4, title: 'Detalhes' },
  { id: 5, title: 'Contato' },
];

export default function OrcamentoWizard({ initialData, onComplete }: OrcamentoWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [typedQuestion, setTypedQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar dados salvos do localStorage
  const loadSavedData = (): Partial<OrcamentoFormData> => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem('orcamento_draft');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const [formData, setFormData] = useState<Partial<OrcamentoFormData>>({
    tipo: 'mudanca',
    ...loadSavedData(),
    ...initialData,
  });

  // Salvar automaticamente no localStorage a cada mudança
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('orcamento_draft', JSON.stringify(formData));
    }
  }, [formData]);

  // Efeito de digitação da IA
  useEffect(() => {
    setIsTyping(true);
    setTypedQuestion('');
    
    const question = getIaQuestion();
    let currentIndex = 0;
    let scrollDone = false; // Flag para garantir que scroll só aconteça uma vez

    const typeChar = () => {
      if (currentIndex < question.length) {
        setTypedQuestion(question.slice(0, currentIndex + 1));
        currentIndex++;
        typingTimeoutRef.current = setTimeout(typeChar, 30); // Velocidade de digitação
      } else {
        setIsTyping(false);
        // Scroll apenas uma vez quando terminar completamente de digitar
        if (!scrollDone) {
          scrollDone = true;
          setTimeout(() => {
            // Usar scrollTo com cálculo de posição para evitar scroll excessivo
            const container = document.getElementById('chat-container');
            if (container && chatEndRef.current) {
              const containerRect = container.getBoundingClientRect();
              const elementRect = chatEndRef.current.getBoundingClientRect();
              
              // Só fazer scroll se o elemento não estiver visível
              if (elementRect.bottom > containerRect.bottom || elementRect.top < containerRect.top) {
                chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }
          }, 150);
        }
      }
    };

    const startDelay = setTimeout(() => {
      typeChar();
    }, 200);

    return () => {
      clearTimeout(startDelay);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [currentStep]);

  // Removido: scroll agora acontece apenas quando termina de digitar (dentro do typeChar)

  const getIaQuestion = (): string => {
    switch (currentStep) {
      case 1:
        return 'Oi! 👋 Eu sou o assistente inteligente do MudaTech. Primeiro, me conta que tipo de serviço você precisa hoje?';
      case 2:
        return 'Perfeito! Agora, de qual cidade seus móveis vão sair?';
      case 3:
        return 'Legal! E para qual cidade você está indo com essa mudança?';
      case 4:
        return 'Ótimo! Me dá mais alguns detalhes sobre o tamanho da mudança pra eu estimar melhor.';
      case 5:
        return 'Quase lá! Pra finalizar, me passa seus dados de contato pra que as empresas possam te responder. 😊';
      default:
        return '';
    }
  };

  const updateFormData = <K extends keyof OrcamentoFormData>(field: K, value: OrcamentoFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addUserMessage = (content: string) => {
    setChatHistory((prev) => {
      const newHistory = [
        ...prev,
        { type: 'user' as const, content, timestamp: new Date() },
      ];
      // Scroll suave após adicionar mensagem, mas sem forçar muito
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
      return newHistory;
    });
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      // Adicionar resposta do usuário ao histórico antes de avançar
      const userResponse = getUserResponseForStep(currentStep);
      if (userResponse) {
        addUserMessage(userResponse);
      }
      
      // Pequeno delay para mostrar a resposta antes de avançar
      setTimeout(() => {
        goToStep(currentStep + 1);
      }, userResponse ? 400 : 100);
    }
  };

  const getUserResponseForStep = (step: number): string | null => {
    switch (step) {
      case 1:
        if (formData.tipo) {
          return `Preciso de ${formData.tipo === 'mudanca' ? 'mudança' : formData.tipo === 'carreto' ? 'carreto' : 'guarda-móveis'}`;
        }
        return null;
      case 2:
        if (formData.cidadeOrigem) {
          return `Saindo de ${formData.cidadeOrigem}${formData.estadoOrigem ? `, ${formData.estadoOrigem}` : ''}`;
        }
        return null;
      case 3:
        if (formData.cidadeDestino) {
          return `Indo para ${formData.cidadeDestino}${formData.estadoDestino ? `, ${formData.estadoDestino}` : ''}`;
        }
        return null;
      case 4:
        if (formData.descricao || formData.comodos || formData.pecas) {
          return 'Detalhes informados ✓';
        }
        return null;
      default:
        return null;
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!formData.tipo;
      case 2:
        return !!formData.cidadeOrigem;
      case 3:
        return !!formData.cidadeDestino;
      case 4:
        return true;
      case 5:
        return !!(
          formData.nomeCliente &&
          formData.emailCliente &&
          formData.telefoneCliente &&
          formData.dataEstimada
        );
      default:
        return false;
    }
  };

  const isFormFullyValid = (): boolean => {
    return !!(
      formData.tipo &&
      formData.cidadeOrigem &&
      formData.cidadeDestino &&
      formData.nomeCliente &&
      formData.emailCliente &&
      formData.telefoneCliente &&
      formData.dataEstimada
    );
  };

  const handleSubmit = () => {
    if (!isFormFullyValid()) return;

    if (onComplete) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('orcamento_draft');
      }
      onComplete(formData as OrcamentoFormData);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Cabeçalho estilo chat moderno */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg border-2 border-white/30">
                AI
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-base">
                Assistente MudaTech
              </p>
              <p className="text-blue-100 text-xs flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Online • respondendo em tempo real
              </p>
            </div>
          </div>
        </div>

        {/* Área de chat */}
        <div id="chat-container" className="p-6 space-y-6 min-h-[500px] max-h-[700px] overflow-y-auto">
          {/* Histórico de mensagens */}
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Mensagem da IA atual */}
          <div className="flex justify-start animate-fadeIn">
            <div className="max-w-[85%] bg-gray-100 rounded-2xl px-4 py-3">
              {isTyping ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">{typedQuestion}</span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                </div>
              ) : (
                <p className="text-sm text-gray-800">{typedQuestion || getIaQuestion()}</p>
              )}
            </div>
          </div>

          {/* Barra de progresso sutil */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-500">
                Etapa {currentStep} de {STEPS.length}
              </span>
              <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Formulário atual */}
          <div className="space-y-4 animate-slideUp">
            {/* Step 1: Tipo de Serviço */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(['mudanca', 'carreto', 'guardamoveis'] as ServiceType[]).map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => updateFormData('tipo', tipo)}
                      className={`group p-5 border-2 rounded-2xl text-left transition-all duration-200 ${
                        formData.tipo === tipo
                          ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      <div className="text-3xl mb-2 transform group-hover:scale-110 transition-transform">
                        {tipo === 'mudanca' && '🏠'}
                        {tipo === 'carreto' && '🚚'}
                        {tipo === 'guardamoveis' && '📦'}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {tipo === 'mudanca' && 'Mudança'}
                        {tipo === 'carreto' && 'Carreto'}
                        {tipo === 'guardamoveis' && 'Guarda-Móveis'}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {tipo === 'mudanca' && 'Mudança residencial ou comercial completa.'}
                        {tipo === 'carreto' && 'Transporte rápido de alguns móveis/objetos.'}
                        {tipo === 'guardamoveis' && 'Armazenamento seguro por tempo determinado.'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Origem */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <CityAutocomplete
                  estado={formData.estadoOrigem}
                  value={formData.cidadeOrigem || ''}
                  onChange={(value, estado) => {
                    updateFormData('cidadeOrigem', value as any);
                    if (estado) {
                      updateFormData('estadoOrigem', estado as any);
                    }
                  }}
                  onEstadoDetected={(estado) => {
                    updateFormData('estadoOrigem', estado as any);
                  }}
                  placeholder="Digite a cidade de origem..."
                  required
                  label=""
                />
                {formData.estadoOrigem && (
                  <div className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    ✓ Estado detectado: {formData.estadoOrigem}
                  </div>
                )}
                {formData.cidadeOrigem && (
                  <>
                    <AddressInput
                      cidade={formData.cidadeOrigem}
                      estado={formData.estadoOrigem}
                      value={formData.enderecoOrigem || ''}
                      onChange={(value) => updateFormData('enderecoOrigem', value as any)}
                      label=""
                      placeholder="Endereço (opcional)"
                    />
                    <BairroInput
                      cidade={formData.cidadeOrigem}
                      estado={formData.estadoOrigem}
                      value={formData.bairroOrigem || ''}
                      onChange={(value) => updateFormData('bairroOrigem', value as any)}
                      label=""
                      placeholder="Bairro (opcional)"
                    />
                  </>
                )}
                <div>
                  <select
                    value={formData.tipoOrigem || ''}
                    onChange={(e) => updateFormData('tipoOrigem', e.target.value as any)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                  >
                    <option value="">Tipo de imóvel (opcional)</option>
                    <option value="casa">Casa</option>
                    <option value="apartamento">Apartamento</option>
                    <option value="comercial">Comercial</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Destino */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <CityAutocomplete
                  estado={formData.estadoDestino}
                  value={formData.cidadeDestino || ''}
                  onChange={(value, estado) => {
                    updateFormData('cidadeDestino', value as any);
                    if (estado) {
                      updateFormData('estadoDestino', estado as any);
                    }
                  }}
                  onEstadoDetected={(estado) => {
                    updateFormData('estadoDestino', estado as any);
                  }}
                  placeholder="Digite a cidade de destino..."
                  required
                  label=""
                />
                {formData.estadoDestino && (
                  <div className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    ✓ Estado detectado: {formData.estadoDestino}
                  </div>
                )}
                {formData.cidadeDestino && (
                  <>
                    <AddressInput
                      cidade={formData.cidadeDestino}
                      estado={formData.estadoDestino}
                      value={formData.enderecoDestino || ''}
                      onChange={(value) => updateFormData('enderecoDestino', value as any)}
                      label=""
                      placeholder="Endereço (opcional)"
                    />
                    <BairroInput
                      cidade={formData.cidadeDestino}
                      estado={formData.estadoDestino}
                      value={formData.bairroDestino || ''}
                      onChange={(value) => updateFormData('bairroDestino', value as any)}
                      label=""
                      placeholder="Bairro (opcional)"
                    />
                  </>
                )}
                <div>
                  <select
                    value={formData.tipoDestino || ''}
                    onChange={(e) => updateFormData('tipoDestino', e.target.value as any)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                  >
                    <option value="">Tipo de imóvel (opcional)</option>
                    <option value="casa">Casa</option>
                    <option value="apartamento">Apartamento</option>
                    <option value="comercial">Comercial</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 4: Detalhes */}
            {currentStep === 4 && (
              <div className="space-y-4">
                {formData.tipo === 'mudanca' && (
                  <>
                    <div>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={formData.comodos || ''}
                        onChange={(e) =>
                          updateFormData('comodos', (e.target.value ? parseInt(e.target.value, 10) : undefined) as any)
                        }
                        placeholder="Número de cômodos"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        💡 1-2 = pequena, 3-4 = média, 5+ = grande
                      </p>
                    </div>
                    <div>
                      <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition-all">
                        <input
                          type="checkbox"
                          checked={formData.precisaEmbalagem || false}
                          onChange={(e) => updateFormData('precisaEmbalagem', e.target.checked as any)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">
                            Precisa de embalagem?
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            A empresa vai embalar seus móveis e objetos
                          </p>
                        </div>
                      </label>
                    </div>
                  </>
                )}

                {formData.tipo === 'carreto' && (
                  <div>
                    <input
                      type="number"
                      min="1"
                      value={formData.pecas || ''}
                      onChange={(e) =>
                        updateFormData('pecas', (e.target.value ? parseInt(e.target.value, 10) : undefined) as any)
                      }
                      placeholder="Número de peças"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      💡 Conte cada móvel ou objeto grande separadamente
                    </p>
                  </div>
                )}

                {formData.tipo === 'guardamoveis' && (
                  <>
                    <div>
                      <input
                        type="text"
                        value={formData.tempoArmazenamento || ''}
                        onChange={(e) => updateFormData('tempoArmazenamento', e.target.value as any)}
                        placeholder="Tempo de armazenamento (ex: 3 meses)"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                      />
                    </div>
                    <SmartTextarea
                      value={formData.oQuePrecisa || ''}
                      onChange={(value) => updateFormData('oQuePrecisa', value as any)}
                      label=""
                      placeholder="O que precisa guardar?"
                      rows={4}
                      tipoServico="guardamoveis"
                    />
                  </>
                )}

                <SmartTextarea
                  value={formData.descricao || ''}
                  onChange={(value) => updateFormData('descricao', value as any)}
                  label=""
                  placeholder="Descrição adicional (opcional)"
                  rows={4}
                  tipoServico={formData.tipo === 'mudanca' || formData.tipo === 'carreto' || formData.tipo === 'guardamoveis' ? formData.tipo : undefined}
                />
              </div>
            )}

            {/* Step 5: Contato */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={formData.nomeCliente || ''}
                  onChange={(e) => updateFormData('nomeCliente', e.target.value as any)}
                  placeholder="Nome completo *"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                  required
                />
                <EmailInput
                  value={formData.emailCliente || ''}
                  onChange={(value) => updateFormData('emailCliente', value as any)}
                  label=""
                  required
                />
                <PhoneInput
                  value={formData.telefoneCliente || ''}
                  onChange={(value) => updateFormData('telefoneCliente', value as any)}
                  label=""
                  required
                />
                <input
                  type="date"
                  value={formData.dataEstimada || ''}
                  onChange={(e) => updateFormData('dataEstimada', e.target.value as any)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                  required
                />
                <div>
                  <p className="text-xs text-gray-600 mb-2">Preferência de contato:</p>
                  <div className="flex flex-wrap gap-3">
                    {['whatsapp', 'email', 'telefone'].map((pref) => (
                      <label key={pref} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.preferenciaContato?.includes(pref as any) || false}
                          onChange={(e) => {
                            const current = formData.preferenciaContato || [];
                            if (e.target.checked) {
                              updateFormData('preferenciaContato', [...current, pref as any] as any);
                            } else {
                              updateFormData('preferenciaContato', current.filter((p) => p !== pref) as any);
                            }
                          }}
                          className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm capitalize text-gray-700">{pref}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sugestões Inteligentes */}
            <SmartSuggestions currentStep={currentStep} formData={formData} />
          </div>

          <div ref={chatEndRef} />
        </div>

        {/* Navegação estilo chat moderno */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                type="button"
                variant="primary"
                onClick={nextStep}
                disabled={!isStepValid()}
                className="px-8 py-2.5 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continuar →
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                disabled={!isFormFullyValid()}
                className="px-8 py-2.5 rounded-xl font-medium bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ✓ Enviar para empresas
              </Button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
