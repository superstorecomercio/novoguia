# 🔌 Integração VPS → API Next.js (WhatsApp)

## 📋 Visão Geral

O WhatsApp roda em uma **VPS (servidor)** que tem arquivos que fazem chamadas HTTP para a API do Next.js.

**Fluxo:**
```
WhatsApp → VPS (arquivos Python/Node/etc) → API Next.js → Banco de Dados
```

---

## 🎯 Endpoint da API

### URL Base
```
https://seu-dominio.com/api/orcamentos
```

### Método
```
POST
```

### Headers
```http
Content-Type: application/json
```

---

## 📤 Formato dos Dados (Payload)

### Estrutura Completa Esperada

```json
{
  "nomeCliente": "João Silva",
  "emailCliente": "joao@email.com",
  "telefoneCliente": "11987654321",
  "cidadeOrigem": "São Paulo",
  "estadoOrigem": "SP",
  "cidadeDestino": "Guarulhos",
  "estadoDestino": "SP",
  "enderecoOrigem": "Rua das Flores, 123",
  "enderecoDestino": "Av. Paulista, 1000",
  "tipoOrigem": "apartamento",
  "precisaEmbalagem": false,
  "dataEstimada": "2025-12-01",
  "comodos": ["Sala", "Cozinha", "2 Quartos"],
  "pecas": ["Sofá", "Geladeira", "Fogão"],
  "descricao": "Mudança completa de apartamento"
}
```

### Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `nomeCliente` | string | Nome do cliente | `"João Silva"` |
| `emailCliente` | string | Email do cliente | `"joao@email.com"` |
| `telefoneCliente` | string | Telefone/WhatsApp | `"11987654321"` |
| `cidadeOrigem` | string | Cidade de origem | `"São Paulo"` |
| `cidadeDestino` | string | Cidade de destino | `"Guarulhos"` |
| `estadoDestino` | string | **Estado de destino (OBRIGATÓRIO)** | `"SP"` |

### Campos Opcionais

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `estadoOrigem` | string | Estado de origem | `"SP"` |
| `enderecoOrigem` | string | Endereço completo origem | `"Rua das Flores, 123"` |
| `enderecoDestino` | string | Endereço completo destino | `"Av. Paulista, 1000"` |
| `tipoOrigem` | string | Tipo de imóvel | `"apartamento"`, `"casa"`, etc. |
| `precisaEmbalagem` | boolean | Precisa embalagem | `true` ou `false` |
| `dataEstimada` | string | Data no formato YYYY-MM-DD | `"2025-12-01"` |
| `comodos` | array | Array de cômodos | `["Sala", "Cozinha"]` |
| `pecas` | array | Array de peças | `["Sofá", "Geladeira"]` |
| `descricao` | string | Descrição adicional | `"Mudança completa"` |

---

## ✅ Resposta da API

### Sucesso (200 OK)

```json
{
  "success": true,
  "orcamentoId": "uuid-do-orcamento",
  "hotsitesNotificados": 10,
  "message": "Orçamento criado com sucesso! 10 empresas foram notificadas."
}
```

### Erro (400 Bad Request)

```json
{
  "error": "Estado de destino é obrigatório e não foi fornecido",
  "hint": "Verifique se o webhook do WhatsApp está enviando o campo estadoDestino"
}
```

### Erro (500 Internal Server Error)

```json
{
  "error": "Erro ao criar orçamento",
  "details": "Mensagem de erro detalhada",
  "hint": "Verifique se o script CORRIGIR_ORCAMENTOS_COMPLETO.sql foi executado no Supabase"
}
```

---

## 🔧 Exemplo de Código na VPS

### Python (requests)

