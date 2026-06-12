/* ═══════════════════════════════════════════════════════
   InsightGrade AI — Analytics & Results
═══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();
  fillUserInfo();
  initBottomNav('analytics');
  await loadAnalytics();
  initUpload();
  initManualForm();
  initSearch();
});

async function loadAnalytics() {
  try {
    const res = await API.results.my();
    renderResultsList(res.results);
    renderPredictions(res.analytics);
  } catch (err) { toast(err.message, 'error'); }
}

// ── Results List ──────────────────────────────────────
function renderResultsList(results) {
  const el = document.getElementById('results-list');
  if (!el) return;
  if (!results?.length) {
    el.innerHTML = `<div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
      <h3>No results yet</h3>
      <p>Upload a CSV/Excel file or enter marks manually.</p>
    </div>`;
    return;
  }

  el.innerHTML = results.map(r => `
    <div class="glass" style="padding:20px;margin-bottom:14px" data-id="${r._id}">
      <div class="flex-between" style="margin-bottom:14px">
        <div>
          <div style="font-family:var(--font-display);font-weight:700;font-size:1.05rem">Semester ${r.semester} — ${r.year}</div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:3px">
            SGPA: <strong>${r.sgpa}</strong> · CGPA: <strong>${r.cgpa||'—'}</strong> · ${r.subjects.length} subjects
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="badge badge-${r.sgpa>=8?'success':r.sgpa>=6?'info':'warning'}">${r.sgpa>=8?'Distinction':r.sgpa>=6?'First Class':'Second Class'}</span>
          <button class="btn btn-ghost btn-sm" onclick="getInsight('${r._id}')">✦ AI Insight</button>
          <button class="btn btn-danger btn-sm" onclick="deleteResult('${r._id}')">✕</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px">
        ${r.subjects.map(s => {
          const g = fmtGrade(s.marks);
          return `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
            <div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:4px;truncate">${s.name}</div>
            <div style="display:flex;align-items:baseline;gap:6px">
              <span style="font-family:var(--font-display);font-weight:700;font-size:1.1rem;color:${g.color}">${s.marks}</span>
              <span style="font-size:0.72rem;color:var(--text-muted)">/${s.maxMarks}</span>
              <span class="badge" style="background:${g.color}22;color:${g.color};border-color:${g.color}44;margin-left:auto">${g.grade}</span>
            </div>
            ${s.attendance!=null?`<div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px">Attendance: ${s.attendance}%</div>`:''}
          </div>`;
        }).join('')}
      </div>
      <div id="insight-${r._id}" style="margin-top:14px;display:none"></div>
    </div>`).join('');
}

async function getInsight(id) {
  const el = document.getElementById(`insight-${id}`);
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = '<div class="loading-center" style="min-height:60px"><div class="spinner"></div></div>';
  try {
    const res = await API.ai.insight(id);
    el.innerHTML = `<div class="ai-box">
      <div class="ai-box-header"><span class="badge badge-info ai-badge">✦ AI INSIGHT</span></div>
      <div class="ai-text">${res.insight.replace(/\n/g,'<br>')}</div>
    </div>`;
  } catch (err) { el.innerHTML = `<div style="color:var(--text-muted);font-size:0.85rem">${err.message}</div>`; }
}

async function deleteResult(id) {
  if (!confirm('Delete this result? This cannot be undone.')) return;
  try {
    await API.results.remove(id);
    toast('Result deleted', 'success');
    loadAnalytics();
  } catch (err) { toast(err.message, 'error'); }
}

// ── Predictions ───────────────────────────────────────
function renderPredictions(a) {
  const el = document.getElementById('predictions');
  if (!el || !a) return;
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px">
      <div class="kpi-card">
        <div style="font-size:1.5rem">🔮</div>
        <div class="kpi-value" style="color:var(--accent)">${a.predicted||'—'}</div>
        <div class="kpi-label">Predicted SGPA</div>
      </div>
      <div class="kpi-card">
        <div style="font-size:1.5rem">🎓</div>
        <div class="kpi-value" style="color:${a.distinctionProb==='High'?'#68d391':a.distinctionProb==='Medium'?'#fbbf24':'#fc8074'}">${a.distinctionProb}</div>
        <div class="kpi-label">Distinction Probability</div>
      </div>
      <div class="kpi-card">
        <div style="font-size:1.5rem">⚠️</div>
        <div class="kpi-value" style="color:${a.backlogRisk==='Low'?'#68d391':'#fc8074'}">${a.backlogRisk}</div>
        <div class="kpi-label">Backlog Risk</div>
      </div>
    </div>`;
}

// ── File Upload ───────────────────────────────────────
function initUpload() {
  const zone = document.getElementById('drop-zone');
  const input= document.getElementById('file-input');
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]);
  });
  input.addEventListener('change', () => { if (input.files[0]) handleUpload(input.files[0]); });
}

async function handleUpload(file) {
  const allowed = ['.csv', '.xlsx', '.xls'];
  const ext = '.' + file.name.split('.').pop();
  if (!allowed.includes(ext)) { toast('Only CSV/Excel files allowed', 'error'); return; }
  const zone = document.getElementById('drop-zone');
  zone.innerHTML = '<div class="loading-center"><div class="spinner"></div><span style="margin-left:12px;font-size:0.9rem">Uploading...</span></div>';
  try {
    const res = await API.results.upload(file);
    toast(`Uploaded ${res.created} result(s)${res.errors.length?' · '+res.errors.length+' errors':''}`, 'success');
    if (res.errors.length) console.warn('Upload errors:', res.errors);
    loadAnalytics();
  } catch (err) { toast(err.message, 'error'); }
  zone.innerHTML = uploadZoneHTML();
}

function uploadZoneHTML() {
  return `<div style="text-align:center;padding:32px 20px">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 12px;color:var(--text-muted)"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
    <p style="color:var(--text-secondary);font-size:0.9rem">Drop CSV/Excel here or <span style="color:var(--accent);cursor:pointer">browse</span></p>
    <p style="font-size:0.75rem;color:var(--text-muted);margin-top:6px">Max 5MB · .csv, .xlsx, .xls</p>
  </div>`;
}

// ── Manual Entry Form ─────────────────────────────────
let subjectCount = 0;

function initManualForm() {
  const addBtn = document.getElementById('add-subject');
  if (addBtn) addBtn.addEventListener('click', addSubjectRow);
  addSubjectRow(); addSubjectRow(); addSubjectRow(); // default 3

  const form = document.getElementById('manual-form');
  if (form) form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type=submit]');
    setLoading(btn, true, 'Saving...');
    try {
      const rows  = document.querySelectorAll('.subject-row');
      const subjects = [];
      rows.forEach(row => {
        const name     = row.querySelector('[name=sub-name]')?.value?.trim();
        const marks    = +row.querySelector('[name=sub-marks]')?.value;
        const maxMarks = +row.querySelector('[name=sub-max]')?.value || 100;
        const credits  = +row.querySelector('[name=sub-credits]')?.value || 3;
        const attend   = row.querySelector('[name=sub-attend]')?.value;
        if (name && !isNaN(marks)) subjects.push({ name, marks, maxMarks, credits, attendance: attend?+attend:undefined });
      });
      if (!subjects.length) { toast('Add at least one subject', 'warning'); setLoading(btn, false); return; }

      await API.results.add({
        semester:    +document.getElementById('semester-input').value,
        year:        +document.getElementById('year-input').value,
        subjects,
        classRank:      +document.getElementById('rank-input')?.value || undefined,
        totalStudents:  +document.getElementById('total-input')?.value || undefined,
      });
      toast('Results saved! ✓', 'success');
      form.reset();
      document.getElementById('subjects-container').innerHTML = '';
      subjectCount = 0;
      addSubjectRow(); addSubjectRow(); addSubjectRow();
      loadAnalytics();
    } catch (err) { toast(err.message, 'error'); }
    setLoading(btn, false);
  });
}

function addSubjectRow() {
  subjectCount++;
  const container = document.getElementById('subjects-container');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'subject-row';
  row.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:center';
  row.innerHTML = `
    <input class="form-input" name="sub-name"    placeholder="Subject name" style="margin:0" required>
    <input class="form-input" name="sub-marks"   placeholder="Marks" type="number" min="0" max="100" style="margin:0" required>
    <input class="form-input" name="sub-max"     placeholder="Max" type="number" value="100" style="margin:0">
    <input class="form-input" name="sub-credits" placeholder="Credits" type="number" value="3" style="margin:0">
    <input class="form-input" name="sub-attend"  placeholder="Att%" type="number" min="0" max="100" style="margin:0">
    <button type="button" class="btn btn-danger btn-sm btn-icon" onclick="this.closest('.subject-row').remove()">✕</button>`;
  container.appendChild(row);
}

// ── Search ────────────────────────────────────────────
function initSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  const user = getUser();
  if (user?.role === 'student') { document.getElementById('search-section')?.classList.add('hidden'); return; }

  input.addEventListener('input', debounce(async () => {
    const q = input.value.trim();
    if (!q) { document.getElementById('search-results').innerHTML = ''; return; }
    try {
      const res = await API.results.search({ q });
      const el  = document.getElementById('search-results');
      if (!res.results.length) { el.innerHTML = '<div class="empty-state"><p>No results found</p></div>'; return; }
      el.innerHTML = res.results.map(r => `
        <div class="glass" style="padding:14px;margin-bottom:10px">
          <div class="flex-between">
            <div>
              <strong>${r.student?.name||'—'}</strong>
              <span style="color:var(--text-muted);font-size:0.8rem;margin-left:8px">${r.student?.rollNumber||''}</span>
            </div>
            <span class="badge badge-info">Sem ${r.semester}</span>
          </div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:6px">
            SGPA: ${r.sgpa} · CGPA: ${r.cgpa||'—'}
          </div>
        </div>`).join('');
    } catch {}
  }, 400));
}

window.getInsight    = getInsight;
window.deleteResult  = deleteResult;
window.addSubjectRow = addSubjectRow;
