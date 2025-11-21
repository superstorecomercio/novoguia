'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#003366] text-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>
        <nav className="space-y-2">
          <Link
            href="/admin"
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive('/admin') ? 'bg-[#004080]' : 'hover:bg-[#004080]'
            }`}
          >
            📊 Dashboard
          </Link>
          <Link
            href="/admin/hotsites"
            className={`block px-4 py-3 rounded-lg transition-colors ${
              pathname?.startsWith('/admin/hotsites') ? 'bg-[#004080]' : 'hover:bg-[#004080]'
            }`}
          >
            🌐 Hotsites
          </Link>
          <Link
            href="/admin/campanhas"
            className={`block px-4 py-3 rounded-lg transition-colors ${
              pathname?.startsWith('/admin/campanhas') ? 'bg-[#004080]' : 'hover:bg-[#004080]'
            }`}
          >
            📢 Campanhas
          </Link>
          <Link
            href="/admin/orcamentos"
            className={`block px-4 py-3 rounded-lg transition-colors ${
              pathname?.startsWith('/admin/orcamentos') ? 'bg-[#004080]' : 'hover:bg-[#004080]'
            }`}
          >
            📝 Orçamentos
          </Link>
        </nav>
      </div>
    </aside>
  );
}

