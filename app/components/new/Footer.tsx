import Link from "next/link"
import Image from "next/image"
import { Mail, Phone, MapPin } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <Link href="/" className="inline-block">
              <Image src="/logo.png" alt="Guia de Mudanças" width={180} height={36} className="h-9 w-auto" />
            </Link>
            <p className="text-sm leading-relaxed">
              Conectamos você às melhores empresas de mudança do Brasil. Orçamentos gratuitos e serviço confiável.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="flex items-center justify-center w-10 h-10 bg-gray-800 hover:bg-primary rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="#"
                className="flex items-center justify-center w-10 h-10 bg-gray-800 hover:bg-primary rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 4.041v.08c0 2.597-.01 2.917-.058 3.96-.045.976-.207 1.505-.344 1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                </svg>
              </a>
              <a
                href="#"
                className="flex items-center justify-center w-10 h-10 bg-gray-800 hover:bg-primary rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-bold mb-6">Serviços</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="hover:text-white transition-colors text-sm">
                  Mudança Residencial
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors text-sm">
                  Mudança Comercial
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors text-sm">
                  Mudança Interestadual
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors text-sm">
                  Guarda-Móveis
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors text-sm">
                  Embalagem e Montagem
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-bold mb-6">Empresa</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/quem-somos" className="hover:text-white transition-colors text-sm">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href="#como-funciona" className="hover:text-white transition-colors text-sm">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors text-sm">
                  Seja um Parceiro
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contato" className="hover:text-white transition-colors text-sm">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold mb-6">Contato</h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="tel:+5511999999999"
                  className="flex items-center gap-3 hover:text-white transition-colors text-sm"
                >
                  <Phone className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>(11) 99999-9999</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:contato@guiademudancas.com.br"
                  className="flex items-center gap-3 hover:text-white transition-colors text-sm"
                >
                  <Mail className="w-5 h-5 text-accent flex-shrink-0" />
                  <span>contato@guiademudancas.com.br</span>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>
                    São Paulo, SP
                    <br />
                    Brasil
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-16 pt-12 border-t border-gray-800">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h3 className="text-2xl font-bold text-white">Receba dicas de mudança</h3>
            <p className="text-sm">Cadastre-se e receba dicas exclusivas para economizar na sua mudança</p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Seu melhor e-mail"
                className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
              <Button type="submit" size="lg" className="rounded-xl font-semibold whitespace-nowrap">
                Inscrever-se
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <p>© {new Date().getFullYear()} Guia de Mudanças. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">
                Termos de Uso
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Privacidade
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