```python
import requests
import json

def criar_orcamento_whatsapp(dados):
    url = "https://seu-dominio.com/api/orcamentos"
    
    payload = {
        "nomeCliente": dados["nome"],
        "emailCliente": dados["email"],
        "telefoneCliente": dados["telefone"],
        "cidadeOrigem": dados["cidade_origem"],
        "estadoOrigem": dados["estado_origem"],  # Opcional
        "cidadeDestino": dados["cidade_destino"],
        "estadoDestino": dados["estado_destino"],  # ✅ OBRIGATÓRIO
        "enderecoOrigem": dados.get("endereco_origem", ""),
        "enderecoDestino": dados.get("endereco_destino", ""),
        "tipoOrigem": dados.get("tipo_imovel", "apartamento"),
        "precisaEmbalagem": dados.get("precisa_embalagem", False),
        "dataEstimada": dados.get("data_estimada", ""),
        "comodos": dados.get("comodos", []),
        "pecas": dados.get("pecas", []),
        "descricao": dados.get("descricao", "")
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        resultado = response.json()
        print(f"✅ Orçamento criado: {resultado['orcamentoId']}")
        print(f"📊 Empresas notificadas: {resultado['hotsitesNotificados']}")
        
        return resultado
    except requests.exceptions.HTTPError as e:
        print(f"❌ Erro HTTP: {e}")
        if e.response:
            print(f"Resposta: {e.response.json()}")
        return None
    except Exception as e:
        print(f"❌ Erro: {e}")
        return None

# Exemplo de uso
dados = {
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "11987654321",
    "cidade_origem": "São Paulo",
    "estado_origem": "SP",
    "cidade_destino": "Guarulhos",
    "estado_destino": "SP",  # ✅ OBRIGATÓRIO
    "tipo_imovel": "apartamento",
    "precisa_embalagem": False
}

resultado = criar_orcamento_whatsapp(dados)
```

### Node.js (fetch)

```javascript
async function criarOrcamentoWhatsApp(dados) {
  const url = 'https://seu-dominio.com/api/orcamentos';
  
  const payload = {
    nomeCliente: dados.nome,
    emailCliente: dados.email,
    telefoneCliente: dados.telefone,
    cidadeOrigem: dados.cidadeOrigem,
    estadoOrigem: dados.estadoOrigem,  // Opcional
    cidadeDestino: dados.cidadeDestino,
    estadoDestino: dados.estadoDestino,  // ✅ OBRIGATÓRIO
    enderecoOrigem: dados.enderecoOrigem || '',
    enderecoDestino: dados.enderecoDestino || '',
    tipoOrigem: dados.tipoOrigem || 'apartamento',
    precisaEmbalagem: dados.precisaEmbalagem || false,
    dataEstimada: dados.dataEstimada || '',
    comodos: dados.comodos || [],
    pecas: dados.pecas || [],
    descricao: dados.descricao || ''
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar orçamento');
    }
    
    const resultado = await response.json();
    console.log('✅ Orçamento criado:', resultado.orcamentoId);
    console.log('📊 Empresas notificadas:', resultado.hotsitesNotificados);
    
    return resultado;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return null;
  }
}

// Exemplo de uso
const dados = {
  nome: 'João Silva',
  email: 'joao@email.com',
  telefone: '11987654321',
  cidadeOrigem: 'São Paulo',
  estadoOrigem: 'SP',
  cidadeDestino: 'Guarulhos',
  estadoDestino: 'SP'  // ✅ OBRIGATÓRIO
};

criarOrcamentoWhatsApp(dados);
```

### cURL

```bash
curl -X POST https://seu-dominio.com/api/orcamentos \
  -H "Content-Type: application/json" \
  -d '{
    "nomeCliente": "João Silva",
    "emailCliente": "joao@email.com",
    "telefoneCliente": "11987654321",
    "cidadeOrigem": "São Paulo",
    "estadoOrigem": "SP",
    "cidadeDestino": "Guarulhos",
    "estadoDestino": "SP",
    "tipoOrigem": "apartamento",
    "precisaEmbalagem": false
  }'
```

---

## ⚠️ Validações Importantes

### 1. `estadoDestino` é OBRIGATÓRIO

**Se não enviar, a API retorna erro 400:**
```json
{
  "error": "Estado de destino é obrigatório e não foi fornecido"
}
```

**Formato correto:**
- ✅ `"SP"` (maiúsculas, 2 letras)
- ❌ `"sp"` (minúsculas)
- ❌ `"SP "` (com espaço)
- ❌ `null` ou `undefined`

### 2. Campos obrigatórios

