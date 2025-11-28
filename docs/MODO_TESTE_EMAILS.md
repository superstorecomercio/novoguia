# 🧪 Modo de Teste de Emails

## Visão Geral

O modo de teste intercepta todos os emails enviados pela aplicação e **não os envia para clientes reais**. Isso permite testar a aplicação sem risco de enviar emails acidentais.

## 🎯 Como Funciona

Quando o modo de teste está ativo:
1. ✅ Todos os emails são interceptados
2. ✅ Nenhum email é enviado para clientes reais
3. ✅ Os emails são logados e podem ser visualizados
4. ✅ Um aviso é adicionado ao HTML do email indicando que está em modo de teste

## ⚙️ Como Ativar

### Opção 1: Modo de Desenvolvimento (Automático)

Quando você executa `npm run dev`, o modo de teste é **ativado automaticamente**.

```bash
npm run dev
```

### Opção 2: Variável de Ambiente

Adicione no arquivo `.env.local`:

```env
# Ativar modo de teste
EMAIL_TEST_MODE=true

# (Opcional) Email para redirecionar todos os emails
EMAIL_TEST_TO=seu-email@exemplo.com
```

### Opção 3: Variável de Ambiente Pública (Para Next.js)

Se precisar que o cliente também veja o status:

```env
NEXT_PUBLIC_EMAIL_TEST_MODE=true
NEXT_PUBLIC_EMAIL_TEST_TO=seu-email@exemplo.com
```

## 📊 Visualizar Emails Interceptados

Acesse a página de **Modo de Teste** no dashboard:

```
/admin/emails/test-mode
```

Nesta página você pode:
- ✅ Ver todos os emails interceptados
- ✅ Ver detalhes completos de cada email (HTML, destinatários, etc.)
- ✅ Ver estatísticas (total de emails, destinatários únicos, etc.)
- ✅ Limpar logs de teste

## 🔍 O que é Interceptado

Todos os emails enviados através dos serviços de email são interceptados:
- ✅ SocketLabs
- ✅ Resend
- ✅ SendGrid
- ✅ Nodemailer

## 📝 Logs

Os emails interceptados são armazenados **em memória** (não persistem após reiniciar o servidor).

Cada log contém:
- Destinatário original
- Assunto
- Conteúdo HTML
- Remetente
- Data/hora
- Provedor usado

## ⚠️ Avisos no Email

Quando um email é interceptado, um aviso visual é adicionado ao topo do HTML:

```html
⚠️ MODO DE TESTE
Este email foi interceptado em modo de teste.
Destinatário original: cliente@exemplo.com
Enviado para: test@mudatech.com.br
```

## 🚀 Produção

**IMPORTANTE:** O modo de teste é **desativado automaticamente** em produção quando:
- `NODE_ENV === 'production'`
- `EMAIL_TEST_MODE` não está definido ou é `false`

## 🔧 Configuração Avançada

### Redirecionar para Email Específico

```env
EMAIL_TEST_TO=admin@mudatech.com.br
```

Todos os emails interceptados serão "enviados" para este email (apenas simulado, não envia realmente).

### Limitar Logs

Por padrão, os logs são limitados a **100 emails** para evitar consumo excessivo de memória. Os logs mais antigos são removidos automaticamente.

## 📚 Exemplos

### Testar Envio de Orçamento

1. Ative o modo de teste
2. Crie um orçamento no sistema
3. Acesse `/admin/emails/test-mode`
4. Veja o email interceptado com todos os detalhes

### Verificar Template de Email

1. Ative o modo de teste
2. Envie um email de teste pela página de configuração
3. Visualize o HTML completo na página de modo de teste
4. Verifique se o template está correto

## 🐛 Troubleshooting

### Modo de teste não está ativo

Verifique:
1. `NODE_ENV` está como `development`?
2. `EMAIL_TEST_MODE` está definido como `true`?
3. Reinicie o servidor após alterar variáveis de ambiente

### Não vejo emails interceptados

1. Verifique se o modo de teste está realmente ativo
2. Confirme que os emails estão sendo enviados (verifique logs do console)
3. Limpe o cache do navegador

### Quero desativar o modo de teste

1. Remova `EMAIL_TEST_MODE` do `.env.local`
2. Ou defina `EMAIL_TEST_MODE=false`
3. Reinicie o servidor

## 💡 Dicas

- Use o modo de teste durante desenvolvimento para evitar emails acidentais
- Visualize os emails interceptados para verificar templates e conteúdo
- Use `EMAIL_TEST_TO` para simular recebimento em um email específico
- Limpe os logs periodicamente para melhor performance



