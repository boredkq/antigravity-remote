const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const authManager = require('./auth');
const agentBridge = require('./agentBridge');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Serve Mobile Web App assets statically if desired
app.use('/mobile', express.static(path.join(__dirname, '../../mobile')));

// --- REST API Endpoints --- //

// Pairing endpoint
app.post('/api/pair', (req, res) => {
  const { pin } = req.body;
  const result = authManager.verifyPin(pin);
  if (result.success) {
    return res.json({ success: true, token: result.token, status: agentBridge.getSystemStatus() });
  }
  return res.status(401).json(result);
});

// Auth Middleware for REST API
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.substring(7);
  if (!authManager.validateToken(token)) {
    return res.status(403).json({ error: 'Invalid or expired session token' });
  }
  next();
};

// Protected routes
app.get('/api/status', authMiddleware, (req, res) => {
  res.json(agentBridge.getSystemStatus());
});

app.get('/api/files', authMiddleware, (req, res) => {
  const { dirPath } = req.query;
  res.json(agentBridge.listWorkspaceFiles(dirPath));
});

app.get('/api/file/content', authMiddleware, (req, res) => {
  const { path: filePath } = req.query;
  res.json(agentBridge.readFileContent(filePath));
});

app.get('/api/artifacts', authMiddleware, (req, res) => {
  res.json(agentBridge.getArtifactsList());
});

app.post('/api/model', authMiddleware, (req, res) => {
  const { model } = req.body;
  res.json(agentBridge.setModel(model));
});

// --- HTTP Server & WebSocket Setup --- //
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

const broadcast = (data) => {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.isAuthed) {
      client.send(payload);
    }
  });
};

wss.on('connection', (ws) => {
  ws.isAuthed = false;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Handle Authentication
      if (data.type === 'auth') {
        if (authManager.validateToken(data.token)) {
          ws.isAuthed = true;
          ws.send(JSON.stringify({
            type: 'auth_success',
            status: agentBridge.getSystemStatus()
          }));
        } else {
          ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid token' }));
          ws.close();
        }
        return;
      }

      if (!ws.isAuthed) {
        ws.send(JSON.stringify({ type: 'error', message: 'Unauthenticated WebSocket connection' }));
        return;
      }

      // Handle Client Actions
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;

        case 'prompt':
          if (data.prompt) {
            agentBridge.executePrompt(data.prompt, broadcast);
          }
          break;

        case 'cancel':
          if (data.taskId) {
            const res = agentBridge.cancelTask(data.taskId);
            broadcast({ type: 'task_cancelled', ...res, taskId: data.taskId });
          }
          break;

        case 'get_status':
          ws.send(JSON.stringify({ type: 'status_update', status: agentBridge.getSystemStatus() }));
          break;

        case 'change_model':
          if (data.model) {
            agentBridge.setModel(data.model);
            broadcast({ type: 'model_changed', model: data.model });
          }
          break;

        default:
          ws.send(JSON.stringify({ type: 'unknown_command', command: data.type }));
      }

    } catch (err) {
      console.error('Error processing WebSocket message:', err);
      ws.send(JSON.stringify({ type: 'error', message: 'Malformed JSON message' }));
    }
  });

  // Heartbeat ping interval
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 30000);

  ws.on('close', () => {
    clearInterval(pingInterval);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Antigravity Remote Server active on port ${PORT}`);
  console.log(`- Web App URL: http://localhost:${PORT}/mobile`);
  console.log(`- WebSocket URL: ws://localhost:${PORT}/ws`);
  console.log(`==================================================\n`);
});
