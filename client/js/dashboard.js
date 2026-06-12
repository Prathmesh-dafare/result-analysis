/* ═══════════════════════════════════════════════════════
   InsightGrade AI — Dashboard
═══════════════════════════════════════════════════════ */
let resultsData = null,
  analyticsData = null;
let sgpaChart = null,
  subjectChart = null;

document.addEventListener("DOMContentLoaded", async () => {
  requireAuth();
  fillUserInfo();
  initBottomNav("dashboard");
  loadNotifBadge();
  await loadDashboard();
});

async function loadDashboard() {
  showSkeletons();
  try {
    const res = await API.results.my();
    resultsData = res.results;
    analyticsData = res.analytics;
    renderKPIs(analyticsData);
    renderSGPAChart(analyticsData);
    renderSubjectChart(analyticsData);
    renderHealthRing(analyticsData);
    renderTimeline(resultsData);
    renderHeatmap(resultsData);
    renderGalaxy(analyticsData);
    renderRankCard(analyticsData);
    loadAIStory();
  } catch (err) {
    toast(err.message, "error");
  }
}

// ── Skeletons ─────────────────────────────────────────
function showSkeletons() {
  document.querySelectorAll(".kpi-card").forEach((c) => {
    c.innerHTML = `<div class="skeleton" style="height:60px;margin-bottom:10px"></div>
                   <div class="skeleton" style="height:14px;width:60%"></div>`;
  });
}

// ── KPIs ──────────────────────────────────────────────
function renderKPIs(a) {
  if (!a) {
    document.getElementById("kpi-grid").innerHTML = emptyKPIs();
    return;
  }
  const kpis = [
    {
      id: "kpi-cgpa",
      val: a.cgpa,
      suffix: "",
      label: "CGPA",
      icon: "🎓",
      color: cgpaColor(a.cgpa),
    },
    {
      id: "kpi-sgpa",
      val: a.latestSGPA,
      suffix: "",
      label: "Latest SGPA",
      icon: "📊",
      color: "#63b3ed",
    },
    {
      id: "kpi-attendance",
      val: a.avgAttendance,
      suffix: "%",
      label: "Attendance",
      icon: "📅",
      color: a.avgAttendance >= 75 ? "#68d391" : "#fc8074",
    },
    {
      id: "kpi-health",
      val: a.healthScore,
      suffix: "",
      label: "Health Score",
      icon: "❤️",
      color: "#9f7aea",
    },
    {
      id: "kpi-rank",
      val: a.rank || "—",
      suffix: "",
      label: "Class Rank",
      icon: "🏆",
      color: "#fbbf24",
    },
    {
      id: "kpi-percentile",
      val: a.percentile || "—",
      suffix: a.percentile ? "%" : "",
      label: "Percentile",
      icon: "📈",
      color: "#68d391",
    },
  ];
  kpis.forEach((k) => {
    const el = document.getElementById(k.id);
    if (!el) return;
    el.innerHTML = `
      <div style="font-size:1.6rem;margin-bottom:8px">${k.icon}</div>
      <div class="kpi-value" id="${k.id}-val" style="color:${k.color}">0${k.suffix}</div>
      <div class="kpi-label">${k.label}</div>`;
    const valEl = document.getElementById(`${k.id}-val`);
    if (typeof k.val === "number") {
      animateCount(valEl, 0, k.val, 1400, k.val % 1 !== 0 ? 2 : 0);
      if (k.suffix) setTimeout(() => (valEl.textContent += k.suffix), 1400);
    } else {
      valEl.textContent = k.val;
    }
  });
}

function cgpaColor(v) {
  if (v >= 8.5) return "#68d391";
  if (v >= 7) return "#63b3ed";
  if (v >= 5.5) return "#fbbf24";
  return "#fc8074";
}

function emptyKPIs() {
  return `<div class="empty-state"><p>No results uploaded yet.</p></div>`;
}

// ── SGPA Chart ────────────────────────────────────────
function renderSGPAChart(a) {
  const canvas = document.getElementById("sgpa-chart");
  if (!canvas || !a) return;
  if (sgpaChart) sgpaChart.destroy();
  const labels = a.sgpas.map((s) => `Sem ${s.semester}`);
  const values = a.sgpas.map((s) => s.sgpa);
  if (a.predicted) {
    labels.push("Predicted");
    values.push(a.predicted);
  }

  sgpaChart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "SGPA",
          data: values,
          borderColor:
            getComputedStyle(document.documentElement)
              .getPropertyValue("--accent")
              .trim() || "#63b3ed",
          backgroundColor: "rgba(99,179,237,0.08)",
          borderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 8,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: values.map((v, i) =>
            i === values.length - 1 && a.predicted ? "#fbbf24" : "#63b3ed",
          ),
          segment: {
            borderDash: (ctx) =>
              ctx.p1DataIndex === values.length - 1 ? [6, 4] : [],
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0c1120",
          borderColor: "#ffffff15",
          borderWidth: 1,
        },
      },
      scales: {
        y: {
          min: 0,
          max: 10,
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: { color: "#94a3b8" },
        },
        x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
      },
    },
  });
}

