// ===== STATE =====
let currentRole = 'patient';
let currentName = 'User';
let isLoading = false;
let selectedModel = 'llama3.2';

// ===== ONBOARDING =====
document.querySelectorAll('.role-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.role-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    currentRole = card.dataset.role;
  });
});

async function startSession() {
  const nameInput = document.getElementById('userName');
  currentName = nameInput.value.trim() || (currentRole === 'doctor' ? 'Dr. User' : 'User');

  try {
    const res = await fetch('/api/init_session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: currentRole, name: currentName })
    });
    const data = await res.json();

    // Transition to app
    document.getElementById('onboarding').style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => {
      document.getElementById('onboarding').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
      initApp();
    }, 300);
  } catch (err) {
    console.error('Session init error:', err);
    // Still proceed
    document.getElementById('onboarding').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    initApp();
  }
}

// ===== APP INIT =====
function initApp() {
  updateUserBadge();
  updateWelcome();
  loadQuickPrompts();
  loadExampleChips();
  focusInput();
}

function updateUserBadge() {
  const initial = currentName.charAt(0).toUpperCase();
  document.getElementById('sidebarAvatar').textContent = initial;
  document.getElementById('sidebarName').textContent = currentName;
  document.getElementById('sidebarRole').textContent = currentRole === 'doctor' ? 'Doctor / Clinician' : 'Patient';
  document.getElementById('roleBadge').textContent = currentRole === 'doctor' ? 'Doctor' : 'Patient';
  document.getElementById('topbarTitle').textContent = currentRole === 'doctor'
    ? 'Clinical Decision Support'
    : 'Medical Assistant';
}

function updateWelcome() {
  const nameDisplay = currentName.split(' ')[0];
  document.getElementById('welcomeTitle').textContent = `Hello, ${nameDisplay}!`;
  if (currentRole === 'doctor') {
    document.getElementById('welcomeText').textContent =
      'Welcome, clinician. Ask me about differential diagnoses, drug interactions, treatment guidelines, lab interpretation, and more.';
  } else {
    document.getElementById('welcomeText').textContent =
      'Ask me anything about your health — symptoms, medications, conditions, or general wellness. I\'m here to help guide you.';
  }
}

async function loadQuickPrompts() {
  try {
    const res = await fetch('/api/quick_prompts');
    const data = await res.json();
    const container = document.getElementById('quickPrompts');
    container.innerHTML = '';
    data.prompts.forEach(prompt => {
      const btn = document.createElement('button');
      btn.className = 'quick-prompt-btn';
      btn.textContent = prompt;
      btn.onclick = () => sendQuickPrompt(prompt);
      container.appendChild(btn);
    });
  } catch (err) {
    console.error('Quick prompts error:', err);
  }
}

async function loadExampleChips() {
  try {
    const res = await fetch('/api/quick_prompts');
    const data = await res.json();
    const container = document.getElementById('exampleChips');
    container.innerHTML = '';
    data.prompts.slice(0, 4).forEach(prompt => {
      const chip = document.createElement('button');
      chip.className = 'example-chip';
      chip.textContent = prompt;
      chip.onclick = () => sendQuickPrompt(prompt);
      container.appendChild(chip);
    });
  } catch (err) {}
}

function sendQuickPrompt(text) {
  const input = document.getElementById('messageInput');
  input.value = text;
  updateCharCount();
  sendMessage();
}

// ===== MESSAGING =====
async function sendMessage() {
  if (isLoading) return;

  const input = document.getElementById('messageInput');
  const message = input.value.trim();
  if (!message) return;

  // Clear welcome block
  const welcomeBlock = document.getElementById('welcomeBlock');
  if (welcomeBlock) welcomeBlock.remove();

  // Add user message
  addMessage('user', message);
  input.value = '';
  input.style.height = 'auto';
  updateCharCount();

  // Show typing indicator
  isLoading = true;
  setSendDisabled(true);
  const typingEl = showTypingIndicator();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    typingEl.remove();

    if (data.error) {
      addMessage('ai', `⚠️ Error: ${data.error}`);
    } else {
      addMessage('ai', data.response, data.timestamp);
    }
  } catch (err) {
    typingEl.remove();
    addMessage('ai', '⚠️ **Connection error.** Please make sure the server is running and Ollama is active.');
  } finally {
    isLoading = false;
    setSendDisabled(false);
    focusInput();
  }
}

