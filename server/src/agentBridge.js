const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class AgentBridge {
  constructor() {
    this.activeWorkspace = process.cwd();
    this.tasks = new Map();
    this.history = [];
    this.model = 'gemini-3.6-flash';
    this.isProcessing = false;
  }

  getSystemStatus() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime: Math.floor(os.uptime()),
      cpuCount: cpus.length,
      cpuModel: cpus[0] ? cpus[0].model : 'Unknown',
      memory: {
        totalMB: Math.round(totalMem / (1024 * 1024)),
        usedMB: Math.round(usedMem / (1024 * 1024)),
        freeMB: Math.round(freeMem / (1024 * 1024)),
        percent: Math.round((usedMem / totalMem) * 100)
      },
      activeWorkspace: this.activeWorkspace,
      currentModel: this.model,
      activeTasksCount: this.tasks.size
    };
  }

  setModel(newModel) {
    this.model = newModel;
    return { success: true, model: this.model };
  }

  listWorkspaceFiles(dirPath = this.activeWorkspace, relativeTo = this.activeWorkspace) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const items = [];

      for (const entry of entries) {
        if (entry.name.startsWith('.') && entry.name !== '.env') continue;
        if (entry.name === 'node_modules') continue;

        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.relative(relativeTo, fullPath);

        if (entry.isDirectory()) {
          items.push({
            name: entry.name,
            path: relPath,
            isDir: true,
            children: this.listWorkspaceFiles(fullPath, relativeTo)
          });
        } else {
          const stats = fs.statSync(fullPath);
          items.push({
            name: entry.name,
            path: relPath,
            isDir: false,
            sizeBytes: stats.size,
            modified: stats.mtime
          });
        }
      }

      return items;
    } catch (err) {
      console.error(`Error reading directory ${dirPath}:`, err);
      return [];
    }
  }

  readFileContent(filePath) {
    try {
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(this.activeWorkspace, filePath);

      if (!fullPath.startsWith(this.activeWorkspace)) {
        return { error: 'Access denied: outside workspace bounds' };
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      return { path: filePath, content, success: true };
    } catch (err) {
      return { error: err.message, success: false };
    }
  }

  executePrompt(prompt, broadcastFn) {
    if (this.isProcessing) {
      return { error: 'Agent is currently processing another task.' };
    }

    this.isProcessing = true;
    const taskId = `task_${Date.now()}`;
    const startTime = Date.now();

    broadcastFn({
      type: 'agent_start',
      taskId,
      prompt,
      model: this.model,
      timestamp: startTime
    });

    // Simulate real-time Antigravity Agent response with thinking deltas & tool calls
    const steps = [
      { type: 'thought', content: `Analyzing user request: "${prompt}"...` },
      { type: 'thought', content: `Searching active workspace (${this.activeWorkspace}) for files...` },
      { type: 'tool_call', tool: 'list_dir', args: { DirectoryPath: this.activeWorkspace } },
      { type: 'thought', content: `Context updated. Processing logic using model ${this.model}...` },
    ];

    let currentStepIndex = 0;
    const stepInterval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        const step = steps[currentStepIndex];
        broadcastFn({
          type: step.type === 'thought' ? 'agent_thought' : 'agent_tool_call',
          taskId,
          ...step,
          timestamp: Date.now()
        });
        currentStepIndex++;
      } else {
        clearInterval(stepInterval);
        
        // Stream text response chunks
        const chunks = [
          `Received your request: **"${prompt}"**.\n\n`,
          `Google Antigravity agent is executing in workspace \`${this.activeWorkspace}\`.\n`,
          `Active model: \`${this.model}\`.\n\n`,
          `### Execution Summary\n`,
          `- Status: **Completed successfully**\n`,
          `- Workspace context: Checked\n`,
          `- System status: Operational\n\n`,
          `Ready for your next remote command!`
        ];

        let chunkIndex = 0;
        const chunkInterval = setInterval(() => {
          if (chunkIndex < chunks.length) {
            broadcastFn({
              type: 'agent_chunk',
              taskId,
              chunk: chunks[chunkIndex],
              timestamp: Date.now()
            });
            chunkIndex++;
          } else {
            clearInterval(chunkInterval);
            this.isProcessing = false;
            
            const historyItem = {
              id: taskId,
              prompt,
              response: chunks.join(''),
              timestamp: startTime,
              durationMs: Date.now() - startTime
            };
            this.history.push(historyItem);

            broadcastFn({
              type: 'agent_complete',
              taskId,
              historyItem,
              timestamp: Date.now()
            });
          }
        }, 150);
      }
    }, 400);

    return { taskId, status: 'started' };
  }

  cancelTask(taskId) {
    if (this.isProcessing) {
      this.isProcessing = false;
      return { success: true, message: `Task ${taskId} cancelled` };
    }
    return { success: false, message: 'No active processing task to cancel' };
  }

  getArtifactsList() {
    const brainDir = path.join(os.homedir(), '.gemini/antigravity/brain');
    try {
      if (!fs.existsSync(brainDir)) return [];
      
      const convs = fs.readdirSync(brainDir);
      const artifacts = [];

      for (const conv of convs) {
        const convPath = path.join(brainDir, conv);
        if (fs.statSync(convPath).isDirectory()) {
          const files = fs.readdirSync(convPath);
          for (const file of files) {
            if (file.endsWith('.md')) {
              const filePath = path.join(convPath, file);
              const stats = fs.statSync(filePath);
              artifacts.push({
                conversationId: conv,
                filename: file,
                fullPath: filePath,
                sizeBytes: stats.size,
                modified: stats.mtime
              });
            }
          }
        }
      }
      return artifacts.sort((a, b) => b.modified - a.modified);
    } catch (err) {
      console.error('Error fetching artifacts:', err);
      return [];
    }
  }
}

module.exports = new AgentBridge();
