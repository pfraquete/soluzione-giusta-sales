const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Estado global do sistema
let systemStatus = {
  uptime: Date.now(),
  processes: [],
  logs: [],
  sessions: [],
  memory: {
    used: 0,
    total: 0
  },
  cpu: 0,
  lastUpdate: Date.now()
};

// Função para executar comandos e capturar saída
function execCommand(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => {
      resolve({
        success: !error,
        stdout: stdout || '',
        stderr: stderr || '',
        error: error?.message || null
      });
    });
  });
}

// Função para atualizar status do sistema
async function updateSystemStatus() {
  try {
    // Memória
    const memInfo = await execCommand('cat /proc/meminfo | head -3');
    if (memInfo.success) {
      const lines = memInfo.stdout.split('\n');
      const total = parseInt(lines[0].match(/\d+/)[0]) * 1024;
      const available = parseInt(lines[2].match(/\d+/)[0]) * 1024;
      systemStatus.memory = {
        used: total - available,
        total: total
      };
    }

    // CPU
    const loadAvg = await execCommand('cat /proc/loadavg');
    if (loadAvg.success) {
      systemStatus.cpu = parseFloat(loadAvg.stdout.split(' ')[0]);
    }

    // Processos do node
    const processes = await execCommand('ps aux | grep node');
    if (processes.success) {
      systemStatus.processes = processes.stdout.split('\n')
        .filter(line => line.includes('node') && !line.includes('grep'))
        .map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            pid: parts[1],
            cpu: parts[2],
            memory: parts[3],
            command: parts.slice(10).join(' ')
          };
        });
    }

    systemStatus.lastUpdate = Date.now();

  } catch (error) {
    console.error('Erro ao atualizar status:', error);
  }
}

// WebSocket para dados em tempo real
wss.on('connection', (ws) => {
  console.log('Cliente conectado ao dashboard');
  
  // Enviar status inicial
  ws.send(JSON.stringify({
    type: 'status',
    data: systemStatus
  }));

  // Intervalo para enviar atualizações
  const interval = setInterval(async () => {
    await updateSystemStatus();
    ws.send(JSON.stringify({
      type: 'status',
      data: systemStatus
    }));
  }, 2000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('Cliente desconectado');
  });
});

// API Endpoints
app.get('/api/status', async (req, res) => {
  await updateSystemStatus();
  res.json(systemStatus);
});

app.get('/api/logs', (req, res) => {
  try {
    // Ler logs do workspace se existirem
    const logsPath = path.join(__dirname, '../MEMORY.md');
    if (fs.existsSync(logsPath)) {
      const content = fs.readFileSync(logsPath, 'utf8');
      res.json({ logs: content.split('\n').slice(-50) });
    } else {
      res.json({ logs: ['Dashboard iniciado', `Timestamp: ${new Date().toISOString()}`] });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/command', async (req, res) => {
  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ error: 'Comando não fornecido' });
  }

  const result = await execCommand(command);
  
  // Adicionar ao log
  systemStatus.logs.push({
    timestamp: Date.now(),
    command: command,
    result: result.stdout || result.stderr,
    success: result.success
  });

  res.json(result);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Dashboard MAVIE rodando em http://localhost:${PORT}`);
});

// Atualização inicial
updateSystemStatus();