// ── Subject Bar Chart ─────────────────────────────────
function renderSubjectChart(a) {
  const canvas = document.getElementById("subject-chart");
  if (!canvas || !a || !a.subjectAvgs.length) return;
  if (subjectChart) subjectChart.destroy();
  const subs = a.subjectAvgs.slice(-8);
  const colors = subs.map((s) =>
    s.status === "strong"
      ? "#68d391"
      : s.status === "average"
        ? "#fbbf24"
        : "#fc8074",
  );

  subjectChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: subs.map((s) =>
        s.name.length > 10 ? s.name.slice(0, 10) + "…" : s.name,
      ),
      datasets: [
        {
          label: "Avg Marks",
          data: subs.map((s) => s.avg),
          backgroundColor: colors.map((c) => c + "88"),
          borderColor: colors,
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 0,
          max: 100,
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: { color: "#94a3b8" },
        },
        x: {
          grid: { display: false },
          ticks: { color: "#94a3b8", maxRotation: 30 },
        },
      },
    },
  });
}

// ── Health Ring ───────────────────────────────────────
function renderHealthRing(a) {
  const wrap = document.getElementById("health-ring");
  if (!wrap) return;
  const score = a?.healthScore || 0;
  const color = score >= 75 ? "#68d391" : score >= 50 ? "#fbbf24" : "#fc8074";
  const r = 54,
    circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  wrap.innerHTML = `
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="12"/>
      <circle cx="70" cy="70" r="${r}" fill="none" stroke="${color}" stroke-width="12"
        stroke-linecap="round"
        stroke-dasharray="${dash} ${circ}"
        style="transition: stroke-dasharray 1.5s cubic-bezier(0.4,0,0.2,1); filter: drop-shadow(0 0 8px ${color}44)"/>
    </svg>
    <div class="health-ring-val" style="color:${color}">
      <span id="health-count">0</span><span>/100</span>
    </div>`;
  setTimeout(
    () => animateCount(document.getElementById("health-count"), 0, score, 1500),
    100,
  );
}

// ── Timeline ──────────────────────────────────────────
function renderTimeline(results) {
  const el = document.getElementById("timeline");
  if (!el) return;
  if (!results?.length) {
    el.innerHTML = '<div class="empty-state"><p>No results yet.</p></div>';
    return;
  }
  el.innerHTML = results
    .slice()
    .reverse()
    .map(
      (r, i) => `
    <div class="timeline-item" style="animation-delay:${i * 0.1}s">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-title">Semester ${r.semester} Results</div>
        <div class="timeline-desc">SGPA: <strong>${r.sgpa}</strong> · ${r.subjects.length} subjects · CGPA: ${r.cgpa || "—"}</div>
        <div class="timeline-time">${fmtDate(r.createdAt)}</div>
      </div>
      <span class="badge badge-${r.sgpa >= 8 ? "success" : r.sgpa >= 6 ? "info" : "warning"}">${r.sgpa >= 8 ? "Excellent" : r.sgpa >= 6 ? "Good" : "Average"}</span>
    </div>`,
    )
    .join("");
}

// ── Heatmap ───────────────────────────────────────────
function renderHeatmap(results) {
  const el = document.getElementById("heatmap");
  if (!el) return;
  const weeks = 20,
    days = 7;
  const subjects = results?.flatMap((r) => r.subjects) || [];
  const allMarks = subjects.map((s) => s.marks);
  // Simulate heatmap from marks
  const cells = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: days }, (_, d) => {
      const idx = w * days + d;
      const m = allMarks[idx % (allMarks.length || 1)] || 0;
      return m > 80 ? 4 : m > 60 ? 3 : m > 40 ? 2 : m > 0 ? 1 : 0;
    }),
  );
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  el.innerHTML = dayLabels
    .map(
      (day, d) => `
    <div class="heatmap-row">
      <span class="heatmap-label">${day}</span>
      ${cells.map((_, w) => `<div class="heatmap-cell" data-level="${cells[w][d]}" title="Week ${w + 1}, ${day}: Level ${cells[w][d]}"></div>`).join("")}
    </div>`,
    )
    .join("");
}

