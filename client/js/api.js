/* ═══════════════════════════════════════════════════════
   InsightGrade AI — API Client
═══════════════════════════════════════════════════════ */
const BASE_URL = "http://127.0.0.1:5000"; // Same origin

const API = {
  _token: () => localStorage.getItem("ig_token"),

  _headers() {
    const h = { "Content-Type": "application/json" };
    const t = this._token();
    if (t) h["Authorization"] = `Bearer ${t}`;
    return h;
  },

  async _req(method, path, body) {
    const opts = { method, headers: this._headers() };
    if (body) opts.body = JSON.stringify(body);
    try {
      const res = await fetch(BASE_URL + path, opts);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      return data;
    } catch (err) {
      if (err.message === "Failed to fetch")
        throw new Error("Network error — check server");
      throw err;
    }
  },

  get: (path) => API._req("GET", path),
  post: (path, body) => API._req("POST", path, body),
  put: (path, body) => API._req("PUT", path, body),
  delete: (path) => API._req("DELETE", path),

  // ── Auth ──────────────────────────────────────────────
  auth: {
    register: (data) => API.post("/api/auth/register", data),
    login: (data) => API.post("/api/auth/login", data),
    me: () => API.get("/api/auth/me"),
    forgotPw: (email) => API.post("/api/auth/forgot-password", { email }),
    resetPw: (token, password) =>
      API.put(`/api/auth/reset-password/${token}`, { password }),
    updateTheme: (theme) => API.put("/api/auth/update-theme", { theme }),
  },

  // ── Results ───────────────────────────────────────────
  results: {
    my: () => API.get("/api/results/my"),
    student: (id) => API.get(`/api/results/student/${id}`),
    add: (data) => API.post("/api/results/manual", data),
    remove: (id) => API.delete(`/api/results/${id}`),
    search: (params) =>
      API.get(`/api/results/search?${new URLSearchParams(params)}`),

    upload: async (file) => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${BASE_URL}/api/results/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${API._token()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    },
  },

  // ── AI ────────────────────────────────────────────────
  ai: {
    mentor: (question) => API.post("/api/ai/mentor", { question }),
    roadmap: () => API.get("/api/ai/roadmap"),
    story: () => API.get("/api/ai/story"),
    resume: () => API.get("/api/ai/resume"),
    insight: (id) => API.get(`/api/ai/insight/${id}`),
  },

  // ── Users ─────────────────────────────────────────────
  users: {
    all: () => API.get("/api/users"),
    updateProfile: (data) => API.put("/api/users/profile", data),
  },

  // ── Notifications ─────────────────────────────────────
  notifications: {
    all: () => API.get("/api/notifications"),
    markRead: () => API.put("/api/notifications/read"),
    clear: () => API.delete("/api/notifications"),
  },

  admin: {
    stats: () => API.get("/api/admin/stats"),

    users: () => API.get("/api/admin/users"),

    createTeacher: (data) => API.post("/api/admin/teachers", data),

    deleteUser: (id) => API.delete(`/api/admin/users/${id}`),
  },
};
