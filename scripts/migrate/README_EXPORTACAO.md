# 📤 Exportação do SQL Server (Sem Acesso Externo)

## 🎯 Solução: Exportar Dados do SQL Server e Importar via CSV

Como você não tem acesso externo ao SQL Server, vamos exportar os dados para arquivos CSV e depois importar no Supabase.

## 📋 Passo a Passo

### Passo 1: Criar Pasta para Arquivos Exportados

```bash
mkdir data
```

### Passo 2: Exportar Cidades do SQL Server

1. **Abra SQL Server Management Studio (SSMS)**
2. **Conecte ao banco `netmude3`**
3. **Abra o arquivo**: `scripts/migrate/sql/01_export_cidades_SIMPLES.sql` ⭐ (versão simplificada)
4. **No SSMS**: Menu `Query` → `Results To` → `Results to File` (ou Ctrl+Shift+F)
5. **Execute a query** (F5)
6. **Salve como**: `data/cidades_export.csv`

**Query para executar:**
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

### Passo 3: Exportar Empresas do SQL Server

1. **Abra o arquivo**: `scripts/migrate/sql/02_export_empresas_SIMPLES.sql` ⭐ (versão simplificada)
2. **No SSMS**: `Query` → `Results To` → `Results to File` (ou Ctrl+Shift+F)
3. **Execute a query** (F5)
4. **Salve como**: `data/empresas_export.csv`

**Query para executar:**
```sql
SELECT 
    e.codEmpresa as id_legado,
    e.nomEmpresa as nome,
    e.CNPJ as cnpj,
    e.Responsavel as responsavel,
    e.Email as email,
    e.telefone,
    NULL as telefone2,
    NULL as telefone3,
    NULL as website,
    e.Endereco as endereco,
    e.Complemento as complemento,
    e.codCidade as cidade_id_legado,
    c.nomCidade as cidade_nome,
    NULL as estado,
    NULL as descricao,
    CASE WHEN e.ativo = 1 THEN 1 ELSE 0 END as ativo
FROM guiaEmpresa e
LEFT JOIN guiaCidade c ON e.codCidade = c.codCidade
ORDER BY e.nomEmpresa;
```

### Passo 4: Exportar Hotsites do SQL Server

1. **Abra o arquivo**: `scripts/migrate/sql/03_export_hotsites_SIMPLES.sql` ⭐ (versão simplificada)
2. **No SSMS**: `Query` → `Results To` → `Results to File` (ou Ctrl+Shift+F)
3. **Execute a query** (F5)
4. **Salve como**: `data/hotsites_export.csv`

**Query para executar:**
```sql
SELECT 
    h.codHotsite as id_legado,
    h.codEmpresa as empresa_id_legado,
    h.hotEmpresa as nome_exibicao,
    h.hotEndereco as endereco,
    h.hotCidade as cidade_nome,
    h.hotEstado as estado,
    h.hotDescricao as descricao,
    h.hotLogotipo as logo_url,
    h.hotFoto1 as foto1_url,
    h.hotFoto2 as foto2_url,
    h.hotFoto3 as foto3_url,
    h.hotServico1, h.hotServico2, h.hotServico3, h.hotServico4, h.hotServico5,
    h.hotServico6, h.hotServico7, h.hotServico8, h.hotServico9, h.hotServico10,
    h.hotDesconto1, h.hotDesconto2, h.hotDesconto3,
    h.hotFormaPagto1, h.hotFormaPagto2, h.hotFormaPagto3, h.hotFormaPagto4, h.hotFormaPagto5
FROM guiaHotsite h
WHERE h.hotCidade IS NOT NULL
ORDER BY h.codEmpresa, h.hotCidade;
```

### Passo 5: Exportar Campanhas do SQL Server

**IMPORTANTE**: Campanhas controlam empresas ativas/inativas, vencimentos, valores e planos de publicidade.

1. **Abra o arquivo**: `scripts/migrate/sql/04_export_campanhas_SIMPLES.sql` ⭐ (versão simplificada)
2. **No SSMS**: `Query` → `Results To` → `Results to File` (ou Ctrl+Shift+F)
3. **Execute a query** (F5)
4. **Salve como**: `data/campanhas_export.csv`

