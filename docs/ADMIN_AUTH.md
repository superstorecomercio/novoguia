# Sistema de Autenticação Admin

Sistema completo de autenticação para o dashboard administrativo do MudaTech, com verificação por email e controle de primeiro login.

## 🚀 Configuração Inicial

### 1. Executar Migration

Execute a migration SQL no Supabase para criar as tabelas necessárias:

```sql
-- Execute o arquivo: supabase/migrations/070_criar_tabela_admins.sql
```

### 2. Criar Usuários Admin

Execute o script para criar os 2 usuários admin iniciais:

```bash
npx tsx scripts/setup-admin-users.ts
```

Isso criará:
- **Admin 1**: `junior@guiademudancas.com.br` / `Admin123!`
- **Admin 2**: `mauricio@guiademudancas.com.br` / `Admin123!`

⚠️ **IMPORTANTE**: Altere as senhas após o primeiro login!

### 3. Configurar Variáveis de Ambiente

Adicione no `.env.local`:

```env
# Bypass de autenticação para desenvolvimento (opcional)
ADMIN_BYPASS_AUTH=true
NEXT_PUBLIC_ADMIN_BYPASS_AUTH=true
```

## 🔐 Fluxo de Autenticação

### 1. Login com Email e Senha
- Usuário acessa `/admin/login`
- Informa email e senha
- Sistema verifica credenciais

### 2. Verificação por Email
- Sistema envia código de 6 dígitos por email
- Código expira em 10 minutos
- Usuário informa o código recebido

### 3. Primeiro Login (Mudança de Senha)
- Se for o primeiro login, sistema força mudança de senha
- Nova senha deve ter no mínimo 8 caracteres
- Após alterar, usuário pode acessar o dashboard

### 4. Sessão
- Sessão válida por 24 horas
- Token armazenado no localStorage e cookie
- Logout remove a sessão

## 🛠️ Bypass para Desenvolvimento

Para testar sem autenticação durante o desenvolvimento:

1. Adicione no `.env.local`:
```env
ADMIN_BYPASS_AUTH=true
NEXT_PUBLIC_ADMIN_BYPASS_AUTH=true
```

2. Reinicie o servidor:
```bash
npm run dev
```

3. Acesse `/admin` diretamente - não pedirá login

⚠️ **NUNCA** ative o bypass em produção!

## 📁 Estrutura de Arquivos

```
lib/auth/
  └── admin-auth.ts          # Funções de autenticação

app/api/admin/auth/
  ├── login/route.ts         # POST - Login (envia código)
  ├── verify-code/route.ts   # POST - Verifica código
  ├── change-password/route.ts # POST - Altera senha
  ├── logout/route.ts        # POST - Logout
  └── me/route.ts            # GET - Dados do admin logado

app/admin/
  ├── login/page.tsx         # Página de login
  └── layout.tsx             # Layout com verificação de auth

app/components/admin/
  └── AdminHeader.tsx        # Header com menu do usuário

middleware.ts                # Proteção de rotas
```

## 🔒 Segurança

- ✅ Senhas hashadas com bcrypt (10 rounds)
- ✅ Códigos de verificação expiram em 10 minutos
- ✅ Sessões expiram em 24 horas
- ✅ Verificação de email obrigatória
- ✅ Mudança de senha obrigatória no primeiro login
- ✅ Tokens únicos por sessão
- ✅ Rastreamento de IP e User-Agent

## 📧 Configuração de Email

O sistema usa a mesma configuração de email do projeto (`/admin/emails/configuracao`).

Certifique-se de que:
1. A configuração de email está ativa
2. O `from_email` está configurado
3. O provedor de email está funcionando

## 🐛 Troubleshooting

### Erro: "Configuração de email não encontrada"
- Configure o email em `/admin/emails/configuracao`
- Verifique se `from_email` está preenchido

### Erro: "Código inválido ou expirado"
- Códigos expiram em 10 minutos
- Verifique a caixa de entrada do email
- Solicite novo código fazendo login novamente

### Erro: "Sessão inválida"
- Sessões expiram em 24 horas
- Faça login novamente

### Bypass não funciona
- Verifique se as variáveis estão no `.env.local`
- Reinicie o servidor após adicionar as variáveis
- Verifique se `NODE_ENV=development`

## 📝 Próximos Passos

- [ ] Adicionar recuperação de senha
- [ ] Adicionar 2FA opcional
- [ ] Adicionar logs de acesso
- [ ] Adicionar rate limiting
- [ ] Adicionar bloqueio após tentativas falhas

