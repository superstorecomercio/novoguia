"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/app/components/ui/button"
import { Card } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { ChevronRight, MapPin, Home, Building2, Phone, Mail, User, CheckCheck, Loader2, CheckCircle2, FileText, TrendingUp, Calendar, Mic } from "lucide-react"
import { cn } from "@/lib/utils"

type EstadoCalculadora = "formularioInicial" | "preview" | "capturaContato" | "resultadoFinal"

type TipoImovel = "kitnet" | "1_quarto" | "2_quartos" | "3_mais" | "comercial"

interface FormData {
  origem: string
  destino: string
  tipoImovel: TipoImovel | ""
  temElevador: "sim" | "nao" | ""
  andar: string
  precisaEmbalagem: "sim" | "nao" | ""
}

interface ContatoData {
  nome: string
  email: string
  whatsapp: string
  dataEstimada: string
}

interface ResultadoCalculo {
  precoMin: number
  precoMax: number
  faixaTexto: string
  distanciaKm?: number
  mensagemIA?: string
  cidadeOrigem?: string
  estadoOrigem?: string
  cidadeDestino?: string
  estadoDestino?: string
}

interface Message {
  id: number
  type: "bot" | "user"
  text: string
  timestamp: Date
  read?: boolean
}

const tiposImovelLabels: Record<TipoImovel, string> = {
  kitnet: "Kitnet",
  "1_quarto": "Apartamento 1 quarto",
  "2_quartos": "Apartamento 2 quartos",
  "3_mais": "Apartamento 3+ quartos ou Casa",
  comercial: "Mudança Comercial"
}

const tiposImovelPorte: Record<TipoImovel, string> = {
  kitnet: "pequeno",
  "1_quarto": "pequeno a médio",
  "2_quartos": "médio",
  "3_mais": "grande",
  comercial: "comercial"
}

// Definir as etapas do formulário conversacional (MESMAS PERGUNTAS DA ORIGINAL)
const getEtapas = () => {
  return [
    {
      id: "origem",
      pergunta: "Para começar, me diga: de onde você está saindo?",
      placeholder: "Ex: Rua das Flores, 123, Centro, São Paulo - SP",
      tipo: "text",
      icon: MapPin
    },
    {
      id: "destino",
      pergunta: "Ótimo! E para onde você está se mudando?",
      placeholder: "Ex: Av. Paulista, 1000, Bela Vista, São Paulo - SP",
      tipo: "text",
      icon: MapPin
    },
    {
      id: "tipoImovel",
      pergunta: "Qual o tipo do seu imóvel?",
      tipo: "select",
      icon: Home,
      opcoes: [
        { valor: "kitnet", label: "Kitnet" },
        { valor: "1_quarto", label: "Apartamento 1 quarto" },
        { valor: "2_quartos", label: "Apartamento 2 quartos" },
        { valor: "3_mais", label: "Apartamento 3+ quartos ou Casa" },
        { valor: "comercial", label: "Mudança Comercial" }
      ]
    },
    {
      id: "temElevador",
      pergunta: "O imóvel tem elevador?",
      tipo: "select",
      icon: Building2,
      opcoes: [
        { valor: "sim", label: "Sim" },
        { valor: "nao", label: "Não" }
      ]
    },
    {
      id: "precisaEmbalagem",
      pergunta: "Você precisa de embalagem e desmontagem de móveis?",
      tipo: "select",
      icon: Building2,
      opcoes: [
        { valor: "sim", label: "Sim, preciso de embalagem completa" },
        { valor: "nao", label: "Não, eu mesmo embalo" }
      ]
    }
  ]
}

// Etapas para captura de contato (formato conversacional)
const getEtapasContato = () => {
  return [
    {
      id: "nome",
      pergunta: "Qual é o seu nome?",
      placeholder: "Como você gostaria de ser chamado?",
      tipo: "text",
      icon: User
    },
    {
      id: "email",
      pergunta: "Qual o seu e-mail?",
      placeholder: "seuemail@exemplo.com",
      tipo: "text",
      icon: Mail
    },
    {
      id: "whatsapp",
      pergunta: "Qual o seu WhatsApp?",
      placeholder: "(11) 98765-4321",
      tipo: "text",
      icon: Phone
    },
    {
      id: "dataEstimada",
      pergunta: "Qual a data estimada da mudança? (opcional)",
      placeholder: "Selecione uma data",
      tipo: "date",
      icon: Calendar,
      opcional: true
    }
  ]
}

interface InstantCalculatorHybridTesteProps {
  onEstadoChange?: (estado: EstadoCalculadora) => void
}

