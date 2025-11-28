-- Migration: Criar tabela de templates de email
-- Data: 2025-11-26
-- Descrição: Armazena templates de email para diferentes tipos de notificações

-- ============================================
-- CRIAR TABELA DE TEMPLATES DE EMAIL
-- ============================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(100) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  assunto VARCHAR(500) NOT NULL,
  corpo_html TEXT NOT NULL,
  variaveis JSONB, -- Variáveis disponíveis no template
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_email_templates_tipo ON email_templates(tipo);
CREATE INDEX IF NOT EXISTS idx_email_templates_ativo ON email_templates(ativo);

-- Comentários
COMMENT ON TABLE email_templates IS 'Templates de email para diferentes tipos de notificações';
COMMENT ON COLUMN email_templates.tipo IS 'Tipo do template: orcamento_empresa, campanha_vencendo_1dia, campanha_vencendo_hoje, campanha_ativada, campanha_desativada';
COMMENT ON COLUMN email_templates.variaveis IS 'Lista de variáveis disponíveis no template em formato JSON';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_email_templates_updated_at
BEFORE UPDATE ON email_templates
FOR EACH ROW
EXECUTE FUNCTION update_email_templates_updated_at();

-- ============================================
-- CRIAR TABELA DE TRACKING DE EMAILS
-- ============================================

