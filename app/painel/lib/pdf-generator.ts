import { jsPDF } from "jspdf"
import type { Lead } from "./mock-data"
import type { CompanyProfile } from "./mock-data"

export interface ProposalData {
  lead: Lead
  price: string
  paymentMethod: string
  validityDays: string
  includedServices: string[]
  needsInspection: boolean
  packagingIncluded: boolean
  additionalNotes?: string
  message: string
  company: CompanyProfile
}

export function generateQuotePDF(data: ProposalData) {
  const {
    lead,
    price,
    paymentMethod,
    validityDays,
    includedServices,
    needsInspection,
    packagingIncluded,
    additionalNotes,
    message,
    company,
  } = data

  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageWidth - margin * 2

  let y = margin

  // Header com logo e nome da empresa
  if (company.logo) {
    try {
      doc.addImage(company.logo, "PNG", margin, y, 30, 30)
    } catch (error) {
      console.log("[v0] Erro ao adicionar logo ao PDF:", error)
    }
  }

  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text(company.name, company.logo ? margin + 35 : margin, y + 10)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(company.email, company.logo ? margin + 35 : margin, y + 17)
  doc.text(company.phone, company.logo ? margin + 35 : margin, y + 23)

  y += 45

  // Linha divisória
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 15

  // Título do documento
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("PROPOSTA COMERCIAL DE MUDANÇA", margin, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Proposta válida por ${validityDays} dias`, margin, y)
  y += 15

  // Dados do cliente
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Dados do Cliente", margin, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Cliente: ${lead.customer_name}`, margin, y)
  y += 6
  doc.text(`Email: ${lead.customer_email}`, margin, y)
  y += 6
  doc.text(`Telefone: ${lead.customer_phone}`, margin, y)
  y += 12

  // Detalhes da mudança
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Detalhes da Mudança", margin, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  const originLines = doc.splitTextToSize(`Origem: ${lead.origin_address}`, maxWidth)
  doc.text(originLines, margin, y)
  y += originLines.length * 6

  const destLines = doc.splitTextToSize(`Destino: ${lead.destination_address}`, maxWidth)
  doc.text(destLines, margin, y)
  y += destLines.length * 6

  doc.text(`Data prevista: ${new Date(lead.moving_date).toLocaleDateString("pt-BR")}`, margin, y)
  y += 6
  doc.text(`Tipo de imóvel: ${lead.property_type} - ${lead.property_size}`, margin, y)
  y += 6
  doc.text(`Elevador: ${lead.has_elevator ? "Sim" : "Não"}`, margin, y)
  y += 6

  if (lead.special_items && lead.special_items.length > 0) {
    const itemsLines = doc.splitTextToSize(`Itens especiais: ${lead.special_items.join(", ")}`, maxWidth)
    doc.text(itemsLines, margin, y)
    y += itemsLines.length * 6
  }

  y += 10

  doc.setFillColor(240, 240, 240)
  doc.rect(margin, y, maxWidth, 8, "F")
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("SERVIÇOS INCLUSOS", margin + 2, y + 5)
  y += 12

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  includedServices.forEach((service) => {
    doc.text(`✓ ${service}`, margin + 5, y)
    y += 5
  })

  y += 8

  if (packagingIncluded || needsInspection) {
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, y, maxWidth, 8, "F")
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("INFORMAÇÕES IMPORTANTES", margin + 2, y + 5)
    y += 12

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")

    if (packagingIncluded) {
      doc.text("✓ Embalagem completa incluída no valor", margin + 5, y)
      y += 5
    }

    if (needsInspection) {
      doc.text("⚠ Vistoria prévia necessária para confirmação do valor", margin + 5, y)
      y += 5
    }

    y += 8
  }

  if (additionalNotes) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Observações:", margin, y)
    y += 6

    doc.setFont("helvetica", "italic")
    const notesLines = doc.splitTextToSize(additionalNotes, maxWidth)
    doc.text(notesLines, margin, y)
    y += notesLines.length * 5 + 8
  }

  // Verificar se precisa de nova página
  if (y > pageHeight - 80) {
    doc.addPage()
    y = margin
  }

  doc.setFillColor(37, 99, 235)
  doc.rect(margin, y, maxWidth, 25, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("VALOR DA PROPOSTA:", margin + 5, y + 9)
  doc.setFontSize(16)
  doc.text(
    `R$ ${Number.parseFloat(price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigals: 2 })}`,
    margin + 5,
    y + 18,
  )

  doc.setTextColor(0, 0, 0)
  y += 32

  const paymentLabels: Record<string, string> = {
    pix: "PIX",
    dinheiro: "Dinheiro",
    cartao: "Cartão de Crédito",
    parcelado: "Parcelado (até 3x)",
    "50-50": "50% antecipado + 50% na entrega",
    boleto: "Boleto Bancário",
  }

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(`Forma de Pagamento: `, margin, y)
  doc.setFont("helvetica", "normal")
  doc.text(paymentLabels[paymentMethod] || paymentMethod, margin + 42, y)
  y += 12

  // Mensagem personalizada da IA
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Nossa Proposta", margin, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  const messageLines = doc.splitTextToSize(message, maxWidth)

  messageLines.forEach((line: string) => {
    if (y > pageHeight - margin - 20) {
      doc.addPage()
      y = margin
    }
    doc.text(line, margin, y)
    y += 6
  })

  y += 12

  // Rodapé
  if (y > pageHeight - margin - 40) {
    doc.addPage()
    y = margin
  }

  doc.setDrawColor(200, 200, 200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(company.address, margin, y)
  y += 5
  doc.text(`CNPJ: ${company.cnpj}`, margin, y)
  y += 8

  doc.setFont("helvetica", "italic")
  doc.setFontSize(8)
  doc.text("Obrigado pela oportunidade de atendê-lo! Estamos à disposição para esclarecer dúvidas.", margin, y)

  return doc
}
