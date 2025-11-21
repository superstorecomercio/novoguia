'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-md backdrop-blur-md bg-opacity-95'
          : 'bg-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="text-2xl font-bold text-[#003366]">
              Guia de Mudanças
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-[#0073e6] ${
                isActive('/') ? 'text-[#0073e6]' : 'text-gray-700'
              }`}
            >
              Início
            </Link>
            <Link
              href="/cidades"
              className={`text-sm font-medium transition-colors hover:text-[#0073e6] ${
                isActive('/cidades') ? 'text-[#0073e6]' : 'text-gray-700'
              }`}
            >
              Cidades
            </Link>
            <Link
              href="/quem-somos"
              className={`text-sm font-medium transition-colors hover:text-[#0073e6] ${
                isActive('/quem-somos') ? 'text-[#0073e6]' : 'text-gray-700'
              }`}
            >
              Sobre
            </Link>
            <Link
              href="/contato"
              className={`text-sm font-medium transition-colors hover:text-[#0073e6] ${
                isActive('/contato') ? 'text-[#0073e6]' : 'text-gray-700'
              }`}
            >
              Contato
            </Link>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/orcamento"
              className="px-6 py-2.5 bg-[#0073e6] text-white rounded-full font-medium text-sm hover:bg-[#005bb5] hover:shadow-lg transition-all duration-200"
            >
              Solicitar Orçamento
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 mt-2 pt-4 animate-fadeIn">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-base font-medium transition-colors ${
                  isActive('/') ? 'text-[#0073e6]' : 'text-gray-700'
                }`}
              >
                Início
              </Link>
              <Link
                href="/cidades"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-base font-medium transition-colors ${
                  isActive('/cidades') ? 'text-[#0073e6]' : 'text-gray-700'
                }`}
              >
                Cidades
              </Link>
              <Link
                href="/quem-somos"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-base font-medium transition-colors ${
                  isActive('/quem-somos') ? 'text-[#0073e6]' : 'text-gray-700'
                }`}
              >
                Sobre
              </Link>
              <Link
                href="/contato"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-base font-medium transition-colors ${
                  isActive('/contato') ? 'text-[#0073e6]' : 'text-gray-700'
                }`}
              >
                Contato
              </Link>
              <Link
                href="/orcamento"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-6 py-2.5 bg-[#0073e6] text-white rounded-full font-medium text-center hover:bg-[#005bb5] transition-colors"
              >
                Solicitar Orçamento
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
