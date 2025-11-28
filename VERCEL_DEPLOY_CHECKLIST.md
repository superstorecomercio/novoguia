# Checklist de Deploy na Vercel

## ✅ Verificações Realizadas

### 1. Configurações do Next.js
- ✅ `next.config.ts` configurado corretamente
- ✅ Sharp configurado como `serverComponentsExternalPackages`
- ✅ Webpack configurado para ignorar módulos opcionais de email
- ✅ Remote patterns configurados para imagens do Supabase

### 2. Variáveis de Ambiente Necessárias
Certifique-se de configurar as seguintes variáveis na Vercel (Settings > Environment Variables):

#### Obrigatórias:
- `NEXT_PUBLIC_SUPABASE_URL` - URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima do Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço do Supabase (para operações admin)

#### Opcionais (mas recomendadas):
- `OPENAI_API_KEY` - Para geração de logos e descrições com IA
- `SOCKETLABS_SERVER_ID` - ID do servidor SocketLabs (para envio de emails)
- `SOCKETLABS_API_KEY` - Chave API do SocketLabs
- `EMAIL_FROM` - Email remetente padrão
- `EMAIL_REPLY_TO` - Email para resposta
- `EMAIL_TEST_TO` - Email para testes
- `ADMIN_EMAIL` - Email do administrador

### 3. Dependências
- ✅ `sharp` está no `package.json` (necessário para processamento de imagens)
- ✅ Todas as dependências principais estão listadas

### 4. Rotas de API
- ✅ Rotas de API configuradas com `export const dynamic = 'force-dynamic'` onde necessário
- ✅ Rotas que usam Sharp configuradas com `export const runtime = 'nodejs'`
- ✅ Tratamento de erros implementado nas rotas

### 5. Imports e Módulos
- ✅ Imports dinâmicos configurados para módulos opcionais de email
- ✅ Sharp importado corretamente (a Vercel instala automaticamente)

## 📋 Passos para Deploy

1. **Conectar o repositório na Vercel**
   - Vá para https://vercel.com
   - Importe o repositório do GitHub/GitLab

2. **Configurar variáveis de ambiente**
   - Vá em Settings > Environment Variables
   - Adicione todas as variáveis listadas acima
   - Configure para Production, Preview e Development

3. **Configurar Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build` (ou `yarn build`)
   - Output Directory: `.next` (padrão do Next.js)
   - Install Command: `npm install` (ou `yarn install`)

4. **Deploy**
   - Clique em "Deploy"
   - Aguarde o build completar
   - Verifique os logs para erros

## ⚠️ Problemas Comuns e Soluções

### Erro: "Module not found: Can't resolve 'sharp'"
- **Solução**: A Vercel instala o Sharp automaticamente. Se o erro persistir, verifique se `sharp` está no `package.json`

### Erro: "Missing environment variables"
- **Solução**: Verifique se todas as variáveis de ambiente obrigatórias estão configuradas na Vercel

### Erro: "Failed to fetch" nas rotas de API
- **Solução**: Verifique se as rotas estão usando `export const dynamic = 'force-dynamic'` quando necessário

### Erro: "Sharp is not available"
- **Solução**: Verifique se a rota está configurada com `export const runtime = 'nodejs'`

### Erro: "Module not found" relacionado à pasta `painel`
- **Solução**: A pasta `painel` é um subprojeto separado (agora na raiz do projeto) e está sendo ignorada. Se aparecer erro, verifique se o `.vercelignore` está configurado corretamente

### Erro: "Can't resolve 'fs'" ou "Can't resolve 'path'"
- **Solução**: A rota `/api/admin/bots-whatsapp/[id]/files/import` usa `fs` que não funciona na Vercel. Esta funcionalidade só funciona localmente. Se necessário, remova ou desabilite esta rota no deploy.

## 🔍 Verificações Pós-Deploy

1. Teste as rotas de API principais:
   - `/api/check-env` - Verifica variáveis de ambiente
   - `/api/admin/campanhas` - Lista campanhas
   - `/api/admin/hotsites` - Lista hotsites

2. Teste funcionalidades críticas:
   - Criação de campanhas
   - Geração de logos (se OpenAI_API_KEY configurado)
   - Envio de emails (se SocketLabs configurado)

3. Verifique os logs na Vercel:
   - Vá em Deployments > [seu deploy] > Functions
   - Verifique se há erros nas funções serverless

## 📝 Notas Importantes

- O Sharp é instalado automaticamente pela Vercel, não precisa estar no `package.json` como dependência opcional
- As rotas de API são serverless functions na Vercel
- O Next.js 16 usa Turbopack por padrão, mas a Vercel pode usar Webpack em produção
- Certifique-se de que todas as migrations do Supabase foram executadas antes do deploy
- A pasta `painel/` (na raiz do projeto) é um subprojeto separado e está sendo ignorada no build. Se aparecer erro relacionado a ela, verifique se o `.vercelignore` e `tsconfig.json` estão configurados corretamente
- A rota `/api/admin/bots-whatsapp/[id]/files/import` usa `fs` que não funciona na Vercel (só funciona localmente)

## ✅ Correções Aplicadas

1. ✅ Corrigido `experimental.serverComponentsExternalPackages` para `serverExternalPackages` (Next.js 16)
2. ✅ Adicionado `.vercelignore` para excluir pasta `painel`
3. ✅ Configurado `webpack.ignoreWarnings` para ignorar erros da pasta `painel`
4. ✅ Sharp configurado corretamente com `serverExternalPackages` e `runtime: 'nodejs'`
5. ✅ `tsconfig.json` atualizado para excluir pasta `painel`

