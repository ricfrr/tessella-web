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

  /* ---------- The dot sets off: it leaves the wordmark on scroll and rides a dotted thread ----------
     The thread runs from the wordmark's dot through every scene to the logo's dot in the footer. The
     travelling dot stays pinned near 42% of the viewport and follows the thread's x at that height,
     easing off the wordmark at the top and landing in the logo at the bottom. */
  const seat = document.querySelector(".wm-dot");
  if (seat && !reduceMotion) {
    const canvas = document.createElement("canvas");
    const traveler = document.createElement("i");
    canvas.className = "thread";
    traveler.className = "traveler";
    canvas.setAttribute("aria-hidden", "true");
    traveler.setAttribute("aria-hidden", "true");
    document.body.append(canvas, traveler);
    const ctx = canvas.getContext("2d");
    const tangerine = getComputedStyle(root).getPropertyValue("--tangerine").trim() || "#FF8722";
    const TRAVEL_R = 8, REVEAL_AT = 1700, REVEAL_MS = 1100;
    const t0 = performance.now();
    const clamp01 = (v) => Math.min(1, Math.max(0, v));
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    let anchors = [], homeR = TRAVEL_R, landR = TRAVEL_R, queued = 0, revealed = false;

    // Anchors in document coordinates: the wordmark's dot, one per scene alternating sides, the footer logo's dot.
    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const s = seat.getBoundingClientRect();
      homeR = s.width / 2;
      anchors = [{ x: s.left + s.width / 2, y: s.top + s.height * 0.57 + scrollY }];
      const cx = innerWidth / 2, sway = Math.min(innerWidth * 0.3, 420);
      [["#robo-boy", 0.9], ["#about", -0.8], ["#contact", 0.7]].forEach(([sel, k]) => {
        const r = document.querySelector(sel)?.getBoundingClientRect();
        if (r) anchors.push({ x: cx + k * sway, y: r.top + scrollY + r.height / 2 });
      });
      // The logo mark's dot sits at (16, 17.7) of its 32-unit square, radius 3.9.
      const mark = document.querySelector(".site-footer .brand svg")?.getBoundingClientRect();
      if (mark) {
        landR = (3.9 / 32) * mark.width;
        anchors.push({ x: mark.left + mark.width * 0.5, y: mark.top + mark.height * (17.7 / 32) + scrollY });
      }
      schedule();
    };

    // x of the thread at viewport height y: invert the segment's cubic y(t) by bisection, then evaluate x(t).
    const threadX = (ys, y) => {
      if (y <= ys[0]) return anchors[0].x;
      for (let i = 0; i < ys.length - 1; i++) {
        const a = ys[i], b = ys[i + 1];
        if (y > b) continue;
        const m = (a + b) / 2;
        let lo = 0, hi = 1;
        for (let k = 0; k < 16; k++) {
          const t = (lo + hi) / 2, u = 1 - t;
          if (u * u * u * a + 3 * t * u * m + t * t * t * b < y) lo = t; else hi = t;
        }
        const t = (lo + hi) / 2;
        return (1 - t) * (1 - t) * (1 + 2 * t) * anchors[i].x + t * t * (3 - 2 * t) * anchors[i + 1].x;
      }
      return anchors[anchors.length - 1].x;
    };

    const tracePath = (ys) => {
      ctx.beginPath();
      ctx.moveTo(anchors[0].x, ys[0]);
      for (let i = 0; i < ys.length - 1; i++) {
        const m = (ys[i] + ys[i + 1]) / 2;
        ctx.bezierCurveTo(anchors[i].x, m, anchors[i + 1].x, m, anchors[i + 1].x, ys[i + 1]);
      }
    };

    const draw = (now) => {
      queued = 0;
      const sy = scrollY, vh = innerHeight, w = innerWidth;
      ctx.clearRect(0, 0, w, vh);
      if (anchors.length < 2) return;
      const ys = anchors.map((a) => a.y - sy);
      const first = ys[0], last = ys[ys.length - 1];

      // Where the dot rides: from its seat, to 42% of the viewport, to the footer logo over the last stretch.
      const span = Math.max(1, root.scrollHeight - vh);
      const f = clamp01(sy / span);
      const top = clamp01(f / 0.12), bottom = clamp01((f - 0.88) / 0.12);
      const y = Math.max(first, Math.min(last, first * (1 - top) + vh * 0.42 * (top - bottom) + last * bottom));
      const x = threadX(ys, y);
      const leave = ease(clamp01(sy / 240));
      const r = homeR + (TRAVEL_R - homeR) * leave + (landR - TRAVEL_R) * ease(bottom);

      // The thread draws itself out of the dot once the name has unfolded; scrolling finishes it at once.
      const reveal = revealed || sy > 1 ? 1 : ease(clamp01((now - t0 - REVEAL_AT) / REVEAL_MS));
      if (reveal < 1) schedule(); else revealed = true;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, reveal >= 1 ? vh : first + reveal * (vh - first));
      ctx.clip();
      ctx.strokeStyle = tangerine;
      ctx.fillStyle = tangerine;
      ctx.lineCap = "round";
      ctx.lineWidth = 3.5;
      ctx.setLineDash([0, 12]);
      // Behind the dot the thread is travelled (solid tangerine dots); ahead of it, faint.
      for (const [from, to, alpha] of [[-1, y, 0.95], [y, vh + 1, 0.4]]) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, from, w, to - from);
        ctx.clip();
        ctx.globalAlpha = alpha;
        tracePath(ys);
        ctx.stroke();
        ctx.restore();
      }
      // A station for each scene: a ring that fills once the dot has passed it.
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      for (let i = 1; i < ys.length - 1; i++) {
        if (ys[i] < -10 || ys[i] > vh + 10) continue;
        ctx.globalAlpha = ys[i] <= y ? 1 : 0.6;
        ctx.beginPath();
        ctx.arc(anchors[i].x, ys[i], 6, 0, Math.PI * 2);
        if (ys[i] <= y) ctx.fill(); else ctx.stroke();
      }
      ctx.restore();

      traveler.style.width = traveler.style.height = `${2 * r}px`;
      traveler.style.transform = `translate(${x - r}px, ${y - r}px)`;
      root.classList.toggle("dot-detached", sy > 1);
    };

    function schedule() { if (!queued) queued = requestAnimationFrame(draw); }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", layout);
    // Late fonts, the poster and the kinetic headings all move the scenes; re-anchor whenever the page resizes.
    new ResizeObserver(layout).observe(document.body);
    layout();
  }

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
  window.addEventListener("resize", () => { layoutTicks(); onScroll(); });
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
