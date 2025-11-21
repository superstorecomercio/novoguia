import { createServerClient } from '@/lib/supabase/server';
import HotsiteForm from '@/app/components/admin/HotsiteForm';

export default async function NovoHotsitePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Criar Novo Hotsite</h1>
        <p className="text-gray-600 mt-2">Preencha os dados para criar um novo hotsite</p>
      </div>
      <HotsiteForm />
    </div>
  );
}
