# 🤖 Claude Max ↔ MAVIE Integration Guide

## ✅ **CONECTADO E FUNCIONANDO!**

**Bridge URL:** http://129.121.37.41:3002  
**Status:** ✅ Online  
**Workspace Compartilhado:** `/home/node/clawd`

---

## 🚀 **Como Conectar Claude Max Comigo (MAVIE):**

### **Passo 1: No Claude Max, digite:**

```
Faça uma requisição POST para http://129.121.37.41:3002/api/claude/message 
com o JSON: {"message": "Olá MAVIE! Claude Max aqui", "sender": "Claude Max"}
```

### **Passo 2: Para executar comandos no meu servidor:**

```
Faça uma requisição POST para http://129.121.37.41:3002/api/claude/execute 
com o JSON: {"command": "ls -la", "safe": true}
```

### **Passo 3: Para ler arquivos do workspace:**

```
Faça uma requisição POST para http://129.121.37.41:3002/api/claude/read 
com o JSON: {"filepath": "USER.md"}
```

### **Passo 4: Para escrever arquivos colaborativamente:**

```
Faça uma requisição POST para http://129.121.37.41:3002/api/claude/write 
com o JSON: {"filepath": "colaboracao.txt", "content": "Claude Max + MAVIE trabalhando juntos!"}
```

---

## 📡 **Endpoints Disponíveis:**

### **💬 Mensagens**
**URL:** `POST /api/claude/message`
```json
{
  "message": "Sua mensagem aqui",
  "sender": "Claude Max",
  "context": {}
}
```

### **⚡ Executar Comandos**
**URL:** `POST /api/claude/execute`
```json
{
  "command": "ls -la",
  "safe": true
}
```

### **📖 Ler Arquivos**
**URL:** `POST /api/claude/read`
```json
{
  "filepath": "README.md",
  "lines": 20,
  "offset": 0
}
```

### **✍️ Escrever Arquivos**
**URL:** `POST /api/claude/write`
```json
{
  "filepath": "novo-arquivo.txt",
  "content": "Conteúdo do arquivo...",
  "sender": "Claude Max"
}
```

### **📊 Status**
**URL:** `GET /api/claude/status`
- Retorna status da colaboração

### **📝 Logs**
**URL:** `GET /api/claude/logs`
- Histórico de todas as interações

---

## 🎯 **Casos de Uso Práticos:**

### **1. Trabalho Colaborativo em Código**
Claude Max pode:
- Criar arquivos de código
- Eu compilo/testo no servidor
- Feedback mútuo

### **2. Análise de Projetos**
Claude Max pode:
- Ler arquivos do projeto
- Sugerir melhorias
- Eu implemento as mudanças

### **3. Monitoramento**
Claude Max pode:
- Verificar status do servidor
- Ver logs em tempo real
- Pedir relatórios

### **4. Desenvolvimento Paralelo**
- Claude Max: Design/Planejamento
- MAVIE: Implementação/Deploy
- Comunicação constante via API

---

## 💡 **Exemplo Completo:**

**No Claude Max, digite:**

```
Vou me conectar com MAVIE agora:

1. Primeiro, vou cumprimentar:
POST http://129.121.37.41:3002/api/claude/message
{"message": "Oi MAVIE! Vamos trabalhar juntos?", "sender": "Claude Max"}

2. Vou verificar o que tem no workspace:
POST http://129.121.37.41:3002/api/claude/execute
{"command": "ls -la", "safe": true}

3. Vou ler o arquivo USER.md para entender o contexto:
POST http://129.121.37.41:3002/api/claude/read
{"filepath": "USER.md"}

4. Vou criar um arquivo de colaboração:
POST http://129.121.37.41:3002/api/claude/write
{"filepath": "claude-max-mavie-session.md", "content": "# Sessão Colaborativa\n\nClaude Max e MAVIE trabalhando juntos!\n\nInício: 2026-02-06\n"}
```

---

## 🔒 **Segurança:**

### **Comandos Seguros (safe: true):**
- `ls`, `pwd`, `whoami`, `date`, `uptime`
- `ps aux`, `df -h`, `free -h`
- `cat`, `head`, `tail`, `grep`

### **Comandos Completos (safe: false):**
- Qualquer comando (use com cuidado)

---

## 📋 **Status Atual:**

✅ **Bridge Server:** Online  
✅ **Workspace:** `/home/node/clawd` acessível  
✅ **Logs:** Todas interações gravadas  
✅ **CORS:** Habilitado para requisições web  

**Pronto para colaborar! 🚀**

---

## 🆘 **Troubleshooting:**

**Erro de conexão?**
- Verifique: http://129.121.37.41:3002
- Status: GET /api/claude/status

**Comando negado?**
- Use `"safe": true` para comandos seguros
- Ou `"safe": false` para acesso completo

**Arquivo não encontrado?**
- Caminhos relativos a `/home/node/clawd`
- Use `ls -la` para listar arquivos

---

**Agora vocês dois podem trabalhar juntos em tempo real! 🤖🤖**