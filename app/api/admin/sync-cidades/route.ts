import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * API para sincronizar cidade_id de hotsites com campanhas ativas
 * Execute após criar novas campanhas
 */
export async function POST() {
  try {
    const supabase = createServerClient();
    
    // Executar a procedure de sincronização
    const { data, error } = await supabase.rpc('sync_hotsites_cidade_id');
    
    if (error) {
      console.error('Erro ao sincronizar:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Hotsites sincronizados com sucesso!',
      data,
    });
  } catch (err: any) {
    console.error('Erro ao sincronizar:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}











