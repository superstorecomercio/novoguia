# 🚀 Próximos Passos - Importação dos Dados

## ✅ O que você já fez

- [x] Exportou os arquivos CSV do SQL Server
- [x] Tem os arquivos prontos para importar

## 📁 Onde Salvar os Arquivos CSV

Salve todos os arquivos CSV na pasta `data/` na raiz do projeto:

```
guia-de-mudancas-next/
├── data/
│   ├── cidades_export.csv          ⬅️ Salve aqui
│   ├── empresas_export.csv         ⬅️ Salve aqui
│   ├── hotsites_export.csv         ⬅️ Salve aqui
│   └── campanhas_export.csv        ⬅️ Salve aqui
```

**Caminho completo**: `C:\Users\junior\newguia\guia-de-mudancas-next\data\`

---

## 📋 Ordem de Importação (IMPORTANTE!)

**SEMPRE importe nesta ordem:**

1. ✅ **Cidades** (base para tudo)
2. ✅ **Empresas** (depende de cidades)
3. ✅ **Hotsites** (depende de empresas e cidades)
4. ✅ **Campanhas** (depende de empresas e planos)

---

## 🔍 Passo 1: Verificar Arquivos CSV

Antes de importar, verifique se os arquivos estão no lugar certo:

```bash
# No terminal, na raiz do projeto:
dir data
```

Você deve ver:
- `cidades_export.csv`
- `empresas_export.csv`
- `hotsites_export.csv`
- `campanhas_export.csv`

---

## 🧪 Passo 2: Testar Importação (Dry Run)

Antes de importar de verdade, teste cada importação para ver o que será importado:

### 2.1 Testar Cidades

```bash
npx tsx scripts/migrate/import/01_import_cidades_csv.ts --dry-run
```

**O que acontece:**
- ✅ Lê o arquivo CSV
- ✅ Mostra o que SERIA importado
- ❌ **NÃO salva nada** no banco (é só um teste)

**Se der erro:**
- Verifique se o arquivo `data/cidades_export.csv` existe
- Verifique se o arquivo tem cabeçalhos na primeira linha

### 2.2 Testar Empresas

```bash
npx tsx scripts/migrate/import/02_import_empresas_csv.ts --dry-run
```

### 2.3 Testar Hotsites

```bash
npx tsx scripts/migrate/import/03_import_hotsites_csv.ts --dry-run
```

### 2.4 Testar Campanhas

```bash
npx tsx scripts/migrate/import/04_import_campanhas_csv.ts --dry-run
```

---

## ✅ Passo 3: Executar Importação Real

Depois de testar e verificar que está tudo OK, execute a importação real:

### 3.1 Importar Cidades

```bash
npx tsx scripts/migrate/import/01_import_cidades_csv.ts
```

**O que acontece:**
- ✅ Lê o arquivo CSV
- ✅ **Salva cada cidade** na tabela `cidades` do Supabase
- ✅ **Cria mapeamento** de IDs legados → novos UUIDs
- ✅ Gera **slug** automaticamente

**Exemplo de saída:**
```
🚀 Iniciando importação de cidades do CSV...
📁 Arquivo: data/cidades_export.csv

📥 Lendo arquivo CSV...
✅ Encontradas 150 cidades no CSV

✅ Migrada: São Paulo (sao-paulo)
✅ Migrada: Rio de Janeiro (rio-de-janeiro)
...

📊 Resumo da Importação:
   ✅ Sucesso: 148
   ⏭️  Ignoradas (já existem): 2
   ❌ Erros: 0
   📦 Total: 150
```

### 3.2 Importar Empresas

**⚠️ IMPORTANTE**: Só execute depois de importar cidades!

```bash
npx tsx scripts/migrate/import/02_import_empresas_csv.ts
```

### 3.3 Importar Hotsites

**⚠️ IMPORTANTE**: Só execute depois de importar empresas e cidades!

```bash
npx tsx scripts/migrate/import/03_import_hotsites_csv.ts
```

### 3.4 Importar Campanhas

**⚠️ IMPORTANTE**: Só execute depois de importar empresas!

```bash
npx tsx scripts/migrate/import/04_import_campanhas_csv.ts
```

---

## 🔍 Passo 4: Verificar Importação no Supabase

Depois de importar tudo, verifique no Supabase SQL Editor:

```sql
-- Ver quantas cidades foram importadas
SELECT COUNT(*) as total_cidades FROM cidades;

-- Ver quantas empresas foram importadas
SELECT COUNT(*) as total_empresas FROM empresas;

-- Ver quantos hotsites foram importados
SELECT COUNT(*) as total_hotsites FROM hotsites;

-- Ver quantas campanhas foram importadas
SELECT COUNT(*) as total_campanhas FROM campanhas;

-- Verificar relacionamentos (exemplo)
SELECT 
  e.nome as empresa,
  c.nome as cidade,
  h.nome_exibicao as hotsite
FROM empresas e
JOIN hotsites h ON h.empresa_id = e.id
JOIN cidades c ON h.cidade_id = c.id
LIMIT 10;

-- Verificar campanhas ativas
SELECT 
  e.nome as empresa,
  pp.nome as plano,
  camp.data_inicio,
  camp.data_fim,
  camp.ativo
FROM campanhas camp
JOIN empresas e ON camp.empresa_id = e.id
JOIN planos_publicidade pp ON camp.plano_id = pp.id
WHERE camp.ativo = true
LIMIT 10;
```

---

## ⚠️ Problemas Comuns

### Erro: "Arquivo não encontrado"

**Solução:**
- Verifique se o arquivo está em `data/nome_do_arquivo.csv`
- O caminho completo deve ser: `C:\Users\junior\newguia\guia-de-mudancas-next\data\cidades_export.csv`

### Erro: "Missing Supabase environment variables"

**Solução:**
- Verifique se o arquivo `.env.local` existe na raiz do projeto
- Verifique se contém:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key
  ```

### Erro: "Cidade não encontrada" ao importar empresas

**Solução:**
- Você precisa importar **cidades primeiro** antes de empresas
- Execute: `npx tsx scripts/migrate/import/01_import_cidades_csv.ts`

### Erro: "Empresa não encontrada" ao importar hotsites

**Solução:**
- Você precisa importar **empresas primeiro** antes de hotsites
- Execute: `npx tsx scripts/migrate/import/02_import_empresas_csv.ts`

---

## 📊 Checklist de Importação

- [ ] Arquivos CSV salvos em `data/`
- [ ] Testei importação de cidades (dry-run)
- [ ] Importei cidades
- [ ] Testei importação de empresas (dry-run)
- [ ] Importei empresas
- [ ] Testei importação de hotsites (dry-run)
- [ ] Importei hotsites
- [ ] Testei importação de campanhas (dry-run)
- [ ] Importei campanhas
- [ ] Verifiquei dados no Supabase SQL Editor

---

## 🎯 Próximo Passo Após Importação

Depois de importar tudo:

1. ✅ Verificar dados no Supabase
2. ✅ Testar o site localmente (`npm run dev`)
3. ✅ Verificar se as páginas estão funcionando:
   - `/cidades` - Lista de cidades
   - `/cidades/[slug]` - Página de cidade com empresas
   - `/empresas/[slug]` - Página de empresa

---

**Boa sorte com a importação!** 🚀

