/* ═══════════════════════════════════════════════════════
   InsightGrade AI — Auth
═══════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  requireGuest();

  // ── Register ────────────────────────────────────────
  const regForm = document.getElementById("register-form");
  if (regForm) {
    regForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = regForm.querySelector("[type=submit]");
      setLoading(btn, true, "Creating account...");
      try {
        const data = Object.fromEntries(new FormData(regForm));
        data.semester = +data.semester;
        const res = await API.auth.register(data);
        setSession(res.token, res.user);
        toast("Account created! Welcome 🎉", "success");
        setTimeout(() => (window.location.href = "dashboard.html"), 1000);
      } catch (err) {
        toast(err.message, "error");
        setLoading(btn, false);
      }
    });
  }

  // ── Login ────────────────────────────────────────────
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector("[type=submit]");
      setLoading(btn, true, "Signing in...");
      try {
        const { email, password } = Object.fromEntries(new FormData(loginForm));
        const res = await API.auth.login({ email, password });
        setSession(res.token, res.user);
        applyTheme(res.user.theme || "dark-neon");
        toast(`Welcome back, ${res.user.name.split(" ")[0]}!`, "success");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 800);
      } catch (err) {
        toast(err.message, "error");
        setLoading(btn, false);
      }
    });
  }

  // ── Forgot Password ──────────────────────────────────
  const forgotForm = document.getElementById("forgot-form");
  if (forgotForm) {
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = forgotForm.querySelector("[type=submit]");
      setLoading(btn, true, "Sending...");
      try {
        const { email } = Object.fromEntries(new FormData(forgotForm));
        const res = await API.auth.forgotPw(email);
        // Use EmailJS to send reset email with token
        if (window.emailjs && res.resetToken) {
          await emailjs.send(
            window.EMAILJS_SERVICE_ID || "",
            window.EMAILJS_TEMPLATE_ID || "",
            {
              to_email: email,
              reset_link: `${window.location.origin}/reset-password.html?token=${res.resetToken}`,
            },
            window.EMAILJS_PUBLIC_KEY || "",
          );
        }
        document.getElementById("forgot-success").classList.remove("hidden");
        forgotForm.classList.add("hidden");
        toast("Reset link sent to your email", "success");
      } catch (err) {
        toast(err.message, "error");
        setLoading(btn, false);
      }
    });
  }

  // ── Reset Password ───────────────────────────────────
  const resetForm = document.getElementById("reset-form");
  if (resetForm) {
    resetForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = resetForm.querySelector("[type=submit]");
      const token = new URLSearchParams(window.location.search).get("token");
      if (!token) {
        toast("Invalid reset link", "error");
        return;
      }
      const { password, confirm } = Object.fromEntries(new FormData(resetForm));
      if (password !== confirm) {
        toast("Passwords do not match", "error");
        return;
      }
      setLoading(btn, true, "Resetting...");
      try {
        const res = await API.auth.resetPw(token, password);
        setSession(res.token, res.user);
        toast("Password reset! Redirecting...", "success");
        setTimeout(() => (window.location.href = "dashboard.html"), 1200);
      } catch (err) {
        toast(err.message, "error");
        setLoading(btn, false);
      }
    });
  }

  // ── Password strength indicator ──────────────────────
  const pwInput = document.getElementById("password");
  if (pwInput) {
    pwInput.addEventListener("input", () => {
      const val = pwInput.value;
      const strength = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/, /.{8,}/].filter((r) =>
        r.test(val),
      ).length;
      const bar = document.getElementById("pw-strength-bar");
      const label = document.getElementById("pw-strength-label");
      if (!bar) return;
      const pct = strength * 25;
      const colors = ["", "#fc8074", "#fbbf24", "#63b3ed", "#68d391"];
      const labels = ["", "Weak", "Fair", "Good", "Strong"];
      bar.style.width = pct + "%";
      bar.style.background = colors[strength] || "transparent";
      if (label) {
        label.textContent = labels[strength] || "";
        label.style.color = colors[strength];
      }
    });
  }

  // ── Toggle password visibility ───────────────────────
  document.querySelectorAll("[data-toggle-pw]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.togglePw);
      if (!target) return;
      const isText = target.type === "text";
      target.type = isText ? "password" : "text";
      btn.querySelector("[data-eye]").style.display = isText ? "block" : "none";
      btn.querySelector("[data-eye-off]").style.display = isText
        ? "none"
        : "block";
    });
  });
});