**Query para executar:**
```sql
SELECT 
    c.codCampanha as id_legado,
    c.codEmpresa as empresa_id_legado,
    c.codPublicidade as plano_id_legado,
    p.desPublicidade as plano_nome,
    c.datainicio as data_inicio,
    c.datafim as data_fim,
    c.valortotal as valor_total,
    c.datacobranca as data_cobranca,
    e.codCidade as cidade_id_legado,
    ci.nomCidade as cidade_nome,
    h.codHotsite as hotsite_id_legado,
    h.hotCidade as hotsite_cidade_nome
FROM guiaCampanha c
INNER JOIN guiaEmpresa e ON c.codEmpresa = e.codEmpresa
LEFT JOIN guiaCidade ci ON e.codCidade = ci.codCidade
LEFT JOIN guiaPublicidade p ON c.codPublicidade = p.codPublicidade
LEFT JOIN guiaHotsite h ON e.codEmpresa = h.codEmpresa
ORDER BY c.codEmpresa, c.datainicio DESC;
```

## 📥 Passo 6: Importar no Supabase

Depois de exportar os arquivos CSV, importe na ordem:

### 5.1 Importar Cidades

```bash
# Testar primeiro
npx tsx scripts/migrate/import/01_import_cidades_csv.ts --dry-run

# Executar
npx tsx scripts/migrate/import/01_import_cidades_csv.ts
```

### 5.2 Importar Empresas

```bash
# Testar primeiro
npx tsx scripts/migrate/import/02_import_empresas_csv.ts --dry-run

# Executar
npx tsx scripts/migrate/import/02_import_empresas_csv.ts
```

### 5.3 Importar Hotsites

```bash
# Testar primeiro
npx tsx scripts/migrate/import/03_import_hotsites_csv.ts --dry-run

# Executar
npx tsx scripts/migrate/import/03_import_hotsites_csv.ts
```

### 5.4 Importar Campanhas

```bash
# Testar primeiro
npx tsx scripts/migrate/import/04_import_campanhas_csv.ts --dry-run

# Executar
npx tsx scripts/migrate/import/04_import_campanhas_csv.ts
```

## 📁 Estrutura de Arquivos

Após exportar, você deve ter:

```
data/
├── cidades_export.csv
├── empresas_export.csv
├── hotsites_export.csv
└── campanhas_export.csv
```

## ⚠️ Importante

1. **Ordem**: Sempre importe na seguinte ordem:
   - 1️⃣ Cidades
   - 2️⃣ Empresas
   - 3️⃣ Hotsites
   - 4️⃣ Campanhas (controla status ativo/inativo, vencimentos, valores)
2. **Formato CSV**: Use vírgula como separador
3. **Encoding**: Use UTF-8 para caracteres especiais
4. **Headers**: O arquivo CSV deve ter cabeçalhos na primeira linha
5. **Campanhas**: São essenciais para controlar quais empresas estão ativas/inativas no site

## 🔍 Verificar Importação

Após importar, verifique no Supabase:

```sql
-- Ver quantas cidades foram importadas
SELECT COUNT(*) FROM cidades;

-- Ver quantas empresas foram importadas
SELECT COUNT(*) FROM empresas;

-- Ver quantos hotsites foram importados
SELECT COUNT(*) FROM hotsites;

-- Verificar relacionamentos
SELECT 
  e.nome as empresa,
  c.nome as cidade_hotsite,
  h.nome_exibicao as hotsite
FROM empresas e
JOIN hotsites h ON h.empresa_id = e.id
JOIN cidades c ON h.cidade_id = c.id
LIMIT 10;

-- Verificar campanhas ativas
SELECT 
  e.nome as empresa,
  pp.nome as plano,
  c.data_inicio,
  c.data_fim,
  c.ativo,
  c.valor_total
FROM campanhas c
JOIN empresas e ON c.empresa_id = e.id
JOIN planos_publicidade pp ON c.plano_id = pp.id
WHERE c.ativo = true
ORDER BY c.data_fim DESC
LIMIT 10;
```

---

**Pronto!** Exporte os arquivos CSV do SQL Server e depois importe usando os scripts acima. 🚀

