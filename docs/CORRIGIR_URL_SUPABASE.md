# 🔴 PROBLEMA CRÍTICO: URL do Supabase Incorreta

## ❌ Problema Identificado

A URL do Supabase está configurada como `http://localhost:3000` em vez da URL real do Supabase.

**Sintoma**: Todos os erros retornam HTML (página 404 do Next.js) em vez de erros JSON do Supabase.

## ✅ Solução

### Passo 1: Verificar URL Atual

Abra o arquivo `.env.local` e verifique o valor de `NEXT_PUBLIC_SUPABASE_URL`.

**❌ ERRADO:**
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3000
```

**✅ CORRETO:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
```

### Passo 2: Obter URL Correta do Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie o **Project URL** (deve ser algo como `https://abcdefghijklmnop.supabase.co`)

### Passo 3: Corrigir o Arquivo .env.local

Edite o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-real.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key-aqui
```

**⚠️ IMPORTANTE:**
- A URL deve começar com `https://`
- A URL deve terminar com `.supabase.co`
- NÃO deve ser `localhost` ou `127.0.0.1`

### Passo 4: Reiniciar o Servidor

Após corrigir, **OBRIGATORIAMENTE** reinicie o servidor:

```bash
# Parar o servidor (Ctrl+C)
# Depois iniciar novamente:
npm run dev
```

## 🔍 Como Verificar se Está Correto

1. Acesse `/test-db` no navegador
2. Veja a seção "Variáveis de Ambiente"
3. A URL deve mostrar algo como: `https://abcdefghijklmnop.supabase.co`
4. Se mostrar `localhost`, está ERRADO!

## 📝 Exemplo Correto

Seu arquivo `.env.local` deve ficar assim:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.exemplo...
```

---

**Última atualização**: 2024-11-20

