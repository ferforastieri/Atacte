# 🚀 Configuração de Deploy Local

## 📋 **Como Configurar**

### **1. Copiar arquivo de exemplo:**
```bash
cp deploy-local.example.sh deploy-local.sh
```

### **2. Editar configurações:**
Abra `deploy-local.sh` e ajuste:
```bash
SERVER_HOST="SEU_IP_AQUI"        # Exemplo: 192.168.1.100
SERVER_USER="seu_usuario"        # Exemplo: fernando  
SERVER_PATH="/caminho/do/projeto" # Exemplo: /home/fernando/atacte
```

### **3. Tornar executável:**
```bash
chmod +x deploy-local.sh
```

### **4. Configurar Git Hook (opcional):**
```bash
chmod +x .git/hooks/post-commit
```

## 🎯 **Como Usar**

### **Deploy Manual:**
```bash
./deploy-local.sh
```

### **Deploy Automático (após push):**
```bash
git add .
git commit -m "sua alteração"
git push origin main
# Deploy roda automaticamente!
```

## ⚙️ **Configurações por Ambiente**

### **Desenvolvimento Local:**
```bash
SERVER_HOST="192.168.1.100"
SERVER_USER="dev"
SERVER_PATH="/home/dev/atacte"
```

### **Servidor de Produção:**
```bash
SERVER_HOST="10.0.0.50"
SERVER_USER="prod"
SERVER_PATH="/opt/atacte"
```

### **Servidor na Nuvem:**
```bash
SERVER_HOST="meuservidor.com"
SERVER_USER="ubuntu"
SERVER_PATH="/home/ubuntu/atacte"
```

## 🔧 **Troubleshooting**

### **Erro: "Permission denied"**
```bash
# Configurar chave SSH
ssh-keygen -t rsa
ssh-copy-id usuario@servidor
```

### **Erro: "Connection refused"**
```bash
# Verificar se o servidor está acessível
ping SEU_IP_AQUI
```

### **Erro: "Docker not found"**
```bash
# No servidor, instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

## 📁 **Arquivos de Exemplo Disponíveis**

### **Deploy:**
- `deploy-local.example.sh` → Template de deploy local
- `DEPLOY_SETUP.md` → Documentação de configuração

### **Docker:**
- `docker-compose.example.yml` → Template do Docker Compose
- `Dockerfile.example` → Template do Dockerfile
- `supervisord.example.conf` → Template do Supervisor

### **Configurações:**
- `backend/config.example.env` → Template de configuração do backend
- `web/env.example` → Template de configuração do frontend
- `nginx/nginx.example.conf` → Template do Nginx

## 📝 **Notas**

- ✅ **Arquivos originais** estão no `.gitignore` (configurações pessoais)
- ✅ **Arquivos .example** estão no repositório (templates)
- ✅ **Git Hook** roda automaticamente após commit
- ✅ **Cada desenvolvedor** configura seus próprios arquivos
