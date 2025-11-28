'use client';

import { useState } from 'react';

export default function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/sync-cidades', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Sincronizado! ${data.data?.[0]?.total_corrigidos || 0} hotsites atualizados.`);
      } else {
        setMessage(`❌ Erro: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleSync}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '⏳ Sincronizando...' : '🔄 Sincronizar Cidades'}
      </button>
      {message && (
        <p className={`text-sm ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}












