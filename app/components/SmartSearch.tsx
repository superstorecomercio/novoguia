"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Loader2, Search, Sparkles, MapPin, Calculator, Lightbulb, TrendingUp, Building2, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

interface SmartSearchResponse {
  intencao: "listar_empresas" | "calcular_preco" | "mostrar_dicas" | "buscar_cidade" | "outros"
  cidade?: string
  cidadeSlug?: string
  empresas?: Array<{
    id: string
    nome: string
    cidade: string
    estado: string
    slug?: string
  }>
  dicas?: string[]
  mensagem: string
}

const sugestoesRapidas = [
  { texto: "CALCULADORA INSTANTÂNEA", subtitulo: "Calcule o preço da sua mudança em segundos", icon: Calculator, destaque: true },
  { texto: "Ver empresas de mudanças", subtitulo: "Encontre as melhores empresas da sua região", icon: Building2, destaque: true },
  { texto: "Empresas em São Paulo", icon: MapPin },
  { texto: "Guarda-móveis", icon: Building2 },
  { texto: "Dicas para mudança", icon: Lightbulb },
]

export function SmartSearch() {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<SmartSearchResponse | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const handleSearch = async (textoPrompt: string) => {
    if (!textoPrompt.trim()) {
      setErro("Digite algo para buscar")
      return
    }

    setLoading(true)
    setErro(null)
    setResultado(null)

    try {
      const response = await fetch("/api/smart-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: textoPrompt }),
      })

      if (!response.ok) {
        throw new Error("Erro ao processar busca")
      }

      const data: SmartSearchResponse = await response.json()
      setResultado(data)

      // Se for para calcular preço, redireciona automaticamente
      if (data.intencao === "calcular_preco") {
        setTimeout(() => {
          router.push("/calculadora")
        }, 1500)
      }

      // Se for buscar cidade e tiver slug, redireciona
      if (data.intencao === "buscar_cidade" && data.cidadeSlug) {
        setTimeout(() => {
          router.push(`/cidades/${data.cidadeSlug}`)
        }, 1500)
      }
    } catch (error: any) {
      console.error("Erro ao buscar:", error)
      setErro(error.message || "Ops! Algo deu errado. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleSugestaoClick = (sugestao: string) => {
    setPrompt(sugestao)
    handleSearch(sugestao)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(prompt)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
            Calcule o preço da sua mudança{" "}
            <span className="text-primary">em segundos</span>
          </h1>
          <div className="flex items-center justify-center gap-6 text-lg font-medium text-muted-foreground">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              Grátis
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              Rápido
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              Sem Cadastro
            </span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-3xl mx-auto">
        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder='Ex: "Calcular mudança de São Paulo para Rio"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={handleKeyPress}
          className="h-16 pl-14 pr-32 rounded-2xl text-lg border-2 border-border focus:border-primary shadow-lg"
          disabled={loading}
        />
        <Button
          size="lg"
          onClick={() => handleSearch(prompt)}
          disabled={loading || !prompt.trim()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-xl h-12"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Buscando...
            </>
          ) : (
            "Buscar"
          )}
        </Button>
      </div>

      {/* Sugestões Rápidas */}
      {!resultado && (
        <div className="space-y-4 max-w-5xl mx-auto">
          <p className="text-base font-medium text-muted-foreground text-center">
            Escolha uma opção ou digite sua pergunta acima
          </p>
          
          {/* Botões em Destaque */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sugestoesRapidas
              .filter((s) => s.destaque)
              .map((sugestao, index) => {
                const Icon = sugestao.icon
                const isCalculadora = sugestao.texto.includes("CALCULADORA")
                return (
                  <button
                    key={index}
                    onClick={() => handleSugestaoClick(sugestao.texto)}
                    className={`group relative p-8 bg-white border-2 rounded-2xl hover:shadow-xl transition-all duration-300 ${
                      isCalculadora 
                        ? "border-primary bg-gradient-to-br from-primary/5 to-primary/10" 
                        : "border-border hover:border-primary"
                    }`}
                  >
                    <div className="flex items-start gap-4 text-left">
                      <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                        isCalculadora ? "bg-primary/20" : "bg-primary/10"
                      }`}>
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className={`font-bold text-xl group-hover:text-primary transition-colors ${
                          isCalculadora ? "text-primary" : "text-foreground"
                        }`}>
                          {sugestao.texto}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {sugestao.subtitulo}
                        </p>
                        <div className="flex items-center gap-1 text-primary font-medium text-sm pt-2">
                          <span>{isCalculadora ? "Calcular agora" : "Ver empresas"}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
          </div>

          {/* Outras Sugestões */}
          <div className="pt-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {sugestoesRapidas
                .filter((s) => !s.destaque)
                .map((sugestao, index) => {
                  const Icon = sugestao.icon
                  return (
                    <Badge
                      key={index}
                      variant="outline"
                      className="px-4 py-2.5 cursor-pointer hover:bg-primary/10 hover:border-primary transition-all text-sm font-medium"
                      onClick={() => handleSugestaoClick(sugestao.texto)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {sugestao.texto}
                    </Badge>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* Erro */}
      {erro && (
        <Card className="p-6 bg-destructive/10 border-destructive/20">
          <p className="text-destructive text-center">{erro}</p>
        </Card>
      )}

      {/* Resultado */}
      {resultado && (
        <Card className="p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Mensagem da IA */}
          <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl">
            <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-foreground mb-1">Resposta:</p>
              <p className="text-muted-foreground">{resultado.mensagem}</p>
            </div>
          </div>

          {/* Listar Empresas */}
          {resultado.intencao === "listar_empresas" && resultado.empresas && resultado.empresas.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-foreground">
                Empresas encontradas em {resultado.cidade}:
              </h3>
              <div className="grid gap-3">
                {resultado.empresas.slice(0, 5).map((empresa) => (
                  <Link
                    key={empresa.id}
                    href={`/cidades/${resultado.cidadeSlug}`}
                    className="p-4 border rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{empresa.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {empresa.cidade} - {empresa.estado}
                        </p>
                      </div>
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                  </Link>
                ))}
              </div>
              {resultado.empresas.length > 5 && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-xl"
                  onClick={() => router.push(`/cidades/${resultado.cidadeSlug}`)}
                >
                  Ver todas as {resultado.empresas.length} empresas
                </Button>
              )}
            </div>
          )}

          {/* Redirecionar para Calculadora */}
          {resultado.intencao === "calcular_preco" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <Calculator className="w-16 h-16 text-primary animate-pulse" />
              <p className="text-lg font-medium text-foreground">
                Redirecionando para a calculadora...
              </p>
            </div>
          )}

          {/* Mostrar Dicas */}
          {resultado.intencao === "mostrar_dicas" && resultado.dicas && resultado.dicas.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-primary" />
                Dicas de Mudança:
              </h3>
              <ul className="space-y-2">
                {resultado.dicas.map((dica, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg">
                    <span className="font-semibold text-accent">{index + 1}.</span>
                    <span className="text-foreground">{dica}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Redirecionando para Cidade */}
          {resultado.intencao === "buscar_cidade" && resultado.cidadeSlug && (
            <div className="flex flex-col items-center gap-4 py-6">
              <MapPin className="w-16 h-16 text-primary animate-pulse" />
              <p className="text-lg font-medium text-foreground">
                Redirecionando para empresas em {resultado.cidade}...
              </p>
            </div>
          )}

          {/* Botão Nova Busca */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setResultado(null)
              setPrompt("")
            }}
            className="w-full rounded-xl mt-4"
          >
            Nova busca
          </Button>
        </Card>
      )}
    </div>
  )
}

