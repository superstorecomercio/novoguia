"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Card } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Loader2, MapPin, Home, Building2, Phone, Mail, CheckCircle2, TrendingUp, Upload, FileText, X } from "lucide-react"

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

export function InstantCalculatorHybrid() {
  const [estado, setEstado] = useState<EstadoCalculadora>("formularioInicial")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    origem: "",
    destino: "",
    tipoImovel: "",
    temElevador: "",
    andar: "1", // Valor padrão: térreo/1º andar
    precisaEmbalagem: ""
  })

  // Etapas do formulário conversacional
  const [etapaAtual, setEtapaAtual] = useState(0)

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
  const [enviandoLista, setEnviandoLista] = useState(false)
  const [listaEnviada, setListaEnviada] = useState(false)
  const [erroLista, setErroLista] = useState<string | null>(null)

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErro(null)
  }

  // Função para formatar telefone com máscara
  const formatarTelefone = (valor: string): string => {
    // Remove tudo que não é número
    const apenasNumeros = valor.replace(/\D/g, '')
    
    // Limita a 11 dígitos (DDD + 9 dígitos para celular ou 8 para fixo)
    const numerosLimitados = apenasNumeros.slice(0, 11)
    
    // Aplica máscara baseado no tamanho
    if (numerosLimitados.length <= 2) {
      return numerosLimitados
    } else if (numerosLimitados.length <= 6) {
      return `(${numerosLimitados.slice(0, 2)}) ${numerosLimitados.slice(2)}`
    } else if (numerosLimitados.length <= 10) {
      // Telefone fixo: (XX) XXXX-XXXX
      return `(${numerosLimitados.slice(0, 2)}) ${numerosLimitados.slice(2, 6)}-${numerosLimitados.slice(6)}`
    } else {
      // Celular: (XX) XXXXX-XXXX
      return `(${numerosLimitados.slice(0, 2)}) ${numerosLimitados.slice(2, 7)}-${numerosLimitados.slice(7)}`
    }
  }

  // Handler para campo de WhatsApp com máscara
  const handleWhatsAppChange = (valor: string) => {
    const formatado = formatarTelefone(valor)
    setContatoData(prev => ({ ...prev, whatsapp: formatado }))
    setErro(null)
  }

  // Definir as etapas do formulário conversacional
  const getEtapas = () => {
    const etapas = [
      {
        id: "origem",
        pergunta: "Olá! 👋 Vamos começar. De onde você vai mudar?",
        placeholder: "Ex: Moema, São Paulo - SP",
        tipo: "text"
      },
      {
        id: "destino",
        pergunta: "Ótimo! E para onde você está se mudando?",
        placeholder: "Ex: Santana, São Paulo - SP",
        tipo: "text"
      },
      {
        id: "tipoImovel",
        pergunta: "Qual o tipo do seu imóvel?",
        tipo: "select",
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
        opcoes: [
          { valor: "sim", label: "Sim" },
          { valor: "nao", label: "Não" }
        ]
      },
      {
        id: "precisaEmbalagem",
        pergunta: "Você precisa de embalagem e desmontagem de móveis?",
        tipo: "select",
        opcoes: [
          { valor: "sim", label: "Sim, preciso de embalagem completa" },
          { valor: "nao", label: "Não, eu mesmo embalo" }
        ]
      }
    ]

    return etapas
  }

  const etapas = getEtapas()
  const etapaAtualData = etapas[etapaAtual]
  const valorAtual = formData[etapaAtualData?.id as keyof FormData]
  const isEtapaValida = valorAtual && valorAtual.toString().trim() !== "" && 
    (etapaAtualData?.tipo !== "number" || parseInt(valorAtual as string) > 0)

  const handleProximaEtapa = () => {
    if (etapaAtual < etapas.length - 1) {
      setEtapaAtual(etapaAtual + 1)
      setErro(null)
    } else {
      // Última etapa, ir para preview
      handleCalcularEstimativa()
    }
  }

  const handleVoltarEtapa = () => {
    if (etapaAtual > 0) {
      setEtapaAtual(etapaAtual - 1)
      setErro(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isEtapaValida) {
      handleProximaEtapa()
    }
  }

  const handleCalcularEstimativa = (dadosAtualizados?: Partial<FormData>) => {
    // Mescla dados atualizados com o formData atual
    const dados = { ...formData, ...dadosAtualizados }
    
    // Validar campos básicos
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
    
    setErro(null)
    setEstado("preview")
  }

  const handleVoltarFormulario = () => {
    setEstado("formularioInicial")
    setEtapaAtual(0)
    setErro(null)
  }

  const handleContinuarParaContato = () => {
    setEstado("capturaContato")
  }

  const handleSubmitContato = async () => {
    // Validação de nome
    if (!contatoData.nome.trim()) {
      setErro("Por favor, informe seu nome")
      return
    }

    // Validação de email
    if (!contatoData.email.trim()) {
      setErro("Por favor, informe seu e-mail")
      return
    }
    if (!contatoData.email.includes("@") || !contatoData.email.includes(".")) {
      setErro("Por favor, informe um e-mail válido")
      return
    }

    // Validação de WhatsApp
    if (!contatoData.whatsapp.trim()) {
      setErro("Por favor, informe seu WhatsApp")
      return
    }
    const somenteNumeros = contatoData.whatsapp.replace(/\D/g, "")
    if (somenteNumeros.length < 10 || somenteNumeros.length > 11) {
      setErro("Por favor, informe um WhatsApp válido com DDD (10 ou 11 dígitos)")
      return
    }

    // Validação dos dados do formulário
    if (!formData.origem.trim()) {
      setErro("Por favor, informe a origem")
      return
    }
    if (!formData.destino.trim()) {
      setErro("Por favor, informe o destino")
      return
    }
    if (!formData.tipoImovel) {
      setErro("Por favor, selecione o tipo de imóvel")
      return
    }
    if (!formData.temElevador) {
      setErro("Por favor, informe se tem elevador")
      return
    }
    if (!formData.precisaEmbalagem) {
      setErro("Por favor, informe se precisa de embalagem")
      return
    }

    setLoading(true)
    setErro(null)

    // Preparar dados para envio
    const andarNumero = parseInt(formData.andar) || 1
    // Remove máscara do WhatsApp antes de enviar (apenas números)
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

    console.log('📤 [Frontend] Enviando dados para API:', dadosParaEnvio)
    console.log('📤 [Frontend] Validação dos dados:', {
      origem: !!dadosParaEnvio.origem,
      destino: !!dadosParaEnvio.destino,
      tipoImovel: !!dadosParaEnvio.tipoImovel,
      temElevador: !!dadosParaEnvio.temElevador,
      andar: typeof dadosParaEnvio.andar === 'number',
      precisaEmbalagem: !!dadosParaEnvio.precisaEmbalagem,
      nome: !!dadosParaEnvio.nome,
      email: !!dadosParaEnvio.email,
      whatsapp: !!dadosParaEnvio.whatsapp,
    })

    try {
      // ✅ A IA agora extrai cidade e estado automaticamente do texto quebrado!
      const response = await fetch("/api/calcular-orcamento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dadosParaEnvio)
      })

      console.log('📥 [Frontend] Resposta da API:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        console.error('❌ [Frontend] Erro na resposta da API:', errorData)
        throw new Error(errorData.error || "Erro ao calcular orçamento")
      }

      const data = await response.json()
      console.log('✅ [Frontend] Dados recebidos da API:', data)
      setResultado(data)
      setEstado("resultadoFinal")
    } catch (error) {
      console.error("❌ [Frontend] Erro ao calcular orçamento:", error)
      const mensagemErro = error instanceof Error ? error.message : "Ops! Algo deu errado. Por favor, tente novamente."
      setErro(mensagemErro)
    } finally {
      setLoading(false)
    }
  }

  const handleNovoCalculo = () => {
    setEstado("formularioInicial")
    setEtapaAtual(0)
    setFormData({
      origem: "",
      destino: "",
      tipoImovel: "",
      temElevador: "",
      andar: "1", // ✅ CORRIGIDO: valor padrão 1
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
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo (txt, pdf, doc, docx, xlsx, csv)
      const allowedTypes = [
        'text/plain',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ]
      
      if (allowedTypes.includes(file.type)) {
        setArquivoLista(file)
        setErroLista(null)
      } else {
        setErroLista("Tipo de arquivo não permitido. Use TXT, PDF, DOC, DOCX, XLS, XLSX ou CSV.")
        setArquivoLista(null)
      }
    }
  }

  const handleRemoverArquivo = () => {
    setArquivoLista(null)
    setErroLista(null)
  }

  const handleEnviarLista = async () => {
    // ✅ Lista agora é enviada automaticamente com o orçamento
    // Apenas marcamos como enviada para feedback visual
    if (!listaObjetos?.trim() && !arquivoLista) {
      setErroLista("Digite a lista de objetos ou faça upload de um arquivo")
      return
    }

    setListaEnviada(true)
    setErroLista(null)
  }

  // ESTADO: Formulário Inicial (Conversacional)
  if (estado === "formularioInicial") {
    return (
      <Card className="w-full max-w-2xl mx-auto p-6 lg:p-8 shadow-xl border-0 bg-white">
        <div className="space-y-8">
          {/* Header - Sempre visível */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mx-auto">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              Calcule o valor aproximado da sua mudança em 15 segundos
            </h2>
            <p className="text-muted-foreground">
              Sem cadastro — rápido, simples e confiável.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Passo {etapaAtual + 1} de {etapas.length}</span>
              <span>{Math.round(((etapaAtual + 1) / etapas.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${((etapaAtual + 1) / etapas.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Pergunta */}
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3">
              <h3 className="text-xl lg:text-2xl font-semibold text-foreground">
                {etapaAtualData.pergunta}
              </h3>
            </div>

            {/* Input baseado no tipo */}
            {(etapaAtualData.tipo === "text" || etapaAtualData.tipo === "number") && (
              <div className="space-y-3">
                <Input
                  type={etapaAtualData.tipo === "number" ? "number" : "text"}
                  min={etapaAtualData.tipo === "number" ? "1" : undefined}
                  placeholder={etapaAtualData.placeholder}
                  value={formData[etapaAtualData.id as keyof FormData] as string}
                  onChange={(e) => handleInputChange(etapaAtualData.id as keyof FormData, e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-14 rounded-xl text-lg"
                  autoFocus
                />
                {etapaAtualData.tipo === "number" && (
                  <p className="text-xs text-muted-foreground">
                    💡 Informe o andar mais alto entre origem e destino
                  </p>
                )}
                {isEtapaValida && (
                  <p className="text-xs text-center text-muted-foreground animate-in fade-in duration-300">
                    Pressione <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono">Enter ↵</kbd> para continuar
                  </p>
                )}
              </div>
            )}

            {etapaAtualData.tipo === "select" && (
              <div className="grid gap-3">
                {etapaAtualData.opcoes?.map((opcao) => (
                  <button
                    key={opcao.valor}
                    onClick={() => {
                      handleInputChange(etapaAtualData.id as keyof FormData, opcao.valor)
                      // Auto-avançar após selecionar
                      setTimeout(() => {
                        if (etapaAtual < etapas.length - 1) {
                          setEtapaAtual(etapaAtual + 1)
                        } else {
                          // Passa o valor atualizado para evitar problema de estado assíncrono
                          handleCalcularEstimativa({ [etapaAtualData.id]: opcao.valor })
                        }
                      }, 300)
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      formData[etapaAtualData.id as keyof FormData] === opcao.valor
                        ? "border-primary bg-primary/5 font-semibold"
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    {opcao.label}
                  </button>
                ))}
              </div>
            )}

            {/* Erro */}
            {erro && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl animate-in fade-in duration-300">
                <p className="text-sm text-destructive">{erro}</p>
              </div>
            )}
          </div>

          {/* Botões de Navegação */}
          <div className="flex gap-3">
            {etapaAtual > 0 && (
              <Button
                variant="outline"
                size="lg"
                onClick={handleVoltarEtapa}
                className="flex-1 rounded-xl"
              >
                Voltar
              </Button>
            )}
            
            {(etapaAtualData.tipo === "text" || etapaAtualData.tipo === "number") && (
              <Button
                size="lg"
                onClick={handleProximaEtapa}
                disabled={!isEtapaValida}
                className="flex-1 rounded-xl font-semibold"
              >
                {etapaAtual < etapas.length - 1 ? "Próximo" : "Calcular estimativa"}
              </Button>
            )}
          </div>

          {/* Footer */}
          <p className="text-xs text-center text-muted-foreground">
            🔒 Seus dados estão seguros. Não compartilhamos com terceiros.
          </p>
        </div>
      </Card>
    )
  }

  // ESTADO: Preview
  if (estado === "preview") {
    const porte = formData.tipoImovel ? tiposImovelPorte[formData.tipoImovel as TipoImovel] : "médio"
    
    return (
      <Card className="w-full max-w-2xl mx-auto p-6 lg:p-8 shadow-xl border-0 bg-white">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-2xl mx-auto mb-4 animate-pulse">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              Analisando sua rota e o porte da mudança...
            </h2>
          </div>

          {/* Resumo */}
          <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl">
            <p className="text-lg font-medium text-foreground">
              Sua mudança parece ser de <span className="text-primary font-bold">porte {porte}</span> na região informada.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Normalmente, mudanças desse tipo ficam em uma faixa de preço bem definida, dependendo da distância, 
              dificuldade de acesso e volume transportado.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Para te mostrar a <span className="font-semibold text-foreground">faixa real de preço</span> baseada 
              em centenas de mudanças parecidas e ainda te enviar <span className="font-semibold text-foreground">até 3 cotações verificadas</span> de 
              empresas de mudança, me informe um contato rápido.
            </p>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleVoltarFormulario}
              className="w-full sm:w-auto rounded-xl bg-transparent"
            >
              Voltar
            </Button>
            <Button
              size="lg"
              onClick={handleContinuarParaContato}
              className="w-full sm:flex-1 rounded-xl font-semibold text-base py-6"
            >
              Continuar para ver preço
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  // ESTADO: Captura de Contato
  if (estado === "capturaContato") {
    return (
      <Card className="w-full max-w-2xl mx-auto p-6 lg:p-8 shadow-xl border-0 bg-white">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mx-auto mb-4">
              <Phone className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              Quase lá! Agora só falta um detalhe 👇
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Para finalizar o cálculo e te mostrar a faixa exata de preço da sua mudança, 
              me informe um contato rápido.
            </p>
            <p className="text-sm text-muted-foreground">
              Seus dados são seguros e não enviamos spam.
            </p>
          </div>

          {/* Campos de Contato */}
          <div className="space-y-5">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium flex items-center gap-2">
                👤 Seu nome
              </Label>
              <Input
                id="nome"
                type="text"
                placeholder="Como você gostaria de ser chamado?"
                value={contatoData?.nome || ""}
                onChange={(e) => setContatoData(prev => ({ ...prev, nome: e.target.value }))}
                className="h-12 rounded-xl"
                autoFocus
              />
            </div>

            {/* E-mail */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Seu e-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={contatoData?.email || ""}
                onChange={(e) => setContatoData(prev => ({ ...prev, email: e.target.value }))}
                className="h-12 rounded-xl"
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-sm font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Seu WhatsApp
              </Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="(11) 98765-4321"
                value={contatoData?.whatsapp || ""}
                onChange={(e) => handleWhatsAppChange(e.target.value)}
                maxLength={15}
                className="h-12 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                💡 Formato: (DDD) 9XXXX-XXXX ou (DDD) XXXX-XXXX
              </p>
            </div>

            {/* Data Estimada (Opcional) */}
            <div className="space-y-2">
              <Label htmlFor="dataEstimada" className="text-sm font-medium flex items-center gap-2">
                📅 Data estimada da mudança (opcional)
              </Label>
              <Input
                id="dataEstimada"
                type="date"
                value={contatoData?.dataEstimada || ""}
                onChange={(e) => setContatoData(prev => ({ ...prev, dataEstimada: e.target.value }))}
                className="h-12 rounded-xl"
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground">
                💡 Ajuda as empresas a priorizar seu orçamento
              </p>
            </div>

            {/* Lista de Objetos (Opcional) */}
            <div className="space-y-3 p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-2">
                <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <Label htmlFor="listaObjetos" className="text-sm font-semibold text-foreground">
                    📦 Lista de objetos (opcional)
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Envie uma lista dos principais móveis/objetos da sua mudança para orçamentos mais precisos!
                  </p>
                </div>
              </div>
              
              <textarea
                id="listaObjetos"
                placeholder="Ex:&#10;- Sofá 3 lugares&#10;- Cama box casal&#10;- Geladeira duplex&#10;- Mesa de jantar com 6 cadeiras&#10;- Guarda-roupa 4 portas&#10;- TV 55 polegadas"
                value={listaObjetos || ""}
                onChange={(e) => setListaObjetos(e.target.value)}
                className="w-full min-h-[120px] p-3 rounded-xl border border-input bg-white resize-y text-sm"
                disabled={!!arquivoLista}
              />
              
              {listaObjetos?.trim() && (
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Lista preenchida ({listaObjetos?.length || 0} caracteres)
                </p>
              )}
            </div>

            {/* Erro */}
            {erro && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-sm text-destructive">{erro}</p>
              </div>
            )}

            {/* Botão */}
            <Button
              size="lg"
              onClick={handleSubmitContato}
              disabled={loading || !contatoData?.nome?.trim() || !contatoData?.email?.trim() || !contatoData?.whatsapp?.trim()}
              className="w-full h-12 rounded-xl font-semibold text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : (
                "Ver faixa de preço estimada"
              )}
            </Button>
          </div>

          {/* Footer */}
          <p className="text-xs text-center text-muted-foreground">
            🔒 Seus dados são protegidos e usados apenas para cálculo do orçamento.
          </p>

          {/* Botão Voltar */}
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEstado("preview")}
              className="text-muted-foreground hover:text-foreground"
            >
              Voltar
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  // ESTADO: Resultado Final
  if (estado === "resultadoFinal" && resultado) {
    return (
      <Card className="w-full max-w-2xl mx-auto p-6 lg:p-8 shadow-xl border-0 bg-white">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              Pronto! Aqui está a faixa estimada para sua mudança 👇
            </h2>
          </div>

          {/* Faixa de Preço */}
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

          {/* Indicação de lista incluída */}
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

          {/* Mensagem da IA (se houver) */}
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

          {/* Mensagem de Confirmação */}
          <div className="p-6 bg-accent/10 rounded-2xl border border-accent/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <p className="font-semibold text-foreground">
                  Orçamento salvo com sucesso!
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Recebemos suas informações e calculamos a estimativa de preço para sua mudança. 
                  Os dados foram salvos e você pode usar esta estimativa como referência.
                </p>
              </div>
            </div>
          </div>

          {/* Detalhes da Mudança */}
          <div className="space-y-3 p-6 bg-muted/30 rounded-2xl">
            <h3 className="font-semibold text-foreground mb-4">Resumo da sua mudança:</h3>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Origem:</span>
                <span className="font-medium text-foreground">{formData.origem}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destino:</span>
                <span className="font-medium text-foreground">{formData.destino}</span>
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

          {/* Botão Nova Cotação */}
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