Se faltar qualquer campo obrigatório, a API retorna erro 400:
- `nomeCliente`
- `emailCliente`
- `telefoneCliente`
- `cidadeOrigem`
- `cidadeDestino`
- `estadoDestino` ⚠️ **CRÍTICO**

---

## 🔍 Como Verificar se Está Funcionando

### 1. Ver logs no terminal do Next.js

Quando a VPS chamar a API, você verá no terminal:

```
📋 [API Orçamentos] Recebendo dados: {
  nome: "João Silva",
  estadoDestino: "SP"  // ⚠️ Verificar se está aqui
}

📦 Dados preparados para RPC: {
  estadoDestino: "SP"  // ⚠️ Verificar se está aqui
}

✅ [API Orçamentos] Orçamento criado: {
  hotsites: 10  // ✅ Deve ser > 0
}
```

### 2. Verificar no banco de dados

```sql
-- Último orçamento criado
SELECT 
  id,
  nome_cliente,
  estado_destino,
  hotsites_notificados,
  origem_formulario,
  created_at
FROM orcamentos
ORDER BY created_at DESC
LIMIT 1;
```

### 3. Testar endpoint diretamente

```bash
# Teste rápido
curl -X POST http://localhost:3000/api/orcamentos \
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

## 🐛 Troubleshooting

### Problema: `hotsites_notificados = 0`

**Causa:** `estadoDestino` não está sendo enviado ou está em formato incorreto.

**Solução:**
1. Verificar logs no terminal
2. Garantir que `estadoDestino` está sendo enviado
3. Verificar formato: maiúsculas, sem espaços (ex: `"SP"`)

### Problema: Erro 400 "Estado de destino é obrigatório"

**Causa:** Campo `estadoDestino` não está no payload.

**Solução:**
```python
# Adicionar ao payload
payload["estadoDestino"] = "SP"  # ✅ OBRIGATÓRIO
```

### Problema: Erro 500 "Erro ao criar orçamento"

**Causa:** Problema na função SQL ou banco de dados.

**Solução:**
1. Verificar logs do terminal
2. Verificar se função SQL está criada no Supabase
3. Executar script: `scripts/SISTEMA_ORCAMENTOS_COMPLETO.sql`

---

## 📊 O que Acontece Após a Chamada

1. **API recebe dados** da VPS
2. **Valida campos obrigatórios**
3. **Chama função SQL** `criar_orcamento_e_notificar()`
4. **Função SQL:**
   - Salva orçamento na tabela `orcamentos`
   - Busca campanhas ativas do `estado_destino`
   - Cria vínculos em `orcamentos_campanhas`
   - Atualiza `hotsites_notificados`
5. **Retorna resultado** para VPS

---

## 🔐 Segurança

### Headers Recomendados

```http
Content-Type: application/json
User-Agent: WhatsApp-Bot/1.0
```

### Rate Limiting

A API tem proteção anti-spam:
- 5 requisições por 15 minutos (por IP/email)
- Se exceder, retorna erro 429

---

## 📝 Checklist para VPS

- [ ] Enviar `estadoDestino` no payload (OBRIGATÓRIO)
- [ ] Formato correto: maiúsculas, sem espaços (`"SP"`)
- [ ] Todos os campos obrigatórios presentes
- [ ] Headers corretos (`Content-Type: application/json`)
- [ ] Tratar erros da API
- [ ] Verificar `hotsitesNotificados` na resposta
- [ ] Logs na VPS para debug

---

## 🎯 Resumo

**A VPS deve:**
1. Fazer POST para `https://seu-dominio.com/api/orcamentos`
2. Enviar JSON com todos os campos (especialmente `estadoDestino`)
3. Verificar resposta para confirmar sucesso
4. Verificar `hotsitesNotificados` na resposta

**A API Next.js:**
1. Recebe dados
2. Valida
3. Chama função SQL
4. Retorna resultado

**A função SQL:**
1. Salva orçamento
2. Busca campanhas ativas
3. Cria vínculos
4. Retorna quantidade de empresas notificadas

---

## 📞 Próximos Passos

1. Verificar código na VPS que chama a API
2. Garantir que `estadoDestino` está sendo enviado
3. Testar chamada e verificar logs
4. Verificar `hotsites_notificados` no banco

