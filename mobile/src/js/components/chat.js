class ChatComponent {
  constructor(containerEl) {
    this.container = containerEl;
    this.messagesList = null;
    this.currentResponseBubble = null;
    this.currentThoughtBox = null;
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="chat-container">
        <div class="quick-commands">
          <button class="cmd-pill" data-cmd="/goal">🎯 /goal</button>
          <button class="cmd-pill" data-cmd="/schedule">⏰ /schedule</button>
          <button class="cmd-pill" data-cmd="/planning">📋 /planning</button>
          <button class="cmd-pill" data-cmd="/skills">🧩 /skills</button>
          <button class="cmd-pill" data-cmd="/mcp">🔌 /mcp</button>
          <button class="cmd-pill" data-cmd="/clear">🗑️ /clear</button>
        </div>

        <div class="messages-list" id="chat-messages">
          <div class="message-bubble agent">
            👋 Welcome to <strong>Antigravity Remote</strong>!<br/>
            You can manage agents, execute commands, view subagents, and browse workspace files directly from your mobile device.
          </div>
        </div>

        <div class="chat-input-bar">
          <input type="text" class="chat-input" id="prompt-input" placeholder="Type prompt or command..." />
          <button class="send-btn" id="send-prompt-btn">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
    `;

    this.messagesList = this.container.querySelector('#chat-messages');
    const inputEl = this.container.querySelector('#prompt-input');
    const sendBtn = this.container.querySelector('#send-prompt-btn');

    const sendAction = () => {
      const text = inputEl.value.trim();
      if (text) {
        this.addUserMessage(text);
        window.remoteWS.send({ type: 'prompt', prompt: text });
        inputEl.value = '';
      }
    };

    sendBtn.addEventListener('click', sendAction);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendAction();
    });

    this.container.querySelectorAll('.cmd-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        inputEl.value = pill.dataset.cmd + ' ';
        inputEl.focus();
      });
    });

    // Handle incoming streaming WebSocket events
    window.remoteWS.on('agent_start', (data) => {
      this.currentResponseBubble = document.createElement('div');
      this.currentResponseBubble.className = 'message-bubble agent';
      this.currentThoughtBox = null;
      this.messagesList.appendChild(this.currentResponseBubble);
      this.scrollToBottom();
    });

    window.remoteWS.on('agent_thought', (data) => {
      if (!this.currentThoughtBox && this.currentResponseBubble) {
        this.currentThoughtBox = document.createElement('div');
        this.currentThoughtBox.className = 'thought-box';
        this.currentResponseBubble.appendChild(this.currentThoughtBox);
      }
      if (this.currentThoughtBox) {
        this.currentThoughtBox.textContent = `💭 ${data.content}`;
        this.scrollToBottom();
      }
    });

    window.remoteWS.on('agent_tool_call', (data) => {
      if (this.currentResponseBubble) {
        const tag = document.createElement('div');
        tag.className = 'tool-tag';
        tag.innerHTML = `⚙️ ${data.tool}`;
        this.currentResponseBubble.appendChild(tag);
        this.scrollToBottom();
      }
    });

    window.remoteWS.on('agent_chunk', (data) => {
      if (this.currentResponseBubble) {
        let textNode = this.currentResponseBubble.querySelector('.agent-text-content');
        if (!textNode) {
          textNode = document.createElement('div');
          textNode.className = 'agent-text-content';
          this.currentResponseBubble.appendChild(textNode);
        }
        textNode.innerHTML += data.chunk.replace(/\n/g, '<br/>');
        this.scrollToBottom();
      }
    });
  }

  addUserMessage(text) {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble user';
    bubble.textContent = text;
    this.messagesList.appendChild(bubble);
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.messagesList.scrollTop = this.messagesList.scrollHeight;
  }
}

window.ChatComponent = ChatComponent;
