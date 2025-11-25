# 🏗️ Arquitetura: VPS WhatsApp → API Next.js

## 📊 Diagrama do Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    VPS (Servidor)                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Arquivos Python/Node/etc (não estão neste repo)    │  │
│  │                                                       │  │
│  │  - Recebe mensagem do WhatsApp                       │  │
│  │  - Processa dados do usuário                         │  │
│  │  - Monta payload JSON                                │  │
│  │  - Faz POST para API Next.js                         │  │
│  └───────────────────┬───────────────────────────────────┘  │
└──────────────────────┼───────────────────────────────────────┘
                       │
                       │ HTTP POST
                       │ https://seu-dominio.com/api/orcamentos
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              API Next.js (Este Repositório)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  app/api/orcamentos/route.ts                         │  │
│  │  - Recebe dados da VPS                               │  │
│  │  - Valida campos obrigatórios                        │  │
│  │  - Prepara dados para função SQL                     │  │
│  └───────────────────┬───────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────▼───────────────────────────────────┐  │
│  │  lib/db/queries/orcamentos.ts                         │  │
│  │  - Função TypeScript                                  │  │
│  │  - Chama função SQL via RPC                           │  │
│  └───────────────────┬───────────────────────────────────┘  │
└──────────────────────┼───────────────────────────────────────┘
                       │
                       │ RPC Call
                       │ criar_orcamento_e_notificar()
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         Banco de Dados (Supabase/PostgreSQL)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Função SQL: criar_orcamento_e_notificar()           │  │
│  │  1. Valida dados                                     │  │
│  │  2. Insere orçamento na tabela orcamentos            │  │
│  │  3. Busca campanhas ativas do estado_destino         │  │
│  │  4. Cria vínculos em orcamentos_campanhas            │  │
│  │  5. Atualiza hotsites_notificados                    │  │
│  │  6. Retorna resultado                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 O que Existe Neste Repositório

### ✅ Arquivos que ESTÃO aqui (Next.js)

1. **API Route:** `app/api/orcamentos/route.ts`
   - Recebe chamadas HTTP da VPS
   - Valida dados
   - Chama função TypeScript

2. **Função TypeScript:** `lib/db/queries/orcamentos.ts`
   - Prepara dados
   - Chama função SQL via RPC

3. **Função SQL:** `supabase/migrations/028_filtrar_campanhas_por_estado.sql`
   - Salva orçamento
   - Busca campanhas
   - Cria vínculos

### ❌ Arquivos que NÃO estão aqui (VPS)

Os arquivos que rodam na VPS e fazem chamadas para a API **não estão neste repositório**.

Eles provavelmente estão em:
- Outro repositório
- Diretório na VPS (ex: `/var/www/whatsapp-bot/`)
- Scripts Python/Node.js na VPS

---

## 📋 O que a VPS Precisa Fazer

### 1. Receber dados do WhatsApp

A VPS recebe mensagens do WhatsApp (via API do WhatsApp Business, Evolution API, etc.)

### 2. Processar dados

Extrair informações do usuário:
- Nome
- Email
- Telefone
- Cidade origem/destino
- **Estado origem/destino** ⚠️ CRÍTICO

### 3. Chamar API Next.js

```python
# Exemplo Python
import requests

url = "https://seu-dominio.com/api/orcamentos"
payload = {
    "nomeCliente": "João",
    "emailCliente": "joao@email.com",
    "telefoneCliente": "11987654321",
    "cidadeOrigem": "São Paulo",
    "estadoOrigem": "SP",
    "cidadeDestino": "Guarulhos",
    "estadoDestino": "SP",  # ✅ OBRIGATÓRIO
    # ... outros campos
}

response = requests.post(url, json=payload)
resultado = response.json()
```

### 4. Verificar resposta

```python
if resultado.get("success"):
    print(f"✅ Orçamento criado: {resultado['orcamentoId']}")
    print(f"📊 Empresas notificadas: {resultado['hotsitesNotificados']}")
else:
    print(f"❌ Erro: {resultado.get('error')}")
```

---

## 🔧 Como Verificar o Código na VPS

### Opção 1: Acessar VPS via SSH

```bash
ssh usuario@ip-da-vps
cd /caminho/do/projeto/whatsapp
ls -la
```

### Opção 2: Verificar logs da VPS

```bash
# Logs do sistema
tail -f /var/log/whatsapp-bot.log

# Ou logs do aplicativo
tail -f /var/www/whatsapp-bot/logs/app.log
```

### Opção 3: Verificar processos rodando

