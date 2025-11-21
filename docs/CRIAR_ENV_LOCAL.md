# Como Criar o Arquivo .env.local

## ⚠️ IMPORTANTE

O arquivo `.env.local` não pode ser criado automaticamente por questões de segurança.
Você precisa criá-lo manualmente.

## 📝 Passo a Passo

### Opção 1: Via Terminal (Recomendado)

```bash
# No terminal, na raiz do projeto:
cp .env.local.example .env.local
```

Depois edite o arquivo `.env.local` e preencha com suas credenciais.

### Opção 2: Manualmente

1. Crie um novo arquivo chamado `.env.local` na raiz do projeto
2. Cole este conteúdo:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

3. Preencha com suas credenciais do Supabase

## 🔑 Onde Encontrar as Credenciais

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** (ícone de engrenagem) → **API**
4. Você verá:
   - **Project URL** → Copie para `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Copie para `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## ✅ Exemplo Completo

Seu arquivo `.env.local` deve ficar assim:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.exemplo...
```

## ⚠️ Importante

- ✅ O arquivo `.env.local` já está no `.gitignore` (não será commitado)
- ✅ Nunca compartilhe suas chaves publicamente
- ✅ Use apenas a chave `anon public` (não use `service_role`)
- ✅ Reinicie o servidor após criar/editar o arquivo

## 🚀 Após Criar

Execute no terminal:

```bash
npm run dev
```

O servidor será reiniciado e carregará as variáveis de ambiente.

---

**Última atualização**: 2024-11-20

