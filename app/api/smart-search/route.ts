import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { createAdminClient } from "@/lib/supabase/server"

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

interface SmartSearchResponse {
  intencao: "listar_empresas" | "calcular_preco" | "mostrar_dicas" | "buscar_cidade" | "outros"
  cidade?: string
  cidadeSlug?: string
  empresas?: Array<{
    id: string
    nome: string
    cidade: string
    estado: string
  }>
  dicas?: string[]
  mensagem: string
}

// Função para normalizar cidade para slug
function normalizarCidadeParaSlug(cidade: string): string {
  return cidade
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/[^a-z0-9-]/g, "") // Remove caracteres especiais
}

// Função para interpretar intenção com OpenAI
async function interpretarIntencaoComIA(prompt: string): Promise<{
  intencao: string
  cidade?: string
  estado?: string
  tipoServico?: string
}> {
  if (!openai) {
    // Fallback simples sem IA
    return interpretarIntencaoFallback(prompt)
  }

  try {
    const promptIA = `Você é um assistente de um site de mudanças. Interprete a intenção do usuário e extraia informações relevantes.

PROMPT DO USUÁRIO: "${prompt}"

Classifique a intenção em uma das seguintes categorias:
- "listar_empresas": usuário quer ver empresas de mudança, carreto ou guarda-móveis
- "calcular_preco": usuário quer calcular o preço/orçamento da mudança
- "mostrar_dicas": usuário quer dicas, conselhos ou informações sobre mudança
- "buscar_cidade": usuário quer ver empresas de uma cidade específica
- "outros": não se encaixa nas categorias acima

Se houver menção a cidade/estado, extraia essa informação.
Se houver menção a tipo de serviço (mudança, carreto, guarda-móveis), extraia.

Retorne APENAS um JSON válido neste formato:
{
  "intencao": "categoria",
  "cidade": "nome da cidade (se mencionada)",
  "estado": "sigla do estado (se mencionado)",
  "tipoServico": "mudanca|carreto|guarda-moveis (se mencionado)"
}

Exemplos:
- "empresas de mudança em são paulo" → {"intencao": "listar_empresas", "cidade": "São Paulo", "estado": "SP", "tipoServico": "mudanca"}
- "quanto custa uma mudança" → {"intencao": "calcular_preco"}
- "dicas para embalar" → {"intencao": "mostrar_dicas"}
- "ver empresas no rio" → {"intencao": "buscar_cidade", "cidade": "Rio de Janeiro", "estado": "RJ"}
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: promptIA }],
      temperature: 0.3,
      max_tokens: 200,
    })

    const resposta = completion.choices[0]?.message?.content
    if (!resposta) {
      throw new Error("Resposta vazia da IA")
    }

    const json = JSON.parse(resposta)
    return json
  } catch (error) {
    console.error("Erro ao interpretar com IA:", error)
    return interpretarIntencaoFallback(prompt)
  }
}

// Fallback sem IA (busca por palavras-chave)
function interpretarIntencaoFallback(prompt: string): {
  intencao: string
  cidade?: string
  estado?: string
  tipoServico?: string
} {
  const promptLower = prompt.toLowerCase()

  // Detectar cidades comuns
  const cidades = [
    { nome: "São Paulo", sigla: "SP", aliases: ["sao paulo", "sp", "sampa"] },
    { nome: "Rio de Janeiro", sigla: "RJ", aliases: ["rio de janeiro", "rio", "rj"] },
    { nome: "Belo Horizonte", sigla: "MG", aliases: ["belo horizonte", "bh", "mg"] },
    { nome: "Brasília", sigla: "DF", aliases: ["brasilia", "df"] },
    { nome: "Curitiba", sigla: "PR", aliases: ["curitiba", "pr"] },
  ]

  let cidadeDetectada = undefined
  let estadoDetectado = undefined

  for (const cidade of cidades) {
    if (cidade.aliases.some((alias) => promptLower.includes(alias))) {
      cidadeDetectada = cidade.nome
      estadoDetectado = cidade.sigla
      break
    }
  }

  // Detectar tipo de serviço
  let tipoServico = undefined
  if (promptLower.includes("carreto")) {
    tipoServico = "carreto"
  } else if (promptLower.includes("guarda") || promptLower.includes("guardamov")) {
    tipoServico = "guarda-moveis"
  } else if (promptLower.includes("mudança") || promptLower.includes("mudanca")) {
    tipoServico = "mudanca"
  }

  // Detectar intenção
  if (
    promptLower.includes("preço") ||
    promptLower.includes("preco") ||
    promptLower.includes("calcular") ||
    promptLower.includes("quanto custa") ||
    promptLower.includes("orçamento") ||
    promptLower.includes("orcamento")
  ) {
    return { intencao: "calcular_preco" }
  }

  if (
    promptLower.includes("dica") ||
    promptLower.includes("conselho") ||
    promptLower.includes("como") ||
    promptLower.includes("embalar")
  ) {
    return { intencao: "mostrar_dicas" }
  }

  if (cidadeDetectada) {
    if (promptLower.includes("empresa") || promptLower.includes("ver") || promptLower.includes("listar")) {
      return {
        intencao: "listar_empresas",
        cidade: cidadeDetectada,
        estado: estadoDetectado,
        tipoServico,
      }
    }
    return {
      intencao: "buscar_cidade",
      cidade: cidadeDetectada,
      estado: estadoDetectado,
    }
  }

  if (
    promptLower.includes("empresa") ||
    promptLower.includes("mudança") ||
    promptLower.includes("carreto") ||
    promptLower.includes("guarda")
  ) {
    return { intencao: "listar_empresas", tipoServico }
  }

  return { intencao: "outros" }
}

// Dicas de mudança padrão
const dicasMudanca = [
  "Comece a planejar sua mudança com pelo menos 1 mês de antecedência",
  "Faça uma lista completa de todos os itens que serão transportados",
  "Contrate uma empresa com boas avaliações e compare pelo menos 3 orçamentos",
  "Embale itens frágeis com cuidado usando papel bolha e caixas reforçadas",
  "Tire fotos dos móveis e eletrônicos antes da mudança",
  "Separe uma caixa com itens essenciais para os primeiros dias na nova casa",
  "Descarte ou doe itens que você não usa mais antes da mudança",
  "Confirme horários e detalhes com a empresa de mudança 2 dias antes",
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt inválido" }, { status: 400 })
    }

    // Interpretar intenção
    const interpretacao = await interpretarIntencaoComIA(prompt)
    console.log("Interpretação:", interpretacao)

    const response: SmartSearchResponse = {
      intencao: interpretacao.intencao as any,
      mensagem: "",
    }

    // Processar baseado na intenção
    switch (interpretacao.intencao) {
      case "listar_empresas": {
        if (interpretacao.cidade) {
          // Buscar empresas da cidade no banco
          const supabase = createAdminClient()
          const cidadeSlug = normalizarCidadeParaSlug(
            `${interpretacao.cidade}-${interpretacao.estado || ""}`
          )

          // Buscar hotsites ativos da cidade
          const { data: hotsites, error } = await supabase
            .from("hotsites")
            .select("id, nome_exibicao, cidade, estado")
            .ilike("cidade", `%${interpretacao.cidade}%`)
            .limit(10)

          if (!error && hotsites && hotsites.length > 0) {
            response.cidade = interpretacao.cidade
            response.cidadeSlug = cidadeSlug
            response.empresas = hotsites.map((h) => ({
              id: h.id,
              nome: h.nome_exibicao || "Empresa",
              cidade: h.cidade || "",
              estado: h.estado || "",
            }))
            response.mensagem = `Encontrei ${hotsites.length} empresas de mudança em ${interpretacao.cidade}!`
          } else {
            response.mensagem = `Não encontrei empresas em ${interpretacao.cidade} no momento, mas você pode explorar outras cidades!`
          }
        } else {
          response.mensagem =
            "Para ver empresas, me diga em qual cidade você está! Ex: 'empresas em São Paulo'"
        }
        break
      }

      case "calcular_preco": {
        response.mensagem =
          "Vou te levar para nossa calculadora inteligente de preços! Você terá uma estimativa em menos de 1 minuto."
        break
      }

      case "mostrar_dicas": {
        response.dicas = dicasMudanca
        response.mensagem = "Aqui estão algumas dicas importantes para sua mudança:"
        break
      }

      case "buscar_cidade": {
        if (interpretacao.cidade) {
          response.cidade = interpretacao.cidade
          response.cidadeSlug = normalizarCidadeParaSlug(
            `${interpretacao.cidade}-${interpretacao.estado || ""}`
          )
          response.mensagem = `Vou te mostrar as melhores empresas de mudança em ${interpretacao.cidade}!`
        } else {
          response.mensagem = "Me diga em qual cidade você está procurando!"
        }
        break
      }

      default: {
        response.mensagem =
          "Desculpe, não entendi bem. Tente perguntar sobre empresas, calcular preço ou pedir dicas!"
        break
      }
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Erro no smart-search:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar busca" },
      { status: 500 }
    )
  }
}

