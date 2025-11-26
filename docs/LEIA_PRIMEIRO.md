# 📖 LEIA PRIMEIRO - Documentação Essencial

**Este arquivo deve ser lido PRIMEIRO em toda nova sessão de trabalho**

---

## 🎯 Objetivo

Este documento lista todos os arquivos de documentação essenciais que devem ser consultados antes de começar a trabalhar no projeto, garantindo contexto completo e continuidade.

---

## 📚 Documentação Principal do Projeto

### 1. README.md (Raiz do Projeto)
**Localização**: `/README.md`

**Conteúdo**:
- Visão geral do MudaTech
- Tecnologias utilizadas
- Estrutura do projeto
- Funcionalidades principais
- Instruções de instalação
- Integração VPS

**Quando ler**: Sempre que precisar entender o projeto como um todo.

---

### 2. SISTEMA_COMPLETO.md
**Localização**: `/docs/SISTEMA_COMPLETO.md`

**Conteúdo**:
- Arquitetura completa do sistema
- Fluxo de dados detalhado
- Componentes principais
- Banco de dados
- Correções implementadas

**Quando ler**: Para entender a arquitetura e fluxo do sistema principal.

---

### 3. CONTEXTO_PROJETO.md
**Localização**: `/docs/CONTEXTO_PROJETO.md`

**Conteúdo**:
- Contexto geral do projeto
- Stack tecnológico
- Estrutura de pastas
- Schema do banco de dados

**Quando ler**: Para entender o contexto e estrutura do projeto.

---

## 📱 Documentação VPS (Bot WhatsApp)

### ⚠️ IMPORTANTE: Sempre consulte a documentação do VPS antes de fazer alterações no bot WhatsApp!

### 1. vps-code/README.md
**Localização**: `/vps-code/README.md`

**Conteúdo**:
- Visão geral do bot WhatsApp Julia
- Status atual do sistema
- Arquitetura do bot
- Como funciona hoje
- Estrutura de arquivos
- Funcionalidades implementadas
- Comandos e manutenção
- Versionamento
- Troubleshooting

**Quando ler**: **SEMPRE** antes de trabalhar no bot WhatsApp ou fazer alterações no VPS.

---

### 2. vps-code/ESTADO_ATUAL.md
**Localização**: `/vps-code/ESTADO_ATUAL.md`

**Conteúdo**:
- Estado atual detalhado do sistema
- Como o sistema roda hoje (passo a passo)
- Integrações ativas
- Configuração atual
- Problemas conhecidos
- Fluxo de dados completo
- Changelog recente

**Quando ler**: Para entender exatamente como o sistema está funcionando agora.

---

### 3. vps-code/REFERENCIA_RAPIDA.md
**Localização**: `/vps-code/REFERENCIA_RAPIDA.md`

**Conteúdo**:
- Comandos essenciais
- Estrutura de arquivos
- Fluxo rápido
- Troubleshooting rápido

**Quando ler**: Para consulta rápida durante desenvolvimento.

---

### 4. vps-code/codigo/VERSION.txt
**Localização**: `/vps-code/codigo/VERSION.txt`

**Conteúdo**: Versão atual do bot

**Quando ler**: Para verificar a versão atual antes de fazer alterações.

---

### 5. vps-code/codigo/CHANGELOG.md
**Localização**: `/vps-code/codigo/CHANGELOG.md`

**Conteúdo**: Histórico de todas as mudanças

**Quando ler**: Para entender o que foi alterado recentemente.

---

## 🔗 Documentação de Integração

### INTEGRACAO_VPS_NEXTJS_COMPLETA.md
**Localização**: `/docs/INTEGRACAO_VPS_NEXTJS_COMPLETA.md`

**Conteúdo**:
- Como o VPS e Next.js se integram
- Fluxo de dados entre sistemas
- Mapeamento de dados
- Guia de alterações

**Quando ler**: Para entender como os dois sistemas trabalham juntos.

---

## 📋 Checklist de Leitura para Nova Sessão

### Antes de Começar a Trabalhar:

