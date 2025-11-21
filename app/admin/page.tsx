import Link from 'next/link';
import { createAdminClient } from '../../lib/supabase/server';

// Desabilitar cache para sempre buscar dados atualizados
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = createAdminClient();

  // Buscar estatísticas
  const [hotsitesCount, campanhasCount, orcamentosCount] = await Promise.all([
    supabase.from('hotsites').select('id', { count: 'exact', head: true }),
    supabase.from('campanhas').select('id', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('orcamentos').select('id', { count: 'exact', head: true }),
  ]);

  const campanhasAtivas = campanhasCount.count || 0;

  const stats = [
    {
      title: 'Hotsites',
      value: hotsitesCount.count || 0,
      href: '/admin/hotsites',
      icon: '🌐',
      color: 'bg-green-500',
    },
    {
      title: 'Campanhas Ativas',
      value: campanhasAtivas,
      href: '/admin/campanhas',
      icon: '📢',
      color: 'bg-blue-500',
    },
    {
      title: 'Orçamentos',
      value: orcamentosCount.count || 0,
      href: '/admin/orcamentos',
      icon: '📝',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/hotsites"
            className="px-6 py-3 bg-[#0073e6] text-white rounded-lg hover:bg-[#005bb5] transition-colors text-center font-medium"
          >
            Gerenciar Hotsites
          </Link>
          <Link
            href="/admin/campanhas"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
          >
            Gerenciar Campanhas
          </Link>
          <Link
            href="/admin/orcamentos"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center font-medium"
          >
            Ver Orçamentos
          </Link>
        </div>
      </div>
    </div>
  );
}

