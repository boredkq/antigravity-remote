const crypto = require('crypto');

class AuthManager {
  constructor() {
    this.pairingPin = this.generatePin();
    this.validTokens = new Set();
    console.log(`\n==================================================`);
    console.log(`[Antigravity Remote] Security Pairing Code: ${this.pairingPin}`);
    console.log(`Enter this 6-digit PIN on your mobile device to pair.`);
    console.log(`==================================================\n`);
  }

  generatePin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  verifyPin(pin) {
    if (pin === this.pairingPin) {
      const token = crypto.randomBytes(32).toString('hex');
      this.validTokens.add(token);
      return { success: true, token };
    }
    return { success: false, message: 'Invalid pairing PIN' };
  }

  validateToken(token) {
    return this.validTokens.has(token);
  }

  regeneratePin() {
    this.pairingPin = this.generatePin();
    console.log(`[Antigravity Remote] New Pairing Code Generated: ${this.pairingPin}`);
    return this.pairingPin;
  }
}

module.exports = new AuthManager();
