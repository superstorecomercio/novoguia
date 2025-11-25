import { TrendingUp, Clock, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface DashboardStatsProps {
  totalLeads: number
  pendingLeads: number
  quotedLeads: number
}

export default function DashboardStats({ totalLeads, pendingLeads, quotedLeads }: DashboardStatsProps) {
  const stats = [
    {
      label: "Total de Leads",
      value: totalLeads,
      icon: TrendingUp,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Pendentes",
      value: pendingLeads,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Orçados",
      value: quotedLeads,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
