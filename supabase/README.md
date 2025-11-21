# Supabase - Guia de Mudanças

Este diretório contém as configurações e migrations do Supabase para o projeto Guia de Mudanças.

## Estrutura

```
supabase/
├── migrations/          # Migrations SQL
│   ├── 001_initial_schema.sql    # Schema inicial completo
│   └── 002_seed_data.sql         # Dados iniciais (seeds)
└── README.md            # Este arquivo
```

## Migration Principal

### 001_complete_schema.sql
**ARQUIVO ÚNICO COMPLETO** - Execute apenas este arquivo!

Contém tudo que você precisa:
- ✅ Todas as tabelas principais (9 tabelas)
- ✅ Relacionamentos (foreign keys)
- ✅ Índices para performance (20+ índices)
- ✅ Triggers para `updated_at` automático
- ✅ Row Level Security (RLS) habilitado e políticas configuradas
- ✅ Dados iniciais (planos de publicidade + 10 cidades principais)
- ✅ Funções auxiliares para migração de dados (opcional)

**Tabelas criadas:**
- `cidades` - Cidades atendidas
- `empresas` - Empresas de mudança
- `hotsites` - Detalhes expandidos das empresas
- `planos_publicidade` - Tipos de planos (Top, Quality, Standard, Intermediário)
- `empresa_planos` - Relacionamento empresa ↔ plano
- `campanhas` - Histórico de campanhas
- `orcamentos` - Orçamentos solicitados
- `orcamento_empresas` - Relacionamento N:N orçamento ↔ empresa
- `empresa_servicos` - Tipos de serviço oferecidos por empresa

## Como Aplicar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo `001_complete_schema.sql`
4. Copie TODO o conteúdo
5. Cole no SQL Editor
6. Clique em **Run** ou pressione `Ctrl+Enter`
7. Aguarde a execução (pode levar alguns segundos)

### Opção 2: Via Supabase CLI

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Login no Supabase
supabase login

# Linkar ao projeto
supabase link --project-ref seu-project-ref

# Aplicar migration
supabase db push
```

### Opção 3: Via Arquivo SQL

1. Abra o arquivo `001_complete_schema.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Execute

## Verificação (Opcional)

### 000_check_existing_tables.sql
Script opcional para verificar quais tabelas existem no banco.
Útil se você quiser verificar o estado antes ou depois da migração.

## Variáveis de Ambiente Necessárias

Após criar o projeto no Supabase, configure no `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key
```

## Próximos Passos

1. ✅ Criar schema inicial
2. ⏳ Criar políticas RLS para autenticação administrativa
3. ⏳ Criar funções SQL para queries complexas
4. ⏳ Criar triggers para lógica de negócio
5. ⏳ Migrar dados do sistema legado (quando necessário)

## Notas Importantes

- **RLS está habilitado**: Todas as tabelas têm Row Level Security ativado
- **Políticas públicas**: Dados públicos (cidades, empresas ativas) podem ser lidos por qualquer um
- **Políticas de escrita**: Apenas orçamentos podem ser criados publicamente (com rate limiting recomendado)
- **Admin**: Políticas administrativas serão criadas em migration separada quando implementar autenticação

## Estrutura do Banco

### Relacionamentos Principais

```
cidades (1) ──< (N) empresas
empresas (1) ──< (1) hotsites
empresas (1) ──< (N) empresa_planos ──> (N) planos_publicidade
empresas (1) ──< (N) empresa_servicos
empresas (1) ──< (N) campanhas
orcamentos (1) ──< (N) orcamento_empresas ──> (N) empresas
```

### Ordenação de Empresas

As empresas devem ser ordenadas por:
1. `empresa_planos.plano_id` (ordem do plano)
2. `empresa_planos.ordem` (se houver)
3. `empresas.created_at` (mais recente primeiro)

---

**Última atualização**: 2024-11-20

