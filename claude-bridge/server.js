const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Função para executar comandos
function execCommand(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { cwd: '/home/node/clawd' }, (error, stdout, stderr) => {
      resolve({
        success: !error,
        stdout: stdout || '',
        stderr: stderr || '',
        error: error?.message || null,
        timestamp: new Date().toISOString()
      });
    });
  });
}

// Função para log de comunicação
function logInteraction(source, action, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    source: source,
    action: action,
    data: data
  };
  
  const logPath = '/home/node/clawd/claude-bridge-log.jsonl';
  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
}

// ====== ENDPOINTS PARA CLAUDE MAX ======

// Endpoint principal para Claude Max se comunicar comigo
app.post('/api/claude/message', async (req, res) => {
  try {
    const { message, sender = 'Claude Max', context = {} } = req.body;
    
    logInteraction('claude-max', 'message', { message, context });
    
    // Aqui posso processar a mensagem e responder
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      from: 'MAVIE',
      to: sender,
      message: `Recebido: "${message}". MAVIE está processando...`,
      status: {
        server: '129.121.37.41',
        uptime: process.uptime(),
        workspace: '/home/node/clawd'
      }
    };
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Claude Max pode pedir para eu executar comandos
app.post('/api/claude/execute', async (req, res) => {
  try {
    const { command, sender = 'Claude Max', safe = false } = req.body;
    
    // Lista de comandos seguros
    const safeCommands = [
      'ls', 'pwd', 'whoami', 'date', 'uptime', 'ps aux', 
      'df -h', 'free -h', 'cat', 'head', 'tail', 'grep'
    ];
    
    if (safe && !safeCommands.some(cmd => command.startsWith(cmd))) {
      return res.status(400).json({
        error: 'Comando não permitido no modo seguro',
        allowed: safeCommands
      });
    }
    
    logInteraction('claude-max', 'execute', { command, safe });
    
    const result = await execCommand(command);
    
    res.json({
      success: true,
      command: command,
      result: result,
      executed_by: 'MAVIE',
      requested_by: sender
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Claude Max pode ler arquivos
app.post('/api/claude/read', async (req, res) => {
  try {
    const { filepath, lines = null, offset = 0 } = req.body;
    
    logInteraction('claude-max', 'read', { filepath, lines, offset });
    
    const fullPath = path.resolve('/home/node/clawd', filepath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const allLines = content.split('\n');
    
    let result;
    if (lines) {
      result = allLines.slice(offset, offset + lines).join('\n');
    } else {
      result = allLines.slice(offset).join('\n');
    }
    
    res.json({
      success: true,
      filepath: filepath,
      content: result,
      totalLines: allLines.length,
      read_by: 'MAVIE'
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Claude Max pode escrever arquivos (colaboração)
app.post('/api/claude/write', async (req, res) => {
  try {
    const { filepath, content, sender = 'Claude Max' } = req.body;
    
    logInteraction('claude-max', 'write', { filepath, contentLength: content.length });
    
    const fullPath = path.resolve('/home/node/clawd', filepath);
    const dir = path.dirname(fullPath);
    
    // Criar diretórios se necessário
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content);
    
    res.json({
      success: true,
      filepath: filepath,
      size: content.length,
      message: `Arquivo criado/atualizado por ${sender}`,
      written_by: 'MAVIE'
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Status da colaboração
app.get('/api/claude/status', (req, res) => {
  res.json({
    mavie_status: 'online',
    server: '129.121.37.41',
    workspace: '/home/node/clawd',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/claude/message - Enviar mensagem',
      'POST /api/claude/execute - Executar comando',  
      'POST /api/claude/read - Ler arquivo',
      'POST /api/claude/write - Escrever arquivo',
      'GET /api/claude/status - Status da colaboração'
    ]
  });
});

// Logs de interação
app.get('/api/claude/logs', (req, res) => {
  try {
    const logPath = '/home/node/clawd/claude-bridge-log.jsonl';
    if (!fs.existsSync(logPath)) {
      return res.json({ logs: [] });
    }
    
    const content = fs.readFileSync(logPath, 'utf8');
    const logs = content.trim().split('\n')
      .filter(line => line)
      .map(line => JSON.parse(line))
      .slice(-50); // Últimos 50
    
    res.json({ logs: logs.reverse() });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Página de documentação
app.get('/', (req, res) => {
  res.send(`
    <html>
    <head>
        <title>MAVIE ↔ Claude Max Bridge</title>
        <style>
            body { font-family: monospace; background: #1a1a1a; color: #00ff00; padding: 20px; }
            .endpoint { margin: 15px 0; padding: 10px; background: #333; border-left: 3px solid #00ff00; }
            .method { color: #ff6600; font-weight: bold; }
            .url { color: #0099ff; }
        </style>
    </head>
    <body>
        <h1>🤖 MAVIE ↔ Claude Max Bridge</h1>
        <p><strong>Status:</strong> Online<br>
        <strong>Servidor:</strong> 129.121.37.41:3002<br>
        <strong>Workspace:</strong> /home/node/clawd</p>
        
        <h2>📡 Endpoints Disponíveis:</h2>
        
        <div class="endpoint">
            <span class="method">POST</span> <span class="url">/api/claude/message</span><br>
            Enviar mensagem para MAVIE<br>
            <code>{ "message": "Olá MAVIE!", "sender": "Claude Max" }</code>
        </div>
        
        <div class="endpoint">
            <span class="method">POST</span> <span class="url">/api/claude/execute</span><br>
            Executar comando no servidor<br>
            <code>{ "command": "ls -la", "safe": true }</code>
        </div>
        
        <div class="endpoint">
            <span class="method">POST</span> <span class="url">/api/claude/read</span><br>
            Ler arquivo do workspace<br>
            <code>{ "filepath": "README.md" }</code>
        </div>
        
        <div class="endpoint">
            <span class="method">POST</span> <span class="url">/api/claude/write</span><br>
            Escrever arquivo no workspace<br>
            <code>{ "filepath": "novo.txt", "content": "Conteúdo..." }</code>
        </div>
        
        <div class="endpoint">
            <span class="method">GET</span> <span class="url">/api/claude/status</span><br>
            Status da colaboração
        </div>
        
        <div class="endpoint">
            <span class="method">GET</span> <span class="url">/api/claude/logs</span><br>
            Logs de interação
        </div>
        
        <h2>💡 Como Usar:</h2>
        <p>1. Claude Max faz requisições HTTP para estes endpoints<br>
        2. MAVIE processa e responde<br>
        3. Colaboração em tempo real!</p>
        
        <p><strong>Exemplo de uso no Claude Max:</strong><br>
        "Faça uma requisição POST para http://129.121.37.41:3002/api/claude/message com a mensagem 'Olá MAVIE!'"</p>
    </body>
    </html>
  `);
});

const PORT = 3002;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 Claude Bridge rodando em http://0.0.0.0:${PORT}`);
  console.log(`📡 Endpoints disponíveis para Claude Max`);
  
  // Log inicial
  logInteraction('system', 'startup', { port: PORT, timestamp: new Date().toISOString() });
});