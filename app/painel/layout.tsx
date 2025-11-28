import type { Metadata, Viewport } from "next"
import "../globals.css"
import { ServiceWorkerRegistration } from "../components/painel/ServiceWorkerRegistration"
import { PWAMetaTags } from "../components/painel/PWAMetaTags"
import { AuthGuard } from "../components/painel/AuthGuard"

export const metadata: Metadata = {
  title: "MudaTech - Dashboard de Mudanças",
  description: "Plataforma B2B para empresas de mudança gerenciarem leads e propostas",
  manifest: "/painel/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MudaTech",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/painel/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/painel/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/painel/apple-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
}

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function PainelLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <PWAMetaTags />
      <ServiceWorkerRegistration />
      <AuthGuard>{children}</AuthGuard>
    </>
  )
}