function addMessage(role, content, timestamp = null) {
  const area = document.getElementById('messagesArea');
  const time = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const group = document.createElement('div');
  group.className = 'message-group';

  const msg = document.createElement('div');
  msg.className = `message ${role === 'user' ? 'user-msg' : 'ai-msg'}`;

  const avatar = document.createElement('div');
  avatar.className = `msg-avatar ${role === 'user' ? 'user-avatar-msg' : 'ai-avatar'}`;
  avatar.textContent = role === 'user' ? currentName.charAt(0).toUpperCase() : '✚';

  const msgContent = document.createElement('div');
  msgContent.className = 'msg-content';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  if (role === 'ai') {
    bubble.innerHTML = parseMarkdown(content);
  } else {
    bubble.textContent = content;
  }

  const timeEl = document.createElement('div');
  timeEl.className = 'msg-time';
  timeEl.textContent = time;

  msgContent.appendChild(bubble);

  if (role === 'ai') {
    const disclaimer = document.createElement('div');
    disclaimer.className = 'ai-disclaimer';
    disclaimer.innerHTML = `<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> Not a substitute for professional medical advice`;
    msgContent.appendChild(disclaimer);
  }

  msgContent.appendChild(timeEl);
  msg.appendChild(avatar);
  msg.appendChild(msgContent);
  group.appendChild(msg);

  area.appendChild(group);
  scrollToBottom();
}

function showTypingIndicator() {
  const area = document.getElementById('messagesArea');
  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';

  indicator.innerHTML = `
    <div class="msg-avatar ai-avatar">✚</div>
    <div class="typing-bubble">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;

  area.appendChild(indicator);
  scrollToBottom();
  return indicator;
}

function parseMarkdown(text) {
  if (typeof marked !== 'undefined') {
    try {
      marked.setOptions({ breaks: true, gfm: true });
      return marked.parse(text);
    } catch (e) {}
  }
  // Fallback basic parsing
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

// ===== INPUT HANDLERS =====
function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  updateCharCount();
}

function updateCharCount() {
  const val = document.getElementById('messageInput').value.length;
  document.getElementById('charCount').textContent = val || '';
}

function setSendDisabled(disabled) {
  document.getElementById('sendBtn').disabled = disabled;
}

function focusInput() {
  document.getElementById('messageInput').focus();
}

function scrollToBottom() {
  const area = document.getElementById('messagesArea');
  area.scrollTop = area.scrollHeight;
}

// ===== HISTORY / CLEAR =====
async function clearHistory() {
  try {
    await fetch('/api/clear_history', { method: 'POST' });
    const area = document.getElementById('messagesArea');
    area.innerHTML = '';

    // Restore welcome block
    const welcome = document.createElement('div');
    welcome.id = 'welcomeBlock';
    welcome.className = 'welcome-block';
    welcome.innerHTML = `
      <div class="welcome-icon">
        <svg viewBox="0 0 60 60" width="60" height="60" fill="none">
          <circle cx="30" cy="30" r="29" stroke="var(--accent)" stroke-width="1.2" opacity="0.4"/>
          <circle cx="30" cy="30" r="20" stroke="var(--accent)" stroke-width="1" opacity="0.2"/>
          <path d="M30 18v24M18 30h24" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </div>
      <h2 id="welcomeTitle">Conversation cleared</h2>
      <p id="welcomeText">Start a new conversation below.</p>
      <div class="example-chips" id="exampleChips"></div>
    `;
    area.appendChild(welcome);
    loadExampleChips();
  } catch (err) {
    console.error(err);
  }
}

// ===== SETTINGS =====
function openSettings() {
  document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettings() {
  document.getElementById('settingsModal').classList.add('hidden');
  const model = document.getElementById('modelSelect').value;
  selectedModel = model;
  document.getElementById('modelTag').textContent = `${model} · local`;
}

function setTheme(theme, btn) {
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
  localStorage.setItem('medai-theme', theme);
}

function resetSession() {
  closeSettings();
  document.getElementById('app').classList.add('hidden');
  document.getElementById('onboarding').classList.remove('hidden');
  document.getElementById('onboarding').style.animation = '';
}

// ===== SIDEBAR TOGGLE =====
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
}

// Close sidebar on outside click (mobile)
document.addEventListener('click', (e) => {
  const sidebar = document.querySelector('.sidebar');
  const menuBtn = document.getElementById('menuBtn');
  if (sidebar && sidebar.classList.contains('open')) {
    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  }
});

// Restore theme on load
(function() {
  const saved = localStorage.getItem('medai-theme');
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();

// Close modal on overlay click
document.getElementById('settingsModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('settingsModal')) {
    closeSettings();
  }
});
