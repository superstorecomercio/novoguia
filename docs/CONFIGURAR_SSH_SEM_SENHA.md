# 🔐 Configurar SSH sem Senha (Chave SSH)

**Problema:** Script pede senha toda hora  
**Solução:** Configurar autenticação por chave SSH

---

## 🎯 Solução Rápida

### Passo 1: Gerar Chave SSH (se não tiver)

```bash
# No Git Bash
ssh-keygen -t rsa -b 4096 -C "seu-email@exemplo.com"

# Quando perguntar:
# - Onde salvar: Pressione Enter (padrão: ~/.ssh/id_rsa)
# - Senha: Pressione Enter (sem senha) ou digite uma senha
```

### Passo 2: Copiar Chave para VPS

```bash
# Copiar chave pública para VPS
ssh-copy-id root@38.242.148.169

# Vai pedir senha UMA VEZ
# Depois disso, não pede mais!
```

### Passo 3: Testar

```bash
# Testar conexão (não deve pedir senha)
ssh root@38.242.148.169

# Se conectar sem pedir senha, está funcionando!
```

---

## 📋 Passo a Passo Detalhado

### 1. Verificar se já tem chave SSH

```bash
# Verificar se já tem chave
ls ~/.ssh/id_rsa.pub

# Se aparecer o arquivo, já tem chave!
# Se não aparecer, precisa gerar
```

### 2. Gerar Chave SSH (se não tiver)

```bash
# Gerar chave
ssh-keygen -t rsa -b 4096 -C "vps@mudatech.com"

# Quando perguntar:
# Enter file in which to save the key: [Pressione Enter]
# Enter passphrase: [Pressione Enter - sem senha]
# Enter same passphrase again: [Pressione Enter]
```

### 3. Copiar Chave para VPS

#### Opção A: ssh-copy-id (Mais Fácil)

```bash
# Copiar chave
ssh-copy-id root@38.242.148.169

# Vai pedir senha UMA VEZ
# Digite a senha do root da VPS
```

#### Opção B: Manual (se ssh-copy-id não funcionar)

```bash
# 1. Ver chave pública
cat ~/.ssh/id_rsa.pub

# 2. Copiar o conteúdo (todo o texto)

# 3. Conectar na VPS
ssh root@38.242.148.169

# 4. Na VPS, executar:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "COLE_AQUI_A_CHAVE_PUBLICA" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

### 4. Testar Conexão

```bash
# Testar (não deve pedir senha)
ssh root@38.242.148.169

# Se conectar sem pedir senha, está funcionando!
# Digite 'exit' para sair
```

---

## 🔧 Se ssh-copy-id Não Funcionar no Windows

### Solução Manual:

```bash
# 1. Ver chave pública
cat ~/.ssh/id_rsa.pub

# 2. Copiar TODO o conteúdo (do ssh-rsa até o email)

# 3. Conectar na VPS (vai pedir senha)
ssh root@38.242.148.169

# 4. Na VPS, executar:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys

# 5. Colar a chave pública (Ctrl+Shift+V)
# 6. Salvar: Ctrl+O, Enter, Ctrl+X

# 7. Dar permissão correta
chmod 600 ~/.ssh/authorized_keys

# 8. Sair
exit

# 9. Testar (não deve pedir senha)
ssh root@38.242.148.169
```

---

## ✅ Verificar se Funcionou

```bash
# Testar conexão
ssh root@38.242.148.169

# Se conectar SEM pedir senha = ✅ Funcionou!
# Se ainda pedir senha = ❌ Algo deu errado
```

---

## 🐛 Troubleshooting

### Erro: "Permission denied (publickey)"

**Solução:**
```bash
# Verificar permissões na VPS
ssh root@38.242.148.169
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
exit
```

### Erro: "ssh-copy-id: command not found"

**Solução:**
- Use o método manual (Opção B acima)

### Ainda pede senha

**Verificar:**
```bash
# 1. Verificar se chave foi copiada
ssh root@38.242.148.169 'cat ~/.ssh/authorized_keys'

# 2. Verificar permissões
ssh root@38.148.148.169 'ls -la ~/.ssh/'

# Deve mostrar:
# drwx------ .ssh
# -rw------- authorized_keys
```

---

## 🎯 Depois de Configurar

Agora você pode executar o script sem pedir senha:

```bash
cd /c/Users/junior/newguia/guia-de-mudancas-next
./scripts/setup-vps-edicao-local.sh
```

**Não vai pedir senha!** ✅

---

## 📝 Resumo

1. **Gerar chave SSH:** `ssh-keygen -t rsa -b 4096`
2. **Copiar para VPS:** `ssh-copy-id root@38.242.148.169`
3. **Testar:** `ssh root@38.242.148.169` (não deve pedir senha)
4. **Executar script:** `./scripts/setup-vps-edicao-local.sh` (sem senha!)

---

**Última atualização:** 2025-01-23