export function InstantCalculatorHybridTeste({ onEstadoChange }: InstantCalculatorHybridTesteProps) {
  const [estado, setEstado] = useState<EstadoCalculadora>("formularioInicial")
  
  // Notifica mudanças de estado para o componente pai
  useEffect(() => {
    onEstadoChange?.(estado)
  }, [estado, onEstadoChange])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    origem: "",
    destino: "",
    tipoImovel: "",
    temElevador: "",
    andar: "1",
    precisaEmbalagem: ""
  })

  const [etapaAtual, setEtapaAtual] = useState(-1)
  const [etapaContatoAtual, setEtapaContatoAtual] = useState(-1) // Nova etapa para captura de contato
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [contatoData, setContatoData] = useState<ContatoData>({
    nome: "",
    email: "",
    whatsapp: "",
    dataEstimada: ""
  })
  
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null)
  
  // Lista de objetos (opcional)
  const [listaObjetos, setListaObjetos] = useState<string>("")
  const [arquivoLista, setArquivoLista] = useState<File | null>(null)
  const [listaEnviada, setListaEnviada] = useState(false)
  const [erroLista, setErroLista] = useState<string | null>(null)
  const [mostrarPerguntaLista, setMostrarPerguntaLista] = useState(false)
  const [coletandoListaObjetos, setColetandoListaObjetos] = useState(false)
  const previewExecutadoRef = useRef(false)
  const introExecutadoRef = useRef(false)

  const etapas = getEtapas()
  const etapasContato = getEtapasContato()
  const etapaAtualData = etapaAtual >= 0 ? etapas[etapaAtual] : null
  const etapaContatoAtualData = etapaContatoAtual >= 0 ? etapasContato[etapaContatoAtual] : null

  const scrollToBottom = () => {
    // Usa requestAnimationFrame para garantir que o DOM foi atualizado
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (messagesEndRef.current) {
          // No mobile, usar block: "nearest" pode funcionar melhor
          const isMobile = window.innerWidth < 768
          messagesEndRef.current.scrollIntoView({ 
            behavior: "smooth", 
            block: isMobile ? "nearest" : "end",
            inline: "nearest"
          })
        }
      }, 100)
    })
  }

  // Autoscroll quando mensagens mudam, isTyping ou loading mudam
  useEffect(() => {
    if (messages.length > 0 || isTyping || loading) {
      // Delay para garantir que o DOM foi atualizado
      const timer = setTimeout(() => {
        scrollToBottom()
      }, 150)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, isTyping, loading])

  // Inicialização com mensagens de boas-vindas
  useEffect(() => {
    if (estado === "formularioInicial" && messages.length === 0 && showIntro && !introExecutadoRef.current) {
      introExecutadoRef.current = true
      
      setTimeout(() => {
        addBotMessage("Olá! Sou a Julia 👋")
      }, 500)

      setTimeout(() => {
        addBotMessage("Vou calcular o valor da sua mudança agora — e o melhor: (o preço aparece na hora, em poucos segundos.)")
      }, 2000)

      setTimeout(() => {
        setShowIntro(false)
        setEtapaAtual(0)
        addBotMessage(etapas[0].pergunta) // Agora será apenas "De onde você vai mudar?"
      }, 3500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado])

  // Preview: adiciona mensagens e vai para captura de contato
  useEffect(() => {
    if (estado === "preview" && !previewExecutadoRef.current) {
      previewExecutadoRef.current = true
      const porte = formData.tipoImovel ? tiposImovelPorte[formData.tipoImovel as TipoImovel] : "médio"
      
      // Adiciona mensagens de preview após um pequeno delay
      setTimeout(() => {
        addBotMessage(`Sua mudança parece ser de porte ${porte} na região informada.`)
      }, 1000)
      
      setTimeout(() => {
        addBotMessage("Normalmente, mudanças desse tipo ficam em uma faixa de preço bem definida, dependendo da distância, dificuldade de acesso e volume transportado.")
      }, 3000)
      
      setTimeout(() => {
        addBotMessage("Para te mostrar a faixa real de preço baseada em centenas de mudanças parecidas e ainda te enviar (cotações verificadas de empresas de mudança), me informe um contato rápido.")
      }, 5000)
      
      setTimeout(() => {
        handleContinuarParaContato()
        previewExecutadoRef.current = false // Reset para permitir nova execução se necessário
      }, 7000)
    }
    
    // Reset quando sair do preview
    if (estado !== "preview") {
      previewExecutadoRef.current = false
    }
  }, [estado, formData.tipoImovel])

  const addBotMessage = (text: string) => {
    setIsTyping(true)
    setTimeout(() => {
      // Processa texto para negrito entre parênteses: (texto) -> **texto**
      const processedText = text.replace(/\(([^)]+)\)/g, '**$1**')
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          text: processedText,
          timestamp: new Date(),
          read: false,
        },
      ])
      setIsTyping(false)
      scrollToBottom()
      setTimeout(() => {
        setMessages((prev) => prev.map((msg) => (msg.type === "bot" && !msg.read ? { ...msg, read: true } : msg)))
      }, 800)
    }, 800)
  }

  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "user",
        text,
        timestamp: new Date(),
        read: true,
      },
    ])
    // Não faz scroll aqui - deixa o scroll acontecer quando a resposta do bot chegar
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErro(null)
  }

  // Função para formatar telefone com máscara
  const formatarTelefone = (valor: string): string => {
    const apenasNumeros = valor.replace(/\D/g, '')
    const numerosLimitados = apenasNumeros.slice(0, 11)
    
    if (numerosLimitados.length <= 2) {
      return numerosLimitados
    } else if (numerosLimitados.length <= 6) {
      return `(${numerosLimitados.slice(0, 2)}) ${numerosLimitados.slice(2)}`
    } else if (numerosLimitados.length <= 10) {
      return `(${numerosLimitados.slice(0, 2)}) ${numerosLimitados.slice(2, 6)}-${numerosLimitados.slice(6)}`
    } else {
      return `(${numerosLimitados.slice(0, 2)}) ${numerosLimitados.slice(2, 7)}-${numerosLimitados.slice(7)}`
    }
  }

  const handleWhatsAppChange = (valor: string) => {
    const formatado = formatarTelefone(valor)
    setContatoData(prev => ({ ...prev, whatsapp: formatado }))
    setErro(null)
  }

  // Função para formatar data com máscara dd/mm/yyyy
  const formatarData = (valor: string): string => {
    // Remove tudo que não é número
    const apenasNumeros = valor.replace(/\D/g, '')
    
    // Limita a 8 dígitos (ddmmyyyy)
    const numerosLimitados = apenasNumeros.slice(0, 8)
    
    // Aplica máscara baseado no tamanho
    if (numerosLimitados.length <= 2) {
      return numerosLimitados
    } else if (numerosLimitados.length <= 4) {
      return `${numerosLimitados.slice(0, 2)}/${numerosLimitados.slice(2)}`
    } else {
      return `${numerosLimitados.slice(0, 2)}/${numerosLimitados.slice(2, 4)}/${numerosLimitados.slice(4)}`
    }
  }

  // Função para validar data
  const validarData = (dataStr: string): boolean => {
    if (!dataStr || dataStr.trim() === '') return true // Vazio é válido (opcional)
    
    // Verifica formato dd/mm/yyyy
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const match = dataStr.match(regex)
    
    if (!match) return false
    
    const dia = parseInt(match[1], 10)
    const mes = parseInt(match[2], 10)
    const ano = parseInt(match[3], 10)
    
    // Validações básicas
    if (mes < 1 || mes > 12) return false
    if (dia < 1 || dia > 31) return false
    if (ano < 1900 || ano > 2100) return false
    
    // Valida data usando Date object
    const data = new Date(ano, mes - 1, dia)
    if (data.getDate() !== dia || data.getMonth() !== mes - 1 || data.getFullYear() !== ano) {
      return false
    }
    
    // Verifica se a data não é no passado
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    if (data < hoje) {
      return false
    }
    
    return true
  }

  // Handler para campo de data com máscara
  const handleDataChange = (valor: string) => {
    // Para input type="date", o valor já vem no formato YYYY-MM-DD
    setInputValue(valor)
    setErro(null)
  }
  
  // Função para converter YYYY-MM-DD para dd/mm/yyyy para exibição
  const formatarDataParaExibicao = (dataStr: string): string => {
    if (!dataStr || dataStr.trim() === '') return ''
    // Se já está no formato dd/mm/yyyy, retorna como está
    if (dataStr.includes('/')) return dataStr
    // Converte YYYY-MM-DD para dd/mm/yyyy
    const partes = dataStr.split('-')
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    }
    return dataStr
  }

  const handleSubmit = (value: string) => {
    if (!value.trim() || etapaAtual < 0 || !etapaAtualData) return

    addUserMessage(value)
    // Atualiza o formData antes de continuar
    const updatedFormData = { ...formData, [etapaAtualData.id]: value }
    setFormData(updatedFormData)
    setInputValue("")

    if (etapaAtual < etapas.length - 1) {
      setTimeout(() => {
        setEtapaAtual((prev) => prev + 1)
        addBotMessage(etapas[etapaAtual + 1].pergunta)
      }, 1000)
    } else {
      // Última etapa - atualiza formData e vai para preview
      setTimeout(() => {
        addBotMessage("Perfeito! ✅ Analisando sua rota e o porte da mudança...")
        setTimeout(() => {
          // Usa os dados atualizados
          handleCalcularEstimativa(updatedFormData)
        }, 2000)
      }, 1000)
    }
  }

  const handleOptionClick = (option: { valor: string; label: string }) => {
    const displayText = option.label
    addUserMessage(displayText)
    // Atualiza o formData antes de continuar
    const updatedFormData = { ...formData, [etapaAtualData!.id]: option.valor }
    setFormData(updatedFormData)
    
    if (etapaAtual < etapas.length - 1) {
      setTimeout(() => {
        setEtapaAtual((prev) => prev + 1)
        addBotMessage(etapas[etapaAtual + 1].pergunta)
      }, 1000)
    } else {
      // Última etapa - atualiza formData e vai para preview
      setTimeout(() => {
        addBotMessage("Perfeito! ✅ Analisando sua rota e o porte da mudança...")
        setTimeout(() => {
          // Usa os dados atualizados
          handleCalcularEstimativa(updatedFormData)
        }, 2000)
      }, 1000)
    }
  }

  const handleCalcularEstimativa = (dadosAtualizados?: Partial<FormData>) => {
    // Se dadosAtualizados foram passados, usa eles, senão usa formData
    const dados = dadosAtualizados ? { ...formData, ...dadosAtualizados } : formData
    
    const basicos = 
      dados.origem.trim() !== "" &&
      dados.destino.trim() !== "" &&
      dados.tipoImovel !== "" &&
      dados.temElevador !== "" &&
      dados.precisaEmbalagem !== ""

    if (!basicos) {
      setErro("Por favor, complete todas as etapas")
      return
    }
    
    // Garante que formData está atualizado
    if (dadosAtualizados) {
      setFormData(dados as FormData)
    }
    
    setErro(null)
    // Reset do ref antes de mudar para preview
    previewExecutadoRef.current = false
    setEstado("preview")
  }

  const handleContinuarParaContato = () => {
    setEstado("capturaContato")
    // NÃO limpa as mensagens - mantém o histórico
    setEtapaAtual(-1)
    setEtapaContatoAtual(0) // Inicia na primeira etapa de contato
    // Só adiciona a pergunta se ainda não foi adicionada
    const hasContatoMessages = messages.some(m => m.text.includes("Qual é o seu nome"))
    if (!hasContatoMessages) {
      setTimeout(() => {
        addBotMessage(etapasContato[0].pergunta)
      }, 500)
    }
  }

  const handleSubmitContatoField = (value: string) => {
    if (etapaContatoAtual < 0 || !etapaContatoAtualData) return

    // Se for opcional e vazio, pode pular
    if (etapaContatoAtualData.opcional && !value.trim()) {
      setInputValue("")
      setErro(null)
      // Avança para próxima etapa ou finaliza
      if (etapaContatoAtual < etapasContato.length - 1) {
        setTimeout(() => {
          setEtapaContatoAtual((prev) => prev + 1)
          addBotMessage(etapasContato[etapaContatoAtual + 1].pergunta)
        }, 1000)
      } else {
        setTimeout(() => {
          handleFinalizarContato()
        }, 1000)
      }
      return
    }

    // Validação: campo obrigatório não pode estar vazio
    if (!value.trim()) {
      setErro("Por favor, preencha este campo")
      return
    }

    // Validações específicas por campo
    if (etapaContatoAtualData.id === "email") {
      if (!value.includes("@") || !value.includes(".")) {
        setErro("Por favor, informe um e-mail válido")
        return
      }
    }

    if (etapaContatoAtualData.id === "whatsapp") {
      const somenteNumeros = value.replace(/\D/g, "")
      if (somenteNumeros.length < 10 || somenteNumeros.length > 11) {
        setErro("Por favor, informe um WhatsApp válido com DDD (10 ou 11 dígitos)")
        return
      }
      // value já vem formatado do input
      addUserMessage(value)
      setContatoData(prev => ({ ...prev, whatsapp: value }))
    } else if (etapaContatoAtualData.id === "dataEstimada") {
      // Para input type="date", o valor já vem no formato YYYY-MM-DD
      // Validação: verificar se é data futura
      if (value.trim()) {
        const dataSelecionada = new Date(value + 'T00:00:00')
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        
        if (dataSelecionada < hoje) {
          setErro("Por favor, selecione uma data futura")
          return
        }
      }
      // O valor já está no formato YYYY-MM-DD (formato do input date)
      const dataParaExibicao = value ? formatarDataParaExibicao(value) : "Não informado"
      addUserMessage(dataParaExibicao)
      setContatoData(prev => ({ ...prev, dataEstimada: value.trim() || "" }))
    } else {
      addUserMessage(value)
      setContatoData(prev => ({ ...prev, [etapaContatoAtualData.id]: value }))
    }

    setInputValue("")
    setErro(null)

    // Avança para próxima etapa ou finaliza
    if (etapaContatoAtual < etapasContato.length - 1) {
      setTimeout(() => {
        setEtapaContatoAtual((prev) => prev + 1)
        addBotMessage(etapasContato[etapaContatoAtual + 1].pergunta)
      }, 1000)
    } else {
      // Última etapa - pode pular se for opcional e vazio, ou finalizar
      if (etapaContatoAtualData.opcional && !value.trim()) {
        // Pula campo opcional vazio
        setTimeout(() => {
          handleFinalizarContato()
        }, 1000)
      } else {
        setTimeout(() => {
          handleFinalizarContato()
        }, 1000)
      }
    }
  }

  const handleFinalizarContato = async () => {
    // Validações finais
    if (!contatoData.nome.trim()) {
      setErro("Por favor, informe seu nome")
      return
    }
    if (!contatoData.email.trim()) {
      setErro("Por favor, informe seu e-mail")
      return
    }
    if (!contatoData.whatsapp.trim()) {
      setErro("Por favor, informe seu WhatsApp")
      return
    }

    // Pergunta sobre lista de objetos antes de calcular
    setMostrarPerguntaLista(true)
    setTimeout(() => {
      addBotMessage("Antes de calcular, você gostaria de enviar uma lista de objetos para um orçamento mais preciso?")
    }, 500)
  }

  const handleResponderLista = (querEnviar: boolean) => {
    setMostrarPerguntaLista(false)
    if (querEnviar) {
      setColetandoListaObjetos(true)
      addUserMessage("Sim, quero enviar")
      setTimeout(() => {
        addBotMessage("Perfeito! Descreva os objetos que serão transportados. Isso ajudará as empresas a preparar um orçamento mais preciso.")
      }, 1000)
    } else {
      addUserMessage("Não, pode calcular")
      setTimeout(() => {
        addBotMessage("Perfeito! Calculando o melhor orçamento para você... ⏳")
        calcularOrcamento()
      }, 500)
    }
  }

  const handleEnviarListaObjetos = () => {
    if (!listaObjetos.trim()) {
      setErro("Por favor, descreva os objetos que serão transportados")
      return
    }
    setListaEnviada(true)
    setColetandoListaObjetos(false)
    addUserMessage(listaObjetos)
    setTimeout(() => {
      addBotMessage("Lista de objetos recebida! Agora vou calcular o melhor orçamento para você... ⏳")
      setTimeout(() => {
        calcularOrcamento()
      }, 1000)
    }, 500)
  }

  const calcularOrcamento = async () => {
    setLoading(true)
    setErro(null)
    setMostrarPerguntaLista(false)
    setColetandoListaObjetos(false)

    const andarNumero = parseInt(formData.andar) || 1
    const whatsappSemMascara = contatoData.whatsapp.replace(/\D/g, "")
    
    const dadosParaEnvio = {
      origem: formData.origem.trim(),
      destino: formData.destino.trim(),
      tipoImovel: formData.tipoImovel,
      temElevador: formData.temElevador,
      andar: andarNumero,
      precisaEmbalagem: formData.precisaEmbalagem,
      nome: contatoData.nome.trim(),
      email: contatoData.email.trim(),
      whatsapp: whatsappSemMascara,
      dataEstimada: contatoData.dataEstimada?.trim() || undefined,
      listaObjetos: listaObjetos?.trim() || undefined,
      arquivoListaNome: arquivoLista?.name || undefined
    }

    // Marca o tempo de início para garantir mínimo de 1 segundo
    const inicioTempo = Date.now()
    const tempoMinimo = 1000 // 1 segundo

    try {
      const response = await fetch("/api/calcular-orcamento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dadosParaEnvio)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(errorData.error || "Erro ao calcular orçamento")
      }

      const data = await response.json()
      
      // Calcula quanto tempo passou e aguarda o restante para completar 1 segundo
      const tempoDecorrido = Date.now() - inicioTempo
      const tempoRestante = Math.max(0, tempoMinimo - tempoDecorrido)
      
      await new Promise(resolve => setTimeout(resolve, tempoRestante))
      
      setResultado(data)
      setEstado("resultadoFinal")
      setMessages([])
    } catch (error) {
      // Mesmo em caso de erro, aguarda o tempo mínimo
      const tempoDecorrido = Date.now() - inicioTempo
      const tempoRestante = Math.max(0, tempoMinimo - tempoDecorrido)
      await new Promise(resolve => setTimeout(resolve, tempoRestante))
      
      const mensagemErro = error instanceof Error ? error.message : "Ops! Algo deu errado. Por favor, tente novamente."
      setErro(mensagemErro)
      addBotMessage(`❌ ${mensagemErro}`)
    } finally {
      setLoading(false)
    }
  }


  const handleNovoCalculo = () => {
    setEstado("formularioInicial")
    setEtapaAtual(-1)
    setEtapaContatoAtual(-1)
    setFormData({
      origem: "",
      destino: "",
      tipoImovel: "",
      temElevador: "",
      andar: "1",
      precisaEmbalagem: ""
    })
    setContatoData({
      nome: "",
      email: "",
      whatsapp: "",
      dataEstimada: ""
    })
    setResultado(null)
    setErro(null)
    setListaObjetos("")
    setArquivoLista(null)
    setListaEnviada(false)
    setErroLista(null)
    setMostrarPerguntaLista(false)
    setColetandoListaObjetos(false)
    setMessages([])
    setShowIntro(true)
    setInputValue("")
    setIsTyping(false)
    setLoading(false)
    // Reset das refs para permitir que as mensagens iniciais sejam adicionadas novamente
    introExecutadoRef.current = false
    previewExecutadoRef.current = false
  }

  // ESTADO: Formulário Inicial (Conversacional)
  if (estado === "formularioInicial") {
    const Icon = etapaAtualData?.icon

    return (
      <Card className="max-w-3xl mx-auto bg-card/80 backdrop-blur-sm border-2 shadow-2xl font-[family-name:var(--font-montserrat)]">
        <div className="flex flex-col max-h-[80vh] lg:max-h-[600px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-6 space-y-3 md:space-y-4 min-h-0">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-2 md:gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500",
                  message.type === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-full overflow-hidden",
                    message.type === "bot" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  {message.type === "bot" ? (
                    <div className="h-full w-full flex items-center justify-center bg-white rounded-full p-0.5 shadow-sm overflow-hidden">
                        <Image
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face&bg=FFE5E5"
                          alt="Julia"
                          width={64}
                          height={64}
                          className="h-full w-full object-cover rounded-full"
                        />
                    </div>
                  ) : (
                    <User className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />
                  )}
                </div>
                <div className="flex flex-col gap-1 max-w-[80%]">
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 md:px-5 md:py-3 shadow-sm relative",
                      message.type === "bot" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground",
                    )}
                  >
                    <p className="text-base md:text-lg lg:text-xl leading-relaxed font-medium">
                      {message.text.split(/(\*\*.*?\*\*)/g).map((part, i) => 
                        part.startsWith('**') && part.endsWith('**') ? (
                          <strong key={i}>{part.slice(2, -2)}</strong>
                        ) : (
                          <span key={i}>{part}</span>
                        )
                      )}
                    </p>
                    <div className={cn(
                      "absolute right-3 flex items-center gap-0.5",
                      message.type === "bot" ? "bottom-1" : "bottom-0.5"
                    )}>
                      {message.type === "bot" ? (
                        <>
                          <CheckCheck className="h-3.5 w-3.5 -ml-0.5 text-blue-500" />
                          <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                        </>
                      ) : (
                        <>
                          <CheckCheck className="h-3.5 w-3.5 -ml-0.5 text-blue-500" />
                          <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                        </>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    "text-xs px-2",
                    message.type === "user" ? "text-right" : "text-left",
                    "text-muted-foreground"
                  )}>
                    {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start gap-2 md:gap-3 animate-in fade-in">
                <div className="flex h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-full overflow-hidden">
                  <div className="h-full w-full flex items-center justify-center bg-white rounded-full p-0.5 shadow-sm overflow-hidden">
                        <Image
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face&bg=FFE5E5"
                          alt="Julia"
                          width={64}
                          height={64}
                          className="h-full w-full object-cover rounded-full"
                        />
                  </div>
                </div>
                <div className="rounded-2xl px-4 py-2.5 md:px-5 md:py-3 bg-muted">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-start gap-3 animate-in fade-in">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full overflow-hidden">
                  <div className="h-full w-full flex items-center justify-center bg-white rounded-full p-0.5 shadow-sm overflow-hidden">
                        <Image
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face&bg=FFE5E5"
                          alt="Julia"
                          width={64}
                          height={64}
                          className="h-full w-full object-cover rounded-full"
                        />
                  </div>
                </div>
                <div className="rounded-2xl px-4 py-2.5 md:px-5 md:py-3 bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    <span className="text-sm text-muted-foreground">Calculando orçamento...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {etapaAtual >= 0 && !isTyping && !loading && messages.length > 0 && etapaAtualData && (
            <div className="border-t bg-background/50 p-4 space-y-3">
              {etapaAtualData.tipo === "select" && etapaAtualData.opcoes ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {etapaAtualData.opcoes.map((opcao) => (
                    <Button
                      key={opcao.valor}
                      onClick={() => handleOptionClick(opcao)}
                      variant="outline"
                      className="justify-start h-auto py-3 px-4 text-left hover:bg-primary hover:text-primary-foreground transition-all text-base font-medium"
                    >
                      <ChevronRight className="mr-2 h-5 w-5 shrink-0" />
                      <span>{opcao.label}</span>
                    </Button>
                  ))}
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSubmit(inputValue)
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />}
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={etapaAtualData.placeholder}
                      className={cn(
                        "h-14 text-base font-medium rounded-xl shadow-md border-2 border-border/50 focus:border-primary focus:shadow-lg transition-all",
                        Icon && "pl-12 pr-12"
                      )}
                      autoFocus
                    />
                    <Mic className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
                  </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-14 w-14 md:w-auto md:px-6 text-base font-semibold rounded-xl shadow-md bg-green-500 hover:bg-green-600 text-white hover:brightness-110 transition-all duration-200 hover:shadow-lg flex items-center justify-center"
                  disabled={!inputValue.trim()}
                >
                  <span className="hidden md:inline">Enviar</span>
                  <ChevronRight className={cn("h-5 w-5", "md:ml-2 md:h-4 md:w-4")} />
                </Button>
                </form>
              )}
              {erro && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <p className="text-sm text-destructive">{erro}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    )
  }

  // ESTADO: Preview (agora no formato conversacional)
  if (estado === "preview") {
    return (
      <Card className="max-w-3xl mx-auto bg-card/80 backdrop-blur-sm border-2 shadow-2xl font-[family-name:var(--font-montserrat)]">
        <div className="flex flex-col max-h-[80vh] lg:max-h-[600px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-6 space-y-3 md:space-y-4 min-h-0">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-2 md:gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500",
                  message.type === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-full overflow-hidden",
                    message.type === "bot" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  {message.type === "bot" ? (
                    <div className="h-full w-full flex items-center justify-center bg-white rounded-full p-0.5 shadow-sm overflow-hidden">
                        <Image
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face&bg=FFE5E5"
                          alt="Julia"
                          width={64}
                          height={64}
                          className="h-full w-full object-cover rounded-full"
                        />
                    </div>
                  ) : (
                    <User className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />
                  )}
                </div>
                <div className="flex flex-col gap-1 max-w-[80%]">
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 md:px-5 md:py-3 shadow-sm relative",
                      message.type === "bot" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground",
                    )}
                  >
                    <p className="text-base md:text-lg lg:text-xl leading-relaxed font-medium">
                      {message.text.split(/(\*\*.*?\*\*)/g).map((part, i) => 
                        part.startsWith('**') && part.endsWith('**') ? (
                          <strong key={i}>{part.slice(2, -2)}</strong>
                        ) : (
                          <span key={i}>{part}</span>
                        )
                      )}
                    </p>
                    <div className={cn(
                      "absolute right-3 flex items-center gap-0.5",
                      message.type === "bot" ? "bottom-1" : "bottom-0.5"
                    )}>
                      {message.type === "bot" ? (
                        <>
                          <CheckCheck className="h-3.5 w-3.5 -ml-0.5 text-blue-500" />
                          <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                        </>
                      ) : (
                        <>
                          <CheckCheck className="h-3.5 w-3.5 -ml-0.5 text-blue-500" />
                          <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                        </>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    "text-xs px-2",
                    message.type === "user" ? "text-right" : "text-left",
                    "text-muted-foreground"
                  )}>
                    {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start gap-2 md:gap-3 animate-in fade-in">
                <div className="flex h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-full overflow-hidden">
                  <div className="h-full w-full flex items-center justify-center bg-white rounded-full p-0.5 shadow-sm overflow-hidden">
                        <Image
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face&bg=FFE5E5"
                          alt="Julia"
                          width={64}
                          height={64}
                          className="h-full w-full object-cover rounded-full"
                        />
                  </div>
                </div>
                <div className="rounded-2xl px-4 py-2.5 md:px-5 md:py-3 bg-muted">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-start gap-3 animate-in fade-in">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full overflow-hidden">
                  <div className="h-full w-full flex items-center justify-center bg-white rounded-full p-0.5 shadow-sm overflow-hidden">
                        <Image
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face&bg=FFE5E5"
                          alt="Julia"
                          width={64}
                          height={64}
                          className="h-full w-full object-cover rounded-full"
                        />
                  </div>
                </div>
                <div className="rounded-2xl px-4 py-2.5 md:px-5 md:py-3 bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    <span className="text-sm text-muted-foreground">Calculando orçamento...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </Card>
    )
  }

  // ESTADO: Captura de Contato (formato conversacional)
  if (estado === "capturaContato") {
    const Icon = etapaContatoAtualData?.icon

    return (
      <Card className="max-w-3xl mx-auto bg-card/80 backdrop-blur-sm border-2 shadow-2xl font-[family-name:var(--font-montserrat)]">
        <div className="flex flex-col max-h-[80vh] lg:max-h-[600px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-6 space-y-3 md:space-y-4 min-h-0">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-2 md:gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500",
                  message.type === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-full overflow-hidden",
                    message.type === "bot" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  {message.type === "bot" ? (
                    <div className="h-full w-full flex items-center justify-center bg-white rounded-full p-0.5 shadow-sm overflow-hidden">
                        <Image
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face&bg=FFE5E5"
                          alt="Julia"
                          width={64}
                          height={64}
                          className="h-full w-full object-cover rounded-full"
                        />
                    </div>
                  ) : (
                    <User className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />
                  )}
                </div>
                <div className="flex flex-col gap-1 max-w-[80%]">
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 md:px-5 md:py-3 shadow-sm relative",
                      message.type === "bot" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground",
                    )}
                  >
                    <p className="text-base md:text-lg lg:text-xl leading-relaxed font-medium">
                      {message.text.split(/(\*\*.*?\*\*)/g).map((part, i) => 
                        part.startsWith('**') && part.endsWith('**') ? (
                          <strong key={i}>{part.slice(2, -2)}</strong>
                        ) : (
                          <span key={i}>{part}</span>
                        )
                      )}
                    </p>
                    <div className={cn(
                      "absolute right-3 flex items-center gap-0.5",
                      message.type === "bot" ? "bottom-1" : "bottom-0.5"
                    )}>
                      {message.type === "bot" ? (
                        <>
                          <CheckCheck className="h-3.5 w-3.5 -ml-0.5 text-blue-500" />
                          <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                        </>
                      ) : (
                        <>
                          <CheckCheck className="h-3.5 w-3.5 -ml-0.5 text-blue-500" />
                          <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                        </>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    "text-xs px-2",
                    message.type === "user" ? "text-right" : "text-left",
                    "text-muted-foreground"
                  )}>
                    {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start gap-2 md:gap-3 animate-in fade-in">
                <div className="flex h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-full overflow-hidden">
                  <div className="h-full w-full flex items-center justify-center bg-white rounded-full p-0.5 shadow-sm overflow-hidden">
                        <Image
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face&bg=FFE5E5"
                          alt="Julia"
                          width={64}
                          height={64}
                          className="h-full w-full object-cover rounded-full"
                        />
                  </div>
                </div>
                <div className="rounded-2xl px-4 py-2.5 md:px-5 md:py-3 bg-muted">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-start gap-3 animate-in fade-in">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full overflow-hidden">
                  <div className="h-full w-full flex items-center justify-center bg-white rounded-full p-0.5 shadow-sm overflow-hidden">
                        <Image
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face&bg=FFE5E5"
                          alt="Julia"
                          width={64}
                          height={64}
                          className="h-full w-full object-cover rounded-full"
                        />
                  </div>
                </div>
                <div className="rounded-2xl px-4 py-2.5 md:px-5 md:py-3 bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    <span className="text-sm text-muted-foreground">Calculando orçamento...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Pergunta sobre lista de objetos */}
          {mostrarPerguntaLista && !isTyping && !loading && (
            <div className="border-t bg-background/50 p-4 space-y-3 flex-shrink-0">
              <div className="flex flex-col md:flex-row gap-3 md:gap-3 justify-end">
                <Button
                  onClick={() => handleResponderLista(false)}
                  size="lg"
                  variant="outline"
                  className="w-full md:w-auto md:flex-1 h-14 text-base font-semibold rounded-xl order-2 md:order-1"
                >
                  Não, pode calcular
                </Button>
                <Button
                  onClick={() => handleResponderLista(true)}
                  size="lg"
                  className="w-full md:w-auto md:flex-1 h-14 text-base font-semibold rounded-xl shadow-md bg-orange-500 hover:bg-orange-600 text-white hover:brightness-110 transition-all duration-200 hover:shadow-lg order-1 md:order-2"
                >
                  Sim, quero enviar
                </Button>
              </div>
            </div>
          )}

          {/* Input Area para Lista de Objetos */}
          {coletandoListaObjetos && !isTyping && !loading && (
            <div className="border-t bg-background/50 p-4 space-y-3 flex-shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleEnviarListaObjetos()
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                  <Input
                    value={listaObjetos}
                    onChange={(e) => {
                      setListaObjetos(e.target.value)
                      setErro(null)
                    }}
                    placeholder="Ex: Sofá de 3 lugares, mesa de jantar com 6 cadeiras, geladeira, fogão, guarda-roupa, cama de casal..."
                    className="h-14 text-base font-medium rounded-xl shadow-md border-2 border-border/50 focus:border-primary focus:shadow-lg transition-all pl-12 pr-12"
                    autoFocus
                  />
                  <Mic className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-14 w-14 md:w-auto md:px-6 text-base font-semibold rounded-xl shadow-md bg-green-500 hover:bg-green-600 text-white hover:brightness-110 transition-all duration-200 hover:shadow-lg flex items-center justify-center"
                  disabled={!listaObjetos.trim()}
                >
                  <span className="hidden md:inline">Enviar</span>
                  <ChevronRight className={cn("h-5 w-5", "md:ml-2 md:h-4 md:w-4")} />
                </Button>
              </form>
              {erro && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <p className="text-sm text-destructive">{erro}</p>
                </div>
              )}
            </div>
          )}

          {/* Input Area - Formato conversacional */}
          {etapaContatoAtual >= 0 && !isTyping && !loading && messages.length > 0 && etapaContatoAtualData && !mostrarPerguntaLista && !coletandoListaObjetos && (
            <div className="border-t bg-background/50 p-4 space-y-3 flex-shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSubmitContatoField(inputValue)
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />}
                  <Input
                    value={inputValue}
                    onChange={(e) => {
                      if (etapaContatoAtualData.id === "whatsapp") {
                        handleWhatsAppChange(e.target.value)
                        setInputValue(formatarTelefone(e.target.value))
                      } else if (etapaContatoAtualData.id === "dataEstimada") {
                        handleDataChange(e.target.value)
                      } else {
                        setInputValue(e.target.value)
                      }
                    }}
                    placeholder={etapaContatoAtualData.placeholder}
                    className={cn(
                      "h-14 text-base font-medium rounded-xl shadow-md border-2 border-border/50 focus:border-primary focus:shadow-lg transition-all",
                      Icon && "pl-12 pr-12",
                      etapaContatoAtualData.id === "dataEstimada" && "date-picker-custom"
                    )}
                    autoFocus
                    type={etapaContatoAtualData.id === "email" ? "email" : etapaContatoAtualData.id === "whatsapp" ? "tel" : etapaContatoAtualData.id === "dataEstimada" ? "date" : "text"}
                    min={new Date().toISOString().split('T')[0]} // Data mínima = hoje
                    maxLength={etapaContatoAtualData.id === "whatsapp" ? 15 : undefined}
                  />
                  <Mic className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-14 w-14 md:w-auto md:px-6 text-base font-semibold rounded-xl shadow-md bg-green-500 hover:bg-green-600 text-white hover:brightness-110 transition-all duration-200 hover:shadow-lg flex items-center justify-center"
                  disabled={!inputValue.trim() && !etapaContatoAtualData.opcional}
                >
                  <span className="hidden md:inline">Enviar</span>
                  <ChevronRight className={cn("h-5 w-5", "md:ml-2 md:h-4 md:w-4")} />
                </Button>
              </form>
              {erro && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <p className="text-sm text-destructive">{erro}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    )
  }

  // ESTADO: Resultado Final
  if (estado === "resultadoFinal" && resultado) {
    return (
      <Card className="w-full max-w-2xl mx-auto p-6 lg:p-8 shadow-xl border-0 bg-white">
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              Pronto! Aqui está a faixa estimada para sua mudança 👇
            </h2>
          </div>

          <div className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-primary/10 text-center space-y-4">
            <p className="text-sm text-muted-foreground uppercase font-semibold tracking-wide">
              Valor estimado
            </p>
            <p className="text-4xl lg:text-5xl font-bold text-primary">
              R$ {resultado.precoMin.toLocaleString("pt-BR")} - R$ {resultado.precoMax.toLocaleString("pt-BR")}
            </p>
            {resultado.distanciaKm && (
              <p className="text-sm text-muted-foreground">
                📍 Distância calculada: <span className="font-semibold text-foreground">{resultado.distanciaKm} km</span>
              </p>
            )}
            <p className="text-muted-foreground leading-relaxed">
              Com base nos dados informados e em mudanças semelhantes na sua região, o valor costuma ficar 
              entre <span className="font-semibold text-foreground">R$ {resultado.precoMin.toLocaleString("pt-BR")}</span> e{" "}
              <span className="font-semibold text-foreground">R$ {resultado.precoMax.toLocaleString("pt-BR")}</span>.
            </p>
          </div>

          {listaObjetos?.trim() && (
            <div className="p-5 bg-green-50 rounded-xl border border-green-200">
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-green-900">
                    ✅ Lista de objetos incluída no orçamento
                  </p>
                  <p className="text-xs text-green-700 leading-relaxed">
                    As empresas receberão sua lista para preparar propostas mais precisas!
                  </p>
                </div>
              </div>
            </div>
          )}

          {resultado.mensagemIA && (
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">
                    Análise da IA
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {resultado.mensagemIA}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="flex items-start gap-3">
              <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <p className="font-semibold text-foreground">
                  Empresas qualificadas entrarão em contato
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Empresas qualificadas e verificadas entrarão em contato com você por <span className="font-semibold text-foreground">WhatsApp</span> ou <span className="font-semibold text-foreground">e-mail</span> para apresentar propostas personalizadas para sua mudança.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-6 bg-muted/30 rounded-2xl">
            <h3 className="font-semibold text-foreground mb-4">Resumo da sua mudança:</h3>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium text-foreground">{contatoData.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Origem:</span>
                <span className="font-medium text-foreground">
                  {resultado.cidadeOrigem && resultado.estadoOrigem 
                    ? `${resultado.cidadeOrigem}, ${resultado.estadoOrigem}`
                    : formData.origem}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destino:</span>
                <span className="font-medium text-foreground">
                  {resultado.cidadeDestino && resultado.estadoDestino 
                    ? `${resultado.cidadeDestino}, ${resultado.estadoDestino}`
                    : formData.destino}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo de imóvel:</span>
                <span className="font-medium text-foreground">
                  {formData.tipoImovel && tiposImovelLabels[formData.tipoImovel as TipoImovel]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Elevador:</span>
                <span className="font-medium text-foreground">{formData.temElevador === "sim" ? "Sim" : "Não"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Embalagem:</span>
                <span className="font-medium text-foreground">
                  {formData.precisaEmbalagem === "sim" ? "Sim, completa" : "Não precisa"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">E-mail:</span>
                <span className="font-medium text-foreground">{contatoData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">WhatsApp:</span>
                <span className="font-medium text-foreground">{contatoData.whatsapp}</span>
              </div>
              {contatoData.dataEstimada && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data estimada:</span>
                  <span className="font-medium text-foreground">
                    {new Date(contatoData.dataEstimada + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              size="lg"
              variant="outline"
              onClick={handleNovoCalculo}
              className="flex-1 rounded-xl font-semibold bg-transparent"
            >
              Fazer nova cotação
            </Button>
            <Button
              size="lg"
              onClick={() => window.location.href = "/"}
              className="flex-1 rounded-xl font-semibold"
            >
              Voltar para Home
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return null
}
