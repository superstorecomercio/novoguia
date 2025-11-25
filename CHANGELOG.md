# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [0.1.0] - 2025-11-23

### Adicionado
- Calculadora inteligente com IA para estimar valores de mudança (`/calcularmudanca`)
- Sistema completo de orçamentos com notificação para empresas
- Painel administrativo para gerenciamento de:
  - Cidades
  - Hotsites (páginas de empresas)
  - Campanhas de publicidade
  - Planos de assinatura
- Páginas dinâmicas por cidade com SEO otimizado
- Sistema de campanhas com controle de limites de orçamentos
- Rate limiter para proteção contra spam
- Logger estruturado para monitoramento
- Upload de imagens para Supabase Storage
- Integração com OpenAI para cálculos inteligentes
- Componentes UI com shadcn/ui e Radix
- Suporte a dark mode

### Estrutura
- Migração completa para Next.js 16 com App Router
- TypeScript com tipagem forte
- Tailwind CSS 4 para estilização
- Supabase como backend (PostgreSQL + Storage)

### Documentação
- README.md com instruções de setup
- CONTRIBUTING.md com guia de contribuição
- API.md com documentação dos endpoints
- Documentação técnica em `/docs`
