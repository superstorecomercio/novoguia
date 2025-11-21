# 💾 Como Salvar Resultados como CSV no SQL Server Management Studio

## 🎯 Método 1: Results to File (Recomendado)

### Passo 1: Configurar para Salvar em Arquivo

1. **Abra o SQL Server Management Studio (SSMS)**
2. **Conecte ao banco** `netmude3`
3. **Abra uma nova query** (Ctrl+N ou File → New → Query with Current Connection)
4. **Cole a query** abaixo:

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

### Passo 2: Configurar para Salvar Resultado

1. **No menu do SSMS**, clique em: **Query** → **Results To** → **Results to File**
   - Ou use o atalho: **Ctrl+Shift+F**

2. **Execute a query** (F5 ou botão Execute)

3. **Uma janela "Salvar como" vai abrir automaticamente**

### Passo 3: Salvar o Arquivo

1. **Navegue até a pasta**: `C:\Users\junior\newguia\guia-de-mudancas-next\data\`
   - Se a pasta `data` não existir, crie ela primeiro

2. **Nome do arquivo**: `cidades_export.csv`

3. **Tipo de arquivo**: Deixe como "All Files (*.*)" ou selecione "CSV"

4. **Clique em "Salvar"**

✅ **Pronto!** O arquivo será salvo como CSV.

---

## 🎯 Método 2: Copiar e Colar Manualmente

Se o método acima não funcionar:

### Passo 1: Executar Query

1. Execute a query normalmente (F5)
2. Os resultados aparecerão na aba "Results"

### Passo 2: Copiar Resultados

1. **Clique com o botão direito** na grade de resultados
2. **Selecione**: "Copy" ou "Copy with Headers"
3. Ou selecione todas as linhas (Ctrl+A) e copie (Ctrl+C)

### Passo 3: Colar no Excel/Notepad++

1. **Abra o Excel** ou **Notepad++**
2. **Cole** os dados (Ctrl+V)
3. **Salve como CSV**:
   - Excel: File → Save As → Tipo: CSV (Comma delimited) (*.csv)
   - Notepad++: File → Save As → Nome: `cidades_export.csv`

### Passo 4: Verificar Formato

O arquivo CSV deve ter este formato:

```csv
id_legado,nome,estado,descricao,regiao
1,São Paulo,NULL,NULL,NULL
2,Rio de Janeiro,NULL,NULL,NULL
3,Belo Horizonte,NULL,NULL,NULL
```

---

## 🎯 Método 3: Usar bcp (Command Line)

Se você tem acesso ao prompt de comando do SQL Server:

```cmd
bcp "SELECT codCidade as id_legado, nomCidade as nome, NULL as estado, NULL as descricao, NULL as regiao FROM guiaCidade ORDER BY nomCidade" queryout "C:\Users\junior\newguia\guia-de-mudancas-next\data\cidades_export.csv" -c -t, -S SEU_SERVIDOR -d netmude3 -T
```

---

## ⚠️ Problemas Comuns

### Problema: "Results to File" não aparece no menu

**Solução:**
- Use o atalho: **Ctrl+Shift+F**
- Ou vá em: **Query** → **Query Options** → **Results** → **Grid** → Marque "Include column headers when copying or saving the results"

### Problema: Arquivo salvo sem cabeçalhos (headers)

**Solução:**
- No SSMS: **Tools** → **Options** → **Query Results** → **SQL Server** → **Results to Grid**
- Marque: **"Include column headers when copying or saving the results"**

### Problema: Arquivo salvo com formatação estranha

**Solução:**
- Verifique se salvou como `.csv` e não `.txt`
- Abra o arquivo no Notepad++ para verificar se está separado por vírgulas

### Problema: Múltiplos resultados aparecem

**Solução:**
- Use o arquivo `01_export_cidades_SIMPLES.sql` que contém apenas uma query
- Ou execute apenas a primeira query (a que começa com `SELECT codCidade...`)

---

## ✅ Verificar se o CSV Está Correto

Abra o arquivo `data/cidades_export.csv` e verifique se tem este formato:

```csv
id_legado,nome,estado,descricao,regiao
1,São Paulo,NULL,NULL,NULL
2,Rio de Janeiro,NULL,NULL,NULL
```

**Importante:**
- ✅ Primeira linha deve ter os cabeçalhos (headers)
- ✅ Cada linha deve ter valores separados por vírgula
- ✅ Pode ter valores `NULL` (isso é normal)

---

## 🚀 Próximo Passo

Depois de salvar o CSV, execute:

```bash
npx tsx scripts/migrate/import/01_import_cidades_csv.ts --dry-run
```

Isso vai testar a importação sem salvar nada no banco.

