# Links do WhatsApp para Empresas Notificadas

## 📋 Resumo

Implementação de links do WhatsApp encurtados para empresas que têm `telefone1` cadastrado. Quando uma empresa é notificada sobre um orçamento, se ela tiver telefone cadastrado, um link encurtado será exibido na mensagem final do WhatsApp, permitindo que o cliente entre em contato diretamente com a empresa.

## 🎯 Funcionalidades

1. **Busca de telefone**: Ao buscar empresas notificadas, também busca o campo `telefone1` do hotsite
2. **Criação de mensagem pré-formatada**: Cria uma mensagem com todos os dados principais do orçamento
3. **Encurtamento de URL**: Usa TinyURL para encurtar a URL do WhatsApp
4. **Exibição na mensagem**: Mostra o link encurtado embaixo do nome da empresa na mensagem final

## 📁 Arquivos Alterados

### 1. `vps-code/codigo/url-shortener.js` (NOVO)

Módulo responsável por encurtar URLs usando a API do TinyURL.

**Funções:**
- `encurtarURL(url)`: Encurta uma URL usando TinyURL
- `criarLinkWhatsApp(telefone, mensagem)`: Cria URL do WhatsApp e encurta

**Exemplo de uso:**
```javascript
const { criarLinkWhatsApp } = require('./url-shortener');
const link = await criarLinkWhatsApp('5511999999999', 'Olá! Mensagem...');
// Retorna: https://tinyurl.com/xxxxx
```

### 2. `vps-code/codigo/supabase-service.js`

**Alterações:**
- Importa `criarLinkWhatsApp` do módulo `url-shortener`
- Busca `telefone1` junto com `nome_exibicao` na query do Supabase
- Cria links do WhatsApp para empresas que têm telefone cadastrado
- Retorna array de objetos com `{ nome, telefone1, linkWhatsApp }` ao invés de apenas strings

**Nova função:**
- `criarMensagemWhatsApp(dados, resultadoIA)`: Cria mensagem pré-formatada com dados do orçamento

**Estrutura da mensagem:**
```
Olá! Recebi um orçamento de mudança e gostaria de mais informações.

*Dados do Orçamento:*
👤 Cliente: [nome]
📧 Email: [email]
📍 Origem: [cidade], [estado]
🎯 Destino: [cidade], [estado]
🏠 Tipo: [tipo]
🚪 Elevador: [sim/não]
📦 Embalagem: [sim/não]
📏 Distância: [km] km
💰 Faixa de preço: R$ [min] - R$ [max]

📝 Lista de objetos:
[lista]

📅 Data estimada: [data]

Gostaria de receber uma cotação personalizada.
```

### 3. `vps-code/codigo/message-handler.js`

**Alterações:**
- Atualiza a formatação da lista de empresas para exibir links do WhatsApp
- Compatibilidade com formato antigo (string) e novo (objeto)

**Formato da mensagem:**
```
✨ *Empresas parceiras que receberam seu orçamento:*

1. Empresa A
   💬 Contato: https://tinyurl.com/xxxxx

2. Empresa B
   💬 Contato: https://tinyurl.com/yyyyy

💬 *Elas entrarão em contato em breve!*
```

## 🔧 Dependências

- `axios`: Já está no `package.json` (usado para chamar API do TinyURL)

## 📊 Fluxo de Dados

1. **Salvar orçamento**: `salvarOrcamento()` é chamado com dados da sessão e resultado da IA
2. **Buscar campanhas**: Query no Supabase busca campanhas com `hotsite` incluindo `telefone1`
3. **Processar empresas**: Para cada empresa única:
   - Se tem `telefone1`: cria mensagem pré-formatada e encurta URL
   - Se não tem: apenas adiciona nome
4. **Retornar resultado**: Retorna array com `{ nome, telefone1, linkWhatsApp }`
5. **Exibir na mensagem**: `message-handler.js` formata e exibe os links

## ⚠️ Tratamento de Erros

- Se a API do TinyURL falhar, retorna a URL original (não encurtada)
- Se houver erro ao criar link, a empresa ainda é exibida, mas sem link
- Logs de erro são registrados no console para debug

## 🧪 Testes

Para testar:

1. **Criar orçamento via WhatsApp** com uma empresa que tem `telefone1` cadastrado
2. **Verificar mensagem final** - deve exibir link encurtado embaixo do nome da empresa
3. **Clicar no link** - deve abrir WhatsApp com mensagem pré-formatada
4. **Verificar logs** - deve mostrar criação de links no console

## 📝 Notas

- A API do TinyURL é gratuita e não requer autenticação
- URLs encurtadas são permanentes (não expiram)
- Se uma empresa não tiver `telefone1`, apenas o nome é exibido (comportamento anterior)
- A mensagem pré-formatada inclui todos os dados principais do orçamento

## 🔄 Próximos Passos (Opcional)

- [ ] Adicionar cache de URLs encurtadas (evitar encurtar a mesma URL múltiplas vezes)
- [ ] Permitir personalização da mensagem por empresa
- [ ] Adicionar analytics para rastrear cliques nos links
- [ ] Considerar usar serviço próprio de encurtamento (mais controle)

