-- Migration: Criar template de email para clientes
-- Data: 2025-11-27
-- Descrição: Template enviado aos clientes que preencheram o orçamento, com detalhes e lista de empresas

INSERT INTO email_templates (tipo, nome, assunto, corpo_html, variaveis) VALUES (
  'orcamento_cliente',
  'Orçamento para Cliente',
  'Seu Orçamento de Mudança - {{codigo_orcamento}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu Orçamento de Mudança</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🚚 Seu Orçamento de Mudança</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
      <strong style="color: #1e40af; font-size: 18px;">Código do Orçamento: {{codigo_orcamento}}</strong>
    </div>
    
    <p style="color: #1f2937; font-size: 16px; margin-bottom: 25px;">
      Olá <strong>{{nome_cliente}}</strong>!<br><br>
      Recebemos seu pedido de orçamento de mudança. Abaixo estão os detalhes do seu orçamento e as empresas que foram notificadas para entrar em contato com você.
    </p>

    <h2 style="color: #1f2937; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 30px;">📋 Detalhes da Mudança</h2>
    <table style="width: 100%; margin-bottom: 25px; background: white; border-radius: 8px; padding: 15px;">
      <tr>
        <td style="padding: 10px 0; font-weight: bold; width: 150px; color: #4b5563;">Origem:</td>
        <td style="padding: 10px 0; color: #1f2937;">{{origem_completo}}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; font-weight: bold; color: #4b5563;">Destino:</td>
        <td style="padding: 10px 0; color: #1f2937;">{{destino_completo}}</td>
      </tr>
      {{#if distancia_km}}
      <tr>
        <td style="padding: 10px 0; font-weight: bold; color: #4b5563;">Distância:</td>
        <td style="padding: 10px 0; color: #1f2937;">{{distancia_km}} km</td>
      </tr>
      {{/if}}
      <tr>
        <td style="padding: 10px 0; font-weight: bold; color: #4b5563;">Tipo de Imóvel:</td>
        <td style="padding: 10px 0; color: #1f2937;">{{tipo_imovel}}</td>
      </tr>
      {{#if metragem}}
      <tr>
        <td style="padding: 10px 0; font-weight: bold; color: #4b5563;">Metragem:</td>
        <td style="padding: 10px 0; color: #1f2937;">{{metragem}}</td>
      </tr>
      {{/if}}
      {{#if data_estimada}}
      <tr>
        <td style="padding: 10px 0; font-weight: bold; color: #4b5563;">Data Estimada:</td>
        <td style="padding: 10px 0; color: #1f2937;">{{data_estimada}}</td>
      </tr>
      {{/if}}
    </table>

    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
      <h3 style="color: white; margin: 0 0 10px 0; font-size: 20px;">💰 Faixa de Preço Estimada</h3>
      <p style="color: white; margin: 0; font-size: 24px; font-weight: bold;">
        {{preco_min}} - {{preco_max}}
      </p>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
        * Valores estimados. As empresas entrarão em contato com uma cotação personalizada.
      </p>
    </div>

    {{#if lista_objetos}}
    <h2 style="color: #1f2937; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 30px;">📦 Lista de Objetos</h2>
    <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; white-space: pre-wrap; font-family: monospace; font-size: 14px; color: #1f2937;">
{{lista_objetos}}
    </div>
    {{/if}}

    <h2 style="color: #1f2937; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 30px;">🏢 Empresas Notificadas</h2>
    <p style="color: #4b5563; font-size: 14px; margin-bottom: 20px;">
      As seguintes empresas foram notificadas sobre seu orçamento e entrarão em contato em breve:
    </p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      {{lista_empresas}}
    </div>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 5px;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        <strong>💡 Dica:</strong> As empresas entrarão em contato com você através do telefone ou WhatsApp informado. 
        Fique atento às ligações e mensagens!
      </p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        Este orçamento foi gerado automaticamente pelo sistema MudaTech.<br>
        Se tiver dúvidas, entre em contato conosco.
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>MudaTech - Plataforma de Orçamentos de Mudança</p>
    <p style="color: #ffffff; font-size: 1px; line-height: 1px;">{{codigo_rastreamento}}</p>
  </div>
</body>
</html>',
  '["codigo_orcamento", "nome_cliente", "email_cliente", "telefone_cliente", "origem_completo", "destino_completo", "distancia_km", "tipo_imovel", "metragem", "data_estimada", "preco_min", "preco_max", "lista_objetos", "lista_empresas", "codigo_rastreamento"]'::JSONB
) ON CONFLICT (tipo) DO UPDATE SET
  nome = EXCLUDED.nome,
  assunto = EXCLUDED.assunto,
  corpo_html = EXCLUDED.corpo_html,
  variaveis = EXCLUDED.variaveis,
  updated_at = NOW();

COMMENT ON COLUMN email_templates.tipo IS 'Tipo do template: orcamento_empresa, orcamento_cliente, campanha_vencendo_1dia, campanha_vencendo_hoje, campanha_ativada, campanha_desativada';

