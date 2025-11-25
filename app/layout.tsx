import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "./components/ConditionalLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MudaTech - Encontre empresas de mudança",
  description: "Encontre as melhores empresas de mudança na sua região. Compare preços e serviços.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased min-h-screen flex flex-col bg-white`}
      >
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  );
}
