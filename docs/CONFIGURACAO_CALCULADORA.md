# Configuração da Calculadora de Mudança

## 📋 Visão Geral

A calculadora de mudança usa **100% Inteligência Artificial** para TUDO:
- **OpenAI GPT-4o-mini** calcula a distância entre origem e destino usando conhecimento geográfico
- **OpenAI GPT-4o-mini** analisa TODOS os dados e retorna orçamentos precisos
- **Fallback básico** apenas se a IA não estiver disponível (não recomendado)
- **Sem APIs externas** - Apenas OpenAI é necessária!

## 🤖 Cálculo 100% com IA (TUDO em um único lugar!)

### Por que usar APENAS IA?

A IA tem **conhecimento completo de geografia E do mercado brasileiro**:

**Cálculo de Distância:**
- ✅ Conhece TODAS as cidades brasileiras
- ✅ Calcula distâncias reais entre qualquer origem e destino
- ✅ Considera rotas reais (não apenas linha reta)
- ✅ Identifica se é mesma cidade, interior, capital ou interestadual

**Cálculo de Preço:**
- ✅ Preços reais praticados em 2024/2025
- ✅ Complexidade logística da rota específica
- ✅ Variações regionais (demanda, concorrência, sazonalidade)
- ✅ Volume estimado de itens por tipo de imóvel
- ✅ Dificuldades de acesso e manuseio
- ✅ Custo real de embalagem profissional
- ✅ Economia de escala em rotas interestaduais
- ✅ Fatores que regras fixas nunca conseguiriam capturar

**Resultado:** Orçamentos EXTREMAMENTE precisos e realistas! Tudo em uma única API.

### 1. Criar Chave da API

1. Acesse: https://platform.openai.com/
2. Crie uma conta ou faça login
3. Vá em: **API Keys**
4. Clique em **Create new secret key**
5. Dê um nome (ex: "Guia de Mudanças")
6. Copie a chave gerada (guarde em local seguro!)

### 2. Configurar no Projeto

Adicione a chave no arquivo `.env.local` (na raiz do projeto):

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

### 3. Modelo Usado

Usamos o **GPT-4o-mini** por padrão:
- ✅ Mais rápido (< 2 segundos)
- ✅ Mais barato ($0.15 por 1M tokens de input)
- ✅ Qualidade excelente para cálculos
- ✅ Suporte a JSON mode

### 4. Custos

**GPT-4o-mini:**
- Input: $0.150 por 1M tokens (~R$ 0,75)
- Output: $0.600 por 1M tokens (~R$ 3,00)
- **Por orçamento**: ~500 tokens = $0.0003 USD (~R$ 0,0015)

**Exemplo real:**
- 1.000 orçamentos/mês = $0.30 USD (~R$ 1,50)
- 10.000 orçamentos/mês = $3 USD (~R$ 15)

💡 **Muito barato para a precisão que oferece!**

### 5. Como Funciona

1. Usuário preenche o formulário com origem, destino e detalhes da mudança
2. **IA recebe TODOS os dados e analisa em um único passo:**
   - Calcula a distância real entre origem e destino usando conhecimento geográfico
   - Identifica o contexto regional (capital, interior, interestadual)
   - Estima o volume de itens baseado no tipo de imóvel
   - Considera dificuldades de acesso (elevador, andar)
   - Adiciona custos de serviços extras (embalagem profissional)
   - Aplica conhecimento do mercado brasileiro atual (2024/2025)
3. **IA retorna:**
   - Distância calculada em km
   - Preço mínimo
   - Preço máximo  
   - Explicação personalizada detalhada do cálculo
4. Se IA falhar ou não estiver configurada, usa estimativa básica (fallback simples - não recomendado)

## 🧪 Testando

1. Configure a OPENAI_API_KEY no `.env.local`
2. Reinicie o servidor: `npm run dev`
3. Acesse: `http://localhost:3000/calculadora`
4. Preencha o formulário com cidades reais
5. Veja no console do terminal os logs da IA

## 🔍 Logs

