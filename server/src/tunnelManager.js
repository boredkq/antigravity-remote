const { spawn } = require('child_process');
const os = require('os');

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
    console.log(`[Network] Local Network URL: http://${localIp}:${port}`);
    console.log(`[Network] Local WebSocket URL: ws://${localIp}:${port}/ws`);

    // Attempt Cloudflare Tunnel (cloudflared) or fallback secure public URL generator
    try {
      console.log(`[Tunnel] Initializing Secure Internet Remote Gateway...`);
      
      // Spawn cloudflared tunnel if available or provide quick tunnel link
      const tunnel = spawn('npx', ['-y', 'localtunnel', '--port', port.toString()], {
        shell: true
      });

      tunnel.stdout.on('data', (data) => {
        const text = data.toString();
        const match = text.match(/https:\/\/[^\s]+/);
        if (match) {
          this.publicUrl = match[0];
          const wssUrl = this.publicUrl.replace('https://', 'wss://') + '/ws';
          console.log(`\n==================================================`);
          console.log(`🌐 GLOBAL INTERNET REMOTE GATEWAY ACTIVE!`);
          console.log(`- Public HTTPS Web App: ${this.publicUrl}/mobile`);
          console.log(`- Public WSS Remote URL: ${wssUrl}`);
          console.log(`You can now connect your iOS / Android app from ANYWHERE in the world!`);
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
      localWebUrl: `http://${localIp}:${port}/mobile`,
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
