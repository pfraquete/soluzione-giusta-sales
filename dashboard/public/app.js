class MAVIEDashboard {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 5000;
        
        this.init();
        this.setupEventListeners();
        this.connect();
    }

    init() {
        // Elementos DOM
        this.elements = {
            statusDot: document.getElementById('status-dot'),
            lastUpdate: document.getElementById('last-update'),
            uptime: document.getElementById('uptime'),
            cpu: document.getElementById('cpu'),
            memory: document.getElementById('memory'),
            processes: document.getElementById('processes'),
            consoleOutput: document.getElementById('console-output'),
            commandInput: document.getElementById('command-input'),
            executeBtn: document.getElementById('execute-btn'),
            clearConsole: document.getElementById('clear-console'),
            activityLog: document.getElementById('activity-log'),
            refreshLogs: document.getElementById('refresh-logs'),
            hostname: document.getElementById('hostname')
        };
    }

    setupEventListeners() {
        // Console commands
        this.elements.executeBtn.addEventListener('click', () => this.executeCommand());
        this.elements.commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.executeCommand();
        });
        
        this.elements.clearConsole.addEventListener('click', () => this.clearConsole());
        this.elements.refreshLogs.addEventListener('click', () => this.loadLogs());
    }

    connect() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.hostname}:${window.location.port || 3001}`;
            
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('Conectado ao MAVIE Dashboard');
                this.updateStatus('online');
                this.reconnectAttempts = 0;
                this.addConsoleOutput('✅ Conectado ao sistema MAVIE', 'success');
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Erro ao processar mensagem:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('Conexão fechada');
                this.updateStatus('offline');
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('Erro WebSocket:', error);
                this.updateStatus('error');
            };

        } catch (error) {
            console.error('Erro ao conectar:', error);
            this.updateStatus('error');
        }
    }

    updateStatus(status) {
        const dot = this.elements.statusDot;
        const lastUpdate = this.elements.lastUpdate;

        switch (status) {
            case 'online':
                dot.className = 'w-3 h-3 bg-green-500 rounded-full pulse-dot';
                lastUpdate.textContent = 'Online';
                break;
            case 'offline':
                dot.className = 'w-3 h-3 bg-red-500 rounded-full';
                lastUpdate.textContent = 'Desconectado';
                break;
            case 'error':
                dot.className = 'w-3 h-3 bg-yellow-500 rounded-full pulse-dot';
                lastUpdate.textContent = 'Erro de conexão';
                break;
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Tentativa de reconexão ${this.reconnectAttempts}...`);
            this.addConsoleOutput(`🔄 Tentativa de reconexão ${this.reconnectAttempts}...`, 'warning');
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectInterval);
        } else {
            this.addConsoleOutput('❌ Máximo de tentativas de reconexão atingido', 'error');
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'status':
                this.updateSystemStatus(data.data);
                break;
            case 'log':
                this.addActivityLog(data.data);
                break;
            case 'command_result':
                this.addConsoleOutput(data.data.output, data.data.success ? 'success' : 'error');
                break;
        }
    }

    updateSystemStatus(status) {
        // Atualizar uptime
        const uptime = this.formatUptime(Date.now() - status.uptime);
        this.elements.uptime.textContent = uptime;

        // CPU
        this.elements.cpu.textContent = status.cpu.toFixed(2);

        // Memória
        const memoryPercent = ((status.memory.used / status.memory.total) * 100).toFixed(1);
        const memoryMB = (status.memory.used / (1024 * 1024)).toFixed(0);
        this.elements.memory.textContent = `${memoryPercent}%`;

        // Processos
        this.elements.processes.textContent = status.processes.length;

        // Hostname (primeira vez)
        if (this.elements.hostname.textContent === '--') {
            this.executeSystemCommand('hostname');
        }

        // Last update
        this.elements.lastUpdate.textContent = new Date().toLocaleTimeString();
    }

    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    async executeCommand() {
        const command = this.elements.commandInput.value.trim();
        if (!command) return;

        // Adicionar comando ao console
        this.addConsoleOutput(`$ ${command}`, 'command');
        this.elements.commandInput.value = '';

        try {
            const response = await fetch('/api/command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ command })
            });

            const result = await response.json();
            
            if (result.stdout) {
                this.addConsoleOutput(result.stdout, 'success');
            }
            if (result.stderr) {
                this.addConsoleOutput(result.stderr, 'error');
            }
            if (result.error) {
                this.addConsoleOutput(`Erro: ${result.error}`, 'error');
            }

        } catch (error) {
            this.addConsoleOutput(`Erro de rede: ${error.message}`, 'error');
        }
    }

    async executeSystemCommand(command) {
        try {
            const response = await fetch('/api/command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ command })
            });

            const result = await response.json();
            
            if (command === 'hostname' && result.stdout) {
                this.elements.hostname.textContent = result.stdout.trim();
            }

        } catch (error) {
            console.error('Erro ao executar comando do sistema:', error);
        }
    }

    addConsoleOutput(text, type = 'normal') {
        const output = this.elements.consoleOutput;
        const timestamp = new Date().toLocaleTimeString();
        
        const colorClass = {
            'success': 'text-green-400',
            'error': 'text-red-400',
            'warning': 'text-yellow-400',
            'command': 'text-cyan-400',
            'normal': 'text-gray-300'
        }[type] || 'text-gray-300';

        const line = document.createElement('div');
        line.className = `console-output ${colorClass}`;
        line.innerHTML = `<span class="text-gray-500 text-xs">${timestamp}</span> ${text}`;
        
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }

    clearConsole() {
        this.elements.consoleOutput.innerHTML = '<div class="text-green-400 console-output">Console limpo.</div>';
    }

    async loadLogs() {
        try {
            const response = await fetch('/api/logs');
            const data = await response.json();
            
            const logContainer = this.elements.activityLog;
            logContainer.innerHTML = '';

            data.logs.slice(-10).forEach(log => {
                if (log.trim()) {
                    const logItem = document.createElement('div');
                    logItem.className = 'text-sm bg-gray-700 p-3 rounded';
                    logItem.innerHTML = `
                        <div class="text-xs text-gray-400 mb-1">${new Date().toLocaleTimeString()}</div>
                        <div>${log}</div>
                    `;
                    logContainer.appendChild(logItem);
                }
            });

        } catch (error) {
            console.error('Erro ao carregar logs:', error);
        }
    }

    addActivityLog(activity) {
        const logContainer = this.elements.activityLog;
        const logItem = document.createElement('div');
        logItem.className = 'text-sm bg-gray-700 p-3 rounded';
        logItem.innerHTML = `
            <div class="text-xs text-gray-400 mb-1">${new Date(activity.timestamp).toLocaleTimeString()}</div>
            <div>${activity.message}</div>
        `;
        
        logContainer.insertBefore(logItem, logContainer.firstChild);
        
        // Manter apenas os 10 mais recentes
        while (logContainer.children.length > 10) {
            logContainer.removeChild(logContainer.lastChild);
        }
    }
}

// Inicializar dashboard quando página carregar
document.addEventListener('DOMContentLoaded', () => {
    new MAVIEDashboard();
});