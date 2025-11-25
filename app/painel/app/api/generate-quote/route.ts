import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const {
      lead,
      price,
      paymentMethod,
      validityDays,
      includedServices,
      needsInspection,
      packagingIncluded,
      additionalNotes,
    } = await request.json()

    const propertyTypeLabels: Record<string, string> = {
      casa: "casa",
      apartamento: "apartamento",
      comercial: "estabelecimento comercial",
    }

    const propertySizeLabels: Record<string, string> = {
      pequeno: "pequeno porte",
      medio: "médio porte",
      grande: "grande porte",
    }

    const paymentLabels: Record<string, string> = {
      pix: "PIX",
      dinheiro: "Dinheiro",
      cartao: "Cartão de Crédito",
      parcelado: "Parcelado em até 3x sem juros",
      "50-50": "50% antecipado e 50% na entrega",
      boleto: "Boleto Bancário",
    }

    const prompt = `Você é um assistente de vendas especializado em mudanças residenciais e comerciais no Brasil.

Crie uma mensagem profissional, cordial e persuasiva para apresentar uma proposta de mudança completa.

DETALHES DO CLIENTE:
- Nome: ${lead.customer_name}
- Tipo de imóvel: ${propertyTypeLabels[lead.property_type]} de ${propertySizeLabels[lead.property_size]}
- Origem: ${lead.origin_address}
- Destino: ${lead.destination_address}
- Data da mudança: ${new Date(lead.moving_date).toLocaleDateString("pt-BR")}
- Elevador disponível: ${lead.has_elevator ? "Sim" : "Não"}
${lead.special_items && lead.special_items.length > 0 ? `- Itens especiais: ${lead.special_items.join(", ")}` : ""}
${lead.additional_notes ? `- Observações do cliente: ${lead.additional_notes}` : ""}

PROPOSTA COMERCIAL:
- Valor: R$ ${Number.parseFloat(price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Forma de Pagamento: ${paymentLabels[paymentMethod] || paymentMethod}
- Validade: ${validityDays} dias
- Serviços inclusos: ${includedServices.join(", ")}
${packagingIncluded ? "- Embalagem completa INCLUÍDA no valor" : ""}
${needsInspection ? "- Vistoria prévia será realizada para confirmação final do valor" : ""}
${additionalNotes ? `- Observações da empresa: ${additionalNotes}` : ""}

INSTRUÇÕES PARA A MENSAGEM:
1. Cumprimente o cliente pelo nome de forma cordial
2. Agradeça o interesse e demonstre entusiasmo em poder ajudar
3. Apresente brevemente a proposta destacando os principais serviços inclusos
4. Mencione o valor de forma natural e positiva
5. Destaque a forma de pagamento como uma facilidade
6. Se houver embalagem incluída, enfatize esse diferencial
7. Se precisar de vistoria, explique que é para garantir precisão
8. Reforce diferenciais: equipe qualificada, seguro, pontualidade, experiência, cuidado especial
9. Demonstre disponibilidade para esclarecer dúvidas
10. Termine com um call-to-action gentil incentivando a confirmação
11. Use tom brasileiro, cordial, confiante e profissional
12. Mantenha entre 180-250 palavras
13. NÃO use saudações finais como "Atenciosamente" ou assinatura
14. NÃO repita o valor em formato de lista

Escreva APENAS a mensagem em formato de texto corrido, natural e fluido.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      temperature: 0.7,
    })

    return NextResponse.json({ message: text })
  } catch (error) {
    console.error("[v0] Error generating quote:", error)
    return NextResponse.json({ error: "Erro ao gerar orçamento" }, { status: 500 })
  }
}