CREATE TABLE IF NOT EXISTS email_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_rastreamento VARCHAR(50) UNIQUE NOT NULL,
  orcamento_id UUID REFERENCES orcamentos(id) ON DELETE CASCADE,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  hotsite_id UUID REFERENCES hotsites(id) ON DELETE CASCADE,
  tipo_email VARCHAR(100) NOT NULL, -- orcamento_empresa, campanha_vencendo, etc
  email_destinatario VARCHAR(255) NOT NULL,
  assunto VARCHAR(500),
  enviado_em TIMESTAMPTZ DEFAULT NOW(),
  visualizado BOOLEAN DEFAULT false,
  visualizado_em TIMESTAMPTZ,
  clicado BOOLEAN DEFAULT false,
  clicado_em TIMESTAMPTZ,
  metadata JSONB -- Dados adicionais
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_email_tracking_codigo ON email_tracking(codigo_rastreamento);
CREATE INDEX IF NOT EXISTS idx_email_tracking_orcamento ON email_tracking(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_campanha ON email_tracking(campanha_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_hotsite ON email_tracking(hotsite_id);

-- Comentários
COMMENT ON TABLE email_tracking IS 'Rastreamento de emails enviados com código único para identificar repasse';
COMMENT ON COLUMN email_tracking.codigo_rastreamento IS 'Código único e aleatório para rastrear se email foi repassado';
COMMENT ON COLUMN email_tracking.tipo_email IS 'Tipo do email: orcamento_empresa, campanha_vencendo_1dia, campanha_vencendo_hoje, campanha_ativada, campanha_desativada';

-- ============================================
-- INSERIR TEMPLATES PADRÃO
-- ============================================

-- Template: Orçamento para Empresa
INSERT INTO email_templates (tipo, nome, assunto, corpo_html, variaveis) VALUES (
  'orcamento_empresa',
  'Orçamento para Empresa',
  'Novo Orçamento de Mudança - {{codigo_orcamento}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novo Orçamento de Mudança</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🚚 Novo Orçamento de Mudança</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
      <strong style="color: #1e40af; font-size: 18px;">Código: {{codigo_orcamento}}</strong>
    </div>
    
    <h2 style="color: #1f2937; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Dados do Cliente</h2>
    <table style="width: 100%; margin-bottom: 25px;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; width: 150px;">Nome:</td>
        <td style="padding: 8px 0;">{{nome_cliente}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Email:</td>
        <td style="padding: 8px 0;"><a href="mailto:{{email_cliente}}" style="color: #667eea;">{{email_cliente}}</a></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Telefone:</td>
        <td style="padding: 8px 0;"><a href="tel:{{telefone_cliente}}" style="color: #667eea;">{{telefone_cliente}}</a></td>
      </tr>
    </table>

    <h2 style="color: #1f2937; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 30px;">Detalhes da Mudança</h2>
    <table style="width: 100%; margin-bottom: 25px;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; width: 150px;">Origem:</td>
        <td style="padding: 8px 0;">{{origem_completo}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Destino:</td>
        <td style="padding: 8px 0;">{{destino_completo}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Distância:</td>
        <td style="padding: 8px 0;">{{distancia_km}} km</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Tipo:</td>
        <td style="padding: 8px 0;">{{tipo_imovel}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Metragem:</td>
        <td style="padding: 8px 0;">{{metragem}}</td>
      </tr>
      {{#if data_estimada}}
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Data Estimada:</td>
        <td style="padding: 8px 0;">{{data_estimada}}</td>
      </tr>
      {{/if}}
    </table>

    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
      <h3 style="color: white; margin: 0 0 10px 0; font-size: 20px;">💰 Faixa de Preço Estimada</h3>
      <p style="color: white; margin: 0; font-size: 24px; font-weight: bold;">
        R$ {{preco_min}} - R$ {{preco_max}}
      </p>
    </div>

    {{#if lista_objetos}}
    <h2 style="color: #1f2937; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 30px;">Lista de Objetos</h2>
    <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; white-space: pre-wrap; font-family: monospace; font-size: 14px;">
{{lista_objetos}}
    </div>
    {{/if}}

    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
      <a href="{{url_whatsapp}}" style="display: inline-block; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        📱 Entrar em Contato via WhatsApp
      </a>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        Este orçamento foi gerado automaticamente pelo sistema MudaTech.<br>
        Entre em contato com o cliente para fornecer uma cotação personalizada.
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>MudaTech - Plataforma de Orçamentos de Mudança</p>
    <p style="color: #ffffff; font-size: 1px; line-height: 1px;">{{codigo_rastreamento}}</p>
  </div>
</body>
</html>',
  '["codigo_orcamento", "nome_cliente", "email_cliente", "telefone_cliente", "origem_completo", "destino_completo", "distancia_km", "tipo_imovel", "metragem", "data_estimada", "preco_min", "preco_max", "lista_objetos", "url_whatsapp", "codigo_rastreamento"]'::JSONB
) ON CONFLICT (tipo) DO NOTHING;

-- Template: Campanha Vencendo (1 dia antes)
INSERT INTO email_templates (tipo, nome, assunto, corpo_html, variaveis) VALUES (
  'campanha_vencendo_1dia',
  'Campanha Vencendo - 1 Dia Antes',
  'Sua campanha vence amanhã - {{nome_campanha}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campanha Vencendo</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Campanha Vencendo</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
      <strong style="color: #92400e; font-size: 16px;">⚠️ Sua campanha vence amanhã!</strong>
    </div>
    
    <h2 style="color: #1f2937; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">Detalhes da Campanha</h2>
    <table style="width: 100%; margin-bottom: 25px;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; width: 150px;">Nome:</td>
        <td style="padding: 8px 0;">{{nome_campanha}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Data de Vencimento:</td>
        <td style="padding: 8px 0;"><strong style="color: #d97706;">{{data_vencimento}}</strong></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Plano:</td>
        <td style="padding: 8px 0;">{{nome_plano}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Valor:</td>
        <td style="padding: 8px 0;">R$ {{valor_plano}}</td>
      </tr>
    </table>

    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
      <h3 style="color: white; margin: 0 0 15px 0; font-size: 20px;">💳 Renove sua Campanha</h3>
      <p style="color: white; margin: 0 0 20px 0; font-size: 16px;">
        Para continuar recebendo orçamentos, renove sua campanha antes do vencimento.
      </p>
      <a href="{{url_pagamento}}" style="display: inline-block; background: white; color: #3b82f6; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Renovar Agora
      </a>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        <strong>Dúvidas?</strong> Entre em contato conosco através do email <a href="mailto:contato@mudatech.com.br" style="color: #667eea;">contato@mudatech.com.br</a>
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>MudaTech - Plataforma de Orçamentos de Mudança</p>
    <p style="color: #ffffff; font-size: 1px; line-height: 1px;">{{codigo_rastreamento}}</p>
  </div>
</body>
</html>',
  '["nome_campanha", "data_vencimento", "nome_plano", "valor_plano", "url_pagamento", "codigo_rastreamento"]'::JSONB
) ON CONFLICT (tipo) DO NOTHING;

-- Template: Campanha Vencendo (Hoje)
INSERT INTO email_templates (tipo, nome, assunto, corpo_html, variaveis) VALUES (
  'campanha_vencendo_hoje',
  'Campanha Vencendo - Hoje',
  'URGENTE: Sua campanha vence hoje - {{nome_campanha}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campanha Vencendo Hoje</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🚨 Campanha Vencendo Hoje</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
      <strong style="color: #991b1b; font-size: 18px;">🚨 URGENTE: Sua campanha vence hoje!</strong>
    </div>
    
    <h2 style="color: #1f2937; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">Detalhes da Campanha</h2>
    <table style="width: 100%; margin-bottom: 25px;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; width: 150px;">Nome:</td>
        <td style="padding: 8px 0;">{{nome_campanha}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Data de Vencimento:</td>
        <td style="padding: 8px 0;"><strong style="color: #dc2626; font-size: 18px;">{{data_vencimento}} (HOJE)</strong></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Plano:</td>
        <td style="padding: 8px 0;">{{nome_plano}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Valor:</td>
        <td style="padding: 8px 0;">R$ {{valor_plano}}</td>
      </tr>
    </table>

    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
      <h3 style="color: white; margin: 0 0 15px 0; font-size: 22px;">💳 Renove AGORA</h3>
      <p style="color: white; margin: 0 0 20px 0; font-size: 16px;">
        Sua campanha expira hoje. Renove agora para não perder orçamentos!
      </p>
      <a href="{{url_pagamento}}" style="display: inline-block; background: white; color: #ef4444; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
        Renovar Agora
      </a>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        <strong>Dúvidas?</strong> Entre em contato conosco através do email <a href="mailto:contato@mudatech.com.br" style="color: #667eea;">contato@mudatech.com.br</a>
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>MudaTech - Plataforma de Orçamentos de Mudança</p>
    <p style="color: #ffffff; font-size: 1px; line-height: 1px;">{{codigo_rastreamento}}</p>
  </div>
</body>
</html>',
  '["nome_campanha", "data_vencimento", "nome_plano", "valor_plano", "url_pagamento", "codigo_rastreamento"]'::JSONB
) ON CONFLICT (tipo) DO NOTHING;

-- Template: Campanha Ativada
INSERT INTO email_templates (tipo, nome, assunto, corpo_html, variaveis) VALUES (
  'campanha_ativada',
  'Campanha Ativada',
  'Sua campanha foi ativada - {{nome_campanha}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campanha Ativada</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Campanha Ativada</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
      <strong style="color: #065f46; font-size: 16px;">🎉 Parabéns! Sua campanha está ativa</strong>
    </div>
    
    <h2 style="color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Detalhes da Campanha</h2>
    <table style="width: 100%; margin-bottom: 25px;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; width: 150px;">Nome:</td>
        <td style="padding: 8px 0;">{{nome_campanha}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Plano:</td>
        <td style="padding: 8px 0;">{{nome_plano}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Validade:</td>
        <td style="padding: 8px 0;">Até {{data_vencimento}}</td>
      </tr>
    </table>

    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
      <p style="color: white; margin: 0; font-size: 16px;">
        Sua empresa já está recebendo orçamentos de mudança! 🚚
      </p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        <strong>Dúvidas?</strong> Entre em contato conosco através do email <a href="mailto:contato@mudatech.com.br" style="color: #667eea;">contato@mudatech.com.br</a>
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>MudaTech - Plataforma de Orçamentos de Mudança</p>
    <p style="color: #ffffff; font-size: 1px; line-height: 1px;">{{codigo_rastreamento}}</p>
  </div>
</body>
</html>',
  '["nome_campanha", "nome_plano", "data_vencimento", "codigo_rastreamento"]'::JSONB
) ON CONFLICT (tipo) DO NOTHING;

-- Template: Campanha Desativada
INSERT INTO email_templates (tipo, nome, assunto, corpo_html, variaveis) VALUES (
  'campanha_desativada',
  'Campanha Desativada',
  'Sua campanha foi desativada - {{nome_campanha}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campanha Desativada</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⏸️ Campanha Desativada</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <div style="background: #f3f4f6; border-left: 4px solid #6b7280; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
      <strong style="color: #374151; font-size: 16px;">Sua campanha foi desativada</strong>
    </div>
    
    <h2 style="color: #1f2937; border-bottom: 2px solid #6b7280; padding-bottom: 10px;">Detalhes da Campanha</h2>
    <table style="width: 100%; margin-bottom: 25px;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; width: 150px;">Nome:</td>
        <td style="padding: 8px 0;">{{nome_campanha}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Plano:</td>
        <td style="padding: 8px 0;">{{nome_plano}}</td>
      </tr>
    </table>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <p style="color: #374151; margin: 0; font-size: 16px; text-align: center;">
        Sua campanha foi desativada e não receberá mais orçamentos.
      </p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        Para reativar sua campanha, entre em contato conosco através do email <a href="mailto:contato@mudatech.com.br" style="color: #667eea;">contato@mudatech.com.br</a>
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>MudaTech - Plataforma de Orçamentos de Mudança</p>
    <p style="color: #ffffff; font-size: 1px; line-height: 1px;">{{codigo_rastreamento}}</p>
  </div>
</body>
</html>',
  '["nome_campanha", "nome_plano", "codigo_rastreamento"]'::JSONB
) ON CONFLICT (tipo) DO NOTHING;

-- ============================================
-- FIM DA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Migration 033_criar_tabela_email_templates.sql aplicada com sucesso!';
  RAISE NOTICE '  - Tabela "email_templates" criada';
  RAISE NOTICE '  - Tabela "email_tracking" criada';
  RAISE NOTICE '  - Templates padrão inseridos';
  RAISE NOTICE '================================================';
END $$;



