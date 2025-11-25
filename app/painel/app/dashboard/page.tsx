import DashboardHeader from "@/components/dashboard/header"
import DashboardStats from "@/components/dashboard/stats"
import LeadsList from "@/components/dashboard/leads-list"
import DashboardFooter from "@/components/dashboard/footer"
import { mockLeads, getMockStats } from "@/lib/mock-data"
import { InstallPrompt } from "@/app/install-prompt"

export default function DashboardPage() {
  const leads = mockLeads
  const stats = getMockStats()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader userEmail="empresa@mudatech.com.br" />

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 space-y-6">
        <DashboardStats
          totalLeads={stats.totalLeads}
          pendingLeads={stats.pendingLeads}
          quotedLeads={stats.quotedLeads}
        />

        <LeadsList initialLeads={leads} />
      </main>

      <DashboardFooter />

      <InstallPrompt />
    </div>
  )
}
