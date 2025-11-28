-- Migration: Adicionar campo envia_email_ativacao em campanhas
-- Data: 2025-11-27
-- Descrição: Adiciona campo para controlar se deve enviar email ao ativar/desativar campanha

ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS envia_email_ativacao BOOLEAN DEFAULT false;

COMMENT ON COLUMN campanhas.envia_email_ativacao IS 'Se true, envia email automaticamente ao ativar/desativar a campanha';

-- Criar templates de email se não existirem
INSERT INTO email_templates (tipo, nome, assunto, corpo_html, variaveis, ativo)
VALUES 
  (
    'campanha_ativada',
    'Campanha Ativada',
    'Sua campanha foi ativada - {{nome_empresa}}',
    '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campanha Ativada</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Campanha Ativada!</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-bottom: 20px;">Olá <strong>{{nome_empresa}}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Sua campanha foi <strong style="color: #10b981;">ativada com sucesso</strong>!
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
      <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">📋 Detalhes da Campanha</h2>
      <p style="margin: 10px 0;"><strong>Empresa:</strong> {{nome_empresa}}</p>
      <p style="margin: 10px 0;"><strong>Data de Início:</strong> {{data_inicio}}</p>
      {{#if data_fim}}
      <p style="margin: 10px 0;"><strong>Data de Fim:</strong> {{data_fim}}</p>
      {{/if}}
      {{#if plano}}
      <p style="margin: 10px 0;"><strong>Plano:</strong> {{plano}}</p>
      {{/if}}
      {{#if valor_mensal}}
      <p style="margin: 10px 0;"><strong>Valor Mensal:</strong> {{valor_mensal}}</p>
      {{/if}}
    </div>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      A partir de agora, sua empresa começará a receber orçamentos de clientes interessados em seus serviços.
    </p>
    
    <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <p style="margin: 0; color: #1e40af; font-size: 14px;">
        💡 <strong>Dica:</strong> Mantenha seus dados atualizados para receber mais orçamentos!
      </p>
    </div>
    
    <p style="font-size: 16px; margin-top: 30px;">
      Se tiver alguma dúvida, entre em contato conosco.
    </p>
    
    <p style="font-size: 16px; margin-top: 20px;">
      Atenciosamente,<br>
      <strong>Equipe MudaTech</strong>
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
    <p>Este é um email automático, por favor não responda.</p>
  </div>
</body>
</html>',
    '["nome_empresa", "nome_campanha", "nome_plano", "plano", "data_inicio", "data_fim", "data_vencimento", "valor_mensal", "codigo_rastreamento"]'::JSONB,
    true
  ),
  (
    'campanha_desativada',
    'Campanha Desativada',
    'Sua campanha foi desativada - {{nome_empresa}}',
    '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campanha Desativada</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Campanha Desativada</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-bottom: 20px;">Olá <strong>{{nome_empresa}}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Informamos que sua campanha foi <strong style="color: #ef4444;">desativada</strong>.
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
      <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">📋 Detalhes da Campanha</h2>
      <p style="margin: 10px 0;"><strong>Empresa:</strong> {{nome_empresa}}</p>
      <p style="margin: 10px 0;"><strong>Data de Início:</strong> {{data_inicio}}</p>
      {{#if data_fim}}
      <p style="margin: 10px 0;"><strong>Data de Fim:</strong> {{data_fim}}</p>
      {{/if}}
      {{#if plano}}
      <p style="margin: 10px 0;"><strong>Plano:</strong> {{plano}}</p>
      {{/if}}
    </div>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      A partir de agora, sua empresa <strong>não receberá mais orçamentos</strong> de clientes até que a campanha seja reativada.
    </p>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        ⚠️ <strong>Atenção:</strong> Para voltar a receber orçamentos, é necessário reativar sua campanha.
      </p>
    </div>
    
    <p style="font-size: 16px; margin-top: 30px;">
      Se tiver alguma dúvida ou desejar reativar sua campanha, entre em contato conosco.
    </p>
    
    <p style="font-size: 16px; margin-top: 20px;">
      Atenciosamente,<br>
      <strong>Equipe MudaTech</strong>
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
    <p>Este é um email automático, por favor não responda.</p>
  </div>
</body>
</html>',
    '["nome_empresa", "nome_campanha", "nome_plano", "plano", "data_inicio", "data_fim", "data_vencimento", "codigo_rastreamento"]'::JSONB,
    true
  )
ON CONFLICT (tipo) DO NOTHING;

