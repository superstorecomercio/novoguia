# 📝 Templates de Email

## Visão Geral

Sistema completo de templates de email com rastreamento único para identificar se empresas repassam orçamentos para outras empresas.

## 🎯 Funcionalidades

### Templates Disponíveis

1. **Orçamento para Empresa** (`orcamento_empresa`)
   - Enviado quando um novo orçamento é criado
   - Contém todos os dados do cliente e da mudança
   - Link para WhatsApp

2. **Campanha Vencendo (1 dia antes)** (`campanha_vencendo_1dia`)
   - Enviado 1 dia antes do vencimento
   - Aviso para renovação
   - Link para pagamento

3. **Campanha Vencendo (Hoje)** (`campanha_vencendo_hoje`)
   - Enviado no dia do vencimento
   - Aviso urgente
   - Link para pagamento

4. **Campanha Ativada** (`campanha_ativada`)
   - Enviado ao ativar uma campanha
   - Confirmação de ativação

5. **Campanha Desativada** (`campanha_desativada`)
   - Enviado ao desativar uma campanha
   - Informação sobre desativação

### Sistema de Rastreamento

Cada email enviado para empresas contém um **código único de rastreamento** (ex: `MT-ABC12345`) que:

- ✅ É inserido automaticamente no final do email (texto invisível)
- ✅ Permite identificar qual empresa recebeu o email original
- ✅ Detecta se o email foi repassado para outra empresa
- ✅ Quando um cliente te passa um email, você pode buscar pelo código para identificar a empresa

## 📍 Onde Gerenciar

### Página de Templates
- **URL**: `/admin/emails/templates`
- **Funcionalidades**:
  - Visualizar todos os templates
  - Editar templates (assunto e corpo HTML)
  - Preview dos templates com dados de exemplo
  - Ver variáveis disponíveis

### Página de Rastreamento
- **URL**: `/admin/emails/tracking`
- **Funcionalidades**:
  - Ver todos os emails enviados
  - Buscar por código de rastreamento
  - Ver detalhes de cada email
  - Identificar empresa que recebeu o email

## 🔧 Como Usar

### Editar um Template

1. Acesse `/admin/emails/templates`
2. Clique em "Editar Template" no template desejado
3. Modifique o assunto e/ou corpo HTML
4. Use variáveis como `{{variavel}}` e condicionais `{{#if variavel}}...{{/if}}`
5. Clique em "Salvar Template"
6. Use "Visualizar Preview" para ver como ficará

### Buscar por Código de Rastreamento

1. Acesse `/admin/emails/tracking`
2. Digite o código de rastreamento (ex: `MT-ABC12345`)
3. Clique em "Buscar"
4. Veja os detalhes do email e identifique a empresa

## 📋 Variáveis Disponíveis

### Template: Orçamento para Empresa

- `{{codigo_orcamento}}` - Código do orçamento
- `{{nome_cliente}}` - Nome do cliente
- `{{email_cliente}}` - Email do cliente
- `{{telefone_cliente}}` - Telefone do cliente
- `{{origem_completo}}` - Origem completa
- `{{destino_completo}}` - Destino completo
- `{{distancia_km}}` - Distância em km
- `{{tipo_imovel}}` - Tipo do imóvel
- `{{metragem}}` - Metragem
- `{{data_estimada}}` - Data estimada
- `{{preco_min}}` - Preço mínimo
- `{{preco_max}}` - Preço máximo
- `{{lista_objetos}}` - Lista de objetos
- `{{url_whatsapp}}` - URL do WhatsApp
- `{{codigo_rastreamento}}` - Código único de rastreamento (automático)

### Template: Campanha Vencendo

- `{{nome_campanha}}` - Nome da campanha
- `{{data_vencimento}}` - Data de vencimento
- `{{nome_plano}}` - Nome do plano
- `{{valor_plano}}` - Valor do plano
- `{{url_pagamento}}` - URL para pagamento
- `{{codigo_rastreamento}}` - Código único de rastreamento (automático)

### Template: Campanha Ativada/Desativada

- `{{nome_campanha}}` - Nome da campanha
- `{{nome_plano}}` - Nome do plano
- `{{data_vencimento}}` - Data de vencimento (apenas ativada)
- `{{codigo_rastreamento}}` - Código único de rastreamento (automático)

## 🔍 Código de Rastreamento

### Formato
- Formato: `MT-XXXXXXXX` (ex: `MT-ABC12345`)
- 8 caracteres alfanuméricos
- Único para cada email enviado

### Localização no Email
O código é inserido automaticamente no final do email como:
```html
<p style="color: #ffffff; font-size: 1px; line-height: 1px;">MT-ABC12345</p>
```

Isso torna o código **invisível** para o usuário, mas ainda presente no HTML do email.

### Como Funciona

1. **Envio**: Quando um email é enviado, um código único é gerado
2. **Inserção**: O código é inserido no template automaticamente
3. **Tracking**: O código é salvo no banco com informações do email
4. **Rastreamento**: Se o cliente te passar o email, você busca pelo código
5. **Identificação**: O sistema mostra qual empresa recebeu o email original

## 💻 Integração no Código

### Enviar Email com Template

```typescript
import { processEmailTemplate, saveEmailTracking } from '@/lib/email/template-service'

// Processar template
const resultado = await processEmailTemplate('orcamento_empresa', {
  codigo_orcamento: 'MD-1234-5678',
  nome_cliente: 'João Silva',
  email_cliente: 'joao@exemplo.com',
  // ... outras variáveis
})

if (resultado) {
  // Enviar email
  await sendEmail({
    to: hotsite.email,
    subject: resultado.assunto,
    html: resultado.html,
    // ...
  })

  // Salvar tracking
  await saveEmailTracking({
    codigo_rastreamento: resultado.codigoRastreamento,
    orcamento_id: orcamento.id,
    hotsite_id: hotsite.id,
    tipo_email: 'orcamento_empresa',
    email_destinatario: hotsite.email,
    assunto: resultado.assunto
  })
}
```

### Buscar Tracking

```typescript
import { getTrackingByCode } from '@/lib/email/template-service'

const tracking = await getTrackingByCode('MT-ABC12345')
if (tracking) {
  console.log('Empresa:', tracking.hotsites?.nome_exibicao)
  console.log('Orçamento:', tracking.orcamentos?.codigo_orcamento)
}
```

## 📊 Banco de Dados

### Tabela: `email_templates`
Armazena os templates de email editáveis.

### Tabela: `email_tracking`
Armazena o rastreamento de cada email enviado com:
- Código de rastreamento único
- Informações do email (destinatário, assunto, tipo)
- Relacionamentos (orcamento, campanha, hotsite)
- Status (visualizado, clicado)

## 🎨 Personalização

Os templates são totalmente editáveis via interface. Você pode:
- Modificar cores e estilos
- Adicionar/remover seções
- Personalizar mensagens
- Adicionar imagens/logos

## 🔐 Segurança

- Códigos de rastreamento são únicos e não podem ser adivinhados
- Apenas admins podem ver os códigos e rastreamentos
- Os códigos são invisíveis no email (mas presentes no HTML)


