# Guia Completo de Migração de Dados

## 🎯 Objetivo

Migrar dados do banco legado (SQL Server - `netmude3`) para o novo banco Supabase (PostgreSQL).

## 📋 Pré-requisitos

1. **Acesso ao banco legado**: Credenciais do SQL Server
2. **Acesso ao Supabase**: Credenciais já configuradas no `.env.local`
3. **Node.js instalado**: Para executar os scripts

## 🔧 Instalação

### 1. Instalar Dependências

```bash
npm install mssql tsx
```

### 2. Configurar Credenciais

Crie o arquivo `scripts/migrate/config.ts` (baseado em `config.example.ts`):

```typescript
export const legacyDbConfig = {
  server: 'VPSKINGW0204', // Seu servidor SQL Server
  database: 'netmude3',
  user: 'sa',
  password: 'sua-senha-aqui',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};
```

**⚠️ IMPORTANTE**: Não commite o arquivo `config.ts` no Git!

## 📊 Estrutura de Migração

### Ordem Recomendada:

1. **Cidades** → Base para relacionamentos
2. **Empresas** → Dados principais
3. **Hotsites** → Detalhes expandidos
4. **Empresa Serviços** → Relacionamentos N:N
5. **Planos de Publicidade** → Relacionamentos

## 🚀 Como Executar

### Passo 1: Testar Conexão (Dry Run)

Sempre teste primeiro com `--dry-run` para ver o que será migrado:

```bash
# Testar migração de cidades
npx tsx scripts/migrate/01_migrate_cidades.ts --dry-run

# Testar migração de empresas
npx tsx scripts/migrate/02_migrate_empresas.ts --dry-run
```

### Passo 2: Executar Migração Real

Após verificar que está tudo correto:

```bash
# Migrar cidades
npx tsx scripts/migrate/01_migrate_cidades.ts

# Migrar empresas
npx tsx scripts/migrate/02_migrate_empresas.ts

# Migrar hotsites
npx tsx scripts/migrate/03_migrate_hotsites.ts
```

## 📝 Mapeamento de Campos

### Cidades (guiaCidade → cidades)

| Campo Legado | Campo Novo | Transformação |
|--------------|------------|---------------|
| `codCidade` | `id` | Gerar UUID novo |
| `nomCidade` | `nome` | Direto |
| - | `slug` | Gerar de `nome` |
| - | `estado` | Mapear manualmente ou extrair |
| - | `regiao` | Mapear por estado |

### Empresas (guiaEmpresa → empresas)

| Campo Legado | Campo Novo | Transformação |
|--------------|------------|---------------|
| `codEmpresa` | `id` | Gerar UUID novo |
| `nomEmpresa` | `nome` | Direto |
| `CNPJ` | `cnpj` | Direto |
| `Responsavel` | `responsavel` | Direto |
| `telefone` | `telefones` | Converter para array |
| `Email` | `email` | Direto |
| `Endereco` | `endereco` | Direto |
| `codCidade` | `cidade_id` | Buscar UUID da cidade migrada |

### Hotsites (guiaHotsite → hotsites)

| Campo Legado | Campo Novo | Transformação |
|--------------|------------|---------------|
| `hotServico1-10` | `servicos` | Converter para array JSONB |
| `hotDesconto1-3` | `descontos` | Converter para array JSONB |
| `hotFormaPagto1-5` | `formas_pagamento` | Converter para array JSONB |

## 🔍 Validações e Tratamentos

### 1. Geração de Slugs

Os scripts geram slugs automaticamente:
- Remove acentos
- Converte para minúsculas
- Substitui espaços por hífens
- Remove caracteres especiais

### 2. Conversão de Telefones

Telefones no formato legado (string separada por vírgula) são convertidos para array:
```
"11 98765-4321, 11 3456-7890" → ["11 98765-4321", "11 3456-7890"]
```

### 3. Mapeamento de Planos

Planos legados são mapeados para o novo formato:
- `TOP` → `top`
- `QUALITY` → `quality`
- `STANDARD` → `standard`
- `INTERMEDIARIO` → `intermediario`

### 4. Mapeamento de Tipos de Serviço

Tipos legados são mapeados:
- `MUDANÇA` → `mudanca`
- `CARRETO` → `carreto`
- `GUARDA-MÓVEIS` → `guardamoveis`

## ⚠️ Pontos de Atenção

### 1. Relacionamentos

- **Cidades devem ser migradas primeiro** (empresas dependem delas)
- **Empresas devem ser migradas antes de hotsites**
- IDs legados não são preservados (geram novos UUIDs)

### 2. Duplicatas

Os scripts verificam duplicatas por slug antes de inserir. Se uma empresa já existe, será ignorada.

### 3. Dados Faltantes

- Campos opcionais podem ser NULL
- Relacionamentos quebrados serão reportados como erro

## 📊 Logs e Monitoramento

Os scripts geram logs detalhados:
- ✅ Sucesso: Registros migrados
- ⏭️ Ignorados: Registros que já existem
- ❌ Erros: Problemas durante migração

## 🆘 Troubleshooting

### Erro: "Cannot connect to SQL Server"
- Verifique credenciais em `config.ts`
- Verifique firewall/rede
- Verifique se o servidor permite conexões externas

### Erro: "Cidade não encontrada"
- Execute primeiro a migração de cidades
- Verifique se o nome da cidade está correto

### Erro: "Empresa já existe"
- Normal se executar o script múltiplas vezes
- Use `--dry-run` para verificar antes

## 📝 Próximos Passos Após Migração

1. ✅ Validar dados migrados
2. ✅ Verificar relacionamentos
3. ✅ Testar queries no código
4. ✅ Ajustar dados manualmente se necessário

---

**Última atualização**: 2024-11-20

