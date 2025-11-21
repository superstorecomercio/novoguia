import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-gray-900 text-lg font-bold mb-4 bg-gradient-to-r from-[#FF385C] to-[#E61E4D] bg-clip-text text-transparent">
              Guia de Mudanças
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Encontre as melhores empresas de mudança na sua região. Compare preços e serviços.
            </p>
          </div>
          <div>
            <h4 className="text-gray-900 font-semibold mb-4 text-sm">Links Rápidos</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="text-gray-600 hover:text-[#FF385C] transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link
                  href="/cidades"
                  className="text-gray-600 hover:text-[#FF385C] transition-colors"
                >
                  Cidades
                </Link>
              </li>
              <li>
                <Link
                  href="/orcamento"
                  className="text-gray-600 hover:text-[#FF385C] transition-colors"
                >
                  Solicitar Orçamento
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-gray-900 font-semibold mb-4 text-sm">Institucional</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/quem-somos"
                  className="text-gray-600 hover:text-[#FF385C] transition-colors"
                >
                  Quem Somos
                </Link>
              </li>
              <li>
                <Link
                  href="/contato"
                  className="text-gray-600 hover:text-[#FF385C] transition-colors"
                >
                  Contato
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-gray-900 font-semibold mb-4 text-sm">Suporte</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Precisa de ajuda? Entre em contato conosco.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} Guia de Mudanças. Todos os direitos reservados.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/" className="text-gray-600 hover:text-[#FF385C] transition-colors text-sm">
              Termos
            </Link>
            <Link href="/" className="text-gray-600 hover:text-[#FF385C] transition-colors text-sm">
              Privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
