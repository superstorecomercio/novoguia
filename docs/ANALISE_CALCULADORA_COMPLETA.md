# 📊 Análise Completa da Calculadora - Layout e TypeScript

**Data:** 2025-01-15  
**Componente:** `InstantCalculatorHybrid.tsx`  
**Página:** `/calculadora` e `/calculadorateste`

---

## 🎯 Visão Geral

A calculadora é um formulário conversacional em etapas que coleta dados da mudança, valida informações, calcula estimativa de preço usando IA e salva o orçamento no banco de dados.

---

## 📐 Estrutura de Estados

### Estados Principais (EstadoCalculadora)
```typescript
type EstadoCalculadora = 
  | "formularioInicial"  // Formulário conversacional em etapas
  | "preview"            // Preview/resumo antes de capturar contato
  | "capturaContato"     // Formulário de dados de contato
  | "resultadoFinal"     // Exibição do resultado do cálculo
```

### Estados React (useState)

#### 1. Estado da Calculadora
- `estado: EstadoCalculadora` - Controla qual tela está sendo exibida
- `loading: boolean` - Indica se está processando requisição
- `erro: string | null` - Mensagens de erro

#### 2. Dados do Formulário
- `formData: FormData` - Dados da mudança
  ```typescript
  {
    origem: string
    destino: string
    tipoImovel: TipoImovel | ""
    temElevador: "sim" | "nao" | ""
    andar: string (padrão: "1")
    precisaEmbalagem: "sim" | "nao" | ""
  }
  ```

#### 3. Etapas do Formulário
- `etapaAtual: number` - Índice da etapa atual (0-4)

#### 4. Dados de Contato
- `contatoData: ContatoData` - Informações do cliente
  ```typescript
  {
    nome: string
    email: string
    whatsapp: string (com máscara)
    dataEstimada: string (formato date)
  }
  ```

#### 5. Resultado
- `resultado: ResultadoCalculo | null` - Resultado da API
  ```typescript
  {
    precoMin: number
    precoMax: number
    faixaTexto: string
    distanciaKm?: number
    mensagemIA?: string
  }
  ```

#### 6. Lista de Objetos (Opcional)
- `listaObjetos: string` - Texto da lista
- `arquivoLista: File | null` - Arquivo enviado
- `enviandoLista: boolean` - Status de envio
- `listaEnviada: boolean` - Confirmação de envio
- `erroLista: string | null` - Erro no upload

---

## 🔄 Fluxo de Navegação

```
formularioInicial (etapas 0-4)
    ↓
preview (resumo)
    ↓
capturaContato (dados pessoais)
    ↓
[API Call] → /api/calcular-orcamento
    ↓
resultadoFinal (exibição)
```

---

## 📋 Etapas do Formulário Conversacional

### Etapa 0: Origem
- **Tipo:** `text`
- **Pergunta:** "Olá! 👋 Vamos começar. De onde você vai mudar?"
- **Placeholder:** "Ex: Moema, São Paulo - SP"
- **Campo:** `formData.origem`

### Etapa 1: Destino
- **Tipo:** `text`
- **Pergunta:** "Ótimo! E para onde você está se mudando?"
- **Placeholder:** "Ex: Santana, São Paulo - SP"
- **Campo:** `formData.destino`

### Etapa 2: Tipo de Imóvel
- **Tipo:** `select`
- **Pergunta:** "Qual o tipo do seu imóvel?"
- **Opções:**
  - `kitnet` → "Kitnet"
  - `1_quarto` → "Apartamento 1 quarto"
  - `2_quartos` → "Apartamento 2 quartos"
  - `3_mais` → "Apartamento 3+ quartos ou Casa"
  - `comercial` → "Mudança Comercial"
- **Campo:** `formData.tipoImovel`
- **Auto-avança:** Sim (300ms após seleção)

### Etapa 3: Elevador
- **Tipo:** `select`
- **Pergunta:** "O imóvel tem elevador?"
- **Opções:**
  - `sim` → "Sim"
  - `nao` → "Não"
- **Campo:** `formData.temElevador`
- **Auto-avança:** Sim (300ms após seleção)

### Etapa 4: Embalagem
- **Tipo:** `select`
- **Pergunta:** "Você precisa de embalagem e desmontagem de móveis?"
- **Opções:**
  - `sim` → "Sim, preciso de embalagem completa"
  - `nao` → "Não, eu mesmo embalo"
