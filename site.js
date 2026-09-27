(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme (same storage key as the docs) ---------- */
  const themeButton = document.querySelector(".theme-toggle");
  const systemDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
  const currentTheme = () => root.dataset.theme || (systemDark() ? "dark" : "light");
  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    try { localStorage.setItem("tessella-theme", theme); } catch (e) {}
    themeButton?.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
    updateTones();
  };
  themeButton?.addEventListener("click", () => applyTheme(currentTheme() === "dark" ? "light" : "dark"));

  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Kinetic headings: split into characters; the final stop is the dot ---------- */
  const kinetic = [...document.querySelectorAll(".kinetic")];
  kinetic.forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.textContent = "";
    let i = 0;
    const words = text.split(/\s+/);
    words.forEach((word, w) => {
      const span = document.createElement("span");
      span.className = "w";
      span.setAttribute("aria-hidden", "true");
      [...word].forEach((c, k) => {
        const ch = document.createElement("span");
        ch.className = "ch";
        if (k === word.length - 1 && /[.?!]/.test(c)) ch.classList.add("stop");
        ch.style.setProperty("--i", i++);
        ch.textContent = c;
        span.append(ch);
      });
      el.append(span);
      if (w < words.length - 1) el.append(" ");
    });
  });
  if (reduceMotion || !("IntersectionObserver" in window)) {
    kinetic.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.35 });
    kinetic.forEach((el) => io.observe(el));
  }

  /* ---------- Hook: the terminals implode exactly into the wordmark's dot ---------- */
  const terms = document.querySelector(".terms");
  const dot = document.querySelector(".wm-dot");
  const aimTerms = () => {
    if (!terms || !dot) return;
    const box = terms.getBoundingClientRect(), d = dot.getBoundingClientRect();
    terms.style.setProperty("--dx", `${d.left + d.width / 2 - (box.left + box.width / 2)}px`);
    terms.style.setProperty("--dy", `${d.top + d.height / 2 - (box.top + box.height * 0.46)}px`);
  };
  aimTerms();
  document.fonts?.ready.then(aimTerms);

  /* ---------- Header and HUD follow the ground beneath them ---------- */
  const header = document.querySelector(".site-header");
  const hud = document.querySelector(".hud");
  const scenes = [...document.querySelectorAll(".scene, .site-footer")];
  const toneOf = (el) => {
    if (!el) return "light";
    if (el.classList.contains("scene--cobalt")) return "cobalt";
    if (el.classList.contains("scene--night") || el.classList.contains("site-footer")) return "dark";
    return currentTheme() === "dark" ? "dark" : "light";
  };
  const sceneAt = (y) => scenes.find((s) => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
  function updateTones() {
    header && (header.dataset.tone = toneOf(sceneAt(36)));
    hud && (hud.dataset.tone = toneOf(sceneAt(window.innerHeight - 16)));
  }

  const rail = hud?.querySelector(".hud-rail");
  const head = hud?.querySelector(".hud-head");
  const hudLabel = hud?.querySelector(".hud-label");
  const hudTime = hud?.querySelector(".hud-time");
  const labelled = [...document.querySelectorAll(".scene[data-label]")];
  const layoutTicks = () => {
    if (!rail) return;
    rail.querySelectorAll(".tick").forEach((t) => t.remove());
    const span = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    labelled.forEach((s) => {
      const tick = document.createElement("i");
      tick.className = "tick";
      tick.style.left = `${Math.min(100, (s.offsetTop / span) * 100)}%`;
      rail.append(tick);
    });
  };
  const onScroll = () => {
    updateTones();
    if (!hud) return;
    const span = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const p = Math.min(1, Math.max(0, window.scrollY / span));
    head.style.left = `${p * 100}%`;
    hudTime.textContent = `${String(Math.round(p * 100)).padStart(3, "0")}%`;
    const current = [...labelled].reverse().find((s) => s.getBoundingClientRect().top <= window.innerHeight * 0.5) || labelled[0];
    hudLabel.textContent = current?.dataset.label || "";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { layoutTicks(); aimTerms(); onScroll(); });
  window.addEventListener("load", () => { layoutTicks(); onScroll(); });
  layoutTicks(); onScroll();

  /* ---------- Teaser: play on demand, chapters seek into it ---------- */
  const teaser = document.querySelector(".teaser");
  const video = document.getElementById("teaser");
  const chapterButtons = [...document.querySelectorAll(".chapters button")];
  const play = (at) => {
    if (!video) return;
    teaser.classList.add("playing");
    video.controls = true;
    const seek = () => { if (typeof at === "number") video.currentTime = at; video.play().catch(() => {}); };
    if (video.readyState >= 1) seek();
    else { video.addEventListener("loadedmetadata", seek, { once: true }); video.load(); }
  };
  document.querySelector(".teaser-play")?.addEventListener("click", () => play());
  chapterButtons.forEach((b) => b.addEventListener("click", () => play(Number(b.dataset.t))));
  video?.addEventListener("timeupdate", () => {
    const t = video.currentTime;
    let active = null;
    chapterButtons.forEach((b) => { if (t >= Number(b.dataset.t) - 0.05) active = b; });
    chapterButtons.forEach((b) => b.classList.toggle("is-active", b === active));
  });

  /* ---------- Contact: compose the message in the visitor's mail app ---------- */
  const CONTACT_EMAIL = "franceschini.ric@gmail.com";
  const form = document.querySelector(".contact-form");
  const status = form?.querySelector(".form-status");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim(), email = form.email.value.trim(), message = form.message.value.trim();
    if (!name || !email || !message || !form.email.checkValidity()) {
      status.textContent = "Add your name, a valid email and a message.";
      (!name ? form.name : !email || !form.email.checkValidity() ? form.email : form.message).focus();
      return;
    }
    const subject = encodeURIComponent(`tessel·la message from ${name}`);
    const body = encodeURIComponent(`From: ${name} <${email}>\n\n${message}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    status.textContent = "Opening your mail app…";
  });
})();