// ── Performance Galaxy (Canvas) ───────────────────────
function renderGalaxy(a) {
  const canvas = document.getElementById("galaxy-canvas");
  if (!canvas || !a?.subjectAvgs?.length) return;
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const subjects = a.subjectAvgs;
  const planets = subjects.map((s, i) => {
    const angle = (i / subjects.length) * Math.PI * 2;
    const radius = 80 + Math.random() * 100;
    const size = 14 + (s.avg / 100) * 28;
    const color =
      s.status === "strong"
        ? "#68d391"
        : s.status === "average"
          ? "#fbbf24"
          : "#fc8074";
    return {
      x: canvas.width / 2 + Math.cos(angle) * radius,
      y: canvas.height / 2 + Math.sin(angle) * radius,
      radius: size,
      color,
      name: s.name,
      avg: s.avg,
      status: s.status,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      origX: canvas.width / 2 + Math.cos(angle) * radius,
      origY: canvas.height / 2 + Math.sin(angle) * radius,
    };
  });
  let selectedPlanet = null;

  let hovered = null,
    mouse = { x: 0, y: 0 };
  let rotation = 0,
    dragging = false,
    lastX = 0;

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    hovered =
      planets.find(
        (p) => Math.hypot(p.x - mouse.x, p.y - mouse.y) < p.radius + 4,
      ) || null;
    canvas.style.cursor = hovered ? "pointer" : dragging ? "grabbing" : "grab";
    const tooltip = document.getElementById("planet-tooltip");
    if (tooltip) {
      if (hovered) {
        tooltip.style.opacity = "1";
        tooltip.style.left = mouse.x + 12 + "px";
        tooltip.style.top = mouse.y - 10 + "px";
        tooltip.innerHTML = `<strong>${hovered.name}</strong><br>Avg: ${hovered.avg}%<br>
          <span class="badge badge-${hovered.status === "strong" ? "success" : hovered.status === "average" ? "warning" : "danger"}">${hovered.status}</span>`;
      } else {
        tooltip.style.opacity = "0";
      }
    }
  });
  canvas.addEventListener("mousedown", (e) => {
    dragging = true;
    lastX = e.clientX;
  });
  canvas.addEventListener("mouseup", () => (dragging = false));
  canvas.addEventListener("mouseleave", () => {
    dragging = false;
    if (document.getElementById("planet-tooltip"))
      document.getElementById("planet-tooltip").style.opacity = "0";
  });
  canvas.addEventListener("mousemove", (e) => {
    if (dragging) {
      rotation += (e.clientX - lastX) * 0.003;
      lastX = e.clientX;
    }
  });

  // Touch support
  canvas.addEventListener("touchstart", (e) => {
    lastX = e.touches[0].clientX;
  });
  canvas.addEventListener(
    "touchmove",
    (e) => {
      rotation += (e.touches[0].clientX - lastX) * 0.004;
      lastX = e.touches[0].clientX;
      e.preventDefault();
    },
    { passive: false },
  );

  function drawStars() {
    for (let i = 0; i < 120; i++) {
      const x =
        (Math.sin(i * 127.1 + rotation * 0.05) * 0.5 + 0.5) * canvas.width;
      const y =
        (Math.sin(i * 311.7 + rotation * 0.03) * 0.5 + 0.5) * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.sin(i + Date.now() / 2000) * 0.1})`;
      ctx.fill();
    }
  }
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    selectedPlanet = null;

    planets.forEach((p) => {
      const distance = Math.hypot(mouseX - p.x, mouseY - p.y);

      if (distance < p.radius) {
        selectedPlanet = p;
      }
    });
  });
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background
    const bg = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      300,
    );
    bg.addColorStop(0, "rgba(99,179,237,0.04)");
    bg.addColorStop(1, "transparent");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawStars();

    // Central star
    const grd = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      30,
    );
    grd.addColorStop(0, "rgba(99,179,237,0.8)");
    grd.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 22, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    planets.forEach((p, i) => {
      const angle = rotation + (i / planets.length) * Math.PI * 2;
      const dist = Math.hypot(
        p.origX - canvas.width / 2,
        p.origY - canvas.height / 2,
      );
      p.x = canvas.width / 2 + Math.cos(angle) * dist;
      p.y = canvas.height / 2 + Math.sin(angle) * dist;

      // Orbit ring

      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, dist, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Glow
      const glow = ctx.createRadialGradient(
        p.x,
        p.y,
        0,
        p.x,
        p.y,
        p.radius * 2,
      );
      glow.addColorStop(0, p.color + "55");
      glow.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Planet body
      const grad = ctx.createRadialGradient(
        p.x - p.radius * 0.3,
        p.y - p.radius * 0.3,
        0,
        p.x,
        p.y,
        p.radius,
      );
      grad.addColorStop(0, "#fff9");
      grad.addColorStop(0.3, p.color);
      grad.addColorStop(1, p.color + "66");
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      if (hovered === p) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 20;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label
      ctx.font = `600 ${Math.max(10, p.radius * 0.55)}px DM Sans`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#000a";
      ctx.fillText(p.avg + "%", p.x, p.y);

      if (selectedPlanet === p) {
        const boxWidth = 180;
        const boxHeight = 60;

        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(
          p.x - boxWidth / 2,
          p.y - p.radius - 80,
          boxWidth,
          boxHeight,
        );

        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          p.x - boxWidth / 2,
          p.y - p.radius - 80,
          boxWidth,
          boxHeight,
        );

        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";

        ctx.fillText(p.name, p.x, p.y - p.radius - 55);

        ctx.font = "14px Arial";

        ctx.fillText(`Score: ${p.avg}%`, p.x, p.y - p.radius - 30);
      }
    });
    rotation += 0.002;
    requestAnimationFrame(animate);
  }
  animate();
}

// ── Rank Card ─────────────────────────────────────────
function renderRankCard(a) {
  const el = document.getElementById("rank-display");
  if (!el || !a) return;
  const rank = a.rank || "—";
  const total = 60; // fallback
  const pct = a.percentile || 0;
  el.innerHTML = `
    <div class="rank-number">${rank}</div>
    <div class="rank-label">Class Rank</div>
    <div class="rank-bar-wrap mt-3">
      <div class="rank-bar" id="rank-bar" style="width:0%"></div>
    </div>
    <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:6px">Top ${100 - pct}% of class</div>
    <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div style="text-align:center"><div style="font-family:var(--font-display);font-size:1.4rem;font-weight:700;color:var(--accent-2)">${pct}%</div><div style="font-size:0.72rem;color:var(--text-muted)">Percentile</div></div>
      <div style="text-align:center"><div style="font-family:var(--font-display);font-size:1.4rem;font-weight:700;color:var(--accent-3)">${a.distinctionProb}</div><div style="font-size:0.72rem;color:var(--text-muted)">Distinction</div></div>
    </div>`;
  setTimeout(() => {
    const bar = document.getElementById("rank-bar");
    if (bar) bar.style.width = pct + "%";
  }, 300);
}

// ── AI Story ──────────────────────────────────────────
async function loadAIStory() {
  const el = document.getElementById("ai-story");
  if (!el) return;
  el.textContent = "Generating your academic story...";
  try {
    const res = await API.ai.story();
    el.innerHTML = `<p class="story-text">${res.story}</p>`;
  } catch {
    el.innerHTML =
      '<p style="color:var(--text-muted);font-size:0.85rem">Story unavailable — add results first.</p>';
  }
}

// ── Notifications badge ───────────────────────────────
async function loadNotifBadge() {
  try {
    const res = await API.notifications.all();
    const unread = res.notifications.filter((n) => !n.read).length;
    const dot = document.querySelector(".notif-dot");
    if (dot) dot.style.display = unread ? "block" : "none";
    const badge = document.querySelector(
      '.bottom-nav-item[data-page="notifications"] .nav-pip',
    );
    if (badge) {
      if (unread) badge.style.display = "block";
    }
    renderNotifications(res.notifications);
  } catch {}
}

function renderNotifications(notifications) {
  const panel = document.getElementById("notif-panel");
  if (!panel) return;
  if (!notifications.length) {
    panel.innerHTML =
      '<div class="empty-state" style="padding:32px"><p>No notifications</p></div>';
    return;
  }
  panel.innerHTML =
    `
    <div class="flex-between" style="padding:14px 16px;border-bottom:1px solid var(--border)">
      <span style="font-weight:600;font-size:0.9rem">Notifications</span>
      <button class="btn btn-ghost btn-sm" onclick="clearNotifs()">Clear all</button>
    </div>` +
    notifications
      .slice(0, 10)
      .map(
        (n) => `
      <div class="notif-item ${n.read ? "" : "unread"}">
        ${n.read ? "" : '<div class="notif-dot-indicator"></div>'}
        <div>
          <div class="notif-text">${n.message}</div>
          <div class="notif-time">${fmtRelative(n.createdAt)}</div>
        </div>
      </div>`,
      )
      .join("");
}

async function clearNotifs() {
  await API.notifications.clear();
  document.getElementById("notif-panel").innerHTML =
    '<div class="empty-state" style="padding:32px"><p>No notifications</p></div>';
  const dot = document.querySelector(".notif-dot");
  if (dot) dot.style.display = "none";
}

// Toggle notif panel
document.addEventListener("click", (e) => {
  const btn = e.target.closest('[data-toggle="notif-panel"]');
  const panel = document.getElementById("notif-panel");
  if (!panel) return;
  if (btn) {
    panel.classList.toggle("open");
    if (panel.classList.contains("open"))
      API.notifications.markRead().catch(() => {});
  } else if (!panel.contains(e.target)) {
    panel.classList.remove("open");
  }
});
