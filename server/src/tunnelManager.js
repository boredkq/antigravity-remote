const { spawn } = require('child_process');
const os = require('os');
const authManager = require('./auth');

class TunnelManager {
  constructor() {
    this.publicUrl = null;
    this.tunnelProcess = null;
  }

  getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return '127.0.0.1';
  }

  async startTunnel(port = 8080) {
    const localIp = this.getLocalIP();
    const currentPin = authManager.pairingPin;

    console.log(`[Network] Local Network Auto-Pair URL: http://${localIp}:${port}/mobile?pin=${currentPin}`);
    console.log(`[Network] Local WebSocket URL: ws://${localIp}:${port}/ws`);

    try {
      console.log(`[Tunnel] Initializing Secure Internet Remote Gateway...`);
      
      const tunnel = spawn('npx', ['-y', 'localtunnel', '--port', port.toString()], {
        shell: true
      });

      tunnel.stdout.on('data', (data) => {
        const text = data.toString();
        const match = text.match(/https:\/\/[^\s]+/);
        if (match) {
          this.publicUrl = match[0];
          const wssUrl = this.publicUrl.replace('https://', 'wss://') + '/ws';
          const autoPairUrl = `${this.publicUrl}/mobile?pin=${currentPin}`;
          
          console.log(`\n==================================================`);
          console.log(`⚡ 1-CLICK DIRECT AUTO-PAIR INTERNET LINK:`);
          console.log(`👉 ${autoPairUrl}`);
          console.log(`==================================================`);
          console.log(`🌐 GLOBAL INTERNET REMOTE GATEWAY ACTIVE!`);
          console.log(`- Public Web App: ${this.publicUrl}/mobile`);
          console.log(`- Public WebSocket: ${wssUrl}`);
          console.log(`- Security PIN Code: ${currentPin}`);
          console.log(`==================================================\n`);
        }
      });

      tunnel.stderr.on('data', (data) => {
        // Suppress non-critical warnings
      });

      this.tunnelProcess = tunnel;
    } catch (err) {
      console.log(`[Tunnel] Local network active. Public tunnel fallback ready.`);
    }

    return {
      localIp,
      localWebUrl: `http://${localIp}:${port}/mobile?pin=${currentPin}`,
      localWsUrl: `ws://${localIp}:${port}/ws`
    };
  }

  stopTunnel() {
    if (this.tunnelProcess) {
      this.tunnelProcess.kill();
    }
  }
}

module.exports = new TunnelManager();
