/* ═══════════════════════════════════════════════════════
   InsightGrade AI — Utilities
═══════════════════════════════════════════════════════ */

// ── Toast ─────────────────────────────────────────────
function toast(message, type = "info", duration = 3500) {
  const container =
    document.getElementById("toast-container") ||
    (() => {
      const el = document.createElement("div");
      el.id = "toast-container";
      document.body.appendChild(el);
      return el;
    })();

  const icons = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span style="font-size:1.1rem">${icons[type] || "ℹ"}</span><span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ── Theme Engine ──────────────────────────────────────
const THEMES = [
  "dark-neon",
  "galaxy-purple",
  "cyber-blue",
  "academic-gold",
  "midnight-black",
];
const THEME_COLORS = {
  "dark-neon": "#63b3ed",
  "galaxy-purple": "#9f7aea",
  "cyber-blue": "#38bdf8",
  "academic-gold": "#fbbf24",
  "midnight-black": "#e2e8f0",
};
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("ig_theme", theme);
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });
}
function initTheme() {
  const saved = localStorage.getItem("ig_theme") || "dark-neon";
  applyTheme(saved);
}

// ── Auth State ────────────────────────────────────────
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("ig_user"));
  } catch {
    return null;
  }
}
function getToken() {
  return localStorage.getItem("ig_token");
}
function setSession(token, user) {
  localStorage.setItem("ig_token", token);
  localStorage.setItem("ig_user", JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem("ig_token");
  localStorage.removeItem("ig_user");
  window.location.href = "login.html";
}
function requireAuth() {
  if (!getToken()) window.location.href = "login.html";
}
function requireGuest() {
  if (getToken()) window.location.href = "dashboard.html";
}

// ── Loading States ────────────────────────────────────
function setLoading(btn, loading, text = "Loading...") {
  if (loading) {
    btn.disabled = true;
    btn._orig = btn.innerHTML;
    btn.innerHTML = `<span class="spinner" style="width:18px;height:18px;border-width:2px"></span> ${text}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn._orig || text;
  }
}

function skeletonRow(n = 3) {
  return Array.from(
    { length: n },
    () =>
      `<div class="skeleton" style="height:18px;margin-bottom:10px;border-radius:6px"></div>`,
  ).join("");
}

// ── Formatters ────────────────────────────────────────
function fmtGrade(marks) {
  if (marks >= 90)
    return { grade: "O", label: "Outstanding", color: "#68d391" };
  if (marks >= 80) return { grade: "A+", label: "Excellent", color: "#68d391" };
  if (marks >= 70) return { grade: "A", label: "Very Good", color: "#9f7aea" };
  if (marks >= 60) return { grade: "B+", label: "Good", color: "#63b3ed" };
  if (marks >= 50) return { grade: "B", label: "Average", color: "#fbbf24" };
  if (marks >= 40) return { grade: "C", label: "Pass", color: "#fc8074" };
  return { grade: "F", label: "Fail", color: "#fc8074" };
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtRelative(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ── Debounce ──────────────────────────────────────────
function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// ── Inject layout helpers ─────────────────────────────
function initBottomNav(active) {
  const navItems = document.querySelectorAll(".bottom-nav-item[data-page]");
  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.page === active);
    item.addEventListener("click", () => {
      window.location.href = item.dataset.href;
    });
  });
}

function fillUserInfo() {
  const user = getUser();
  if (!user) return;
  document
    .querySelectorAll("[data-user-name]")
    .forEach((el) => (el.textContent = user.name));
  document
    .querySelectorAll("[data-user-role]")
    .forEach((el) => (el.textContent = user.role));
  document
    .querySelectorAll("[data-user-initials]")
    .forEach((el) => (el.textContent = fmtInitials(user.name)));
  document
    .querySelectorAll("[data-user-dept]")
    .forEach((el) => (el.textContent = user.department || "—"));
  document
    .querySelectorAll("[data-user-roll]")
    .forEach((el) => (el.textContent = user.rollNumber || "—"));
}

// ── PDF Export helper ─────────────────────────────────
function exportPDF(title, contentHtml) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(99, 179, 237);
  doc.text(title, 20, 22);
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
  doc.setDrawColor(50, 50, 80);
  doc.line(20, 33, 190, 33);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(220, 220, 240);
  const lines = doc.splitTextToSize(contentHtml.replace(/<[^>]+>/g, ""), 170);
  doc.text(lines, 20, 40);
  doc.save(`${title.replace(/\s+/g, "-")}.pdf`);
}

// ── Animate counter ───────────────────────────────────
function animateCount(el, from, to, duration = 1200, decimals = 0) {
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 4);
    el.textContent = (from + (to - from) * ease).toFixed(decimals);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// ── Init on load ──────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  fillUserInfo();
  // Logout buttons
  document
    .querySelectorAll('[data-action="logout"]')
    .forEach((btn) => btn.addEventListener("click", clearSession));
  // Theme buttons
  document.querySelectorAll(".theme-btn").forEach((btn) =>
    btn.addEventListener("click", async () => {
      applyTheme(btn.dataset.theme);
      if (getToken()) {
        try {
          await API.auth.updateTheme(btn.dataset.theme);
        } catch {}
      }
    }),
  );
});
