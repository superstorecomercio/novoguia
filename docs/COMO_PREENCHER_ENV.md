# Como Preencher o Arquivo .env.local

## 🔴 Problema Identificado

O arquivo `.env.local` existe mas está **VAZIO**. Você precisa preenchê-lo com suas credenciais do Supabase.

## ✅ Solução Rápida

### Passo 1: Obter Credenciais do Supabase

1. Acesse: https://supabase.com/dashboard
2. Faça login e selecione seu projeto
3. Vá em **Settings** (ícone de engrenagem) → **API**
4. Você verá duas informações importantes:

   **Project URL**
   ```
   https://abcdefghijklmnop.supabase.co
   ```
   → Copie este valor

   **anon public** (chave pública)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.exemplo...
   ```
   → Copie este valor (é uma string longa)

### Passo 2: Preencher o Arquivo .env.local

Abra o arquivo `.env.local` (na raiz do projeto) e preencha assim:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-aqui.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-public-aqui
```

**⚠️ IMPORTANTE:**
- ❌ NÃO use aspas
- ❌ NÃO adicione espaços antes ou depois do `=`
- ✅ Cole os valores exatamente como estão no Supabase
- ✅ Uma variável por linha

### Passo 3: Salvar e Reiniciar

1. **Salve o arquivo** (Ctrl+S)
2. **Pare o servidor** (Ctrl+C no terminal)
3. **Inicie novamente**:
   ```bash
   npm run dev
   ```

## 📝 Exemplo Completo

Seu arquivo `.env.local` deve ficar assim (com seus valores reais):

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

## ✅ Verificação

Após preencher e reiniciar, o erro deve desaparecer.

Se ainda der erro, verifique:
- [ ] Arquivo está na raiz do projeto?
- [ ] Valores foram copiados corretamente?
- [ ] Não há espaços extras?
- [ ] Servidor foi reiniciado?

---

**Última atualização**: 2024-11-20

