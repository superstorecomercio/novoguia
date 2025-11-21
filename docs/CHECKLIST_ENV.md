# Checklist - Configuração do .env.local

## ✅ Verificações Necessárias

### 1. Arquivo Existe?
```powershell
Test-Path .env.local
# Deve retornar: True
```

### 2. Arquivo Está na Raiz?
O arquivo `.env.local` deve estar no mesmo nível que `package.json`:

```
guia-de-mudancas-next/
├── .env.local          ← AQUI!
├── package.json
├── app/
└── lib/
```

### 3. Formato Correto?

O arquivo deve ter exatamente este formato (SEM aspas, SEM espaços extras):

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**❌ ERRADO:**
```env
NEXT_PUBLIC_SUPABASE_URL = "https://..."  # Espaços e aspas
NEXT_PUBLIC_SUPABASE_URL=https://...      # Sem valor
```

**✅ CORRETO:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui
```

### 4. Servidor Foi Reiniciado?

**CRÍTICO**: Após criar/editar `.env.local`, você DEVE:

1. Parar o servidor (Ctrl+C no terminal)
2. Iniciar novamente: `npm run dev`

O Next.js só carrega variáveis na inicialização!

### 5. Variáveis Estão Preenchidas?

Execute para verificar:

```powershell
Get-Content .env.local
```

Você deve ver duas linhas com valores (não vazias).

## 🔧 Solução Rápida

Se o erro persistir, tente:

1. **Deletar pasta .next e reiniciar:**
```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

2. **Verificar se variáveis estão sendo lidas:**
Crie um arquivo temporário `app/test-env/page.tsx`:

```tsx
export default function TestEnv() {
  return (
    <div className="p-8">
      <h1>Teste de Variáveis</h1>
      <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NÃO DEFINIDA'}</p>
      <p>KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA'}</p>
    </div>
  );
}
```

Acesse `/test-env` para verificar.

---

**Última atualização**: 2024-11-20

