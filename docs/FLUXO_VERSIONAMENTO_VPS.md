# 🔄 Fluxo de Versionamento VPS - Explicação Completa

**Objetivo:** Entender como funciona o versionamento e sincronização entre VPS e projeto local

---

## 🎯 Conceitos Importantes

### ⚠️ Git na VPS é LOCAL (não é GitHub!)

**O que significa:**
- Git na VPS = repositório Git **local** na VPS
- **NÃO** está conectado ao GitHub/GitLab
- É apenas para **histórico local** e **controle de versão**
- Não "sobe" automaticamente para lugar nenhum

### 🔄 Sincronização = Cópia de Arquivos

**Como funciona:**
- VPS tem código → você copia para projeto local via `scp`
- Projeto local tem Git → você pode fazer commit/push para GitHub

---

## 📊 Fluxo Completo (Passo a Passo)

```
┌─────────────────────────────────────────────────────────────┐
│                    VPS (Servidor)                           │
│                                                              │
│  /home/whatsapp-webhook/                                    │
│  ├── server.js                                              │
│  ├── message-handler.js                                     │
│  ├── ...                                                    │
│  ├── .git/              ← Git LOCAL (não remoto!)          │
│  ├── VERSION.txt        ← Versão atual (ex: 1.0.1)         │
│  └── CHANGELOG.md       ← Histórico de alterações          │
│                                                              │
│  Quando você altera:                                        │
│  1. Edita arquivo (nano message-handler.js)                │
│  2. Testa (pm2 restart)                                     │
│  3. Atualiza versão (./atualizar-versao.sh)                │
│     → Faz commit LOCAL no Git da VPS                        │
│     → Atualiza VERSION.txt (1.0.0 → 1.0.1)                 │
│     → Atualiza CHANGELOG.md                                 │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ SCP (cópia de arquivos)
                       │ ./scripts/sincronizar-vps.sh
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              PROJETO LOCAL (Seu Computador)                 │
│                                                              │
│  vps-code/codigo/                                           │
│  ├── server.js          ← Copiado da VPS                    │
│  ├── message-handler.js ← Copiado da VPS                    │
│  ├── ...                                                     │
│  ├── VERSION.txt        ← Versão atual (1.0.1)             │
│  └── CHANGELOG.md       ← Histórico                         │
│                                                              │
│  .git/                    ← Git do PROJETO (pode ter GitHub)│
│                                                              │
│  Quando sincroniza:                                         │
│  1. Executa script (./scripts/sincronizar-vps.sh)          │
│     → Copia arquivos da VPS para vps-code/codigo/          │
│  2. Verifica diferenças (git diff)                         │
│  3. Commit no Git do projeto (git add && git commit)       │
│  4. Push para GitHub (git push) - OPCIONAL                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo Detalhado

### Cenário: Você quer alterar mensagem do bot

#### PASSO 1: Alterar na VPS

```bash
# 1. Conectar na VPS
ssh root@38.242.148.169

# 2. Ir para diretório
cd /home/whatsapp-webhook

# 3. Fazer backup (opcional mas recomendado)
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz *.js .env

# 4. Editar arquivo
nano message-handler.js
# ... fazer alteração ...

# 5. Testar
pm2 restart whatsapp-webhook
pm2 logs whatsapp-webhook

# 6. Atualizar versão (IMPORTANTE!)
./atualizar-versao.sh "Alterada mensagem de boas-vindas"

# O que acontece:
# ✅ Incrementa VERSION.txt (1.0.0 → 1.0.1)
# ✅ Atualiza CHANGELOG.md
# ✅ Faz commit LOCAL no Git da VPS
#    (git add . && git commit -m "v1.0.1: Alterada mensagem...")
```

**Resultado na VPS:**
- ✅ Código alterado
- ✅ Versão atualizada (1.0.1)
- ✅ Commit no Git LOCAL da VPS
- ✅ CHANGELOG atualizado

**⚠️ IMPORTANTE:** O commit está APENAS na VPS, não foi para lugar nenhum!

---

#### PASSO 2: Sincronizar com Projeto Local

```bash
# No seu computador (projeto local)

# 1. Executar script de sincronização
./scripts/sincronizar-vps.sh

# O que acontece:
# ✅ Copia todos os arquivos .js da VPS para vps-code/codigo/
# ✅ Copia VERSION.txt
# ✅ Copia CHANGELOG.md
# ✅ Mostra versão atual

# 2. Verificar o que mudou
git status
git diff vps-code/codigo/

# 3. Commit no Git do projeto (se quiser)
git add vps-code/
git commit -m "Sincronizado VPS v1.0.1 - Alterada mensagem de boas-vindas"

# 4. Push para GitHub (OPCIONAL - se tiver repositório remoto)
git push origin main
```

**Resultado no projeto local:**
- ✅ Código sincronizado
- ✅ Versão atualizada
- ✅ Commit no Git do projeto
- ✅ (Opcional) Push para GitHub

---

## 🎯 Resumo do Fluxo

### Quando você altera na VPS:

```
1. Edita código na VPS
   ↓
2. Testa (pm2 restart)
   ↓
