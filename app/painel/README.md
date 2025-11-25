# MudaTech Dashboard

Dashboard moderno e mobile-first para empresas de mudança gerenciarem leads e responderem orçamentos com ajuda de IA.

## 🚀 Funcionalidades

### Dashboard Principal (`/dashboard`)
- **Visualização de Leads**: Cards responsivos com todos os detalhes da mudança
- **Estatísticas em Tempo Real**: Total de leads, pendentes e orçados
- **Status dos Leads**: Sistema visual de badges (Pendente, Orçado, Aceito, Recusado)
- **Detalhes Completos**: Endereços, data, tipo de imóvel, elevador, embalagem e itens especiais

### Resposta com IA
- **Geração Automática**: IA cria mensagens personalizadas baseadas nos detalhes do lead
- **Edição Flexível**: Mensagem pode ser editada antes do envio
- **Geração de PDF**: Proposta profissional em PDF com logo e dados da empresa
- **Preview do PDF**: Visualização antes de enviar
- **Download**: Baixar o PDF localmente

### Envio de Propostas
- **Email**: Envio direto com PDF anexado
- **WhatsApp**: Abre conversa com mensagem pré-preenchida e PDF pronto para enviar
- **Cópia Rápida**: Botão para copiar mensagem para área de transferência

### Perfil da Empresa (`/profile`)
- **Upload de Logo**: Adicione o logo da empresa (aparece no PDF)
- **Informações Básicas**: Nome, CNPJ, descrição
- **Dados de Contato**: Email, telefone, endereço
- **Serviços Oferecidos**: Lista editável de serviços (aparece nas propostas)

### Autenticação (`/login`)
- **Login Simulado**: Sistema mockado para visualização do design
- **Preparado para Integração**: Estrutura pronta para conectar com Supabase via Cursor AI

## 🛠️ Tecnologias

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Shadcn/ui** (Componentes)
- **Vercel AI SDK** (Geração de mensagens)
- **jsPDF** (Geração de PDFs)
- **Lucide React** (Ícones)

## 📱 Mobile-First

O dashboard foi projetado com foco em dispositivos móveis:
- Layout responsivo com breakpoints otimizados
- Cards adaptáveis para telas pequenas
- Navegação otimizada para touch
- Modais com scroll para conteúdo longo
- Tipografia legível em qualquer tamanho de tela

## 🎨 Design System

### Cores
- **Primary**: Azul moderno (#2563eb)
- **Background**: Branco/Dark adaptável
- **Foreground**: Textos com contraste otimizado
- **Muted**: Elementos secundários

### Tipografia
- **Headings**: Negrito, tamanhos escalonados
- **Body**: Leading relaxado (1.5-1.6) para legibilidade
- **Labels**: Texto pequeno mas legível

### Componentes
- Cards com bordas arredondadas e hover effects
- Badges coloridos por status
- Botões com estados claros
- Modais responsivos e acessíveis

## 🔧 Estrutura de Arquivos

\`\`\`
app/
├── dashboard/          # Dashboard principal
│   └── page.tsx
├── login/             # Página de login
│   └── page.tsx
├── profile/           # Perfil da empresa
│   └── page.tsx
└── api/
    ├── generate-quote/ # Geração de mensagem com IA
    └── send-quote/     # Envio de propostas

components/
└── dashboard/
    ├── header.tsx      # Header com navegação
    ├── stats.tsx       # Cards de estatísticas
    ├── leads-list.tsx  # Lista de leads
    ├── lead-card.tsx   # Card individual do lead
    └── quote-modal.tsx # Modal de resposta com IA

lib/
├── mock-data.ts       # Dados simulados (5 leads de exemplo)
└── pdf-generator.ts   # Geração de PDF das propostas

types/
└── jspdf.d.ts        # Tipos TypeScript para jsPDF
\`\`\`

## 🔌 Integração com Cursor AI

O projeto está preparado para integração real via Cursor AI:

### Supabase (Banco de Dados)
\`\`\`sql
-- Tabelas necessárias:
- companies (perfil da empresa)
- leads (leads de mudança)
- quotes (orçamentos enviados)
\`\`\`

### Variáveis de Ambiente
\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI (Vercel AI Gateway)
# Já configurado por padrão

# Email (opcional)
RESEND_API_KEY=

# WhatsApp (opcional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
\`\`\`

### Próximos Passos para Produção

1. **Remover Mock Data**: Substituir `lib/mock-data.ts` por queries do Supabase
2. **Implementar Auth**: Conectar login real com Supabase Auth
3. **Storage**: Upload de logo para Supabase Storage
4. **Email Real**: Integrar Resend ou SendGrid para envio de emails
5. **WhatsApp API**: Integrar Twilio ou similar para envio automático

## 📦 Instalação

\`\`\`bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
\`\`\`

## 🎯 Como Usar

1. **Acesse o Dashboard**: Navegue para `/dashboard` (ou apenas `/`)
2. **Visualize os Leads**: Veja 5 leads mockados de exemplo
3. **Responder Lead**: Clique em "Responder com IA" em qualquer lead
4. **Digite o Valor**: Informe o preço do orçamento
5. **Gere a Mensagem**: Clique para a IA criar a mensagem personalizada
6. **Gere o PDF**: Visualize e baixe a proposta em PDF
7. **Envie**: Escolha entre Email ou WhatsApp

## 🎨 Customização

### Alterar Cores
Edite `app/globals.css` para mudar o tema:
\`\`\`css
--primary: ...
--background: ...
--foreground: ...
\`\`\`

### Adicionar Campos aos Leads
Atualize a interface `Lead` em `lib/mock-data.ts`

### Customizar Mensagem da IA
Edite o prompt em `app/api/generate-quote/route.ts`

### Modificar Layout do PDF
Ajuste a função em `lib/pdf-generator.ts`

## 📄 Licença

Projeto criado para MudaTech - Todos os direitos reservados
