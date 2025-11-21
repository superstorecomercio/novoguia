# 🔧 Configurar Migração de Dados

## Passo 1: Instalar Dependências

Execute no terminal:

```bash
npm install mssql tsx
```

Isso instala:
- `mssql` - Cliente para conectar ao SQL Server legado
- `tsx` - Executor TypeScript (para rodar os scripts .ts diretamente)

## Passo 2: Criar Arquivo de Configuração

### 2.1 Copiar arquivo de exemplo

```bash
# No PowerShell
Copy-Item scripts\migrate\config.example.ts scripts\migrate\config.ts

# Ou no Git Bash/Linux
cp scripts/migrate/config.example.ts scripts/migrate/config.ts
```

### 2.2 Editar com suas credenciais

Abra o arquivo `scripts/migrate/config.ts` e preencha:

```typescript
export const legacyDbConfig = {
  server: 'VPSKINGW0204',        // Seu servidor SQL Server
  database: 'netmude3',          // Nome do banco legado
  user: 'sa',                    // Seu usuário
  password: 'sua-senha-aqui',    // ⚠️ SUA SENHA REAL
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};
```

**⚠️ IMPORTANTE:**
- O arquivo `config.ts` está no `.gitignore` (não será commitado)
- Use suas credenciais reais do banco legado
- Se o servidor for remoto, verifique firewall/rede

## Passo 3: Testar Conexão

Crie um script de teste rápido:

```bash
# Criar arquivo de teste
npx tsx -e "
const sql = require('mssql');
const config = require('./scripts/migrate/config.ts').legacyDbConfig;

async function test() {
  try {
    await sql.connect(config);
    console.log('✅ Conexão OK!');
    const result = await sql.query\`SELECT COUNT(*) as total FROM guiaCidade\`;
    console.log(\`Total de cidades: \${result.recordset[0].total}\`);
    await sql.close();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
test();
"
```

Ou teste diretamente com um dos scripts:

```bash
# Testar migração de cidades (dry-run)
npx tsx scripts/migrate/01_migrate_cidades.ts --dry-run
```

## Passo 4: Executar Migração (na ordem)

### Ordem Obrigatória:

1. **Cidades** (base para relacionamentos)
2. **Empresas** (depende de cidades)
3. **Hotsites** (depende de empresas E cidades)

### Comandos:

```bash
# 1. Migrar Cidades
npx tsx scripts/migrate/01_migrate_cidades.ts --dry-run    # Testar primeiro
npx tsx scripts/migrate/01_migrate_cidades.ts               # Executar

# 2. Migrar Empresas
npx tsx scripts/migrate/02_migrate_empresas.ts --dry-run    # Testar primeiro
npx tsx scripts/migrate/02_migrate_empresas.ts              # Executar

# 3. Migrar Hotsites
npx tsx scripts/migrate/03_migrate_hotsites.ts --dry-run    # Testar primeiro
npx tsx scripts/migrate/03_migrate_hotsites.ts              # Executar
```

## Passo 5: Verificar Migração

Após migrar, verifique no Supabase:

```sql
-- Ver quantas cidades foram migradas
SELECT COUNT(*) FROM cidades;

-- Ver quantas empresas foram migradas
SELECT COUNT(*) FROM empresas;

-- Ver quantos hotsites foram migrados
SELECT COUNT(*) FROM hotsites;

-- Ver mapeamentos salvos
SELECT COUNT(*) FROM migration_cidades_map;
SELECT COUNT(*) FROM migration_empresas_map;

-- Verificar relacionamentos empresa ↔ hotsite ↔ cidade
SELECT 
  e.nome as empresa,
  c.nome as cidade,
  h.nome_exibicao as hotsite
FROM empresas e
JOIN hotsites h ON h.empresa_id = e.id
JOIN cidades c ON h.cidade_id = c.id
LIMIT 10;
```

## 🆘 Troubleshooting

### Erro: "Cannot connect to SQL Server"

**Possíveis causas:**
1. Credenciais incorretas
2. Servidor não acessível (firewall/rede)
3. SQL Server não permite conexões remotas

**Soluções:**
- Verifique credenciais em `config.ts`
- Teste conexão com SQL Server Management Studio primeiro
- Verifique firewall do servidor
- Se necessário, ajuste `trustServerCertificate: false`

### Erro: "Cidade não encontrada"

- Execute primeiro a migração de cidades
- Verifique se os nomes das cidades estão corretos
- Verifique se a tabela `migration_cidades_map` foi populada

### Erro: "Empresa já existe"

- Normal se executar o script múltiplas vezes
- O script ignora duplicatas automaticamente
- Use `--dry-run` para verificar antes

## 📝 Próximos Passos Após Migração

1. ✅ Validar dados migrados
2. ✅ Verificar relacionamentos empresa ↔ cidade ↔ hotsite
3. ✅ Testar queries no código
4. ✅ Ajustar dados manualmente se necessário

---

**Última atualização**: 2024-11-20

