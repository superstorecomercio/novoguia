# 📤 Passo a Passo: Exportar CSV do SQL Server

## 🎯 Solução Rápida

### 1. Use o arquivo simplificado

Abra o arquivo: **`scripts/migrate/sql/01_export_cidades_SIMPLES.sql`**

Ele contém **APENAS UMA QUERY** (sem as outras opções).

---

## 📋 Passo a Passo Detalhado

### Passo 1: Abrir SSMS e Conectar

1. Abra **SQL Server Management Studio**
2. Conecte ao servidor onde está o banco `netmude3`
3. Selecione o banco `netmude3` no dropdown

### Passo 2: Abrir Query Simplificada

1. Abra uma **nova query** (Ctrl+N)
2. Abra o arquivo: `scripts/migrate/sql/01_export_cidades_SIMPLES.sql`
3. Ou **cole esta query**:

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

### Passo 3: Configurar para Salvar em Arquivo

**IMPORTANTE**: Configure ANTES de executar!

1. No menu do SSMS, clique em: **Query** → **Results To** → **Results to File**
   - Ou use o **atalho**: **Ctrl+Shift+F**
   
2. Você verá uma mensagem no rodapé: **"Results will be saved to file"**

### Passo 4: Executar Query

1. **Execute a query** (F5 ou botão Execute)
2. Uma janela **"Salvar como"** vai abrir automaticamente

### Passo 5: Salvar o Arquivo

1. **Navegue até**: `C:\Users\junior\newguia\guia-de-mudancas-next\data\`
   - Se a pasta `data` não existir, crie ela primeiro!

2. **Nome do arquivo**: `cidades_export.csv`

3. **Tipo**: Deixe como está ou selecione "CSV (Comma delimited) (*.csv)"

4. **Clique em "Salvar"**

✅ **Pronto!** O arquivo será salvo.

---

## 🔍 Verificar se Funcionou

1. Abra o Windows Explorer
2. Vá até: `C:\Users\junior\newguia\guia-de-mudancas-next\data\`
3. Verifique se existe o arquivo `cidades_export.csv`
4. Abra o arquivo (pode ser no Notepad ou Excel)
5. Deve ter este formato:

```csv
id_legado,nome,estado,descricao,regiao
1,São Paulo,NULL,NULL,NULL
2,Rio de Janeiro,NULL,NULL,NULL
```

---

## ⚠️ Se Não Encontrar "Results to File"

### Alternativa 1: Usar Atalho

- Pressione **Ctrl+Shift+F** diretamente

### Alternativa 2: Copiar e Colar Manualmente

1. Execute a query normalmente (F5)
2. **Clique com botão direito** na grade de resultados
3. **Selecione**: "Copy" ou "Copy with Headers"
4. Abra o **Excel** ou **Notepad++**
5. **Cole** (Ctrl+V)
6. **Salve como CSV**:
   - Excel: File → Save As → Tipo: CSV
   - Notepad++: File → Save As → Nome: `cidades_export.csv`

---

## ✅ Próximo Passo

Depois de salvar o CSV, teste a importação:

```bash
npx tsx scripts/migrate/import/01_import_cidades_csv.ts --dry-run
```

Isso vai mostrar o que será importado, sem salvar nada ainda.

