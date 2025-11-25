# 📍 Onde Executar o Script de Configuração

**Resposta rápida:** No seu computador (projeto local), não na VPS!

---

## 🎯 Onde Executar

### ❌ NÃO execute na VPS
### ✅ Execute no seu computador (projeto local)

---

## 📋 Passo a Passo

### 1. Abrir Terminal no Projeto Local

**Opções:**

#### Opção A: Git Bash (Recomendado no Windows)

1. Abra o Git Bash
2. Navegue até a pasta do projeto:
   ```bash
   cd /c/Users/junior/newguia/guia-de-mudancas-next
   ```
3. Execute o script:
   ```bash
   ./scripts/setup-vps-edicao-local.sh
   ```

#### Opção B: WSL (Windows Subsystem for Linux)

1. Abra o WSL (Ubuntu)
2. Navegue até a pasta do projeto:
   ```bash
   cd /mnt/c/Users/junior/newguia/guia-de-mudancas-next
   ```
3. Execute o script:
   ```bash
   ./scripts/setup-vps-edicao-local.sh
   ```

#### Opção C: VS Code/Cursor Terminal

1. Abra o terminal integrado (Ctrl + `)
2. Selecione "Git Bash" ou "WSL" como terminal
3. Execute:
   ```bash
   ./scripts/setup-vps-edicao-local.sh
   ```

---

## 🔍 Como Saber se Está no Lugar Certo

### ✅ Você está no lugar certo se:

```bash
# Verificar se está na pasta do projeto
pwd
# Deve mostrar: /c/Users/junior/newguia/guia-de-mudancas-next
# ou: /mnt/c/Users/junior/newguia/guia-de-mudancas-next

# Verificar se o script existe
ls scripts/setup-vps-edicao-local.sh
# Deve mostrar: scripts/setup-vps-edicao-local.sh

# Verificar se tem pasta vps-code
ls vps-code
# Deve mostrar a pasta vps-code
```

---

## 🚀 Executar o Script

### Comando:

```bash
./scripts/setup-vps-edicao-local.sh
```

### O que o script faz:

1. ✅ Verifica scripts locais
2. ✅ **Conecta na VPS via SSH** (você não precisa fazer isso manualmente!)
3. ✅ Configura Git na VPS
4. ✅ Cria arquivos de versão na VPS
5. ✅ Cria script de atualização na VPS
6. ✅ Sincroniza código da VPS para projeto local

**Importante:** O script se conecta na VPS automaticamente via SSH. Você só precisa executar no projeto local!

---

## ⚠️ Requisitos

### Antes de executar, certifique-se de:

1. ✅ Ter acesso SSH configurado
   ```bash
   # Testar conexão SSH
   ssh root@38.242.148.169
   # Se conectar, está OK!
   ```

2. ✅ Estar na pasta do projeto
   ```bash
   pwd
   # Deve mostrar a pasta do projeto
   ```

3. ✅ Ter Git Bash ou WSL instalado
   - Git Bash: vem com Git for Windows
   - WSL: Windows Subsystem for Linux

---

## 📝 Exemplo Completo

### No Git Bash:

```bash
# 1. Abrir Git Bash

# 2. Ir para pasta do projeto
cd /c/Users/junior/newguia/guia-de-mudancas-next

# 3. Verificar se está no lugar certo
ls scripts/setup-vps-edicao-local.sh
# Deve mostrar o arquivo

# 4. Executar script
./scripts/setup-vps-edicao-local.sh

# 5. O script vai:
#    - Verificar scripts locais
#    - Conectar na VPS (via SSH)
#    - Configurar tudo automaticamente
#    - Mostrar mensagens de progresso
```

---

## 🔄 O que Acontece Quando Executa

```
Você executa no projeto local:
  ./scripts/setup-vps-edicao-local.sh
         ↓
Script se conecta na VPS (via SSH):
  ssh root@38.242.148.169
         ↓
Script configura na VPS:
  - Git
  - Arquivos de versão
  - Scripts
         ↓
Script sincroniza código:
  - Baixa código da VPS
  - Salva em vps-code/codigo/
         ↓
✅ Pronto!
```

---

## ❓ Problemas Comuns

### Erro: "bash: ./scripts/setup-vps-edicao-local.sh: Permission denied"

**Solução:**
```bash
# Dar permissão de execução
chmod +x scripts/setup-vps-edicao-local.sh

# Executar novamente
./scripts/setup-vps-edicao-local.sh
```

### Erro: "ssh: connect to host 38.242.148.169 port 22: Connection refused"

**Solução:**
- Verificar se VPS está online
- Verificar se SSH está habilitado
- Verificar firewall

### Erro: "Permission denied (publickey)"

**Solução:**
- Configurar chave SSH
- Ou usar senha do root

---

## 🎯 Resumo

**Onde executar:** No seu computador (projeto local)  
**Como executar:** `./scripts/setup-vps-edicao-local.sh`  
**Onde:** Git Bash ou WSL  
**O que faz:** Conecta na VPS via SSH e configura tudo automaticamente

---

**Última atualização:** 2025-01-23

