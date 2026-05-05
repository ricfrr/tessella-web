/* ============================================================
   tessel·la v2 — minimal, type-led, traveling-dot parallax
   ============================================================ */

const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light"
}/*EDITMODE-END*/;

const { useState, useEffect, useRef, useCallback } = React;

/* ---------- Icons ---------- */
const Icon = {
  github: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...p}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.69-3.87-1.37-3.87-1.37-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.41-5.27 5.69.41.36.78 1.06.78 2.13v3.16c0 .31.21.66.8.55C20.21 21.39 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5Z"/>
    </svg>
  ),
  arrow: (p) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  ),
  sun: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>
    </svg>
  ),
  moon: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
    </svg>
  ),
};

/* ---------- Header ---------- */
function Header({ theme, setTheme }) {
  return (
    <header className="site-header">
      <div className="nav">
        <a href="#top" className="brand" aria-label="tessel·la home">
          tesse
          <span className="ll">
            l<span className="dot-mini"/>l
          </span>
          a
        </a>
        <ul className="nav-links">
          <li><a href="#projects">Projects</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#contact">Contact</a></li>
          <li className="always">
            <button
              className="theme-toggle"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Icon.sun/> : <Icon.moon/>}
            </button>
          </li>
        </ul>
      </div>
    </header>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section id="top" className="hero">
      <div>
        <h1 className="wordmark" aria-label="tessel·la">
          tesse<span style={{ display: "inline-block" }}>l</span>
          <span className="dot-stage" aria-hidden="true">
            <span className="orbit"/>
            <span className="orbit b"/>
            <span className="dot"/>
            <span className="sat s1"/>
            <span className="sat s2"/>
          </span>
          <span style={{ display: "inline-block" }}>l</span>a
        </h1>
        <p className="hero-sub">
          A small robotics studio. We build open, friendly tools for the people who actually work with robots.
        </p>
        <div className="hero-meta">
          <span><i className="led"/> shipping</span>
          <span>est. 2024</span>
          <span>open source</span>
        </div>
      </div>
      <div className="scroll-cue">scroll</div>
    </section>
  );
}

/* ---------- Cursor-reactive constellation ----------
   Anchors live at section boundaries. They are connected by a soft
   thread; the cursor pushes nearby points and the thread bends
   toward it, drawing attention to the link between sections. */
function Constellation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const mouse = { x: -9999, y: -9999, active: false }; // kept but unused
    let anchors = [];
    let traveler = null; // dot that walks the line
    let raf = 0;
    let t0 = performance.now();

    const readAccent = () => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2aa198";

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildAnchors();
    };

    const buildAnchors = () => {
      const sels = [".hero", "#projects", ".project", "#about", "#contact", "footer"];
      const vw = window.innerWidth;
      const cx = vw / 2;
      const sway = Math.min(vw * 0.18, 220);
      anchors = [];
      sels.forEach((sel, i) => {
        const els = document.querySelectorAll(sel);
        els.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const absY = rect.top + window.scrollY + rect.height * 0.5;
          const sign = (anchors.length % 2 === 0) ? -1 : 1;
          const x = cx + sign * sway * (0.4 + 0.6 * Math.sin(anchors.length * 1.3));
          anchors.push({ ax: x, ay: absY, x, y: absY, vx: 0, vy: 0 });
        });
      });
    };

    const tick = () => {
      const sy = window.scrollY;
      const vh = window.innerHeight;
      const accent = readAccent();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Anchors are calm now — spring untouched, no cursor influence
      for (const a of anchors) {
        const screenY = a.ay - sy;
        if (screenY < -200 || screenY > vh + 200) {
          a.x = a.ax; a.y = a.ay; a.vx = 0; a.vy = 0;
          continue;
        }
        const kx = (a.ax - a.x) * 0.06;
        const ky = (a.ay - a.y) * 0.06;
        a.vx = (a.vx + kx) * 0.82;
        a.vy = (a.vy + ky) * 0.82;
        a.x += a.vx;
        a.y += a.vy;
      }

      // Draw thread between consecutive anchors
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.22;

      for (let i = 0; i < anchors.length - 1; i++) {
        const a = anchors[i];
        const b = anchors[i + 1];
        const ay = a.y - sy;
        const by = b.y - sy;
        if ((ay < -50 && by < -50) || (ay > vh + 50 && by > vh + 50)) continue;
        // Bezier with control points pulled by the midpoint
        const mx = (a.x + b.x) / 2;
        const my = (ay + by) / 2;
        ctx.beginPath();
        ctx.moveTo(a.x, ay);
        ctx.bezierCurveTo(a.x, my, b.x, my, b.x, by);
        ctx.stroke();
      }

      // nodes removed — just the line
      ctx.globalAlpha = 1;

      // Traveling dot — a viewport guide. Always near the user's
      // current scroll position, gently leading down the page.
      if (anchors.length >= 2) {
        // Map scroll progress (0..1) to position along the path,
        // with a small lead so the dot sits just below the read line
        // and oscillates softly so it stays perceivable.
        const docH = Math.max(1, document.documentElement.scrollHeight - vh);
        const scrollT = Math.min(1, Math.max(0, sy / docH));
        const lead = 0.04 + 0.025 * Math.sin(performance.now() / 1100); // gentle bob
        const tt = Math.min(1, Math.max(0, scrollT + lead));
        const segs = anchors.length - 1;
        const seg = Math.min(segs - 1, Math.floor(tt * segs));
        const local = (tt * segs) - seg;
        const a = anchors[seg];
        const b = anchors[seg + 1];
        const ay = a.y - sy;
        const by = b.y - sy;
        const my = (ay + by) / 2;
        const u = local;
        const iu = 1 - u;
        const px = iu*iu*iu*a.x + 3*iu*iu*u*a.x + 3*iu*u*u*b.x + u*u*u*b.x;
        const py = iu*iu*iu*ay + 3*iu*iu*u*my + 3*iu*u*u*my + u*u*u*by;
        // flat dot, no shadow / no halo
        ctx.globalAlpha = 1;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(tick);
    };

    const onMove = () => {};
    const onLeave = () => {};
    const onScroll = () => {};

    resize();
    raf = requestAnimationFrame(tick);

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    // Rebuild anchors after layout settles / images load
    const rebuildT = setTimeout(buildAnchors, 400);
    const rebuildT2 = setTimeout(buildAnchors, 1500);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("scroll", onScroll);
      clearTimeout(rebuildT);
      clearTimeout(rebuildT2);
    };
  }, []);

  return <canvas className="constellation" ref={canvasRef} aria-hidden="true"/>;
}