- **Campo:** `formData.precisaEmbalagem`
- **Auto-avança:** Sim (300ms após seleção)

---

## 🎨 Layout por Estado

### 1. Estado: `formularioInicial`

**Estrutura:**
```
┌─────────────────────────────────────┐
│  Card (max-w-2xl, shadow-xl)        │
│  ┌───────────────────────────────┐  │
│  │ Header                         │  │
│  │ - Ícone TrendingUp             │  │
│  │ - Título                       │  │
│  │ - Subtítulo                    │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Progress Bar                   │  │
│  │ - Passo X de Y                 │  │
│  │ - Barra de progresso           │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Pergunta                       │  │
│  │ - Texto da pergunta            │  │
│  │ - Input/Select                 │  │
│  │ - Dica (se number)             │  │
│  │ - Dica Enter (se válido)       │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Botões                         │  │
│  │ - Voltar (se etapa > 0)        │  │
│  │ - Próximo/Calcular             │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Footer                         │  │
│  │ - Mensagem de segurança        │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Características:**
- Card centralizado com `max-w-2xl`
- Barra de progresso animada
- Inputs com `autoFocus`
- Suporte a Enter para avançar
- Botões adaptativos (Voltar aparece só se etapa > 0)
- Animações: `fade-in`, `slide-in-from-bottom-4`

### 2. Estado: `preview`

**Estrutura:**
```
┌─────────────────────────────────────┐
│  Card (max-w-2xl, shadow-xl)        │
│  ┌───────────────────────────────┐  │
│  │ Header                         │  │
│  │ - Ícone CheckCircle2 (pulsante)│  │
│  │ - Título                       │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Resumo                         │  │
│  │ - Porte da mudança             │  │
│  │ - Explicação                   │  │
│  │ - Call-to-action               │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Botões                         │  │
│  │ - Voltar                       │  │
│  │ - Continuar para ver preço     │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Características:**
- Card com gradiente `from-blue-50 to-green-50`
- Ícone com animação `animate-pulse`
- Texto explicativo sobre o porte
- Botão principal destacado

### 3. Estado: `capturaContato`

**Estrutura:**
```
┌─────────────────────────────────────┐
│  Card (max-w-2xl, shadow-xl)        │
│  ┌───────────────────────────────┐  │
│  │ Header                         │  │
│  │ - Ícone Phone                  │  │
│  │ - Título                       │  │
│  │ - Subtítulo                    │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Campos                         │  │
│  │ - Nome (text)                  │  │
│  │ - Email (email)                │  │
│  │ - WhatsApp (tel, com máscara)  │  │
│  │ - Data Estimada (date)         │  │
│  │ - Lista de Objetos (textarea)  │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Erro (se houver)               │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Botão                          │  │
│  │ - Ver faixa de preço           │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Footer                         │  │
│  │ - Mensagem de segurança        │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Botão Voltar (ghost)           │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Características:**
- Todos os campos obrigatórios (exceto data e lista)
- WhatsApp com máscara brasileira
- Lista de objetos em card destacado com gradiente
- Validação em tempo real
- Botão desabilitado até campos obrigatórios preenchidos

### 4. Estado: `resultadoFinal`

**Estrutura:**
```
┌─────────────────────────────────────┐
│  Card (max-w-2xl, shadow-xl)        │
│  ┌───────────────────────────────┐  │
│  │ Header                         │  │
│  │ - Ícone CheckCircle2           │  │
│  │ - Título                       │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Faixa de Preço                 │  │
│  │ - Label "Valor estimado"       │  │
│  │ - R$ X.XXX - R$ X.XXX          │  │
│  │ - Distância (se houver)        │  │
│  │ - Explicação                   │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Lista Incluída (se houver)     │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Mensagem da IA (se houver)     │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Confirmação                    │  │
│  │ - Orçamento salvo              │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Resumo da Mudança              │  │
│  │ - Grid com todos os dados      │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Botões                         │  │
│  │ - Fazer nova cotação           │  │
│  │ - Voltar para Home             │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Características:**
- Card com gradiente `from-primary/5 to-accent/5` para preço
- Preço em destaque (text-4xl/5xl)
- Seções condicionais (lista, IA)
- Resumo completo em grid
- Botões de ação final

---

## 🔧 Funções TypeScript

### 1. `handleInputChange(field, value)`
- Atualiza campo específico do `formData`
- Limpa erros ao digitar
- **Uso:** Inputs de texto

