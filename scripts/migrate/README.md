# Scripts de Migração de Dados

Scripts para migrar dados do banco legado (SQL Server) para o Supabase (PostgreSQL).

## 📋 Pré-requisitos

1. **Conexão com banco legado**: Você precisa ter acesso ao banco legado
2. **Dependências**: Instalar pacotes necessários

```bash
npm install mssql  # Para SQL Server
# ou
npm install pg     # Para PostgreSQL legado
```

3. **Variáveis de ambiente**: Configurar `.env.local` com credenciais do Supabase

## 🚀 Como Usar

### 1. Migrar Cidades

```bash
# Modo dry-run (não insere dados, apenas mostra o que faria)
npx tsx scripts/migrate/01_migrate_cidades.ts --dry-run

# Migração real
npx tsx scripts/migrate/01_migrate_cidades.ts
```

### 2. Migrar Empresas

```bash
# Modo dry-run
npx tsx scripts/migrate/02_migrate_empresas.ts --dry-run

# Migração real
npx tsx scripts/migrate/02_migrate_empresas.ts
```

## ⚙️ Configuração

### Passo 1: Configurar Conexão com Banco Legado

Edite os arquivos de migração e configure a função `fetchLegacyCities()` ou `fetchLegacyEmpresas()`:

```typescript
async function fetchLegacyCities(): Promise<LegacyCity[]> {
  const sql = require('mssql');
  const config = {
    server: 'seu-servidor-sql-server',
    database: 'seu-banco-legado',
    user: 'seu-usuario',
    password: 'sua-senha',
    options: {
      encrypt: true, // Use se necessário
      trustServerCertificate: true, // Use se necessário
    },
  };
  
  await sql.connect(config);
  const result = await sql.query`
    SELECT id, nome, estado, descricao, regiao
    FROM cidades
    ORDER BY nome
  `;
  
  await sql.close();
  return result.recordset;
}
```

### Passo 2: Ajustar Mapeamento de Campos

Verifique se os nomes das colunas no banco legado correspondem aos esperados. Ajuste conforme necessário.

### Passo 3: Testar com Dry-Run

Sempre teste primeiro com `--dry-run` para ver o que será migrado sem inserir dados.

## 📊 Estrutura de Migração

### Cidades
- ✅ Mapeamento direto
- ✅ Geração automática de slugs
- ✅ Validação de duplicatas

### Empresas
- ✅ Mapeamento de campos básicos
- ✅ Conversão de telefones (string → array)
- ✅ Geração automática de slugs
- ✅ Migração de serviços (N:N)
- ✅ Migração de planos de publicidade

## 🔍 Validações

Os scripts fazem validações automáticas:
- ✅ Verifica se registro já existe (evita duplicatas)
- ✅ Valida relacionamentos (ex: cidade existe)
- ✅ Trata campos opcionais
- ✅ Gera logs detalhados

## 📝 Logs

Os scripts geram logs detalhados:
- ✅ Sucesso: Registros migrados
- ⏭️ Ignorados: Registros que já existem
- ❌ Erros: Problemas durante migração

## 🆘 Troubleshooting

### Erro: "Cidade não encontrada"
- Verifique se as cidades foram migradas primeiro
- Verifique se o nome da cidade está correto

### Erro: "Empresa já existe"
- Normal se executar o script múltiplas vezes
- Use `--dry-run` para verificar antes

### Erro de conexão com banco legado
- Verifique credenciais
- Verifique firewall/rede
- Verifique se o servidor permite conexões externas

---

**Última atualização**: 2024-11-20

