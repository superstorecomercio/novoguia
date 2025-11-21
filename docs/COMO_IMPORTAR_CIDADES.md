# 📥 Como Importar Cidades - Passo a Passo

## 🎯 Visão Geral

O processo de importação funciona em **2 etapas**:

1. **Exportar** do SQL Server → Salvar como CSV
2. **Importar** do CSV → Salvar automaticamente no Supabase

---

## 📤 ETAPA 1: Exportar do SQL Server

### Passo 1.1: Abrir SQL Server Management Studio (SSMS)

1. Abra o **SQL Server Management Studio**
2. Conecte ao banco `netmude3`

### Passo 1.2: Executar Query de Exportação

1. Abra o arquivo: `scripts/migrate/sql/01_export_cidades.sql`
2. **Copie e cole** a query abaixo no SSMS:

```sql
SELECT 
    codCidade as id_legado,
    nomCidade as nome,
    NULL as estado,
    NULL as descricao,
    NULL as regiao
FROM guiaCidade
ORDER BY nomCidade;
```

3. **Execute** a query (F5 ou botão Execute)

### Passo 1.3: Salvar Resultado como CSV

1. No SSMS, vá em: **Query** → **Results** → **Results to File**
2. Execute a query novamente (ou clique em **Execute** se já estiver configurado)
3. Uma janela de "Salvar como" vai abrir
4. **Navegue até a pasta**: `C:\Users\junior\newguia\guia-de-mudancas-next\data\`
5. **Nome do arquivo**: `cidades_export.csv`
6. **Salvar**

✅ **Resultado**: Você terá um arquivo `data/cidades_export.csv` com todas as cidades

---

## 📥 ETAPA 2: Importar para o Supabase

### Passo 2.1: Testar Importação (Dry Run)

Antes de importar de verdade, teste para ver o que será importado:

```bash
npx tsx scripts/migrate/import/01_import_cidades_csv.ts --dry-run
```

**O que acontece:**
- ✅ Lê o arquivo CSV
- ✅ Mostra o que SERIA importado
- ❌ **NÃO salva nada** no banco (é só um teste)

**Exemplo de saída:**
```
🚀 Iniciando importação de cidades do CSV...
📁 Arquivo: data/cidades_export.csv
⚠️  MODO DRY RUN - Nenhum dado será inserido

📥 Lendo arquivo CSV...
✅ Encontradas 150 cidades no CSV

[DRY RUN] Criaria cidade: São Paulo (sao-paulo)
[DRY RUN] Criaria cidade: Rio de Janeiro (rio-de-janeiro)
...

📊 Resumo da Importação:
   ✅ Sucesso: 150
   ⏭️  Ignoradas (já existem): 0
   ❌ Erros: 0
   📦 Total: 150
```

### Passo 2.2: Executar Importação Real

Se o teste estiver OK, execute a importação real:

```bash
npx tsx scripts/migrate/import/01_import_cidades_csv.ts
```

**O que acontece:**
- ✅ Lê o arquivo CSV
- ✅ **Salva cada cidade** na tabela `cidades` do Supabase
- ✅ **Cria mapeamento** de IDs legados → novos UUIDs na tabela `migration_cidades_map`
- ✅ Gera **slug** automaticamente (ex: "São Paulo" → "sao-paulo")

**Exemplo de saída:**
```
🚀 Iniciando importação de cidades do CSV...
📁 Arquivo: data/cidades_export.csv

📥 Lendo arquivo CSV...
✅ Encontradas 150 cidades no CSV

✅ Migrada: São Paulo (sao-paulo)
✅ Migrada: Rio de Janeiro (rio-de-janeiro)
✅ Migrada: Belo Horizonte (belo-horizonte)
...

📊 Resumo da Importação:
   ✅ Sucesso: 148
   ⏭️  Ignoradas (já existem): 2
   ❌ Erros: 0
   📦 Total: 150
```

---

## 💾 Onde os Dados São Salvos?

### 1. Tabela `cidades` (Supabase)

Cada cidade é salva automaticamente com:

```sql
INSERT INTO cidades (
  id,              -- UUID gerado automaticamente
  nome,            -- Nome da cidade (ex: "São Paulo")
  slug,            -- Slug gerado (ex: "sao-paulo")
  estado,          -- NULL (pode preencher depois)
  descricao,       -- NULL
  regiao,          -- NULL
  created_at       -- Data/hora atual
)
```

### 2. Tabela `migration_cidades_map` (Supabase)

O script **automaticamente** salva um mapeamento:

```sql
INSERT INTO migration_cidades_map (
  id_legado,       -- ID antigo do SQL Server (ex: 123)
  id_novo,         -- Novo UUID do Supabase (ex: "a1b2c3d4-...")
  nome             -- Nome da cidade (ex: "São Paulo")
)
```

**Por que isso é importante?**
- Quando importar empresas depois, o script vai usar esse mapeamento para vincular empresas às cidades corretas
- Você não precisa fazer nada manualmente!

---

## 🔍 Verificar se Funcionou

### No Supabase SQL Editor:

```sql
-- Ver quantas cidades foram importadas
SELECT COUNT(*) as total_cidades FROM cidades;

-- Ver algumas cidades importadas
SELECT nome, slug, estado, created_at 
FROM cidades 
ORDER BY nome 
LIMIT 10;

-- Ver o mapeamento de IDs
SELECT id_legado, id_novo, nome 
FROM migration_cidades_map 
LIMIT 10;
```

---

## ⚠️ Problemas Comuns

### Erro: "Arquivo não encontrado"

**Solução:**
- Verifique se o arquivo está em `data/cidades_export.csv`
- O caminho completo deve ser: `C:\Users\junior\newguia\guia-de-mudancas-next\data\cidades_export.csv`

### Erro: "Missing Supabase environment variables"

**Solução:**
- Verifique se o arquivo `.env.local` existe na raiz do projeto
- Verifique se contém `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Cidade já existe

**O que acontece:**
- Se uma cidade com o mesmo slug já existe, ela é **ignorada** (não duplica)
- O mapeamento é salvo mesmo assim (para vincular empresas depois)

---

## ✅ Próximos Passos

Depois de importar cidades com sucesso:

1. ✅ **Cidades importadas** → Pronto!
2. ⏭️ **Próximo**: Importar Empresas (`02_import_empresas_csv.ts`)
3. ⏭️ **Depois**: Importar Hotsites (`03_import_hotsites_csv.ts`)
4. ⏭️ **Por último**: Importar Campanhas (`04_import_campanhas_csv.ts`)

---

**Resumo**: Você só precisa exportar o CSV do SQL Server e executar o script. O script salva tudo automaticamente no Supabase! 🚀

