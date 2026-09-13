class SettingsComponent {
  constructor(containerEl) {
    this.container = containerEl;
    this.init();
  }

  init() {
    const savedUrl = localStorage.getItem('ag_server_url') || 'ws://' + window.location.host + '/ws';
    const savedToken = localStorage.getItem('ag_token') || '';

    this.container.innerHTML = `
      <div class="glass-card">
        <div class="card-title">📡 Server Connection</div>
        <div class="card-subtitle">Configure your Antigravity Server Bridge host</div>
        
        <label style="font-size: 12px; color: var(--text-muted); margin-top: 10px; display: block;">Server WebSocket URL</label>
        <input type="text" id="setting-url" class="input-field" value="${savedUrl}" placeholder="ws://192.168.1.100:8080/ws" />

        <label style="font-size: 12px; color: var(--text-muted); margin-top: 10px; display: block;">Pairing Token</label>
        <input type="password" id="setting-token" class="input-field" value="${savedToken}" placeholder="Session token" />

        <button class="btn-primary" id="save-conn-btn">Save & Reconnect</button>
      </div>

      <div class="glass-card">
        <div class="card-title">🤖 Gemini Model Switcher</div>
        <div class="card-subtitle">Select active AI model for agent tasks</div>

        <select id="model-select" class="input-field" style="background: rgba(255,255,255,0.08);">
          <option value="gemini-3.6-flash">Gemini 3.6 Flash (Recommended)</option>
          <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
          <option value="gemini-3.5-pro">Gemini 3.5 Pro</option>
        </select>
      </div>

      <div class="glass-card">
        <div class="card-title">📱 App Information</div>
        <div style="font-size: 13px; color: var(--text-muted); line-height: 1.6;">
          <strong>Antigravity Remote v1.0</strong><br/>
          Platform: iOS & Android (PWA / Capacitor / Flutter)<br/>
          Google DeepMind Antigravity Development Platform
        </div>
      </div>
    `;

    const saveBtn = this.container.querySelector('#save-conn-btn');
    saveBtn.addEventListener('click', () => {
      const url = this.container.querySelector('#setting-url').value.trim();
      const token = this.container.querySelector('#setting-token').value.trim();
      window.remoteWS.setServerConfig(url, token);
      window.remoteWS.connect();
      alert('Connection settings saved! Reconnecting...');
    });

    const modelSelect = this.container.querySelector('#model-select');
    modelSelect.addEventListener('change', (e) => {
      const model = e.target.value;
      window.remoteWS.send({ type: 'change_model', model });
    });
  }
}

window.SettingsComponent = SettingsComponent;
