# Calculadora Teste - Documentação Completa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura e Componentes](#arquitetura-e-componentes)
3. [Fluxo Completo do Usuário](#fluxo-completo-do-usuário)
4. [Estados da Aplicação](#estados-da-aplicação)
5. [Interface Conversacional](#interface-conversacional)
6. [Cálculo de Preços com IA](#cálculo-de-preços-com-ia)
7. [Validações e Proteções](#validações-e-proteções)
8. [Componentes Visuais](#componentes-visuais)
9. [API e Backend](#api-e-backend)
10. [Melhorias Implementadas](#melhorias-implementadas)

---

## 🎯 Visão Geral

A **Calculadora Teste** (`/calculadorateste`) é uma calculadora de orçamentos de mudança com interface conversacional estilo chat, onde o usuário interage com a assistente virtual "Julia" para fornecer informações sobre sua mudança e receber uma estimativa de preço em tempo real.

### Características Principais

- ✅ Interface conversacional estilo WhatsApp
- ✅ Assistente virtual "Julia" com avatar real
- ✅ Cálculo de preços em tempo real usando IA (OpenAI GPT-4o-mini)
- ✅ Validação automática de preços mínimos
- ✅ Captura de dados de contato
- ✅ Opção de enviar lista de objetos
- ✅ Design responsivo e moderno
- ✅ Scroll automático e barra de scroll oculta
- ✅ Indicadores de leitura (checkmarks duplos)
- ✅ Timestamps nas mensagens

---

## 🏗️ Arquitetura e Componentes

### Estrutura de Arquivos

```
app/
├── calculadorateste/
│   └── page.tsx                    # Página principal
├── components/
│   └── InstantCalculatorHybridTeste.tsx  # Componente principal
└── api/
    └── calcular-orcamento/
        └── route.ts                # API de cálculo com IA
```

### Componente Principal

**`InstantCalculatorHybridTeste.tsx`** - Componente React que gerencia todo o estado e lógica da calculadora.

---

## 🔄 Fluxo Completo do Usuário

### 1. Inicialização

```
Usuário acessa /calculadorateste
    ↓
Componente monta com estado "formularioInicial"
    ↓
useEffect detecta estado e messages.length === 0
    ↓
Adiciona mensagens iniciais da Julia:
  - "Olá! Sou a Julia 👋" (500ms)
  - "Vou calcular o valor da sua mudança agora — e o melhor: o preço aparece na hora, em poucos segundos." (2000ms)
  - "Para começar, me diga: de onde você está saindo?" (3500ms)
```

### 2. Formulário Inicial (Conversacional)

O usuário responde perguntas sequenciais:

1. **Origem**: "De onde você está saindo?"
   - Placeholder: "Ex: Rua das Flores, 123, Centro, São Paulo - SP"
   - Validação: Campo obrigatório

2. **Destino**: "Para onde você está se mudando?"
   - Placeholder: "Ex: Av. Paulista, 1000, Bela Vista, São Paulo - SP"
   - Validação: Campo obrigatório

3. **Tipo de Imóvel**: "Qual o tipo do seu imóvel?"
   - Opções: Kitnet, 1 quarto, 2 quartos, 3+ quartos/Casa, Comercial
   - Interface: Botões de seleção

4. **Elevador**: "Tem elevador no prédio?"
   - Opções: Sim / Não
   - Interface: Botões de seleção

5. **Andar**: "Qual o andar?" (se não tem elevador)
   - Tipo: Input numérico
   - Validação: Número entre 1 e 50

6. **Embalagem**: "Precisa de embalagem e desmontagem completa?"
   - Opções: Sim / Não
   - Interface: Botões de seleção

### 3. Preview

Após preencher todas as informações:

```
Estado muda para "preview"
    ↓
Adiciona mensagens explicativas:
  - "Sua mudança parece ser de porte [pequeno/médio/grande] na região informada."
  - "Normalmente, mudanças desse tipo ficam em uma faixa de preço bem definida..."
  - "Para te mostrar a faixa real de preço... me informe um contato rápido."
    ↓
Estado muda para "capturaContato"
```

### 4. Captura de Contato

O usuário fornece dados de contato:

1. **Nome**: Campo de texto obrigatório
2. **E-mail**: Campo de e-mail obrigatório com validação
3. **WhatsApp**: Campo de telefone com máscara automática
4. **Data Estimada**: Campo de data opcional

### 5. Pergunta sobre Lista de Objetos

Após preencher os dados de contato:

```
Sistema pergunta: "Antes de calcular, você gostaria de enviar uma lista de objetos para um orçamento mais preciso?"
    ↓
Usuário escolhe:
  - "Sim, quero enviar" → Abre campo de texto para lista
  - "Não, pode calcular" → Vai direto para cálculo
```

**Se escolher "Sim":**
- Campo de texto aparece na mesma interface
- Usuário descreve os objetos
- Ao enviar, lista é salva e cálculo é iniciado

**Se escolher "Não":**
- Mensagem "Perfeito! Calculando o melhor orçamento para você... ⏳"
- Cálculo é iniciado imediatamente

### 6. Cálculo e Resultado

```
Estado muda para "resultadoFinal"
    ↓
API /api/calcular-orcamento é chamada
    ↓
IA calcula distância e preço
    ↓
Validação de preços mínimos aplicada
    ↓
Resultado exibido com:
  - Faixa de preço (min - max)
  - Distância calculada
  - Mensagem explicativa da IA
  - Resumo completo da mudança
  - Informação sobre contato das empresas
```

---

## 📊 Estados da Aplicação

### Estados Principais

```typescript
type EstadoCalculadora = 
  | "formularioInicial"  // Coletando dados da mudança
  | "preview"            // Mostrando preview antes do contato
  | "capturaContato"     // Coletando dados de contato
  | "resultadoFinal"     // Exibindo resultado do cálculo
```

### Estados Auxiliares

- `etapaAtual`: Índice da etapa atual no formulário inicial (-1 a 5)
- `etapaContatoAtual`: Índice da etapa atual na captura de contato (-1 a 3)
- `mostrarPerguntaLista`: Boolean - mostra pergunta sobre lista de objetos
- `coletandoListaObjetos`: Boolean - mostra campo para lista de objetos
- `loading`: Boolean - indica que está calculando
- `isTyping`: Boolean - indica que o bot está "digitando"
- `showIntro`: Boolean - controla se deve mostrar mensagens iniciais

### Refs de Controle

- `introExecutadoRef`: Evita duplicação das mensagens iniciais
- `previewExecutadoRef`: Evita duplicação das mensagens de preview
- `messagesEndRef`: Referência para scroll automático

---

## 💬 Interface Conversacional

### Estrutura de Mensagens

```typescript
interface Message {
  id: number
  type: "bot" | "user"
  text: string
  timestamp: Date
  read?: boolean  // Para checkmarks duplos
}
```

### Formatação de Texto

- **Negrito**: Texto entre parênteses `(texto)` é convertido para `**texto**` e renderizado em negrito
- **Timestamps**: Exibidos abaixo de cada mensagem (formato HH:MM)
- **Checkmarks**: Ícones duplos (VV) azuis no canto inferior direito das mensagens

### Avatar da Julia

- **Imagem**: URL do Unsplash (mulher sorrindo com fundo pastel)
- **Estilo**: Circular, com borda branca e sombra suave
- **Tamanho**: 64x64px

### Scroll Automático

- Scroll automático para a última mensagem quando novas mensagens são adicionadas
- Barra de scroll oculta (mas funcionalidade mantida)
- Altura máxima responsiva: `max-h-[80vh]` no mobile, `lg:max-h-[600px]` no desktop

---

## 🤖 Cálculo de Preços com IA

### API: `/api/calcular-orcamento`

#### Request

```typescript
{
  origem: string
  destino: string
  tipoImovel: "kitnet" | "1_quarto" | "2_quartos" | "3_mais" | "comercial"
  temElevador: "sim" | "nao"
  andar: number
  precisaEmbalagem: "sim" | "nao"
  nome: string
  email: string
  whatsapp: string
  dataEstimada?: string
  listaObjetos?: string
  arquivoListaNome?: string
}
```

#### Response

```typescript
{
  precoMin: number
  precoMax: number
  faixaTexto: string
  distanciaKm?: number
  mensagemIA?: string
  cidadeOrigem?: string
  estadoOrigem?: string
  cidadeDestino?: string
  estadoDestino?: string
}
```

### Processo de Cálculo

1. **IA Analisa os Dados**
   - Interpreta origem e destino (corrige erros de digitação)
   - Calcula distância real em km
   - Identifica tipo de mudança (mesma cidade, interestadual, etc.)

2. **IA Calcula Preço Base**
   - Considera todos os fatores de custo
   - Retorna faixa de preço (min - max)

3. **Validação Automática**
   - Calcula preço mínimo baseado em:
     - Tipo de imóvel (valores base)
     - Distância (combustível ida e volta)
     - Custos adicionais (embalagem, elevador, etc.)
     - Margem de 20%
   - Se preço da IA for muito baixo, ajusta automaticamente
   - Garante diferença mínima de 30% entre min e max

### Fatores de Custo Considerados

#### Custos Base por Tipo de Imóvel

- **Kitnet**: R$ 1.000-1.200 (2 pessoas, veículo pequeno)
- **1 quarto**: R$ 1.400-1.800 (2-3 pessoas, veículo médio)
- **2 quartos**: R$ 1.800-2.500 (3-4 pessoas, veículo médio/grande)
- **3+ quartos/Casa**: R$ 2.500-4.000 (4+ pessoas, veículo grande)
- **Comercial**: R$ 2.000-5.000+ (depende do volume)

#### Custos Adicionais

- **Combustível**: R$ 0,80-1,20 por km (ida e volta = 2x a distância)
- **Embalagem profissional**: +R$ 800-2.000
- **Desmontagem/Remontagem**: +R$ 300-800
- **Sem elevador (3º-4º andar)**: +R$ 300-400
- **Sem elevador (5º+ andar)**: +R$ 500-1.000
- **Seguro de carga**: +R$ 200-500
- **Pernoite (mudanças >600km)**: +R$ 400-800
- **Pedágios**: +R$ 50-200 (mudanças >100km)
- **Margem de lucro**: 20-30% sobre custos totais

### Exemplos de Referência

- **Mesma cidade (12 km, kitnet, com elevador, sem embalagem)**: R$ 1.200 - R$ 1.600
- **Mesma cidade (12 km, 2 quartos, sem elevador 3º andar, sem embalagem)**: R$ 1.800 - R$ 2.500
- **Mesma cidade (12 km, 2 quartos, com elevador, COM embalagem)**: R$ 2.800 - R$ 3.800
- **Interestadual (430 km, 2 quartos, com elevador, com embalagem)**: R$ 4.500 - R$ 6.500
- **Interestadual (1.100 km, 3+ quartos, sem elevador 4º andar, com embalagem)**: R$ 8.000 - R$ 12.000

---

## 🛡️ Validações e Proteções

### Rate Limiting

- **Limite**: 5 requisições por hora por IP/e-mail
- **Retry-After**: 30 minutos após exceder limite
- **Resposta**: HTTP 429 com mensagem de erro

### Verificação de Duplicatas

- Verifica se mesmo e-mail/origem/destino foi enviado nos últimos 5 minutos
- **Resposta**: HTTP 409 com mensagem informativa

### Validações de Dados

#### Frontend
- Campos obrigatórios não podem estar vazios
- E-mail deve ter formato válido
- WhatsApp deve ter formato válido (máscara automática)
- Data deve estar no futuro (se fornecida)

#### Backend
- Validação de todos os campos obrigatórios
- Validação de formato de e-mail
- Validação de formato de WhatsApp
- Sanitização de dados antes de salvar

### Validação de Preços

- **Preço mínimo calculado**: Baseado em tipo + distância + custos adicionais + margem
- **Ajuste automático**: Se IA retornar preço muito baixo, ajusta para 90% do mínimo calculado
- **Diferença mínima**: Garante pelo menos 30% de diferença entre min e max

---

## 🎨 Componentes Visuais

### Input Fields

- **Altura**: 56px (h-14)
- **Bordas**: 12px arredondadas (rounded-xl)
- **Sombra**: Suave (shadow-md) com aumento no foco (shadow-lg)
- **Ícones**: À esquerda (ícone do campo) e à direita (microfone)
- **Placeholder**: Texto descritivo com exemplos

### Botões

#### Botão "Enviar"
- **Cor**: Laranja vibrante (bg-orange-500)
- **Hover**: Laranja mais escuro (bg-orange-600) + brilho (brightness-110)
- **Ícone**: Seta para direita (ChevronRight)
- **Tamanho**: h-14, px-6
- **Transição**: Suave (duration-200)

#### Botões de Opção
- **Layout**: Grid responsivo (1 coluna mobile, 2 colunas desktop)
- **Hover**: Elevação e sombra aumentada
- **Selecionado**: Borda e fundo destacados

### Cards de Mensagem

#### Mensagem do Bot
- **Fundo**: Cinza claro (bg-muted)
- **Texto**: Preto (text-foreground)
- **Bordas**: Arredondadas (rounded-2xl)
- **Padding**: px-5 py-3

#### Mensagem do Usuário
- **Fundo**: Laranja (bg-primary)
- **Texto**: Branco (text-primary-foreground)
- **Alinhamento**: Direita (flex-row-reverse)
- **Bordas**: Arredondadas (rounded-2xl)

### Resultado Final

- **Card principal**: Fundo branco, sombra destacada
- **Valor estimado**: Destaque grande (text-4xl lg:text-5xl) em laranja
- **Resumo**: Grid com informações organizadas
- **Botões de ação**: "Fazer nova cotação" e "Voltar para Home"

---

## 🔌 API e Backend

### Endpoint: POST `/api/calcular-orcamento`

#### Fluxo de Processamento

```
1. Validação de Rate Limit
   ↓
2. Verificação de Duplicatas
   ↓
3. Validação de Dados
   ↓
4. Cálculo com IA (OpenAI GPT-4o-mini)
   ↓
5. Validação e Ajuste de Preços
   ↓
6. Salvamento no Banco de Dados
   ↓
7. Notificação para Empresas
   ↓
8. Retorno do Resultado
```

#### Configuração da IA

- **Modelo**: `gpt-4o-mini`
- **Temperature**: 0.3 (baixa para consistência)
- **Max Tokens**: 600
- **Response Format**: JSON Object
- **System Prompt**: Especialista em orçamentos de mudanças e geografia brasileira

#### Salvamento no Banco

- Dados salvos na tabela `orcamentos`
- Associação com campanhas ativas
- Notificação automática para empresas qualificadas
- Logs detalhados de todas as operações

---

## ✨ Melhorias Implementadas

### 1. Interface Conversacional

- ✅ Chat estilo WhatsApp com mensagens do bot e usuário
- ✅ Avatar real da Julia (mulher sorrindo)
- ✅ Checkmarks duplos azuis (indicadores de leitura)
- ✅ Timestamps nas mensagens
- ✅ Scroll automático suave
- ✅ Barra de scroll oculta (mas funcional)

### 2. Experiência do Usuário

- ✅ Placeholders descritivos com exemplos
- ✅ Máscara automática para WhatsApp
- ✅ Validação em tempo real
- ✅ Mensagens de erro claras
- ✅ Indicador de "digitando" do bot
- ✅ Animações suaves de entrada

### 3. Cálculo de Preços

- ✅ Integração com OpenAI GPT-4o-mini
- ✅ Interpretação inteligente de localidades
- ✅ Correção automática de erros de digitação
- ✅ Validação de preços mínimos
- ✅ Consideração de todos os fatores de custo
- ✅ Exemplos de referência atualizados

### 4. Funcionalidades Adicionais

- ✅ Opção de enviar lista de objetos
- ✅ Captura completa de dados de contato
- ✅ Preview antes do cálculo
- ✅ Resumo detalhado do resultado
- ✅ Botão para nova cotação
- ✅ Integração com sistema de notificações

### 5. Proteções e Segurança

- ✅ Rate limiting (5 req/hora)
- ✅ Verificação de duplicatas
- ✅ Validação de dados frontend e backend
- ✅ Sanitização de inputs
- ✅ Logs detalhados para debug

### 6. Design e Responsividade

- ✅ Design moderno e limpo
- ✅ Cores consistentes (laranja e azul)
- ✅ Responsivo (mobile-first)
- ✅ Acessibilidade (contraste, tamanhos)
- ✅ Performance otimizada

---

## 📝 Exemplo de Uso Completo

### Cenário: Mudança de Kitnet em São Paulo

1. **Usuário acessa** `/calculadorateste`
2. **Julia apresenta-se**: "Olá! Sou a Julia 👋"
3. **Usuário informa origem**: "Rua das Flores, 123, Centro, São Paulo - SP"
4. **Usuário informa destino**: "Av. Paulista, 1000, Bela Vista, São Paulo - SP"
5. **Usuário seleciona tipo**: "Kitnet"
6. **Usuário informa elevador**: "Sim"
7. **Usuário informa embalagem**: "Não"
8. **Sistema mostra preview** e pede contato
9. **Usuário informa**: Nome, E-mail, WhatsApp
10. **Sistema pergunta sobre lista**: Usuário escolhe "Não"
11. **Sistema calcula**: IA processa e retorna:
    - Distância: 12 km
    - Preço: R$ 1.200 - R$ 1.600
    - Explicação: "Mudança entre Centro e Bela Vista, ambos bairros de São Paulo (12km). Distância curta dentro da mesma cidade, acesso facilitado com elevador."
12. **Resultado exibido** com resumo completo
13. **Empresas são notificadas** automaticamente

---

## 🔧 Configuração e Deploy

### Variáveis de Ambiente Necessárias

```env
OPENAI_API_KEY=sk-...  # Chave da API OpenAI
DATABASE_URL=...       # URL do banco de dados
```

### Dependências Principais

- `next`: Framework React
- `openai`: Cliente OpenAI
- `lucide-react`: Ícones
- `tailwindcss`: Estilização
- `@supabase/supabase-js`: Banco de dados

### Build e Deploy

```bash
npm install
npm run build
npm start
```

---

## 📊 Métricas e Monitoramento

### Logs Implementados

- ✅ Todas as requisições à API
- ✅ Cálculos realizados pela IA
- ✅ Ajustes de preços aplicados
- ✅ Erros e exceções
- ✅ Rate limits excedidos
- ✅ Duplicatas detectadas

### Métricas Importantes

- Taxa de conversão (cotações completadas)
- Tempo médio de resposta da IA
- Taxa de ajuste de preços
- Taxa de erro
- Distribuição de tipos de mudança

---

## 🚀 Próximas Melhorias Sugeridas

1. **Integração com Google Maps API** para cálculo preciso de distância
2. **Histórico de cotações** do usuário
3. **Comparação de preços** entre diferentes empresas
4. **Chat em tempo real** com empresas
5. **Upload de fotos** dos objetos
6. **Agendamento online** de mudança
7. **Integração com pagamento** online
8. **Avaliações e reviews** de empresas

---

## 📞 Suporte

Para dúvidas ou problemas:
- Verificar logs em `/logs`
- Consultar documentação da API
- Verificar configuração das variáveis de ambiente
- Revisar validações e rate limits

---

**Última atualização**: Dezembro 2024
**Versão**: 1.0.0







