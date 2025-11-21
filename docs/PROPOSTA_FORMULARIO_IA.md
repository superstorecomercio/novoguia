# 🤖 Proposta: Formulário de Orçamento com IA

## 🎯 Visão Geral

Formulário multi-step inteligente que usa IA para:
- **Preencher automaticamente** campos baseado em contexto
- **Sugerir empresas** mais adequadas baseado nas respostas
- **Validar e corrigir** dados em tempo real
- **Estimar valores** aproximados baseado em histórico
- **Otimizar experiência** do usuário

## 📋 Estrutura do Formulário (5 Etapas)

### Etapa 1: Tipo de Serviço
- Seleção visual: Mudança, Carreto, Guarda-Móveis
- **IA**: Sugere tipo baseado em palavras-chave da descrição inicial (se houver)

### Etapa 2: Origem
- Estado + Cidade (autocomplete com IA)
- Endereço + Bairro (opcional)
- Tipo de imóvel (Casa, Apartamento, Comercial)
- **IA**: Auto-completa cidade baseado em estado, sugere bairros conhecidos

### Etapa 3: Destino
- Estado + Cidade (autocomplete com IA)
- Endereço + Bairro (opcional)
- Tipo de imóvel
- **IA**: Sugere cidades próximas, calcula distância estimada

### Etapa 4: Detalhes do Serviço (Dinâmico)
**Mudança:**
- Número de cômodos
- Estilo de vida (Minimalista, Padrão, Luxo, Comercial)
- Descrição livre
- **IA**: Estima quantidade de itens baseado em cômodos + estilo

**Carreto:**
- Número de peças
- Descrição dos itens
- **IA**: Sugere tipo de veículo necessário

**Guarda-Móveis:**
- Tempo de armazenamento
- O que precisa guardar
- **IA**: Estima espaço necessário

### Etapa 5: Dados Pessoais
- Nome completo
- Email (validação com IA)
- Telefone (formatação automática)
- Preferência de contato (WhatsApp, Email, Telefone)
- Data estimada
- **IA**: Valida email em tempo real, formata telefone automaticamente

## 🧠 Funcionalidades de IA

### 1. Auto-complete Inteligente de Cidades
- Busca cidades do banco
- Sugere cidades populares baseado em histórico
- Corrige erros de digitação

### 2. Estimativa de Preço
- Analisa histórico de orçamentos similares
- Calcula estimativa baseada em:
  - Distância origem → destino
  - Tipo de serviço
  - Tamanho/complexidade
  - Região

### 3. Sugestão de Empresas
- Filtra empresas baseado em:
  - Tipo de serviço
  - Cidade de origem/destino
  - Histórico de avaliações
  - Disponibilidade

### 4. Validação Inteligente
- Detecta erros de digitação em cidades
- Valida formato de telefone
- Verifica se email é válido
- Sugere correções

## 🎨 Design Proposto

- **Progress Bar**: Mostra progresso visual
- **Animações suaves**: Transições entre etapas
- **Validação em tempo real**: Feedback imediato
- **Salvamento automático**: Salva progresso no localStorage
- **Mobile-first**: Otimizado para celular

## 🔧 Tecnologias Sugeridas

### Opção 1: IA com API Externa (OpenAI/Claude)
- Pros: Mais poderosa, contexto melhor
- Contras: Custo, latência, dependência externa

### Opção 2: IA Local (Embeddings + Similarity Search)
- Pros: Gratuito, rápido, privacidade
- Contras: Menos poderosa, precisa treinar

### Opção 3: Híbrida (Regras + IA quando necessário)
- Pros: Melhor custo-benefício
- Contras: Mais complexa de implementar

## 💡 Recomendação

**Começar com Opção 3 (Híbrida):**
1. Auto-complete de cidades: Busca no banco + fuzzy search
2. Validação: Regras + regex
3. Sugestões: Baseado em dados históricos
4. IA para casos específicos: Descrição livre → extrair informações

## 📊 Fluxo do Usuário

```
1. Usuário acessa /orcamento
2. Seleciona tipo de serviço
3. Preenche origem (IA sugere cidades)
4. Preenche destino (IA calcula distância)
5. Detalhes específicos (IA estima valores)
6. Dados pessoais (IA valida)
7. Revisão final com estimativa
8. Envio → Empresas recebem orçamento
```

## 🚀 Próximos Passos

1. Criar componente de multi-step
2. Implementar auto-complete de cidades
3. Adicionar validação inteligente
4. Criar estimativa de preço
5. Integrar com backend (Supabase)

