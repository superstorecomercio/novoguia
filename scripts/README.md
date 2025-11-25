# 📁 Scripts SQL

## Arquivo Principal

### `SISTEMA_ORCAMENTOS_COMPLETO.sql`

**Este é o único arquivo SQL necessário para o sistema de orçamentos.**

Contém:
- ✅ Função `buscar_hotsites_ativos_por_cidade()`
- ✅ Função `buscar_hotsites_ativos_por_estado()`
- ✅ Função `criar_orcamento_e_notificar()`
- ✅ Políticas RLS para `orcamentos` e `orcamentos_campanhas`
- ✅ Trigger `sync_hotsite_city_fields()`
- ✅ Script de diagnóstico comentado

---

## Como Usar

1. Abra o **SQL Editor** no Supabase
2. Copie todo o conteúdo de `SISTEMA_ORCAMENTOS_COMPLETO.sql`
3. Execute o script
4. Pronto! ✅

---

## Pasta `migrate/`

Esta pasta contém scripts de migração de dados e importação.
**Não modificar** - parte da estrutura do projeto.








