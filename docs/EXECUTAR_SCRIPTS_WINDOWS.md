# 🪟 Como Executar Scripts .sh no Windows

**Problema:** Windows não executa scripts `.sh` diretamente no PowerShell/CMD

**Solução:** Use Git Bash ou WSL

---

## 🎯 Solução Rápida

### Opção 1: Git Bash (Mais Fácil) ⭐

1. **Abrir Git Bash:**
   - Clique com botão direito na pasta do projeto
   - Selecione "Git Bash Here"
   - Ou procure "Git Bash" no menu Iniciar

2. **Executar script:**
   ```bash
   ./scripts/setup-vps-edicao-local.sh
   ```

---

### Opção 2: VS Code/Cursor com Git Bash

1. **Abrir VS Code/Cursor**
2. **Abrir terminal:** `Ctrl + `` (backtick)
3. **Selecionar Git Bash:**
   - Clique no `+` ao lado do terminal
   - Ou clique na seta ao lado de `+`
   - Selecione "Git Bash"

4. **Executar:**
   ```bash
   ./scripts/setup-vps-edicao-local.sh
   ```

---

### Opção 3: WSL (Windows Subsystem for Linux)

1. **Abrir WSL:**
   - Digite "Ubuntu" no menu Iniciar
   - Ou "WSL" no PowerShell

2. **Navegar até o projeto:**
   ```bash
   cd /mnt/c/Users/junior/newguia/guia-de-mudancas-next
   ```

3. **Executar:**
   ```bash
   ./scripts/setup-vps-edicao-local.sh
   ```

---

## 🔧 Configurar Git Bash como Terminal Padrão no VS Code

### Passo a Passo:

1. **Abrir VS Code/Cursor**
2. **Abrir configurações:** `Ctrl + ,`
3. **Buscar:** "terminal integrated default profile windows"
4. **Selecionar:** "Git Bash"
5. **Salvar**

Agora quando abrir terminal (`Ctrl + ``), já abre no Git Bash!

---

## 📋 Verificar se Git Bash Está Instalado

### Verificar:

```bash
# No PowerShell ou CMD
where git
# Deve mostrar: C:\Program Files\Git\bin\git.exe
```

### Se não tiver, instalar:

1. Baixar: https://git-scm.com/download/win
2. Instalar (deixar opções padrão)
3. Reiniciar VS Code/Cursor

---

## 🎯 Método Mais Rápido (Recomendado)

### 1. Abrir Git Bash Diretamente:

- **Clique com botão direito** na pasta do projeto no Windows Explorer
- Selecione **"Git Bash Here"**
- Terminal abre direto na pasta certa!

### 2. Executar:

```bash
./scripts/setup-vps-edicao-local.sh
```

---

## ⚠️ Por Que Não Funciona no PowerShell?

**PowerShell/CMD:**
- ❌ Não entende scripts `.sh` (bash)
- ❌ Não tem `chmod`, `./`, etc.
- ❌ É para Windows, não Linux

**Git Bash/WSL:**
- ✅ Entende scripts `.sh` (bash)
- ✅ Tem todos os comandos Linux
- ✅ Funciona perfeitamente

---

## 🔄 Alternativa: Executar Comandos Manualmente

Se não conseguir usar Git Bash, pode executar os comandos manualmente:

### 1. Conectar na VPS:

```bash
ssh root@38.242.148.169
```

### 2. Executar comandos na VPS (um por um):

```bash
cd /home/whatsapp-webhook
git init
git config user.name "VPS Bot"
git config user.email "vps@mudatech.com"
# ... etc
```

Mas é mais trabalhoso! Melhor usar o script.

---

## 📝 Resumo

| Método | Como Abrir | Comando |
|--------|-----------|---------|
| **Git Bash** | Botão direito → "Git Bash Here" | `./scripts/setup-vps-edicao-local.sh` |
| **VS Code Terminal** | `Ctrl + `` → Selecionar Git Bash | `./scripts/setup-vps-edicao-local.sh` |
| **WSL** | Menu Iniciar → Ubuntu | `./scripts/setup-vps-edicao-local.sh` |

---

## ✅ Checklist

- [ ] Git Bash instalado? (`where git` no PowerShell)
- [ ] Abriu Git Bash? (botão direito → "Git Bash Here")
- [ ] Está na pasta do projeto? (`pwd` deve mostrar a pasta)
- [ ] Script existe? (`ls scripts/setup-vps-edicao-local.sh`)

---

**Última atualização:** 2025-01-23

