# Quick Start - Migração de Dados

## 🚀 Passo a Passo Rápido

### 1. Instalar Dependências

```bash
npm install mssql tsx
```

### 2. Criar Arquivo de Configuração

Copie `scripts/migrate/config.example.ts` para `scripts/migrate/config.ts`:

```bash
cp scripts/migrate/config.example.ts scripts/migrate/config.ts
```

Edite `scripts/migrate/config.ts` com suas credenciais do SQL Server:

```typescript
export const legacyDbConfig = {
  server: 'VPSKINGW0204',
  database: 'netmude3',
  user: 'sa',
  password: 'sua-senha-aqui',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};
```

### 3. Criar Tabelas de Mapeamento

Execute no Supabase SQL Editor:

```sql
-- Copie e execute o conteúdo de scripts/migrate/00_setup_mapping_table.sql
```

Isso cria tabelas para mapear IDs legados → novos UUIDs.

### 4. Testar Migração (Dry Run)

```bash
# Testar migração de cidades
npx tsx scripts/migrate/01_migrate_cidades.ts --dry-run

# Testar migração de empresas
npx tsx scripts/migrate/02_migrate_empresas.ts --dry-run
```

### 5. Executar Migração Real

```bash
# Migrar cidades primeiro
npx tsx scripts/migrate/01_migrate_cidades.ts

# Depois migrar empresas
npx tsx scripts/migrate/02_migrate_empresas.ts

# Por último, migrar hotsites
npx tsx scripts/migrate/03_migrate_hotsites.ts
```

## ⚠️ Importante

1. **Ordem**: Sempre migre cidades antes de empresas
2. **Dry Run**: Sempre teste primeiro com `--dry-run`
3. **Backup**: Faça backup do banco antes de migrar
4. **Validação**: Verifique os dados após migração

## 🔍 Verificar Migração

Após migrar, verifique no Supabase:

```sql
-- Ver quantas cidades foram migradas
SELECT COUNT(*) FROM cidades;

-- Ver quantas empresas foram migradas
SELECT COUNT(*) FROM empresas;

-- Ver mapeamentos salvos
SELECT COUNT(*) FROM migration_cidades_map;
SELECT COUNT(*) FROM migration_empresas_map;
```

---

**Última atualização**: 2024-11-20

