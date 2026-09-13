class ArtifactsComponent {
  constructor(containerEl) {
    this.container = containerEl;
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="glass-card">
        <div class="card-title">📜 Agent Artifacts & Plans</div>
        <div class="card-subtitle">Generated implementation plans, walkthroughs, & diagrams</div>
      </div>
      <div class="glass-card" style="padding: 0;" id="artifacts-list-card">
        <div id="artifacts-list-container" style="padding: 6px 0;">
          <div style="font-size: 13px; color: var(--text-subtle); text-align: center; padding: 20px;">
            Loading artifacts...
          </div>
        </div>
      </div>
    `;

    window.remoteWS.on('connected', () => this.fetchArtifacts());
    this.fetchArtifacts();
  }

  async fetchArtifacts() {
    const token = localStorage.getItem('ag_token');
    if (!token) return;

    try {
      const res = await fetch('/api/artifacts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      this.renderArtifacts(data);
    } catch (err) {
      console.error('Error fetching artifacts:', err);
    }
  }

  renderArtifacts(artifacts) {
    const listContainer = this.container.querySelector('#artifacts-list-container');
    if (!listContainer) return;

    if (!artifacts || artifacts.length === 0) {
      listContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-subtle);">No artifacts generated yet</div>`;
      return;
    }

    listContainer.innerHTML = artifacts.map(art => `
      <div class="file-item" data-path="${art.fullPath}">
        <div class="file-info">
          <svg class="file-icon" viewBox="0 0 24 24" style="fill: var(--primary-light)">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <div>
            <div style="font-weight: 500; font-size: 13px;">${art.filename}</div>
            <div style="font-size: 11px; color: var(--text-subtle);">${new Date(art.modified).toLocaleString()}</div>
          </div>
        </div>
        <span style="font-size: 11px; color: var(--accent); font-weight: 500;">View</span>
      </div>
    `).join('');

    listContainer.querySelectorAll('.file-item').forEach(item => {
      item.addEventListener('click', () => {
        const fullPath = item.dataset.path;
        this.openArtifactViewer(fullPath);
      });
    });
  }

  async openArtifactViewer(fullPath) {
    const token = localStorage.getItem('ag_token');
    try {
      const res = await fetch(`/api/file/content?path=${encodeURIComponent(fullPath)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`Artifact Content:\n\n${data.content}`);
      } else {
        alert(`Could not open artifact: ${data.error}`);
      }
    } catch (err) {
      alert('Error fetching artifact: ' + err.message);
    }
  }
}

window.ArtifactsComponent = ArtifactsComponent;
