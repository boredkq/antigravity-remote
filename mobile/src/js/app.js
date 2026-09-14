document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI components
  const chatPane = document.getElementById('chat-tab');
  const tasksPane = document.getElementById('tasks-tab');
  const filesPane = document.getElementById('files-tab');
  const artifactsPane = document.getElementById('artifacts-tab');
  const settingsPane = document.getElementById('settings-tab');

  new window.ChatComponent(chatPane);
  new window.TasksComponent(tasksPane);
  new window.FilesComponent(filesPane);
  new window.ArtifactsComponent(artifactsPane);
  new window.SettingsComponent(settingsPane);

  // Tab router
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.dataset.tab;
      
      navItems.forEach(n => n.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      document.getElementById(tabId + '-tab').classList.add('active');
    });
  });

  // Pairing Modal Handling
  const pairingModal = document.getElementById('pairing-modal');
  const pinInput = document.getElementById('pin-input');
  const pairBtn = document.getElementById('pair-submit-btn');

  const showPairingModal = () => pairingModal.classList.add('active');
  const hidePairingModal = () => pairingModal.classList.remove('active');

  const autoPairWithPin = async (pin) => {
    try {
      const serverHost = window.location.protocol + '//' + window.location.host;
      const res = await fetch(`${serverHost}/api/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();

      if (data.success) {
        hidePairingModal();
        const wsUrl = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws';
        window.remoteWS.setServerConfig(wsUrl, data.token);
        window.remoteWS.connect();
        
        // Clean URL query param for privacy
        const url = new URL(window.location);
        url.searchParams.delete('pin');
        window.history.replaceState({}, '', url);
        return true;
      }
    } catch (err) {
      console.error('Auto pairing error:', err);
    }
    return false;
  };

  pairBtn.addEventListener('click', async () => {
    const pin = pinInput.value.trim();
    if (!pin) return;
    const success = await autoPairWithPin(pin);
    if (!success) alert('Invalid PIN code');
  });

  // Connection Indicator
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  window.remoteWS.on('connected', (status) => {
    statusDot.className = 'status-dot online';
    statusText.textContent = 'Connected';
    hidePairingModal();
  });

  window.remoteWS.on('disconnected', () => {
    statusDot.className = 'status-dot';
    statusText.textContent = 'Offline';
  });

  window.remoteWS.on('auth_required', async () => {
    // Check URL parameters for 1-Click Auto Pairing (e.g. ?pin=123456)
    const urlParams = new URLSearchParams(window.location.search);
    const pinFromUrl = urlParams.get('pin') || urlParams.get('auto_pair');

    if (pinFromUrl) {
      console.log('⚡ Auto-pairing with URL PIN parameter...');
      const success = await autoPairWithPin(pinFromUrl);
      if (success) return;
    }

    statusDot.className = 'status-dot connecting';
    statusText.textContent = 'Pairing Required';
    showPairingModal();
  });

  // Initial connect attempt
  window.remoteWS.connect();
});
