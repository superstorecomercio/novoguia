# Documentação da API

## Visão Geral

A API do MudaTech é construída com Next.js API Routes. Todos os endpoints retornam JSON e seguem convenções RESTful.

**Base URL**: `http://localhost:3000/api` (desenvolvimento)

## Endpoints Públicos

### Verificação de Ambiente

```http
GET /api/check-env
```

Verifica se as variáveis de ambiente estão configuradas corretamente.

**Resposta**:
```json
{
  "status": "ok",
  "supabaseUrl": true,
  "supabaseKey": true,
  "openaiKey": true
}
```

---

### Calcular Orçamento

```http
POST /api/calcular-orcamento
```

Calcula o valor estimado de uma mudança usando IA.

**Body**:
```json
{
  "estadoOrigem": "SP",
  "cidadeOrigem": "São Paulo",
  "estadoDestino": "RJ",
  "cidadeDestino": "Rio de Janeiro",
  "tipoImovel": "apartamento",
  "comodos": 3,
  "andar": 5,
  "temElevador": true,
  "precisaEmbalagem": true,
  "dataEstimada": "2025-12-15"
}
```

**Resposta**:
```json
{
  "valorEstimado": {
    "minimo": 2500,
    "maximo": 4500,
    "medio": 3500
  },
  "detalhes": {
    "distancia": "430km",
    "volumeEstimado": "25m³",
    "tempoEstimado": "1 dia"
  }
}
```

---

### Orçamentos

```http
GET /api/orcamentos
```

Lista orçamentos (requer autenticação admin).

**Query Params**:
- `status`: Filtrar por status (`pendente`, `enviado`, `respondido`)
- `limit`: Limite de resultados (padrão: 50)
- `offset`: Offset para paginação

```http
POST /api/orcamentos
```

Cria um novo pedido de orçamento.

**Body**:
```json
{
  "tipo": "mudanca",
  "nomeCliente": "João Silva",
  "emailCliente": "joao@email.com",
  "telefoneCliente": "(11) 99999-9999",
  "estadoOrigem": "SP",
  "cidadeOrigem": "São Paulo",
  "estadoDestino": "SP",
  "cidadeDestino": "Campinas",
  "comodos": 3,
  "dataEstimada": "2025-12-15",
  "descricao": "Mudança residencial com 3 quartos"
}
```

---

### Smart Search

```http
GET /api/smart-search
```

Busca inteligente com IA.

**Query Params**:
- `q`: Termo de busca
- `cidade`: Filtrar por cidade
- `tipo`: Tipo de serviço

---

## Endpoints Administrativos

### Cidades

```http
GET /api/admin/cidades
```

Lista todas as cidades cadastradas.

**Resposta**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "São Paulo",
      "slug": "sao-paulo",
      "state": "SP",
      "region": "sudeste"
    }
  ]
}
```

```http
POST /api/admin/cidades
```

Cria uma nova cidade.

```http
GET /api/admin/cidades/:id
PUT /api/admin/cidades/:id
DELETE /api/admin/cidades/:id
```

Operações CRUD em cidade específica.

---

### Hotsites

```http
GET /api/admin/hotsites
```

Lista todos os hotsites (páginas de empresas).

**Query Params**:
- `cidadeId`: Filtrar por cidade
- `ativo`: Filtrar por status (true/false)

```http
POST /api/admin/hotsites
```

Cria um novo hotsite.

**Body**:
```json
{
  "nomeExibicao": "Mudanças Express",
  "cidadeId": "uuid-cidade",
  "descricao": "Empresa de mudanças residenciais",
  "endereco": "Rua Example, 123",
  "cidade": "São Paulo",
  "estado": "SP",
  "tipoempresa": "Empresa de Mudança",
  "servicos": ["Mudanças locais", "Mudanças interestaduais"],
  "formasPagamento": ["Dinheiro", "Cartão", "PIX"]
}
```

```http
GET /api/admin/hotsites/:id
PUT /api/admin/hotsites/:id
DELETE /api/admin/hotsites/:id
```

---

### Campanhas

```http
GET /api/admin/campanhas
```

Lista todas as campanhas de publicidade.

```http
POST /api/admin/campanhas
```

**Body**:
```json
{
  "hotsiteId": "uuid-hotsite",
  "planoId": "uuid-plano",
  "cidadeId": "uuid-cidade",
  "dataInicio": "2025-01-01",
  "dataFim": "2025-12-31",
  "valorMensal": 299.90,
  "ativo": true,
  "participaCotacao": true,
  "limiteOrcamentosMes": 50
}
```

```http
GET /api/admin/campanhas/:id
PUT /api/admin/campanhas/:id
DELETE /api/admin/campanhas/:id
```

---

### Planos

```http
GET /api/admin/planos
```

Lista planos de publicidade disponíveis.

**Resposta**:
```json
{
  "data": [
    {
      "id": "uuid",
      "nome": "top",
      "descricao": "Plano Top - Máxima visibilidade",
      "ordem": 1,
      "preco": 499.90,
      "periodicidade": "mensal"
    }
  ]
}
```

```http
POST /api/admin/planos
PUT /api/admin/planos/:id
DELETE /api/admin/planos/:id
```

---

### Upload de Imagem

```http
POST /api/admin/upload-image
```

Upload de imagem para Supabase Storage.

**Body**: `multipart/form-data`
- `file`: Arquivo de imagem
- `path`: Caminho no storage (ex: `hotsites/logo.png`)

**Resposta**:
```json
{
  "url": "https://supabase.co/storage/v1/object/public/..."
}
```

---

### Sincronizar Cidades

```http
POST /api/admin/sync-cidades
```

Sincroniza cidades do banco de dados legado.

---

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 404 | Não encontrado |
| 429 | Rate limit excedido |
| 500 | Erro interno do servidor |

## Rate Limiting

- **Limite**: 10 requisições por 15 minutos por IP/email
- **Bloqueio**: 30 minutos após exceder limite
- **Header**: `X-RateLimit-Remaining` indica requisições restantes

## Autenticação

Endpoints `/api/admin/*` requerem autenticação via Supabase Auth. O token deve ser enviado no header:

```http
Authorization: Bearer <token>
```