- [ ] Ler `/README.md` (visão geral do projeto)
- [ ] Ler `/vps-code/README.md` (se for trabalhar com bot WhatsApp)
- [ ] Ler `/vps-code/ESTADO_ATUAL.md` (se for trabalhar com bot WhatsApp)
- [ ] Verificar `/vps-code/codigo/VERSION.txt` (versão atual)
- [ ] Ler `/vps-code/codigo/CHANGELOG.md` (últimas mudanças)

### Se For Trabalhar em Funcionalidades Específicas:

- [ ] **Calculadora**: Ler `/docs/CALCULADORA_COMPLETA.md`
- [ ] **API**: Ler `/docs/API.md`
- [ ] **Dashboard**: Ler `/docs/ANALISE_PAINEL_DASHBOARD.md`
- [ ] **Deploy**: Ler `/docs/FLUXO_EDICAO_LOCAL.md`

---

## 🎯 Ordem Recomendada de Leitura

### Para Trabalho Geral no Projeto:

1. `/README.md` - Visão geral
2. `/docs/SISTEMA_COMPLETO.md` - Arquitetura
3. `/docs/CONTEXTO_PROJETO.md` - Contexto

### Para Trabalho no Bot WhatsApp:

1. `/vps-code/README.md` - Documentação principal
2. `/vps-code/ESTADO_ATUAL.md` - Estado atual
3. `/vps-code/codigo/VERSION.txt` - Versão atual
4. `/vps-code/codigo/CHANGELOG.md` - Últimas mudanças
5. `/vps-code/REFERENCIA_RAPIDA.md` - Referência rápida

### Para Entender Integração:

1. `/docs/INTEGRACAO_VPS_NEXTJS_COMPLETA.md` - Integração completa

---

## 📝 Notas Importantes

### ⚠️ Regras de Ouro:

1. **SEMPRE** consulte a documentação do VPS antes de alterar código do bot WhatsApp
2. **SEMPRE** verifique a versão atual antes de fazer alterações
3. **SEMPRE** atualize o CHANGELOG após fazer mudanças
4. **SEMPRE** atualize a versão se houver mudanças significativas

### 🔄 Workflow Recomendado:

1. Ler documentação relevante
2. Verificar versão atual
3. Fazer alterações
4. Testar
5. Atualizar versão e CHANGELOG
6. Atualizar documentação se necessário

---

## 🚀 Comandos Úteis para Consulta Rápida

```bash
# Ver versão atual do bot
cat vps-code/codigo/VERSION.txt

# Ver últimas mudanças
cat vps-code/codigo/CHANGELOG.md

# Ver estado atual
cat vps-code/ESTADO_ATUAL.md

# Ver referência rápida
cat vps-code/REFERENCIA_RAPIDA.md
```

---

## 📞 Informações de Contato do Sistema

### VPS
- **IP**: 38.242.148.169
- **Domínio**: mudancas.duckdns.org / mudatech.com.br
- **Webhook**: https://mudancas.duckdns.org/webhook

### Projeto
- **Domínio**: mudatech.com.br
- **Vercel**: Deploy automático via GitHub
- **Repositório**: GitHub (verificar remote)

---

## ✅ Status da Documentação

**Última atualização**: 26/11/2025

**Documentação atualizada**:
- ✅ README.md principal
- ✅ vps-code/README.md
- ✅ vps-code/ESTADO_ATUAL.md
- ✅ vps-code/REFERENCIA_RAPIDA.md
- ✅ vps-code/codigo/CHANGELOG.md

**Próxima revisão**: Quando houver mudanças significativas no sistema

---

## 🎯 Instrução para IA

**Ao iniciar uma nova sessão de trabalho, ler PRIMEIRO:**

1. Este arquivo (`docs/LEIA_PRIMEIRO.md`)
2. `/README.md` (visão geral)
3. `/vps-code/README.md` (se for trabalhar com bot)
4. `/vps-code/ESTADO_ATUAL.md` (se for trabalhar com bot)
5. Verificar `/vps-code/codigo/VERSION.txt` (versão atual)

Isso garantirá contexto completo para continuar o trabalho de forma eficiente e sem perder continuidade.

---

**Criado em**: 26/11/2025  
**Objetivo**: Garantir continuidade e contexto em novas sessões de trabalho

