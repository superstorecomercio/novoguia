# 📊 Sistema de Campanhas

## 🎯 Visão Geral

A tabela `campanhas` é o **centro de controle administrativo** do sistema. Ela gerencia:

- ✅ **Status ativo/inativo** das empresas no site
- 📅 **Vencimentos** de planos de publicidade
- 💰 **Valores** cobrados por campanha
- 🎯 **Planos de publicidade** (Top, Quality, Standard, Intermediário)
- 📍 **Vinculação** com cidades e hotsites específicos

## 📋 Estrutura da Tabela

```sql
CREATE TABLE campanhas (
  id UUID PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id),
  plano_id UUID REFERENCES planos_publicidade(id),
  cidade_id UUID REFERENCES cidades(id),        -- Opcional: cidade específica
  hotsite_id UUID REFERENCES hotsites(id),      -- Opcional: hotsite específico
  data_inicio DATE NOT NULL,
  data_fim DATE,                                 -- NULL = sem vencimento
  valor_total DECIMAL(10,2),
  data_cobranca DATE,
  ativo BOOLEAN DEFAULT true,                   -- Status da campanha
  observacoes TEXT,                              -- Notas administrativas
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 🔗 Relacionamentos

```
campanhas
  ├── empresa_id → empresas (N:1)
  ├── plano_id → planos_publicidade (N:1)
  ├── cidade_id → cidades (N:1) [opcional]
  └── hotsite_id → hotsites (N:1) [opcional]
```

## 💡 Como Funciona

### 1. **Campanha Ativa = Empresa Visível**

Uma empresa só aparece no site se tiver uma **campanha ativa**:

```sql
-- Empresas visíveis no site
SELECT e.*
FROM empresas e
JOIN campanhas c ON c.empresa_id = e.id
WHERE c.ativo = true
  AND (c.data_fim IS NULL OR c.data_fim >= CURRENT_DATE);
```

### 2. **Controle de Vencimento**

- **`data_fim IS NULL`**: Campanha sem vencimento (ativa permanentemente)
- **`data_fim >= CURRENT_DATE`**: Campanha válida até a data especificada
- **`data_fim < CURRENT_DATE`**: Campanha vencida (deve ser desativada)

### 3. **Planos de Publicidade**

A campanha vincula a empresa a um plano:

- **Top**: Maior destaque, aparece primeiro
- **Quality**: Destaque médio
- **Standard**: Destaque padrão
- **Intermediário**: Destaque básico

### 4. **Vinculação com Cidade/Hotsite**

Uma campanha pode ser vinculada a:
- **Cidade específica**: Campanha válida apenas para uma cidade
- **Hotsite específico**: Campanha vinculada a um hotsite específico
- **Ambos**: Controle mais granular

## 📊 Uso no Dashboard

### Listar Campanhas Ativas

```sql
SELECT 
  e.nome as empresa,
  pp.nome as plano,
  c.data_inicio,
  c.data_fim,
  c.valor_total,
  c.ativo,
  CASE 
    WHEN c.data_fim IS NULL THEN 'Sem vencimento'
    WHEN c.data_fim >= CURRENT_DATE THEN 'Válida'
    ELSE 'Vencida'
  END as status
FROM campanhas c
JOIN empresas e ON c.empresa_id = e.id
JOIN planos_publicidade pp ON c.plano_id = pp.id
WHERE c.ativo = true
ORDER BY c.data_fim DESC NULLS LAST;
```

### Campanhas Vencendo em 30 Dias

```sql
SELECT 
  e.nome as empresa,
  pp.nome as plano,
  c.data_fim,
  (c.data_fim - CURRENT_DATE) as dias_restantes
FROM campanhas c
JOIN empresas e ON c.empresa_id = e.id
JOIN planos_publicidade pp ON c.plano_id = pp.id
WHERE c.ativo = true
  AND c.data_fim IS NOT NULL
  AND c.data_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY c.data_fim ASC;
```

### Desativar Campanhas Vencidas

```sql
UPDATE campanhas
SET ativo = false
WHERE data_fim < CURRENT_DATE
  AND ativo = true;
```

## 🔄 Migração do Sistema Legado

### Tabela Legada: `guiaCampanha`

```sql
-- Campos legados
codCampanha      → id (UUID gerado)
codEmpresa       → empresa_id (via migration_empresas_map)
codPublicidade   → plano_id (via nome do plano)
datainicio       → data_inicio
datafim          → data_fim
valortotal       → valor_total
datacobranca     → data_cobranca
```

### Scripts de Migração

1. **Exportar**: `scripts/migrate/sql/04_export_campanhas.sql`
2. **Importar**: `scripts/migrate/import/04_import_campanhas_csv.ts`

## ⚠️ Importante

1. **Ordem de Importação**: Campanhas devem ser importadas **depois** de empresas e hotsites
2. **Status Ativo**: Uma empresa só aparece no site se tiver campanha ativa
3. **Vencimentos**: Configure alertas para campanhas vencendo em breve
4. **Valores**: Use `valor_total` para controle financeiro e relatórios

## 📝 Próximos Passos

- [ ] Criar dashboard administrativo para gerenciar campanhas
- [ ] Implementar alertas de vencimento (email/notificação)
- [ ] Criar relatórios financeiros baseados em campanhas
- [ ] Implementar renovação automática de campanhas