```bash
# Ver processos Python/Node relacionados ao WhatsApp
ps aux | grep whatsapp
ps aux | grep python
ps aux | grep node
```

---

## 📝 Checklist: O que Verificar na VPS

### 1. Arquivos de código

- [ ] Localizar arquivo que recebe mensagens do WhatsApp
- [ ] Localizar arquivo que chama a API Next.js
- [ ] Verificar se está enviando `estadoDestino`

### 2. Configuração

- [ ] URL da API está correta: `https://seu-dominio.com/api/orcamentos`
- [ ] Headers estão corretos: `Content-Type: application/json`
- [ ] Payload está no formato correto

### 3. Logs

- [ ] Verificar logs quando recebe mensagem do WhatsApp
- [ ] Verificar logs quando chama API Next.js
- [ ] Verificar resposta da API

---

## 🎯 Exemplo de Código que Deve Estar na VPS

### Python (exemplo)

```python
# whatsapp_handler.py (na VPS)
import requests
from whatsapp_api import receive_message, send_message

def handle_orcamento_message(message):
    # Extrair dados da mensagem do WhatsApp
    dados = extract_data_from_message(message)
    
    # Montar payload para API Next.js
    payload = {
        "nomeCliente": dados["nome"],
        "emailCliente": dados["email"],
        "telefoneCliente": dados["telefone"],
        "cidadeOrigem": dados["cidade_origem"],
        "estadoOrigem": dados.get("estado_origem", ""),
        "cidadeDestino": dados["cidade_destino"],
        "estadoDestino": dados["estado_destino"],  # ✅ OBRIGATÓRIO
        "tipoOrigem": dados.get("tipo_imovel", "apartamento"),
        "precisaEmbalagem": dados.get("precisa_embalagem", False),
        "dataEstimada": dados.get("data_estimada", ""),
    }
    
    # Chamar API Next.js
    try:
        response = requests.post(
            "https://seu-dominio.com/api/orcamentos",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            resultado = response.json()
            if resultado.get("success"):
                # Enviar confirmação para o usuário
                send_message(
                    message["from"],
                    f"✅ Orçamento criado! {resultado['hotsitesNotificados']} empresas foram notificadas."
                )
            else:
                send_message(message["from"], f"❌ Erro: {resultado.get('error')}")
        else:
            error = response.json()
            send_message(message["from"], f"❌ Erro: {error.get('error')}")
            
    except Exception as e:
        print(f"Erro ao chamar API: {e}")
        send_message(message["from"], "❌ Erro ao processar orçamento. Tente novamente.")
```

---

## 🔍 Como Encontrar o Problema

### Passo 1: Verificar código na VPS

1. Acessar VPS via SSH
2. Localizar arquivos do WhatsApp
3. Verificar se está enviando `estadoDestino`

### Passo 2: Verificar logs da VPS

```bash
# Ver logs em tempo real
tail -f /var/log/whatsapp-bot.log

# Ou
journalctl -u whatsapp-bot -f
```

### Passo 3: Verificar logs da API Next.js

No terminal onde roda `npm run dev`, você verá:

```
📋 [API Orçamentos] Recebendo dados: {
  estadoDestino: "SP"  // ⚠️ Verificar se está aqui
}
```

### Passo 4: Testar manualmente

```bash
# Na VPS, testar chamada manual
curl -X POST https://seu-dominio.com/api/orcamentos \
  -H "Content-Type: application/json" \
  -d '{
    "nomeCliente": "Teste",
    "emailCliente": "teste@teste.com",
    "telefoneCliente": "11999999999",
    "cidadeOrigem": "São Paulo",
    "cidadeDestino": "Guarulhos",
    "estadoDestino": "SP"
  }'
```

---

## 📊 Resumo

**Este repositório contém:**
- ✅ API Next.js que recebe chamadas
- ✅ Função TypeScript que processa
- ✅ Função SQL que salva no banco

**A VPS contém (não está aqui):**
- ❌ Código que recebe mensagens do WhatsApp
- ❌ Código que chama a API Next.js
- ❌ Lógica de processamento de mensagens

**Para debugar:**
1. Verificar código na VPS
2. Verificar logs da VPS
3. Verificar logs da API Next.js
4. Garantir que `estadoDestino` está sendo enviado

---

## 🔗 Arquivos Relacionados

- `app/api/orcamentos/route.ts` - API que recebe chamadas da VPS
- `lib/db/queries/orcamentos.ts` - Função TypeScript
- `supabase/migrations/028_filtrar_campanhas_por_estado.sql` - Função SQL
- `docs/INTEGRACAO_VPS_WHATSAPP.md` - Guia completo de integração

