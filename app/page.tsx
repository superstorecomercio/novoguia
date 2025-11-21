import { HeroSection } from "@/app/components/new/HeroSection"
import { SmartSearch } from "@/app/components/SmartSearch"

export default function Home() {
  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        
        {/* Smart Search com IA - Única Seção Principal */}
        <section className="py-12 px-4 bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen flex items-center justify-center">
          <SmartSearch />
        </section>
      </main>
    </div>
  )
}
