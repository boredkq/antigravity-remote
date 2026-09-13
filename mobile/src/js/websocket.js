class RemoteWSClient {
  constructor() {
    this.ws = null;
    this.token = localStorage.getItem('ag_token') || '';
    this.serverUrl = localStorage.getItem('ag_server_url') || 'ws://' + window.location.host + '/ws';
    this.listeners = new Map();
    this.isConnected = false;
    this.reconnectTimer = null;
  }

  setServerConfig(url, token) {
    this.serverUrl = url;
    this.token = token;
    localStorage.setItem('ag_server_url', url);
    localStorage.setItem('ag_token', token);
  }

  connect() {
    if (!this.token) {
      this.emit('auth_required');
      return;
    }

    try {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        console.log('[RemoteWS] Connected. Sending auth token...');
        this.send({ type: 'auth', token: this.token });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'auth_success') {
            this.isConnected = true;
            this.emit('connected', data.status);
          } else if (data.type === 'auth_error') {
            this.isConnected = false;
            this.emit('auth_required');
          } else {
            this.emit(data.type, data);
          }
        } catch (err) {
          console.error('[RemoteWS] Parse error:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[RemoteWS] Socket error:', err);
        this.isConnected = false;
        this.emit('error', err);
      };

      this.ws.onclose = () => {
        console.log('[RemoteWS] Socket disconnected. Reconnecting in 3s...');
        this.isConnected = false;
        this.emit('disconnected');
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      };

    } catch (err) {
      console.error('[RemoteWS] Connection attempt failed:', err);
      this.emit('error', err);
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }
}

window.remoteWS = new RemoteWSClient();
