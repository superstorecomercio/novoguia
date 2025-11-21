# 🧪 Teste Rápido de Conexão

## Teste Simples

Depois de preencher `config.ts`, execute:

```bash
npx tsx scripts/migrate/01_migrate_cidades.ts --dry-run
```

Isso vai:
1. ✅ Tentar conectar ao banco legado
2. ✅ Buscar cidades
3. ✅ Mostrar quantas encontrou
4. ✅ **NÃO inserir dados** (dry-run)

## O que você deve ver:

### ✅ Se funcionar:
```
🚀 Iniciando migração de cidades...
⚠️  MODO DRY RUN - Nenhum dado será inserido

📥 Buscando cidades do banco legado...
🔌 Conectando ao banco legado...
✅ Encontradas X cidades

[DRY RUN] Criaria cidade: São Paulo (sao-paulo)
[DRY RUN] Criaria cidade: Rio de Janeiro (rio-de-janeiro)
...
```

### ❌ Se não funcionar:
```
❌ Erro ao buscar cidades do banco legado: Cannot connect to SQL Server
```

**Nesse caso:**
- Verifique credenciais em `config.ts`
- Verifique se o servidor está acessível
- Teste com SQL Server Management Studio primeiro

