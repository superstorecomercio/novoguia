# Solução: Erro "supabaseUrl is required"

## 🔴 Problema

O erro ocorre porque as variáveis de ambiente do Supabase não estão configuradas.

## ✅ Solução Passo a Passo

### 1. Verificar se o arquivo .env.local existe

O arquivo deve estar na **raiz do projeto** (mesmo nível que `package.json`):

```
guia-de-mudancas-next/
├── .env.local          ← AQUI!
├── package.json
├── app/
└── ...
```

### 2. Criar/Editar o arquivo .env.local

**Opção A: Via Editor de Texto**
1. Crie um arquivo chamado `.env.local` na raiz do projeto
2. Adicione este conteúdo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key
```

**Opção B: Via Terminal (PowerShell)**
```powershell
# Criar arquivo
New-Item -Path .env.local -ItemType File -Force

# Adicionar conteúdo (substitua pelos valores reais)
Add-Content -Path .env.local -Value "NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co"
Add-Content -Path .env.local -Value "NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key"
```

### 3. Obter Credenciais do Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Preencher o arquivo .env.local

Seu arquivo deve ficar assim (com valores reais):

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.exemplo...
```

### 5. Reiniciar o Servidor ⚠️ OBRIGATÓRIO

**IMPORTANTE**: Após criar/editar `.env.local`, você DEVE reiniciar o servidor:

```bash
# Parar o servidor (Ctrl+C)
# Depois iniciar novamente:
npm run dev
```

O Next.js só carrega variáveis de ambiente na inicialização!

### 6. Verificar se Funcionou

Após reiniciar, o erro deve desaparecer. Se ainda ocorrer:

1. Verifique se o arquivo está na raiz do projeto
2. Verifique se não há espaços extras nas variáveis
3. Verifique se não há aspas nas variáveis (não use aspas)
4. Verifique se reiniciou o servidor

## 🔍 Verificação Rápida

Execute no terminal (na raiz do projeto):

```powershell
# Verificar se arquivo existe
Test-Path .env.local

# Ver conteúdo (cuidado: não compartilhe as chaves!)
Get-Content .env.local
```

## ⚠️ Importante

- ✅ O arquivo `.env.local` já está no `.gitignore` (não será commitado)
- ✅ Nunca compartilhe suas chaves publicamente
- ✅ Use apenas a chave `anon public` (não use `service_role`)
- ✅ Sempre reinicie o servidor após criar/editar `.env.local`

## 🆘 Ainda com Erro?

Se após seguir todos os passos ainda der erro:

1. Verifique se as variáveis estão corretas (sem espaços, sem aspas)
2. Verifique se o arquivo está na raiz (mesmo nível que package.json)
3. Tente deletar a pasta `.next` e reiniciar:
   ```bash
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

---

**Última atualização**: 2024-11-20

