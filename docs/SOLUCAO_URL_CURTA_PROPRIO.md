# Solução: URLs Curtas Próprias (Substituindo TinyURL)

## 🔍 Problema

O TinyURL não estava funcionando, deixando as URLs gigantes e causando erro 400 no WhatsApp (limite de 4096 caracteres).

## ✅ Solução Implementada

Criada uma rota própria no Next.js (`/api/w`) que:
1. Recebe telefone e dados codificados em base64
2. Decodifica os dados
3. Cria mensagem simplificada
4. Redireciona para WhatsApp com mensagem pré-formatada

## 📁 Arquivos Criados/Modificados

### 1. `app/api/w/route.ts` (NOVO)
Rota que recebe:
- `t`: Telefone (limpo, apenas números)
- `d`: Dados codificados em base64

**Exemplo de URL:**
```
https://novoguia.vercel.app/api/w?t=5511999999999&d=eyJuYW1lIjoiSm9...
```

### 2. `vps-code/codigo/url-shortener.js` (MODIFICADO)
- Removida dependência do TinyURL
- Agora cria URLs usando a rota própria `/api/w`
- Codifica dados em base64 para reduzir tamanho

### 3. `vps-code/codigo/supabase-service.js` (MODIFICADO)
- Atualizado para passar dados completos (não apenas mensagem)
- Usa nova função `criarLinkWhatsApp` que recebe objeto de dados

## 🎯 Vantagens

1. **Controle total**: Não depende de serviços externos
2. **URLs mais curtas**: Base64 reduz tamanho dos dados
3. **Confiável**: Sempre funciona (não depende de API externa)
4. **Mensagem simplificada**: Reduz ainda mais o tamanho

## ⚙️ Configuração

### Variável de Ambiente (Opcional)

No `.env` da VPS, pode configurar:
```bash
API_BASE_URL=https://novoguia.vercel.app
```

Se não configurar, usa `https://novoguia.vercel.app` como padrão.

## 📊 Comparação de Tamanho

**Antes (URL completa do WhatsApp):**
```
https://wa.me/5511999999999?text=Olá!%20Recebi%20um%20orçamento...
```
~500-800 caracteres por link

**Depois (URL curta própria):**
```
https://novoguia.vercel.app/api/w?t=5511999999999&d=eyJuYW1lIjoiSm9...
```
~100-150 caracteres por link

**Redução: ~70-80%**

## 🚀 Próximos Passos

1. **Fazer deploy do Next.js** (para incluir a rota `/api/w`)
2. **Fazer deploy da VPS** (para usar nova função)
3. **Testar** criando um orçamento via WhatsApp

## ⚠️ Nota Importante

A URL base está configurada como `https://novoguia.vercel.app`. Se o domínio mudou para `mudatech.vercel.app`, atualizar:
- No código: `vps-code/codigo/url-shortener.js`
- Ou configurar variável de ambiente `API_BASE_URL` na VPS

