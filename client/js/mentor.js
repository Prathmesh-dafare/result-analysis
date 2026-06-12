/* ═══════════════════════════════════════════════════════
   InsightGrade AI — AI Mentor & Features
═══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  fillUserInfo();
  initBottomNav('mentor');

  initMentor();
  loadRoadmap();
  loadResume();
});

// ── Chat Mentor ───────────────────────────────────────
const QUICK_PROMPTS = [
  'Why did my marks decrease?',
  'Which subject needs most improvement?',
  'How can I improve my CGPA?',
  'Am I at risk of getting a backlog?',
  'What should I study next?',
  'How do I manage my time better?',
];

function initMentor() {
  const messages = document.getElementById('chat-messages');
  if (!messages) return;

  // Welcome
  appendMsg('ai', `Hello! I'm your InsightGrade AI Mentor 🎓\n\nI have access to your complete academic profile and can answer specific questions about your performance. Try asking me something!`);

  // Quick prompts
  const qp = document.getElementById('quick-prompts');
  if (qp) {
    qp.innerHTML = QUICK_PROMPTS.map(p =>
      `<button class="swipe-tab" onclick="sendQuick('${p}')">${p}</button>`
    ).join('');
  }

  // Send button
  const sendBtn = document.getElementById('send-btn');
  const input   = document.getElementById('chat-input');
  if (sendBtn && input) {
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
  }
}

function sendQuick(text) {
  const input = document.getElementById('chat-input');
  if (input) { input.value = text; sendMessage(); }
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const btn   = document.getElementById('send-btn');
  const q     = input?.value?.trim();
  if (!q) return;
  input.value = '';
  appendMsg('user', q);
  showTyping();
  btn.disabled = true;
  try {
    const res = await API.ai.mentor(q);
    hideTyping();
    appendMsg('ai', res.response);
  } catch (err) {
    hideTyping();
    appendMsg('ai', '⚠️ ' + err.message);
  } finally {
    btn.disabled = false;
    input.focus();
  }
}

function appendMsg(role, text) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `chat-msg ${role}`;
  const initials = role === 'ai' ? '✦' : fmtInitials(getUser()?.name || 'U');
  const formatted = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/• /g, '• ');
  el.innerHTML = `
    <div class="user-avatar" style="${role==='ai'?'background:linear-gradient(135deg,var(--accent),var(--accent-2));font-size:0.9rem':''}">
      ${initials}
    </div>
    <div class="chat-bubble">${formatted}</div>`;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  const el = document.createElement('div');
  el.className = 'chat-msg ai'; el.id = 'typing-indicator';
  el.innerHTML = `<div class="user-avatar" style="background:linear-gradient(135deg,var(--accent),var(--accent-2));font-size:0.9rem">✦</div>
    <div class="chat-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  document.getElementById('chat-messages')?.appendChild(el);
  document.getElementById('chat-messages').scrollTop = 99999;
}
function hideTyping() { document.getElementById('typing-indicator')?.remove(); }

// ── Study Roadmap ─────────────────────────────────────
async function loadRoadmap() {
  const el = document.getElementById('roadmap-content');
  if (!el) return;
  el.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
  try {
    const res = await API.ai.roadmap();
    const r   = res.roadmap;
    el.innerHTML = `
      <div class="roadmap-grid">
        ${roadmapCard('Daily Plan 📅', r.daily)}
        ${roadmapCard('Weekly Goals 🎯', r.weekly)}
        ${roadmapCard('Monthly Milestones 🏆', r.monthly)}
      </div>
      ${r.weakSubjects?.length ? `
        <div class="glass chart-card mt-3">
          <div class="chart-title">⚠️ Focus Subjects</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
            ${r.weakSubjects.map(s => `<span class="badge badge-danger">${s}</span>`).join('')}
          </div>
        </div>` : ''}
      ${r.tips?.length ? `
        <div class="ai-box mt-3">
          <div class="ai-box-header"><span class="badge badge-info ai-badge">✦ AI TIPS</span></div>
          ${r.tips.map(t => `<div class="ai-text">• ${t}</div>`).join('')}
        </div>` : ''}`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
  }
}

function roadmapCard(title, items = []) {
  return `<div class="glass roadmap-card">
    <div class="roadmap-card-title">${title}</div>
    ${items.map(i => `<div class="roadmap-item">${i}</div>`).join('') || '<div class="roadmap-item" style="color:var(--text-muted)">No items</div>'}
  </div>`;
}

// ── Resume Generator ──────────────────────────────────
async function loadResume() {
  const el = document.getElementById('resume-content');
  if (!el) return;
  el.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
  try {
    const res = await API.ai.resume();
    const medals = ['🥇','🥈','🥉','🏅','⭐'];
    el.innerHTML = res.achievements.map((a, i) => `
      <div class="achievement-item">
        <div class="achievement-icon">${medals[i]||'✦'}</div>
        <div class="achievement-text">${a}</div>
        <button class="btn btn-ghost btn-sm" onclick="copyAchievement(this,'${a.replace(/'/g,"\\'")}')">Copy</button>
      </div>`).join('');
  } catch (err) {
    el.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
  }
}

function copyAchievement(btn, text) {
  navigator.clipboard.writeText('• ' + text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = orig, 1500);
  });
}

window.sendQuick = sendQuick;
window.copyAchievement = copyAchievement;
