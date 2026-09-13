class FilesComponent {
  constructor(containerEl) {
    this.container = containerEl;
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="glass-card">
        <div class="card-title">📁 Workspace File Explorer</div>
        <div class="card-subtitle">Browse workspace files and review live diffs</div>
      </div>
      <div class="glass-card" style="padding: 0;" id="file-tree-card">
        <div id="file-list-container" style="padding: 6px 0;">
          <div style="font-size: 13px; color: var(--text-subtle); text-align: center; padding: 20px;">
            Loading workspace directory...
          </div>
        </div>
      </div>
    `;

    window.remoteWS.on('connected', () => this.fetchFiles());
    this.fetchFiles();
  }

  async fetchFiles() {
    const token = localStorage.getItem('ag_token');
    if (!token) return;

    try {
      const res = await fetch('/api/files', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      this.renderFiles(data);
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  }

  renderFiles(files) {
    const listContainer = this.container.querySelector('#file-list-container');
    if (!listContainer) return;

    if (!files || files.length === 0) {
      listContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-subtle);">Directory is empty</div>`;
      return;
    }

    listContainer.innerHTML = files.map(file => `
      <div class="file-item" data-path="${file.path}" data-isdir="${file.isDir}">
        <div class="file-info">
          <svg class="file-icon" viewBox="0 0 24 24">
            ${file.isDir 
              ? '<path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>' 
              : '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>'}
          </svg>
          <span>${file.name}</span>
        </div>
        <span style="font-size: 11px; color: var(--text-subtle);">
          ${file.isDir ? 'Folder' : (file.sizeBytes ? Math.round(file.sizeBytes / 1024) + ' KB' : '')}
        </span>
      </div>
    `).join('');

    listContainer.querySelectorAll('.file-item').forEach(item => {
      item.addEventListener('click', () => {
        const path = item.dataset.path;
        const isDir = item.dataset.isdir === 'true';
        if (!isDir) {
          this.openFileViewer(path);
        }
      });
    });
  }

  async openFileViewer(filePath) {
    const token = localStorage.getItem('ag_token');
    try {
      const res = await fetch(`/api/file/content?path=${encodeURIComponent(filePath)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`File: ${filePath}\n\n${data.content.substring(0, 500)}...`);
      } else {
        alert(`Could not read file: ${data.error}`);
      }
    } catch (err) {
      alert('Error fetching file content: ' + err.message);
    }
  }
}

window.FilesComponent = FilesComponent;
