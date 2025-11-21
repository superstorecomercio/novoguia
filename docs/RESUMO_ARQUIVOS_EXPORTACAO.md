# 📋 Resumo dos Arquivos de Exportação

## ✅ Arquivos Simplificados (Recomendados)

Use estes arquivos para exportar - eles contêm **apenas uma query** cada:

| Arquivo | Descrição | Salvar Como |
|---------|-----------|-------------|
| `01_export_cidades_SIMPLES.sql` | Exporta cidades | `data/cidades_export.csv` |
| `02_export_empresas_SIMPLES.sql` | Exporta empresas | `data/empresas_export.csv` |
| `03_export_hotsites_SIMPLES.sql` | Exporta hotsites | `data/hotsites_export.csv` |
| `04_export_campanhas_SIMPLES.sql` | Exporta campanhas | `data/campanhas_export.csv` |

## 📝 Como Usar

### Para cada arquivo:

1. **Abra o arquivo** `*_SIMPLES.sql` no SSMS
2. **Configure para salvar**: `Query` → `Results To` → `Results to File` (ou **Ctrl+Shift+F**)
3. **Execute** a query (F5)
4. **Salve** o arquivo CSV na pasta `data/`

## 📚 Arquivos Completos (Opcionais)

Os arquivos sem `_SIMPLES` contêm múltiplas opções (CSV, JSON, SQL INSERT), mas retornam múltiplos resultados. Use apenas se precisar de outras opções.

---

**Dica**: Use sempre os arquivos `*_SIMPLES.sql` para evitar confusão! 🎯

