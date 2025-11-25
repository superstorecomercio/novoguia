import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { leadId, price, message, method, customerEmail, customerPhone, hasPDF } = await request.json()

    console.log("[v0] Mock: Sending quote for lead:", leadId)
    console.log("[v0] Mock: Price:", price)
    console.log("[v0] Mock: Method:", method)
    console.log("[v0] Mock: Customer email:", customerEmail)
    console.log("[v0] Mock: Has PDF:", hasPDF)

    // Simula delay de processamento
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (method === "email") {
      console.log("[v0] Mock: Email sent to:", customerEmail)
      console.log("[v0] Mock: Message:", message)
      if (hasPDF) {
        console.log("[v0] Mock: PDF attached to email")
      }
    }

    if (method === "whatsapp") {
      console.log("[v0] Mock: WhatsApp message prepared for:", customerPhone)
      console.log("[v0] Mock: Message:", message)
      if (hasPDF) {
        console.log("[v0] Mock: PDF ready for manual WhatsApp upload")
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error sending quote:", error)
    return NextResponse.json({ error: "Erro ao enviar orçamento" }, { status: 500 })
  }
}
