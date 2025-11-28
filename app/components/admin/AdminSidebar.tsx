'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  // Fechar menu ao clicar em um link no mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevenir scroll do body quando menu está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const mainMenuItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/hotsites', label: 'Hotsites', icon: '🌐' },
    { href: '/admin/campanhas', label: 'Campanhas', icon: '📢' },
    { href: '/admin/planos', label: 'Planos', icon: '💎' },
    { href: '/admin/cidades', label: 'Cidades', icon: '🌍' },
    { href: '/admin/orcamentos', label: 'Orçamentos', icon: '📝' },
    { href: '/admin/orcamentos/simular', label: 'Simular Orçamento', icon: '🧪' },
  ];

  const emailMenuItems = [
    { href: '/admin/emails', label: 'Fila de Emails (Empresas)', icon: '📧' },
    { href: '/admin/emails/clientes', label: 'Fila de Emails (Clientes)', icon: '👤' },
    { href: '/admin/emails/campanhas-vencendo-hoje', label: 'Fila (Vencendo Hoje)', icon: '📅' },
    { href: '/admin/emails/campanhas-vencendo-1dia', label: 'Fila (Vencendo 1 Dia)', icon: '⏰' },
    { href: '/admin/emails/newsletter', label: 'Fila (Newsletter)', icon: '📰' },
    { href: '/admin/emails/configuracao', label: 'API Email (SocketLabs)', icon: '⚙️' },
    { href: '/admin/emails/rotas', label: 'Executar Rotas', icon: '🚀' },
    { href: '/admin/emails/templates', label: 'Templates', icon: '📝' },
    { href: '/admin/emails/logs', label: 'Logs de Envio', icon: '📋' },
    { href: '/admin/emails/tracking', label: 'Rastreamento', icon: '🔍' },
    { href: '/admin/emails/test-mode', label: 'Modo de Teste', icon: '🧪' },
  ];

  const botsMenuItems = [
    { href: '/admin/bots-whatsapp', label: 'Bots WhatsApp', icon: '🤖' },
    { href: '/admin/bots-whatsapp-clientes', label: 'Bots Clientes', icon: '👥' },
    { href: '/admin/modelos-bots', label: 'Modelos de Bots', icon: '📋' },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#003366] text-white shadow-lg h-16">
        <div className="flex items-center justify-between p-4 h-full">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-[#004080] transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full w-64 bg-[#003366] text-white shadow-lg z-50
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 pt-20 lg:pt-6 h-full overflow-y-auto">
          <h1 className="text-2xl font-bold mb-8 hidden lg:block">Admin Dashboard</h1>
          <nav className="space-y-6">
            {/* Menu Principal */}
            <div className="space-y-2">
              {mainMenuItems.map((item) => {
                const active = item.href === '/admin'
                  ? isActive('/admin')
                  : pathname?.startsWith(item.href);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${active ? 'bg-[#004080]' : 'hover:bg-[#004080]'}
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Seção de Emails */}
            <div className="space-y-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Emails
              </div>
              {emailMenuItems.map((item) => {
                const active = pathname?.startsWith(item.href);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${active ? 'bg-[#004080]' : 'hover:bg-[#004080]'}
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Seção de Bots WhatsApp */}
            <div className="space-y-2 border-t border-[#004080] pt-4">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Bots WhatsApp
              </div>
              {botsMenuItems.map((item) => {
                const active = pathname?.startsWith(item.href);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${active ? 'bg-[#004080]' : 'hover:bg-[#004080]'}
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}

