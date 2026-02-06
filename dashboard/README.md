# MAVIE Dashboard

Dashboard em tempo real para monitorar o sistema MAVIE (Operador Digital Innovativa).

## 🚀 Funcionalidades

- **Status do Sistema:** CPU, Memória, Uptime, Processos
- **Console Interativo:** Execute comandos diretamente no servidor
- **Logs em Tempo Real:** Histórico de atividades e comandos
- **Interface Dark Mode:** Design moderno com TailwindCSS
- **WebSocket:** Atualizações automáticas a cada 2 segundos

## 📊 Informações Monitoradas

### Status Cards
- **Uptime:** Tempo online do sistema
- **CPU Load:** Carga média do processador
- **Memória:** Uso atual de RAM
- **Processos:** Quantidade de processos ativos

### Console
- Execução de comandos shell em tempo real
- Histórico de comandos com timestamps
- Output colorizado (sucesso/erro/warning)
- Limpeza de console

### Logs de Atividade
- Últimas 10 atividades do sistema
- Carregamento automático de MEMORY.md
- Timestamps precisos

## 🔧 Tecnologias

- **Backend:** Node.js + Express + WebSocket
- **Frontend:** JavaScript Vanilla + TailwindCSS
- **Interface:** Font Awesome + Dark Mode
- **Comunicação:** REST API + WebSocket

## 📂 Estrutura

```
dashboard/
├── server.js          # Servidor backend
├── package.json       # Dependências
├── public/
│   ├── index.html     # Interface principal
│   └── app.js         # JavaScript frontend
└── README.md          # Este arquivo
```

## 🌐 Acesso

**URL:** http://129.121.37.41:3001
**Local:** http://localhost:3001

## ⚙️ Configuração

O dashboard roda automaticamente na porta 3001 e monitora:
- Sistema de arquivos: `/home/node/clawd`
- Processos: node, clawdbot-gateway, signal-cli
- Memória: `/proc/meminfo`
- CPU: `/proc/loadavg`
- Logs: `MEMORY.md`

## 🔄 API Endpoints

- `GET /api/status` - Status completo do sistema
- `GET /api/logs` - Logs recentes
- `POST /api/command` - Executar comando
- `WebSocket /` - Atualizações em tempo real

## 🎨 Interface

- **Header:** Logo MAVIE + Status de conexão
- **Cards:** Métricas principais do sistema
- **Console:** Terminal interativo
- **Activity:** Log de atividades recentes
- **System Info:** Informações estáticas (servidor, container, modelo IA)

## 📋 Comandos Úteis

```bash
# Iniciar dashboard
cd dashboard && node server.js

# Com porta específica
PORT=3002 node server.js

# Monitorar logs
tail -f ../MEMORY.md

# Status do sistema
curl http://localhost:3001/api/status
```

## 🔍 Monitoramento

O dashboard atualiza automaticamente:
- **Status:** A cada 2 segundos
- **Processos:** Detecção automática
- **Memória/CPU:** Leitura de /proc/
- **Logs:** Carregamento sob demanda

---

**Criado em:** 2026-02-06  
**Sistema:** VPS 129.121.37.41  
**Agente:** MAVIE (Sistema Innovativa)