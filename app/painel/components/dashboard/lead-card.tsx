"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Calendar,
  Home,
  Package,
  ArrowRight,
  Sparkles,
  Mail,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import QuoteModal from "./quote-modal"

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
  status: string
  created_at: string
}

interface LeadCardProps {
  lead: Lead
}

export default function LeadCard({ lead }: LeadCardProps) {
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [showFullNotes, setShowFullNotes] = useState(false)

  const statusConfig = {
    pending: { label: "Pendente", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
    quoted: { label: "Orçado", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
    accepted: { label: "Aceito", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
    rejected: { label: "Recusado", color: "bg-red-500/10 text-red-700 dark:text-red-400" },
  }

  const propertyTypeLabels: Record<string, string> = {
    casa: "Casa",
    apartamento: "Apartamento",
    comercial: "Comercial",
  }

  const propertySizeLabels: Record<string, string> = {
    pequeno: "Pequeno",
    medio: "Médio",
    grande: "Grande",
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + "..."
  }

  const shouldTruncateNotes = lead.additional_notes && lead.additional_notes.length > 150

  return (
    <>
      <Card className="border-2 hover:shadow-lg transition-all hover:border-primary/50">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{lead.customer_name}</h3>
              <div className="flex flex-wrap gap-2">
                <Badge className={statusConfig[lead.status as keyof typeof statusConfig].color}>
                  {statusConfig[lead.status as keyof typeof statusConfig].label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {propertyTypeLabels[lead.property_type]} • {propertySizeLabels[lead.property_size]}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Endereços */}
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs">Origem</p>
                <p className="font-medium text-pretty">{lead.origin_address}</p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs">Destino</p>
                <p className="font-medium text-pretty">{lead.destination_address}</p>
              </div>
            </div>
          </div>

          {/* Detalhes */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="font-medium">{formatDate(lead.moving_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Home className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Elevador</p>
                <p className="font-medium">{lead.has_elevator ? "Sim" : "Não"}</p>
              </div>
            </div>
          </div>

          {/* Extras */}
          {(lead.needs_packing || (lead.special_items && lead.special_items.length > 0)) && (
            <div className="space-y-2 pt-3 border-t">
              {lead.needs_packing && (
                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="font-medium">Precisa de embalagem</span>
                </div>
              )}
              {lead.special_items && lead.special_items.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Itens especiais</p>
                    <p className="font-medium">{lead.special_items.join(", ")}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Observações */}
          {lead.additional_notes && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-1">Observações</p>
              <p className="text-sm text-pretty">
                {shouldTruncateNotes && !showFullNotes
                  ? truncateText(lead.additional_notes, 150)
                  : lead.additional_notes}
              </p>
              {shouldTruncateNotes && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullNotes(!showFullNotes)}
                  className="mt-2 h-7 text-xs"
                >
                  {showFullNotes ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Ver tudo
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Ações */}
          <div className="pt-3 border-t space-y-2">
            <Button
              onClick={() => setShowQuoteModal(true)}
              className="w-full"
              size="lg"
              disabled={lead.status !== "pending"}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Proposta
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${lead.customer_email}`}>
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://wa.me/55${lead.customer_phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <QuoteModal lead={lead} open={showQuoteModal} onOpenChange={setShowQuoteModal} />
    </>
  )
}
