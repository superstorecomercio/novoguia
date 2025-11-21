import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local file.\n\n' +
    'Para configurar:\n' +
    '1. Crie o arquivo .env.local na raiz do projeto\n' +
    '2. Adicione:\n' +
    '   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co\n' +
    '   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key\n' +
    '3. Reinicie o servidor: npm run dev'
  );
}

/**
 * Cliente Supabase para uso em Server Components
 * Use este cliente em páginas e Server Components
 */
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};

/**
 * Cliente Supabase Admin com SERVICE_ROLE_KEY
 * Bypassa Row Level Security (RLS)
 * Use APENAS em rotas de API admin ou operações privilegiadas
 * NUNCA exponha este cliente ao cliente/browser
 */
export const createAdminClient = () => {
  if (!supabaseServiceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable.\n\n' +
      'Para configurar:\n' +
      '1. Adicione no arquivo .env.local:\n' +
      '   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key\n' +
      '2. Encontre a chave em: Supabase Dashboard > Settings > API > service_role key\n' +
      '3. Reinicie o servidor: npm run dev'
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

