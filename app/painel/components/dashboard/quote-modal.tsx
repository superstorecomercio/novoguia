"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Sparkles, Mail, MessageCircle, FileText, Download, Check, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { generateQuotePDF } from "@/lib/pdf-generator"
import { mockCompanyProfile } from "@/lib/mock-data"
import type { ProposalData } from "@/lib/pdf-generator"

interface Lead {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  origin_address: string
  destination_address: string
  moving_date: string
  property_type: string
  property_size: string
  has_elevator: boolean
  needs_packing: boolean
  special_items: string[] | null
  additional_notes: string | null
}

interface QuoteModalProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function QuoteModal({ lead, open, onOpenChange }: QuoteModalProps) {
  const [price, setPrice] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [validityDays, setValidityDays] = useState("15")
  const [includedServices, setIncludedServices] = useState<string[]>(["Transporte", "Seguro básico"])
  const [needsInspection, setNeedsInspection] = useState(false)
  const [packagingIncluded, setPackagingIncluded] = useState(lead.needs_packing)
  const [additionalNotes, setAdditionalNotes] = useState("")

  const [generatingProposal, setGeneratingProposal] = useState(false)
  const [proposalGenerated, setProposalGenerated] = useState(false)
  const [aiMessage, setAiMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)

  const serviceOptions = [
    "Transporte",
    "Seguro básico",
    "Seguro total",
    "Desmontagem de móveis",
    "Montagem de móveis",
    "Embalagem completa",
    "Içamento",
    "Armazenamento temporário",
  ]

