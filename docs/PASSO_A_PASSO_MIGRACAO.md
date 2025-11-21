# 🚀 Passo a Passo - Configurar e Executar Migração

## ✅ Passo 1: Preencher Credenciais (FAZER AGORA)

Abra o arquivo `scripts/migrate/config.ts` e preencha com suas credenciais do SQL Server:

```typescript
export const legacyDbConfig = {
  server: 'VPSKINGW0204',        // ⬅️ Seu servidor SQL Server
  database: 'netmude3',          // ⬅️ Nome do banco (já está correto)
  user: 'sa',                     // ⬅️ Seu usuário
  password: 'SUA_SENHA_AQUI',     // ⬅️ ⚠️ SUBSTITUA PELA SUA SENHA REAL
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
- Substitua `SUA_SENHA_AQUI` pela senha real do banco
- O arquivo `config.ts` está no `.gitignore` (não será commitado)
- Se o servidor for diferente, ajuste o campo `server`

## ✅ Passo 2: Testar Conexão

Depois de preencher as credenciais, teste a conexão:

```bash
npx tsx scripts/migrate/01_migrate_cidades.ts --dry-run
```

**O que esperar:**
- ✅ Se conectar: Verá mensagens sobre cidades encontradas
- ❌ Se falhar: Verá erro de conexão (verifique credenciais)

## ✅ Passo 3: Executar Migração (na ordem)

### 3.1 Migrar Cidades

```bash
# Testar primeiro (não insere dados)
npx tsx scripts/migrate/01_migrate_cidades.ts --dry-run

# Se estiver tudo OK, executar de verdade
npx tsx scripts/migrate/01_migrate_cidades.ts
```

**O que acontece:**
- Busca todas as cidades do banco legado (`guiaCidade`)
- Gera slugs automaticamente
- Insere no Supabase
- Cria mapeamento de IDs legados → novos UUIDs

### 3.2 Migrar Empresas

```bash
# Testar primeiro
npx tsx scripts/migrate/02_migrate_empresas.ts --dry-run

# Executar
npx tsx scripts/migrate/02_migrate_empresas.ts
```

**O que acontece:**
- Busca todas as empresas do banco legado (`guiaEmpresa`)
- Converte telefones para array
- Vincula empresas às cidades migradas
- Migra serviços e planos de publicidade
- Cria mapeamento de IDs legados → novos UUIDs

### 3.3 Migrar Hotsites

```bash
# Testar primeiro
npx tsx scripts/migrate/03_migrate_hotsites.ts --dry-run

# Executar
npx tsx scripts/migrate/03_migrate_hotsites.ts
```

**O que acontece:**
- Busca todos os hotsites do banco legado (`guiaHotsite`)
- Identifica a cidade onde cada hotsite é exibido (`hotCidade`, `hotEstado`)
- Vincula hotsites às empresas E cidades migradas
- Converte serviços/descontos/pagamentos para arrays JSONB

## ✅ Passo 4: Verificar Migração

Após migrar, verifique no Supabase SQL Editor:

```sql
-- Ver quantas cidades foram migradas
SELECT COUNT(*) as total_cidades FROM cidades;

-- Ver quantas empresas foram migradas
SELECT COUNT(*) as total_empresas FROM empresas;

-- Ver quantos hotsites foram migrados
SELECT COUNT(*) as total_hotsites FROM hotsites;

-- Verificar relacionamentos empresa ↔ hotsite ↔ cidade
SELECT 
  e.nome as empresa,
  c.nome as cidade_hotsite,
  h.nome_exibicao as hotsite
FROM empresas e
JOIN hotsites h ON h.empresa_id = e.id
JOIN cidades c ON h.cidade_id = c.id
ORDER BY e.nome, c.nome
LIMIT 20;

-- Ver empresas com múltiplos hotsites
SELECT 
  e.nome as empresa,
  COUNT(h.id) as total_hotsites
FROM empresas e
LEFT JOIN hotsites h ON h.empresa_id = e.id
GROUP BY e.id, e.nome
HAVING COUNT(h.id) > 1
ORDER BY total_hotsites DESC;
```

## 📊 Exemplo de Saída Esperada

Ao executar a migração, você verá algo assim:

```
🚀 Iniciando migração de cidades...
📥 Buscando cidades do banco legado...
🔌 Conectando ao banco legado...
✅ Encontradas 150 cidades

✅ Migrada: São Paulo (sao-paulo)
✅ Migrada: Rio de Janeiro (rio-de-janeiro)
✅ Migrada: Belo Horizonte (belo-horizonte)
...

📊 Resumo da Migração:
   ✅ Sucesso: 150
   ⏭️  Ignoradas (já existem): 0
   ❌ Erros: 0
   📦 Total: 150
```

## 🆘 Problemas Comuns

### Erro: "Cannot connect to SQL Server"

**Solução:**
1. Verifique se as credenciais em `config.ts` estão corretas
2. Teste a conexão com SQL Server Management Studio primeiro
3. Verifique firewall/rede do servidor
4. Se necessário, ajuste `trustServerCertificate: false`

### Erro: "Cidade não encontrada"

**Solução:**
- Execute primeiro a migração de cidades
- Verifique se a tabela `migration_cidades_map` foi populada

### Erro: "Module not found: mssql"

**Solução:**
```bash
npm install mssql tsx @types/mssql --save-dev
```

## 📝 Checklist

- [ ] Preencher credenciais em `scripts/migrate/config.ts`
- [ ] Testar conexão com `--dry-run`
- [ ] Migrar cidades
- [ ] Migrar empresas
- [ ] Migrar hotsites
- [ ] Verificar dados no Supabase
- [ ] Testar páginas do site

---

**Pronto para começar!** Preencha o `config.ts` e execute os comandos acima. 🚀