### 2. `formatarTelefone(valor: string): string`
- Remove caracteres não numéricos
- Limita a 11 dígitos
- Aplica máscara: `(XX) XXXXX-XXXX` ou `(XX) XXXX-XXXX`
- **Uso:** Campo WhatsApp

### 3. `handleWhatsAppChange(valor: string)`
- Aplica máscara usando `formatarTelefone`
- Atualiza `contatoData.whatsapp`
- Limpa erros

### 4. `getEtapas()`
- Retorna array com definição de todas as etapas
- Cada etapa tem: `id`, `pergunta`, `tipo`, `placeholder`/`opcoes`
- **Retorna:** Array de objetos de etapa

### 5. `handleProximaEtapa()`
- Avança para próxima etapa
- Se última etapa, chama `handleCalcularEstimativa()`
- Limpa erros

### 6. `handleVoltarEtapa()`
- Volta para etapa anterior
- Só funciona se `etapaAtual > 0`
- Limpa erros

### 7. `handleKeyPress(e: KeyboardEvent)`
- Detecta Enter
- Avança etapa se válida
- **Uso:** Inputs de texto

### 8. `handleCalcularEstimativa(dadosAtualizados?)`
- Valida todos os campos obrigatórios
- Mescla dados atualizados (para evitar problema de estado assíncrono)
- Muda estado para `"preview"`
- **Validações:**
  - origem não vazio
  - destino não vazio
  - tipoImovel selecionado
  - temElevador selecionado
  - precisaEmbalagem selecionado

### 9. `handleVoltarFormulario()`
- Volta para `formularioInicial`
- Reseta `etapaAtual` para 0
- Limpa erros

### 10. `handleContinuarParaContato()`
- Muda estado para `"capturaContato"`

### 11. `handleSubmitContato()`
- **Validações:**
  - Nome obrigatório
  - Email obrigatório e válido (contém @ e .)
  - WhatsApp obrigatório (10 ou 11 dígitos)
  - Todos os campos do formulário
- Remove máscara do WhatsApp antes de enviar
- Prepara `dadosParaEnvio`
- Faz POST para `/api/calcular-orcamento`
- Atualiza `resultado` e muda para `"resultadoFinal"`
- **Tratamento de erros:**
  - Rate limit (429)
  - Duplicata (409)
  - Outros erros (500)

### 12. `handleNovoCalculo()`
- Reseta todos os estados
- Volta para `formularioInicial`
- Limpa todos os dados

### 13. `handleFileChange(e: ChangeEvent)`
- Valida tipo de arquivo
- Tipos permitidos: txt, pdf, doc, docx, xlsx, csv
- Atualiza `arquivoLista`
- **Uso:** Upload de lista de objetos

### 14. `handleRemoverArquivo()`
- Limpa `arquivoLista`
- Limpa `erroLista`

### 15. `handleEnviarLista()`
- Marca lista como enviada (feedback visual)
- Valida se há lista ou arquivo
- **Nota:** Lista é enviada automaticamente com o orçamento

---

## 🎨 Estilos e Classes Tailwind

### Cards
- `Card` com `max-w-2xl mx-auto`
- `shadow-xl border-0 bg-white`
- Padding: `p-6 lg:p-8`

### Botões
- `Button` com `size="lg"`
- `rounded-xl` (bordas arredondadas)
- `font-semibold` (texto em negrito)

### Inputs
- `Input` com `h-12` ou `h-14`
- `rounded-xl`
- `text-lg` para inputs maiores

### Gradientes
- `bg-gradient-to-br from-blue-50 to-green-50` (preview)
- `bg-gradient-to-br from-primary/5 to-accent/5` (preço)
- `bg-gradient-to-br from-blue-50 to-purple-50` (lista objetos)

### Animações
- `animate-in fade-in slide-in-from-bottom-4 duration-500`
- `animate-pulse` (ícone preview)
- `transition-all duration-300` (hover effects)

### Cores
- Primary: `text-primary`, `bg-primary`
- Accent: `text-accent`, `bg-accent`
- Muted: `text-muted-foreground`
- Destructive: `text-destructive` (erros)

---

## 📊 Validações

### Validações Client-Side

#### Formulário Inicial
- Campo não vazio (trim)
- Se number, valor > 0