  const generateProposal = async () => {
    if (!price) {
      alert("Por favor, informe o valor da proposta")
      return
    }

    if (!paymentMethod) {
      alert("Por favor, selecione a forma de pagamento")
      return
    }

    setGeneratingProposal(true)
    setAiMessage("")
    setProposalGenerated(false)
    setPdfBlob(null)

    try {
      const response = await fetch("/api/generate-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead,
          price,
          paymentMethod,
          validityDays,
          includedServices,
          needsInspection,
          packagingIncluded,
          additionalNotes,
        }),
      })

      const data = await response.json()
      setAiMessage(data.message)
      setProposalGenerated(true)
    } catch (error) {
      alert("Erro ao gerar proposta com IA")
    } finally {
      setGeneratingProposal(false)
    }
  }

  const generateAndSavePDF = () => {
    if (!proposalGenerated || !aiMessage) {
      alert("Gere a proposta com IA primeiro")
      return
    }

    try {
      const proposalData: ProposalData = {
        lead,
        price,
        paymentMethod,
        validityDays,
        includedServices,
        needsInspection,
        packagingIncluded,
        additionalNotes,
        message: aiMessage,
        company: mockCompanyProfile,
      }

      const doc = generateQuotePDF(proposalData)

      const blob = doc.output("blob")
      setPdfBlob(blob)

      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
    } catch (error) {
      console.error("[v0] Erro ao gerar PDF:", error)
      alert("Erro ao gerar PDF")
    }
  }

  const downloadPDF = () => {
    if (!pdfBlob) return

    const url = URL.createObjectURL(pdfBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Proposta_${lead.customer_name.replace(/\s/g, "_")}_${Date.now()}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const sendProposal = async (method: "email" | "whatsapp") => {
    if (!pdfBlob) {
      alert("Gere e visualize o PDF antes de enviar")
      return
    }

    setSending(true)

    try {
      await fetch("/api/send-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          method,
          customerEmail: lead.customer_email,
          customerPhone: lead.customer_phone,
          proposalData: {
            price,
            paymentMethod,
            validityDays,
            includedServices,
            needsInspection,
            packagingIncluded,
          },
        }),
      })

      if (method === "whatsapp") {
        const whatsappMessage = `Olá ${lead.customer_name}! Segue a proposta de mudança que você solicitou. 📄\n\nFaça o download do PDF da proposta e analise com calma. Qualquer dúvida, estou à disposição!`
        const whatsappUrl = `https://wa.me/55${lead.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`

        downloadPDF()

        setTimeout(() => {
          window.open(whatsappUrl, "_blank")
        }, 500)
      }

      alert(`Proposta preparada para envio por ${method === "email" ? "email" : "WhatsApp"}!`)
      onOpenChange(false)
    } catch (error) {
      alert("Erro ao enviar proposta")
    } finally {
      setSending(false)
    }
  }

  const toggleService = (service: string) => {
    setIncludedServices((prev) => (prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Gerar Proposta Profissional</DialogTitle>
          <DialogDescription>Crie uma proposta completa e personalizada para {lead.customer_name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Valor da Proposta (R$) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="5000.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment">Forma de Pagamento *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                  <SelectItem value="parcelado">Parcelado (até 3x)</SelectItem>
                  <SelectItem value="50-50">50% antecipado + 50% na entrega</SelectItem>
                  <SelectItem value="boleto">Boleto Bancário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validity">Validade da Proposta (dias)</Label>
              <Input
                id="validity"
                type="number"
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inspection"
                  checked={needsInspection}
                  onCheckedChange={(checked) => setNeedsInspection(checked as boolean)}
                />
                <Label htmlFor="inspection" className="cursor-pointer font-normal">
                  Requer vistoria prévia
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="packaging"
                  checked={packagingIncluded}
                  onCheckedChange={(checked) => setPackagingIncluded(checked as boolean)}
                />
                <Label htmlFor="packaging" className="cursor-pointer font-normal">
                  Embalagem incluída
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>O que está incluso na proposta</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {serviceOptions.map((service) => (
                <div key={service} className="flex items-center space-x-2">
                  <Checkbox
                    id={service}
                    checked={includedServices.includes(service)}
                    onCheckedChange={() => toggleService(service)}
                  />
                  <Label htmlFor={service} className="cursor-pointer font-normal text-sm">
                    {service}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações Adicionais (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Ex: Horário flexível, equipe especializada em itens frágeis..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={generateProposal}
            className="w-full"
            size="lg"
            disabled={!price || !paymentMethod || generatingProposal}
          >
            {generatingProposal ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Gerando proposta personalizada...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Gerar Proposta com IA
              </>
            )}
          </Button>

          {proposalGenerated && aiMessage && (
            <div className="space-y-4 pt-4 border-t">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">Proposta gerada com sucesso!</p>
                  <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                    Revise a mensagem abaixo e gere o PDF para visualizar a proposta completa.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mensagem Personalizada da IA</Label>
                <Textarea
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button onClick={generateAndSavePDF} variant="default" className="flex-1" size="lg">
                    <FileText className="w-5 h-5 mr-2" />
                    {pdfBlob ? "Visualizar PDF Novamente" : "Gerar e Visualizar PDF"}
                  </Button>
                  {pdfBlob && (
                    <Button onClick={downloadPDF} variant="outline" size="lg">
                      <Download className="w-5 h-5" />
                    </Button>
                  )}
                </div>

                {!pdfBlob && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Gere o PDF antes de enviar a proposta para o cliente.
                    </p>
                  </div>
                )}

                {pdfBlob && (
                  <div className="space-y-3 pt-3 border-t">
                    <Label>Enviar Proposta</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => sendProposal("email")}
                        variant="outline"
                        size="lg"
                        disabled={sending}
                        className="h-auto py-4 flex-col gap-2"
                      >
                        {sending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Mail className="w-6 h-6" />
                            <div className="text-xs text-center">
                              <div className="font-medium">Enviar por Email</div>
                              <div className="text-muted-foreground">{lead.customer_email}</div>
                            </div>
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => sendProposal("whatsapp")}
                        variant="outline"
                        size="lg"
                        disabled={sending}
                        className="h-auto py-4 flex-col gap-2"
                      >
                        {sending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <MessageCircle className="w-6 h-6" />
                            <div className="text-xs text-center">
                              <div className="font-medium">Enviar por WhatsApp</div>
                              <div className="text-muted-foreground">{lead.customer_phone}</div>
                            </div>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