/* ---------- Projects (RoboBoy) ---------- */
function Projects() {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);
  const VIDEO_SRC = "https://tessel.la/media/videos/robo-boy/roboboy_1080p.webm";

  const play = () => {
    setPlaying(true);
    setTimeout(() => { videoRef.current && videoRef.current.play().catch(() => {}); }, 50);
  };

  return (
    <section id="projects">
      <div className="wrap">
        <div className="section-head">
          <div className="titles">
            <span className="eyebrow">Projects</span>
            <h2>Open tools for<br/>the robot era.</h2>
          </div>
          <p className="lede">
            We make small, useful things. Each one is open source — peek inside, fork it, ship it.
          </p>
        </div>

        <article className="project reveal">
          <div className="project-meta">
            <span className="num">01 / Robo·Boy</span>
            <h3>A handheld console<br/>for ROS&nbsp;2 robots.</h3>
            <p>
              A web app that turns your phone into a retro-handheld controller. Custom gamepads,
              voice commands, live camera, theme-able visuals — works on any browser, on any robot.
            </p>
            <div className="project-tags">
              <span>ROS 2</span>
              <span>rosbridge</span>
              <span>React</span>
              <span>PWA</span>
              <span>MIT</span>
            </div>
            <div className="project-cta">
              <a className="btn btn--accent" href="https://github.com/tessel-la/robo-boy" target="_blank" rel="noopener">
                <Icon.github/> robo-boy
              </a>
              <button className="btn btn--ghost" onClick={() => { play(); document.querySelector(".project .media").scrollIntoView({ behavior: "smooth", block: "center" }); }}>
                Watch teaser <Icon.arrow/>
              </button>
            </div>
          </div>

          <div className={"media" + (playing ? " playing" : "")}>
            {playing ? (
              <video
                ref={videoRef}
                src={VIDEO_SRC}
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <div className="play-overlay" onClick={play} role="button" tabIndex={0} aria-label="Play teaser">
                <div className="play-btn" aria-hidden="true"/>
              </div>
            )}
            {!playing && <div className="scan"/>}
          </div>
        </article>

        {/* placeholder for future projects */}
        <article className="project reveal" style={{ opacity: 0.7 }}>
          <div className="project-meta">
            <span className="num">02 / next</span>
            <h3>Something else<br/>is on the bench.</h3>
            <p>
              We're cooking. If you want to know what's next — or want a hand wiring up your own
              robot — say hello below.
            </p>
            <div className="project-tags">
              <span>coming soon</span>
            </div>
          </div>
          <div className="media" style={{ background: "transparent", boxShadow: "none", border: "1px dashed var(--hairline)", display: "grid", placeItems: "center" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-mute)", letterSpacing: "0.18em" }}>
              ░ TBA ░
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

/* ---------- About ---------- */
function About() {
  const principles = [
    { num: "01", title: "Open by default", body: "Every line we ship is on GitHub. Fork it, break it, send it back better." },
    { num: "02", title: "Small over scalable", body: "We'd rather make one tool that you love than ten that gather dust." },
    { num: "03", title: "Friendly to humans", body: "Robots are weird. The software you use to talk to them shouldn't be." },
  ];
  return (
    <section id="about">
      <div className="wrap">
        <div className="section-head">
          <div className="titles">
            <span className="eyebrow">About</span>
            <h2>A small studio<br/>building friendly robots.</h2>
          </div>
          <p className="lede">
            <strong style={{ color: "var(--ink)", fontWeight: 500 }}>tessel·la</strong> is a robotics studio
            shipping open tools for students, hobbyists, and the engineers who keep their lab robot in a duffel bag.
            We like our software like our hardware: <em>simple</em>, <em>nostalgic</em>, and easy to take apart.
          </p>
        </div>

        <div className="about">
          <ol className="principles">
            {principles.map((p) => (
              <li key={p.num}>
                <span className="num">{p.num}</span>
                <div>
                  <h4>{p.title}</h4>
                  <p>{p.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div>
            <p>
              We started tessel·la because we wanted a controller that felt like a toy and worked like a tool —
              something you'd actually pull out of your pocket at the demo, not a dashboard that lives behind a VPN.
            </p>
            <p>
              Robo·Boy is the first thing. There will be more. If any of this resonates, the code is open and the
              door is open.
            </p>
            <div className="more">
              <a className="btn btn--ghost" href="https://github.com/tessel-la" target="_blank" rel="noopener">
                <Icon.github/> tessel-la on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Contact ---------- */
function Contact() {
  const [sent, setSent] = useState(false);
  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };
  return (
    <section id="contact">
      <div className="wrap">
        <div className="contact">
          <div>
            <span className="eyebrow">Contact</span>
            <h2>Got a robot<br/>you'd like to wire up?</h2>
            <p style={{ marginTop: 16, fontSize: 16, maxWidth: "44ch" }}>
              Tell us about it. We answer every message — usually within a day, sometimes from a robot.
            </p>
          </div>
          <form className="contact-form" onSubmit={onSubmit}>
            <div className="row">
              <input required type="text" placeholder="Your name"/>
              <input required type="email" placeholder="you@robot.lab"/>
            </div>
            <textarea required placeholder="What are you building?"/>
            <button className="btn btn--accent" type="submit" style={{ alignSelf: "flex-start" }}>
              {sent ? "Sent ✓" : "Send transmission"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  return (
    <footer>
      <div className="wrap footer-grid">
        <div>© {new Date().getFullYear()} · tessel·la</div>
        <div className="footer-links">
          <a href="https://github.com/tessel-la/robo-boy" target="_blank" rel="noopener">Robo·Boy</a>
          <a href="https://github.com/tessel-la" target="_blank" rel="noopener">GitHub</a>
          <a href="#contact">Contact</a>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Toast ---------- */
function Toast({ message }) {
  return <div className={"toast" + (message ? " show" : "")}>{message}</div>;
}

/* ---------- Tweaks panel ---------- */
function MyTweaks({ tweaks, setTweak }) {
  if (typeof TweaksPanel === "undefined") return null;
  return (
    <TweaksPanel>
      <TweakSection title="Theme">
        <TweakRadio
          value={tweaks.theme}
          onChange={(v) => setTweak("theme", v)}
          options={[
            { value: "light", label: "Light" },
            { value: "dark",  label: "Dark"  },
          ]}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

/* ---------- App ---------- */
function App() {
  const tweaksHook = (typeof useTweaks === "function") ? useTweaks(TWEAKS_DEFAULTS) : null;
  const [localTweaks, setLocalTweaks] = useState(TWEAKS_DEFAULTS);
  const T = tweaksHook ? tweaksHook[0] : localTweaks;
  const setT = tweaksHook ? tweaksHook[1] : (a, b) => {
    setLocalTweaks((prev) => typeof a === "object" ? { ...prev, ...a } : { ...prev, [a]: b });
  };

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("tessella-theme") || T.theme || "light";
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tessella-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (T.theme && T.theme !== theme) setTheme(T.theme);
  }, [T.theme]);

  // reveal-on-scroll
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const flash = useCallback((m) => {
    setToast(m);
    clearTimeout(flash._t);
    flash._t = setTimeout(() => setToast(null), 2400);
  }, []);

  return (
    <>
      <Header theme={theme} setTheme={setTheme}/>
      <Constellation/>
      <main>
        <Hero/>
        <Projects/>
        <About/>
        <Contact/>
      </main>
      <Footer/>
      <Toast message={toast}/>
      <MyTweaks tweaks={T} setTweak={setT}/>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