#### Captura de Contato
- **Nome:** Não vazio
- **Email:** Não vazio, contém @ e .
- **WhatsApp:** Não vazio, 10 ou 11 dígitos (após remover máscara)
- **Formulário:** Todos os campos obrigatórios preenchidos

### Validações Server-Side (API)
- Rate limiting (5 req/15min)
- Verificação de duplicatas (5 min)
- Validação de tipos
- Validação de formato

---

## 🔄 Integração com API

### Endpoint
`POST /api/calcular-orcamento`

### Payload
```typescript
{
  origem: string
  destino: string
  tipoImovel: TipoImovel
  temElevador: "sim" | "nao"
  andar: number
  precisaEmbalagem: "sim" | "nao"
  nome: string
  email: string
  whatsapp: string (sem máscara)
  dataEstimada?: string
  listaObjetos?: string
  arquivoListaNome?: string
}
```

### Response (Sucesso)
```typescript
{
  precoMin: number
  precoMax: number
  faixaTexto: string
  distanciaKm?: number
  mensagemIA?: string
}
```

### Response (Erro)
```typescript
{
  error: string
  retryAfter?: number (se rate limit)
  duplicate?: boolean (se duplicata)
  existingId?: string (se duplicata)
}
```

---

## 📱 Responsividade

- **Mobile:** Padding reduzido, botões full-width
- **Desktop:** Padding maior, botões lado a lado
- Breakpoints: `lg:` (1024px+)
- Cards: `max-w-2xl` (centralizado)

---

## 🎯 Pontos de Customização

### 1. Layout Geral
- Container: `min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50`
- Card: `max-w-2xl mx-auto`

### 2. Cores e Temas
- Primary: usado para botões principais e destaques
- Accent: usado para confirmações e sucesso
- Muted: usado para textos secundários

### 3. Animações
- Transições suaves em todos os elementos
- Animações de entrada nas etapas
- Pulse no ícone de preview

### 4. Tipografia
- Títulos: `text-2xl lg:text-3xl font-bold`
- Subtítulos: `text-muted-foreground`
- Labels: `text-sm font-medium`

---

## 🔍 Dependências

### Componentes UI (shadcn/ui)
- `Button`
- `Card`
- `Input`
- `Label`
- `Select` (não usado diretamente, mas disponível)

### Ícones (lucide-react)
- `Loader2` - Loading spinner
- `MapPin` - Localização
- `Home` - Casa
- `Building2` - Prédio
- `Phone` - Telefone
- `Mail` - Email
- `CheckCircle2` - Confirmação
- `TrendingUp` - Tendência/cálculo
- `Upload` - Upload
- `FileText` - Arquivo
- `X` - Fechar

---

## 📝 Observações Importantes

1. **Estado Assíncrono:** Ao selecionar opção em select, usa `setTimeout(300ms)` para garantir que o estado seja atualizado antes de avançar

2. **Máscara de Telefone:** Aplicada apenas no frontend, removida antes de enviar para API

3. **Validação de Arquivo:** Tipos MIME específicos, não apenas extensão

4. **Lista de Objetos:** Enviada como texto no payload, não como arquivo (arquivo só envia nome)

5. **Andar:** Valor padrão é "1" (térreo/1º andar)

6. **Auto-focus:** Aplicado nos inputs de texto para melhor UX

7. **Enter para avançar:** Funciona apenas em inputs de texto, não em selects

8. **Progress Bar:** Calculada dinamicamente: `((etapaAtual + 1) / etapas.length) * 100`

---

## 🎨 Estrutura de Renderização

```typescript
if (estado === "formularioInicial") {
  return <Card>...</Card> // Etapas conversacionais
}

if (estado === "preview") {
  return <Card>...</Card> // Preview/resumo
}

if (estado === "capturaContato") {
  return <Card>...</Card> // Formulário de contato
}

if (estado === "resultadoFinal" && resultado) {
  return <Card>...</Card> // Resultado
}

return null
```

---

## 🔗 Fluxo de Dados

```
User Input
    ↓
handleInputChange / handleWhatsAppChange
    ↓
formData / contatoData (state)
    ↓
handleCalcularEstimativa (validação)
    ↓
preview (estado)
    ↓
handleContinuarParaContato
    ↓
capturaContato (estado)
    ↓
handleSubmitContato (validação + API call)
    ↓
/api/calcular-orcamento
    ↓
resultado (state)
    ↓
resultadoFinal (estado)
```

---

**Pronto para receber o novo layout!** 🎨







