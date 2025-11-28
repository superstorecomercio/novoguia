-- Migration: Criar função para adicionar emails de campanhas vencendo à fila
-- Data: 2025-11-27
-- Descrição: Cria função para identificar campanhas que vencem em 1 dia ou hoje
--            e criar registros de email_tracking na fila

-- Função para adicionar emails de campanhas vencendo à fila
CREATE OR REPLACE FUNCTION adicionar_emails_campanhas_vencendo()
RETURNS TABLE (
  campanha_id UUID,
  email_destinatario TEXT,
  tipo_email TEXT,
  data_vencimento DATE,
  emails_criados INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_campanha RECORD;
  v_hotsite RECORD;
  v_codigo_rastreamento TEXT;
  v_assunto TEXT;
  v_emails_criados INTEGER := 0;
  v_tipo_email TEXT;
  v_data_vencimento DATE;
BEGIN
  -- Buscar campanhas que vencem hoje ou em 1 dia
  FOR v_campanha IN
    SELECT 
      c.id as campanha_id,
      c.data_fim,
      c.hotsite_id,
      h.email,
      h.nome_exibicao,
      CASE 
        WHEN c.data_fim = CURRENT_DATE THEN 'campanha_vencendo_hoje'
        WHEN c.data_fim = CURRENT_DATE + INTERVAL '1 day' THEN 'campanha_vencendo_1dia'
      END as tipo_email_calculado
    FROM campanhas c
    INNER JOIN hotsites h ON h.id = c.hotsite_id
    WHERE 
      c.ativo = true
      AND c.data_fim IS NOT NULL
      AND (
        c.data_fim = CURRENT_DATE -- Vence hoje
        OR c.data_fim = CURRENT_DATE + INTERVAL '1 day' -- Vence em 1 dia
      )
      AND h.email IS NOT NULL
      AND h.email != ''
  LOOP
    -- Verificar se já existe um email_tracking para esta campanha e tipo
    -- (evitar duplicatas se a função for executada múltiplas vezes)
    IF NOT EXISTS (
      SELECT 1 
      FROM email_tracking et
      WHERE et.campanha_id = v_campanha.campanha_id
        AND et.tipo_email = v_campanha.tipo_email_calculado
        AND DATE(et.created_at) = CURRENT_DATE -- Apenas emails criados hoje
    ) THEN
      -- Gerar código de rastreamento único
      v_codigo_rastreamento := 'MT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT || v_campanha.campanha_id::TEXT) FROM 1 FOR 8));
      
      -- Montar assunto básico
      v_assunto := 'Sua campanha vence ' || 
        CASE 
          WHEN v_campanha.tipo_email_calculado = 'campanha_vencendo_hoje' THEN 'hoje'
          WHEN v_campanha.tipo_email_calculado = 'campanha_vencendo_1dia' THEN 'amanhã'
        END || 
        ' - ' || COALESCE(v_campanha.nome_exibicao, 'Campanha');
      
      -- Inserir registro de email_tracking
      INSERT INTO email_tracking (
        codigo_rastreamento,
        campanha_id,
        hotsite_id,
        tipo_email,
        email_destinatario,
        assunto,
        metadata,
        enviado_em
      ) VALUES (
        v_codigo_rastreamento,
        v_campanha.campanha_id,
        v_campanha.hotsite_id,
        v_campanha.tipo_email_calculado,
        v_campanha.email,
        v_assunto,
        jsonb_build_object(
          'status_envio', 'na_fila',
          'nome_empresa', v_campanha.nome_exibicao,
          'data_vencimento', v_campanha.data_fim,
          'created_at', NOW()
        ),
        NULL -- NULL porque ainda não foi enviado, está na fila
      )
      ON CONFLICT (codigo_rastreamento) DO NOTHING;
      
      v_emails_criados := v_emails_criados + 1;
      
      -- Retornar informação sobre o email criado
      RETURN QUERY
      SELECT 
        v_campanha.campanha_id,
        v_campanha.email::TEXT,
        v_campanha.tipo_email_calculado::TEXT,
        v_campanha.data_fim,
        1::INTEGER;
    END IF;
  END LOOP;
  
  -- Se não criou nenhum email, retornar vazio
  IF v_emails_criados = 0 THEN
    RETURN;
  END IF;
END;
$$;

COMMENT ON FUNCTION adicionar_emails_campanhas_vencendo() IS 
'Identifica campanhas que vencem hoje ou em 1 dia e cria registros de email_tracking na fila. Evita duplicatas verificando se já existe um email criado hoje para a mesma campanha e tipo.';

-- Criar função auxiliar para executar via cron ou manualmente
CREATE OR REPLACE FUNCTION processar_campanhas_vencendo()
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_resultado JSONB;
  v_total_criados INTEGER := 0;
BEGIN
  -- Executar função e contar resultados
  SELECT COUNT(*) INTO v_total_criados
  FROM adicionar_emails_campanhas_vencendo();
  
  v_resultado := jsonb_build_object(
    'sucesso', true,
    'emails_criados', v_total_criados,
    'executado_em', NOW()
  );
  
  RETURN v_resultado;
END;
$$;

COMMENT ON FUNCTION processar_campanhas_vencendo() IS 
'Função auxiliar para executar adicionar_emails_campanhas_vencendo() e retornar resultado em JSON. Pode ser chamada via cron job ou manualmente.';

