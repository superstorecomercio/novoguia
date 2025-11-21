# Instruções Rápidas - Setup do Banco de Dados

## 🚀 Setup Rápido (1 arquivo apenas!)

### Passo 1: Acessar Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Faça login e crie um novo projeto (ou use um existente)
3. Vá em **SQL Editor**

### Passo 2: Executar Script
1. Abra o arquivo `supabase/migrations/001_complete_schema.sql`
2. Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Clique em **Run** ou pressione `Ctrl+Enter`
5. Aguarde alguns segundos...

### Passo 3: Verificar
Execute esta query para verificar se tudo foi criado:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Você deve ver 9 tabelas:
- campanhas
- cidades
- empresa_planos
- empresa_servicos
- empresas
- hotsites
- orcamento_empresas
- orcamentos
- planos_publicidade

### Passo 4: Configurar Variáveis de Ambiente

Crie/edite o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key
```

Você encontra essas informações em:
- Supabase Dashboard → Settings → API

## ✅ Pronto!

Agora você pode:
- ✅ Conectar o código Next.js ao Supabase
- ✅ Começar a criar queries
- ✅ Testar as rotas da aplicação

## 📋 O que foi criado?

- ✅ **9 tabelas** completas
- ✅ **20+ índices** para performance
- ✅ **5 triggers** para updated_at automático
- ✅ **RLS habilitado** com políticas de segurança
- ✅ **4 planos de publicidade** (Top, Quality, Standard, Intermediário)
- ✅ **10 cidades principais** do Brasil
- ✅ **Funções auxiliares** para migração (caso precise migrar dados depois)

## 🆘 Problemas?

### Erro: "relation already exists"
- Significa que algumas tabelas já existem
- Você pode deletar tudo e executar novamente, ou
- Usar o script `000_check_existing_tables.sql` para verificar

### Erro: "permission denied"
- Verifique se você tem permissão de administrador no projeto
- Tente executar em partes menores

### Erro: "extension uuid-ossp does not exist"
- O Supabase já tem essa extensão habilitada por padrão
- Se ocorrer, execute manualmente: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

---

**Última atualização**: 2024-11-20