3. Atualiza versão (./atualizar-versao.sh)
   → Commit LOCAL no Git da VPS
   → Atualiza VERSION.txt
   → Atualiza CHANGELOG.md
   ↓
4. [Código fica na VPS, não vai para lugar nenhum automaticamente]
```

### Quando você sincroniza:

```
1. Executa script (./scripts/sincronizar-vps.sh)
   → Copia arquivos da VPS para projeto local
   ↓
2. Verifica diferenças (git diff)
   ↓
3. Commit no Git do projeto (git add && git commit)
   ↓
4. Push para GitHub (git push) - OPCIONAL
```

---

## ❓ Perguntas Frequentes

### 1. O Git da VPS sobe automaticamente para o GitHub?

**❌ NÃO!**

- Git na VPS é **apenas local**
- Não está conectado a nenhum repositório remoto
- É apenas para **histórico local** e **controle de versão**

### 2. Como o código da VPS chega no projeto local?

**Via SCP (cópia de arquivos):**

- Script `sincronizar-vps.sh` usa `scp` para copiar arquivos
- Não usa Git para sincronizar
- É uma **cópia física** dos arquivos

### 3. Preciso fazer commit no projeto local?

**✅ SIM, se quiser versionar no projeto:**

- O script apenas **copia** os arquivos
- Você precisa fazer commit manualmente no Git do projeto
- Isso permite versionar no GitHub (se tiver)

### 4. Posso conectar Git da VPS ao GitHub?

**✅ SIM, mas não é recomendado:**

**Opção A: Git remoto na VPS (não recomendado)**
```bash
# Na VPS
cd /home/whatsapp-webhook
git remote add origin https://github.com/seu-usuario/vps-code.git
git push origin main
```

**Por que não recomendo:**
- ⚠️ Expõe estrutura da VPS
- ⚠️ Precisa gerenciar credenciais na VPS
- ⚠️ Mais complexo

**Opção B: Manter separado (RECOMENDADO)**
- ✅ VPS: Git local (histórico local)
- ✅ Projeto: Git com GitHub (versionamento público)
- ✅ Sincronização via script (simples e seguro)

### 5. E se eu quiser fazer rollback na VPS?

**Com Git local na VPS:**

```bash
# Ver histórico
cd /home/whatsapp-webhook
git log --oneline

# Voltar para versão anterior
git checkout <hash-do-commit>

# Ou voltar VERSION.txt
git checkout HEAD~1 VERSION.txt
```

---

## 🔄 Fluxo Completo Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    VPS (Servidor)                           │
│                                                              │
│  1. Você edita: nano message-handler.js                     │
│  2. Você testa: pm2 restart whatsapp-webhook                │
│  3. Você atualiza: ./atualizar-versao.sh "Descrição"        │
│     ├─ Incrementa VERSION.txt                               │
│     ├─ Atualiza CHANGELOG.md                                │
│     └─ git commit (LOCAL na VPS)                            │
│                                                              │
│  [Código fica aqui, não vai para lugar nenhum]              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ Você executa no projeto local:
                       │ ./scripts/sincronizar-vps.sh
                       │
                       │ (Usa SCP para copiar arquivos)
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              PROJETO LOCAL (Seu Computador)                 │
│                                                              │
│  1. Script copia arquivos da VPS                            │
│  2. Você verifica: git diff                                 │
│  3. Você commita: git add && git commit                     │
│  4. Você faz push: git push (OPCIONAL)                      │
│                                                              │
│  [Agora está versionado no Git do projeto]                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Checklist do Fluxo

### Quando alterar na VPS:

- [ ] Conectar na VPS (`ssh root@38.242.148.169`)
- [ ] Fazer backup (opcional)
- [ ] Editar arquivo
- [ ] Testar (`pm2 restart whatsapp-webhook`)
- [ ] Atualizar versão (`./atualizar-versao.sh "Descrição"`)
- [ ] Verificar versão (`cat VERSION.txt`)

### Quando sincronizar:

- [ ] Executar script (`./scripts/sincronizar-vps.sh`)
- [ ] Verificar diferenças (`git diff vps-code/codigo/`)
- [ ] Commit no projeto (`git add vps-code/ && git commit`)
- [ ] Push para GitHub (opcional: `git push`)

---

## 🎯 Resumo Final

### Git na VPS:
- ✅ **Local apenas** (não remoto)
- ✅ Histórico de alterações
- ✅ Fácil rollback
- ❌ **NÃO sobe automaticamente**

### Sincronização:
- ✅ Via script (`sincronizar-vps.sh`)
- ✅ Usa SCP (cópia de arquivos)
- ✅ Manual (você executa quando quiser)

### Git do Projeto:
- ✅ Versionamento do projeto completo
- ✅ Pode ter GitHub
- ✅ Você faz commit manualmente após sincronizar

---

## 💡 Recomendação

**Mantenha assim:**

1. **VPS:** Git local (histórico local)
2. **Projeto:** Git com GitHub (versionamento)
3. **Sincronização:** Script manual quando necessário

**Por quê?**
- ✅ Simples
- ✅ Seguro
- ✅ Controle total
- ✅ Não expõe estrutura da VPS

---

**Última atualização:** 2025-01-23

