# Changelog - VPS WhatsApp Bot

## [1.0.2] - 2025-11-26
### Alterações
- ✅ Adicionado código único de orçamento (MD-XXXX-XXXX)
- ✅ Melhorias na validação de data (aceita múltiplos formatos: DD/MM, DD.MM, DD MM, DD/MM/YYYY)
- ✅ Separação de mensagens (dados do orçamento + lista de empresas)
- ✅ Marca MudaTech nas mensagens
- ✅ Lista de empresas com links WhatsApp encurtados
- ✅ URL shortener com múltiplos serviços (is.gd → v.gd → 0x0.st)
- ✅ Validação de telefone robusta (telefone-validator.js)
- ✅ Prevenção de números clicáveis (nomes entre aspas)
- ✅ Ativação melhorada ("calcular mudança", "olá" com/sem acento)
- ✅ Normalização de texto (remove acentos para melhor detecção)

### Arquivos Modificados
- `message-handler.js` - Ativação melhorada, separação de mensagens, código do orçamento
- `supabase-service.js` - Busca código do orçamento, geração de links WhatsApp
- `url-shortener.js` - Múltiplos serviços de encurtamento
- `date-validator.js` - Validação de múltiplos formatos de data
- `telefone-validator.js` - Validação robusta de telefones brasileiros

## [1.0.1] - 2025-11-25
### Alterações
- ✅ Adicionada exibição de lista de empresas notificadas
- ✅ Busca de nomes e telefones das empresas
- ✅ Criação de links WhatsApp para empresas

## [1.0.0] - 2025-01-23
### Inicial
- ✅ Versão inicial do sistema
- ✅ Bot conversacional completo (10 perguntas)
- ✅ Integração OpenAI (cálculo de distância e preço)
- ✅ Integração Supabase (salvamento e notificação)
- ✅ Webhook Facebook configurado
- ✅ SSL e domínio ativos
- ✅ PM2 para gerenciamento de processos
