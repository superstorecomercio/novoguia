"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import LeadCard from "./lead-card"
import { Inbox } from "lucide-react"

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

interface LeadsListProps {
  initialLeads: Lead[]
}

export default function LeadsList({ initialLeads }: LeadsListProps) {
  const [leads] = useState<Lead[]>(initialLeads)

  if (leads.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="py-16">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Inbox className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Nenhum lead disponível</h3>
              <p className="text-sm text-muted-foreground">
                Novos leads aparecerão aqui quando clientes solicitarem orçamentos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Leads de Mudança</h2>
        <Badge variant="secondary" className="text-sm">
          {leads.length} {leads.length === 1 ? "lead" : "leads"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  )
}
