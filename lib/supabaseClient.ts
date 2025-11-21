import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