O sistema loga informações úteis no console:

```
🤖 Consultando IA para calcular distância e orçamento...
✅ IA calculou orçamento completo: {
  distanciaKm: 430,
  precoMin: 2800,
  precoMax: 3900,
  explicacao: "Mudança interestadual de médio porte (430km, rota São Paulo-Rio)..."
}
```

Se a IA não estiver configurada:
```
❌ OPENAI_API_KEY não configurada! Configure para ter orçamentos precisos.
```

## 🚀 Produção

Antes de ir para produção:

1. ✅ Configure a chave da API
2. ✅ Ative restrições de segurança (domínio/IP)
3. ✅ Configure alertas de faturamento no Google Cloud
4. ✅ Monitore o uso mensal
5. ✅ Considere cache de distâncias comuns (opcional)

## 📝 Variáveis de Ambiente

Adicione no `.env.local` (apenas 1 chave necessária!):

```env
# OpenAI API (ÚNICA API NECESSÁRIA - calcula TUDO!)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

**✨ Simples assim! Não precisa de mais nada.**

## 🎯 Por que usar IA ao invés de Regras Fixas?

| Aspecto | IA 100% (GPT-4o-mini) | Fallback Básico |
|---------|----------------------|-----------------|
| **Cálculo de Distância** | ✅ Conhece TODAS as cidades | ❌ Não calcula |
| **Precisão de Preço** | ✅ Muito Alta (contexto completo) | ❌ Genérico fixo |
| **Flexibilidade** | ✅ Adapta-se a qualquer cenário | ❌ Rígido e limitado |
| **Contexto Regional** | ✅ Conhece mercado brasileiro | ❌ Não considera regionalidade |
| **Manutenção** | ✅ Zero manutenção | ⚠️ Precisa atualizar valores |
| **APIs Externas** | ✅ Nenhuma (só OpenAI) | ❌ Nenhuma |
| **Custo/orçamento** | ~R$ 0,002 | Grátis |
| **Velocidade** | ~2-3 segundos | < 100ms |
| **Explicação** | ✅ Texto personalizado e claro | ❌ Texto genérico |
| **Experiência do usuário** | ✅ Premium e confiável | ❌ Básica e imprecisa |

**Recomendação:** ✅ **SEMPRE use a IA em produção!** 

**Por que é melhor:**
- 🎯 **Tudo em 1**: Calcula distância + preço em uma única chamada
- 💰 **Custo baixíssimo**: ~R$ 2,00 para 1000 orçamentos
- 🔒 **Menos complexidade**: Sem APIs externas para gerenciar
- 🚀 **Sempre atualizado**: IA acompanha mudanças do mercado

## 🧪 Exemplo de Resposta da IA

**Input:**
```json
{
  "origem": "Moema, São Paulo, SP",
  "destino": "Copacabana, Rio de Janeiro, RJ",
  "distancia": 430,
  "tipoImovel": "2_quartos",
  "temElevador": "sim",
  "andar": 5,
  "precisaEmbalagem": "sim"
}
```

**Output da IA:**
```json
{
  "precoMin": 2800,
  "precoMax": 3900,
  "explicacao": "Mudança interestadual de médio porte (430km, rota São Paulo-Rio). O custo inclui embalagem profissional (~R$ 1.000), transporte de longa distância, mão de obra especializada e acesso com elevador. A faixa considera variação entre empresas econômicas e premium."
}
```

**Vantagens da IA:**
- ✅ Reconhece que SP-RJ é uma rota comum (mais empresas = preços competitivos)
- ✅ Considera o custo real de embalagem para apartamento de 2 quartos
- ✅ Leva em conta a complexidade logística da mudança interestadual
- ✅ Gera explicação clara e personalizada para o usuário
- ✅ Adapta-se a mudanças no mercado SEM alterar código!

## 🛠️ Manutenção

- Verifique uso mensal no Google Cloud Console
- Atualize distâncias conhecidas em `estimarDistanciaPorTexto()`
- Ajuste preços por km conforme necessário

