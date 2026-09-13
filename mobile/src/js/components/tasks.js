class TasksComponent {
  constructor(containerEl) {
    this.container = containerEl;
    this.init();
  }

  init() {
    this.render();
    window.remoteWS.on('connected', (status) => this.updateStatus(status));
    window.remoteWS.on('status_update', (data) => this.updateStatus(data.status));
  }

  render() {
    this.container.innerHTML = `
      <div class="glass-card">
        <div class="card-title">🖥️ System Resources</div>
        <div class="card-subtitle" id="host-info">Connecting to host...</div>

        <div class="meter-container">
          <div class="meter-label">
            <span>Memory Usage</span>
            <span id="mem-val">0 MB / 0 MB</span>
          </div>
          <div class="meter-bar">
            <div class="meter-fill" id="mem-bar" style="width: 0%"></div>
          </div>
        </div>

        <div class="meter-container" style="margin-top: 12px;">
          <div class="meter-label">
            <span>Active Tasks</span>
            <span id="tasks-val">0 Running</span>
          </div>
          <div class="meter-bar">
            <div class="meter-fill" id="tasks-bar" style="width: 0%"></div>
          </div>
        </div>
      </div>

      <div class="glass-card" style="margin-top: 14px;">
        <div class="card-title">🤖 Subagents & Active Tasks</div>
        <div class="card-subtitle">Real-time background agent monitors</div>
        <div id="tasks-list" style="margin-top: 12px;">
          <div style="font-size: 13px; color: var(--text-subtle); text-align: center; padding: 16px 0;">
            No background subagents currently active
          </div>
        </div>
      </div>
    `;
  }

  updateStatus(status) {
    if (!status) return;

    const hostInfo = this.container.querySelector('#host-info');
    const memVal = this.container.querySelector('#mem-val');
    const memBar = this.container.querySelector('#mem-bar');
    const tasksVal = this.container.querySelector('#tasks-val');
    const tasksBar = this.container.querySelector('#tasks-bar');

    if (hostInfo) hostInfo.textContent = `${status.hostname} (${status.platform} ${status.arch}) | ${status.cpuCount} CPUs`;
    
    if (status.memory) {
      if (memVal) memVal.textContent = `${status.memory.usedMB} MB / ${status.memory.totalMB} MB (${status.memory.percent}%)`;
      if (memBar) memBar.style.width = `${status.memory.percent}%`;
    }

    if (tasksVal) tasksVal.textContent = `${status.activeTasksCount} Active`;
    if (tasksBar) tasksBar.style.width = status.activeTasksCount > 0 ? '60%' : '0%';
  }
}

window.TasksComponent = TasksComponent;
