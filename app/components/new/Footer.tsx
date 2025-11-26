import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300 border-t border-gray-700/50">
      {/* Main Footer */}
      <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <Link href="/" className="inline-block">
              <div className="text-2xl font-bold tracking-tight">
                <span className="text-[#667eea]">
                  Muda
                </span>
                <span className="text-[#4facfe]">
                  Tech
                </span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              Conectamos você às melhores empresas de mudança do Brasil. Orçamentos gratuitos e serviço confiável.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="flex items-center justify-center w-10 h-10 bg-gray-800/50 hover:bg-gradient-to-r hover:from-[#667eea] hover:to-[#764ba2] rounded-lg transition-all duration-300 hover:scale-110 border border-gray-700/50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="#"
                className="flex items-center justify-center w-10 h-10 bg-gray-800/50 hover:bg-gradient-to-r hover:from-[#667eea] hover:to-[#764ba2] rounded-lg transition-all duration-300 hover:scale-110 border border-gray-700/50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 4.041v.08c0 2.597-.01 2.917-.058 3.96-.045.976-.207 1.505-.344 1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                </svg>
              </a>
              <a
                href="#"
                className="flex items-center justify-center w-10 h-10 bg-gray-800/50 hover:bg-gradient-to-r hover:from-[#667eea] hover:to-[#764ba2] rounded-lg transition-all duration-300 hover:scale-110 border border-gray-700/50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-extrabold mb-6 text-lg">Serviços</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="hover:text-[#667eea] transition-colors text-sm text-gray-400 hover:translate-x-1 inline-block transition-transform">
                  Mudança Residencial
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#667eea] transition-colors text-sm text-gray-400 hover:translate-x-1 inline-block transition-transform">
                  Mudança Comercial
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#667eea] transition-colors text-sm text-gray-400 hover:translate-x-1 inline-block transition-transform">
                  Mudança Interestadual
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#667eea] transition-colors text-sm text-gray-400 hover:translate-x-1 inline-block transition-transform">
                  Guarda-Móveis
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#667eea] transition-colors text-sm text-gray-400 hover:translate-x-1 inline-block transition-transform">
                  Embalagem e Montagem
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-extrabold mb-6 text-lg">Empresa</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/quem-somos" className="hover:text-[#667eea] transition-colors text-sm text-gray-400 hover:translate-x-1 inline-block transition-transform">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href="/como-funciona" className="hover:text-[#667eea] transition-colors text-sm text-gray-400 hover:translate-x-1 inline-block transition-transform">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link href="/orcamento" className="hover:text-[#667eea] transition-colors text-sm text-gray-400 hover:translate-x-1 inline-block transition-transform">
                  Anuncie sua Empresa
                </Link>
              </li>
              <li>
                <Link href="/contato" className="hover:text-[#667eea] transition-colors text-sm text-gray-400 hover:translate-x-1 inline-block transition-transform">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700/50 bg-gray-900/50">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>© {new Date().getFullYear()} MudaTech. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <Link href="/termos-de-uso" className="hover:text-[#667eea] transition-colors">
                Termos de Uso
              </Link>
              <Link href="/privacidade" className="hover:text-[#667eea] transition-colors">
                Privacidade
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

