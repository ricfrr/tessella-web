/* ============================================================
   tessel·la — app.jsx
   Y2K translucent plastic, single-page, deploy on GitHub Pages
   ============================================================ */

const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light"
}/*EDITMODE-END*/;

const { useState, useEffect, useRef, useCallback } = React;

/* ---------- Icons ---------- */
const Icon = {
  bolt: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>
    </svg>
  ),
  pad: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="2" y="7" width="20" height="12" rx="6"/>
      <path d="M7 13h4M9 11v4"/><circle cx="16" cy="11" r="1"/><circle cx="18" cy="14" r="1"/>
    </svg>
  ),
  mic: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="9" y="3" width="6" height="11" rx="3"/>
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>
    </svg>
  ),
  cam: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3z"/>
    </svg>
  ),
  swatch: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 3h7v18a4 4 0 0 1-4-4V3z"/><path d="M10 12 17 5l3 3-7 7"/><path d="M10 21h11v-7"/>
    </svg>
  ),
  net: (p) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="12" cy="18" r="2.4"/>
      <path d="M7.5 7.5 11 16M16.5 7.5 13 16M8 6h8"/>
    </svg>
  ),
  github: (p) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...p}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.69-3.87-1.37-3.87-1.37-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.41-5.27 5.69.41.36.78 1.06.78 2.13v3.16c0 .31.21.66.8.55C20.21 21.39 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5Z"/>
    </svg>
  ),
  arrow: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  ),
  sun: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>
    </svg>
  ),
  moon: (p) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
    </svg>
  ),
};

/* ---------- Mascot SVG (the little robo-boy) ---------- */
function Mascot({ size = 96 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mbody" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="40%" stopColor="oklch(0.85 0.12 225)"/>
          <stop offset="100%" stopColor="oklch(0.5 0.16 240)"/>
        </radialGradient>
        <radialGradient id="meye" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fff"/>
          <stop offset="100%" stopColor="oklch(0.86 0.18 130)"/>
        </radialGradient>
      </defs>
      {/* antenna */}
      <line x1="50" y1="14" x2="50" y2="4" stroke="oklch(0.4 0.15 240)" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="50" cy="3" r="3.5" fill="oklch(0.86 0.18 130)" stroke="oklch(0.4 0.15 240)" strokeWidth="1.2"/>
      {/* head */}
      <rect x="22" y="14" width="56" height="46" rx="14" fill="url(#mbody)" stroke="oklch(0.4 0.15 240 / 0.5)" strokeWidth="1"/>
      {/* visor */}
      <rect x="28" y="24" width="44" height="20" rx="8" fill="oklch(0.18 0.05 240)"/>
      <rect x="30" y="26" width="30" height="6" rx="3" fill="oklch(0.85 0.10 200 / 0.4)"/>
      {/* eyes */}
      <circle cx="40" cy="34" r="3.5" fill="url(#meye)"/>
      <circle cx="60" cy="34" r="3.5" fill="url(#meye)"/>
      {/* mouth */}
      <rect x="40" y="50" width="20" height="4" rx="1.5" fill="oklch(0.4 0.15 240 / 0.5)"/>
      {/* body */}
      <rect x="32" y="60" width="36" height="22" rx="8" fill="url(#mbody)" stroke="oklch(0.4 0.15 240 / 0.5)" strokeWidth="1"/>
      {/* led on chest */}
      <circle cx="50" cy="71" r="3" fill="oklch(0.78 0.18 25)" stroke="oklch(0.4 0.15 25)" strokeWidth="0.8">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite"/>
      </circle>
      {/* legs */}
      <rect x="36" y="82" width="8" height="14" rx="3" fill="url(#mbody)" stroke="oklch(0.4 0.15 240 / 0.5)" strokeWidth="0.8"/>
      <rect x="56" y="82" width="8" height="14" rx="3" fill="url(#mbody)" stroke="oklch(0.4 0.15 240 / 0.5)" strokeWidth="0.8"/>
    </svg>
  );
}

/* ---------- Boot screen inside device ---------- */
function BootScreen({ pressed }) {
  const [lines, setLines] = useState([]);
  const lineSet = [
    { txt: "tessel·la OS  v1.0  © 2025", cls: "" },
    { txt: "boot: discovering rosbridge...", cls: "ok", tail: " ok" },
    { txt: "node /joy_node ............ ", cls: "ok", tail: " up" },
    { txt: "node /cmd_vel ............. ", cls: "ok", tail: " up" },
    { txt: "node /robo_boy ............ ", cls: "ok", tail: " up" },
    { txt: "telemetry: 60 hz", cls: "" },
    { txt: "ready.", cls: "warn" },
  ];

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      setLines(lineSet.slice(0, i));
      if (i >= lineSet.length) clearInterval(t);
    }, 380);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="screen">
      <div className="screen-glow"/>
      <div className="screen-content">
        <div className="screen-bar">
          <span>RB-1 · CONNECTED</span>
          <span className="screen-row">
            <i className="pip" style={{ background: "oklch(0.86 0.18 130)" }}/>
            <i className="pip" style={{ background: "oklch(0.78 0.18 25)" }}/>
            <i className="pip" style={{ background: "oklch(0.78 0.16 280)" }}/>
          </span>
        </div>
        {lines.map((l, i) => (
          <div className="boot-line" key={i}>
            &gt; {l.txt}
            <span className={l.cls}>{l.tail}</span>
          </div>
        ))}
        {lines.length >= lineSet.length && (
          <div className="boot-line" style={{ marginTop: "auto" }}>
            input: <strong style={{ color: pressed ? "oklch(0.86 0.18 130)" : "oklch(0.85 0.10 200)" }}>{pressed || "—"}</strong>
            <span className="cursor"/>
          </div>
        )}
      </div>
      <div className="screen-scan"/>
    </div>
  );
}

/* ---------- Hero device ---------- */
function HeroDevice() {
  const [pressed, setPressed] = useState(null);
  const [stickerRot, setStickerRot] = useState(8);

  const press = (k) => {
    setPressed(k);
    setTimeout(() => setPressed((p) => (p === k ? null : p)), 600);
  };

  // keyboard control
  useEffect(() => {
    const map = { ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→", Enter: "●", a: "A", b: "B" };
    const onKey = (e) => {
      const k = map[e.key];
      if (k) { press(k); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="device-stage" aria-label="RoboBoy translucent device">
      <div className="device">
        <BootScreen pressed={pressed}/>
        <div className="controls">
          <div className="dpad" role="group" aria-label="d-pad">
            <button className={"up" + (pressed === "↑" ? " pressed" : "")} onClick={() => press("↑")} aria-label="up">▲</button>
            <button className={"left" + (pressed === "←" ? " pressed" : "")} onClick={() => press("←")} aria-label="left">◀</button>
            <button className={"center" + (pressed === "●" ? " pressed" : "")} onClick={() => press("●")} aria-label="select">●</button>
            <button className={"right" + (pressed === "→" ? " pressed" : "")} onClick={() => press("→")} aria-label="right">▶</button>
            <button className={"down" + (pressed === "↓" ? " pressed" : "")} onClick={() => press("↓")} aria-label="down">▼</button>
          </div>
          <div className="ab-cluster">
            <button className="ab-btn b" onClick={() => press("B")}>B</button>
            <button className="ab-btn"   onClick={() => press("A")}>A</button>
          </div>
        </div>
        <div
          className="sticker"
          style={{ transform: `rotate(${stickerRot}deg)` }}
          onClick={() => setStickerRot((r) => r + 12)}
          title="click me"
        >
          <strong>BETA</strong>
          serial · 0xRB-1<br/>made in robotics
        </div>
      </div>
      <div style={{ position: "absolute", left: "-8px", bottom: "10%" }}>
        <Mascot size={96}/>
      </div>
    </div>
  );
}

/* ---------- Header ---------- */
function Header({ theme, setTheme }) {
  return (
    <header className="site-header">
      <div className="nav gel">
        <a href="#top" className="brand">
          <span className="brand-mark"/>
          <span className="brand-name">tessel<span className="midbullet" style={{ width: 4, height: 4, margin: "0 4px 4px" }}/>la</span>
        </a>
        <ul className="nav-links">
          <li><a href="#roboboy">RoboBoy</a></li>
          <li><a href="#demo">Demo</a></li>
          <li><a href="#future">Future</a></li>
          <li><a href="#about">About</a></li>
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
      <div className="wrap">
        <div className="hero-grid">
          <div>
            <span className="eyebrow"><i className="dot"/> open robotics · est. 2024</span>
            <h1 className="wordmark" style={{ marginTop: 18 }}>
              tessel<span className="midbullet"/>la
            </h1>
            <p className="tagline">
              Tiny tools for big robots — starting with <em>RoboBoy</em>, our retro-handheld controller for ROS&nbsp;2.
            </p>
            <p className="hero-sub lede">
              Pilot, configure and play with any robot from a translucent web console that feels like a 2001 gadget — and runs anywhere a browser does.
            </p>
            <div className="hero-cta">
              <a className="btn" href="#demo">Try the demo <Icon.arrow/></a>
              <a className="btn btn--ghost" href="https://github.com/tessel-la/robo-boy" target="_blank" rel="noopener">
                <Icon.github/> View on GitHub
              </a>
            </div>
            <div className="hero-meta">
              <span><i className="led"/> rosbridge online</span>
              <span>v1.0 · web</span>
              <span>open source · MIT</span>
            </div>
          </div>
          <HeroDevice/>
        </div>
      </div>
    </section>
  );
}

/* ---------- Features grid ---------- */
function Features() {
  const [padCells, setPadCells] = useState(() =>
    Array(15).fill(null).map((_, i) => (i === 6 ? "a" : i === 8 ? "b" : i === 12 ? "c" : null))
  );
  const cycle = (i) => {
    setPadCells((cells) => {
      const next = [...cells];
      const order = [null, "a", "b", "c"];
      next[i] = order[(order.indexOf(next[i]) + 1) % order.length];
      return next;
    });
  };

  return (
    <section id="roboboy">
      <div className="wrap">
        <div className="section-head">
          <div className="titles">
            <span className="eyebrow"><i className="dot"/> what is RoboBoy</span>
            <h2>A handheld console<br/>for the robot era.</h2>
          </div>
          <p className="lede">
            One web app, every robot. RoboBoy talks to ROS&nbsp;2 over rosbridge, ships with a custom-pad designer, themeable visuals, and runs on any phone or laptop.
          </p>
        </div>

        <div className="features">
          <div className="feature gel span-6 reveal">
            <div className="ico"><Icon.pad/></div>
            <h3>Custom gamepads, drag-and-drop</h3>
            <p>Lay out joysticks, buttons, sliders and toggles. Map every input to a ROS topic in seconds — tap a tile to recolor it.</p>
            <div className="feat-visual">
              <div className="pad-mini">
                {padCells.map((c, i) => (
                  <div
                    key={i}
                    className={"cell" + (c ? " live " + c : "")}
                    onClick={() => cycle(i)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="feature gel span-6 accent-grape reveal">
            <div className="ico"><Icon.swatch/></div>
            <h3>Pick your plastic</h3>
            <p>Five default themes inspired by the candy-colored hardware of the early 2000s. Swap palettes mid-mission.</p>
            <div className="feat-visual">
              <div className="themes">
                <div className="theme-chip bondi"><span>BONDI</span></div>
                <div className="theme-chip tangerine"><span>TANGERINE</span></div>
                <div className="theme-chip grape"><span>GRAPE</span></div>
                <div className="theme-chip lime"><span>LIME</span></div>
                <div className="theme-chip graphite"><span>GRAPHITE</span></div>
              </div>
            </div>
          </div>

          <div className="feature gel span-4 accent-tangerine reveal">
            <div className="ico"><Icon.mic/></div>
            <h3>Voice commands</h3>
            <p>"Robot, dock." Whisper instructions, RoboBoy publishes them to your stack.</p>
            <div className="feat-visual">
              <div className="wave">
                {Array(28).fill(0).map((_, i) => (
                  <i key={i} style={{ animationDelay: (i * 0.06) + "s" }}/>
                ))}
              </div>
            </div>
          </div>

          <div className="feature gel span-4 accent-lime reveal">
            <div className="ico"><Icon.cam/></div>
            <h3>Live camera + depth</h3>
            <p>Stream sensor topics, view RGB and depth side-by-side, snap stills with one tap.</p>
            <div className="feat-visual">
              <div className="feat-camera">
                <div className="vid"/>
                <div className="vid b"/>
              </div>
            </div>
          </div>

          <div className="feature gel span-4 reveal">
            <div className="ico"><Icon.net/></div>
            <h3>ROS 2 native</h3>
            <p>Topics, services and actions over rosbridge. Drop-in for any URDF.</p>
            <div className="feat-visual">
              <div className="ribbon">
                <div className="topic">/cmd_vel<span className="pill">geometry/Twist</span></div>
                <div className="topic">/scan<span className="pill">sensor_msgs</span></div>
                <div className="topic">/joy<span className="pill">sensor_msgs/Joy</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Demo ---------- */
function Demo() {
  const [playing, setPlaying] = useState(false);
  const screenRef = useRef(null);

  return (
    <section id="demo">
      <div className="wrap">
        <div className="section-head">
          <div className="titles">
            <span className="eyebrow"><i className="dot"/> live demo</span>
            <h2>Hit play. Drive a robot.</h2>
          </div>
          <p className="lede">
            A 30-second tour through pairing, custom-pad creation, and a coffee-fetching maneuver across the office.
          </p>
        </div>

        <div className="demo-frame gel">
          <div className="demo-side">
            <span className="led"/>
            <span className="led r"/>
            <span className="led b"/>
            <span className="label">RB-1 · CH 01</span>
          </div>
          <div className={"demo-screen" + (playing ? " playing" : "")} ref={screenRef}>
            <div className="grid-overlay"/>
            <div className="corner tl">CAM · /front</div>
            <div className="corner tr">● REC</div>
            <div className="corner bl">14:22:08</div>
            <div className="corner br">60 fps</div>
            {!playing && (
              <div className="play" onClick={() => setPlaying(true)}>
                <button className="play-btn" aria-label="Play demo"/>
              </div>
            )}
            {playing && (
              <div style={{
                position: "absolute", inset: 0,
                display: "grid", placeItems: "center",
                color: "oklch(0.85 0.10 200)", fontFamily: "var(--mono)",
                textAlign: "center", padding: 24, fontSize: 14, lineHeight: 1.7
              }}>
                <div>
                  <div style={{ fontSize: 32, marginBottom: 14 }}>📡</div>
                  Demo footage coming soon.<br/>
                  <span style={{ opacity: 0.6 }}>Drop a video file at <code>media/demo.mp4</code> and uncomment the &lt;video&gt; tag.</span>
                  <div style={{ marginTop: 16 }}>
                    <button className="btn btn--ghost" onClick={() => setPlaying(false)} style={{ height: 36 }}>Back</button>
                  </div>
                </div>
              </div>
            )}
            <div className="scan"/>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Future ---------- */
function Future() {
  const cards = [
    { tag: "soon",      tagLbl: "shipping soon",  title: "RoboBoy Cloud",  body: "Multi-robot fleet view, persistent maps, and shareable pad layouts that sync across devices." },
    { tag: "research",  tagLbl: "research",       title: "Tactile Toolkit", body: "Haptic feedback for soft-grasp manipulators — feel the squish through your phone." },
    { tag: "",          tagLbl: "exploring",      title: "Pocket Sim",     body: "Run a Gazebo sim in the corner of your screen, drive it with the same pad, swap to real hardware in one tap." },
  ];
  return (
    <section id="future">
      <div className="wrap">
        <div className="section-head">
          <div className="titles">
            <span className="eyebrow"><i className="dot"/> what's next</span>
            <h2>The lab is busy.</h2>
          </div>
          <p className="lede">RoboBoy is the first device. Here's what's on the bench.</p>
        </div>
        <div className="future-grid">
          {cards.map((c, i) => (
            <article key={i} className="future-card gel reveal">
              <span className={"tag " + c.tag}>{c.tagLbl}</span>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- About ---------- */
function About() {
  return (
    <section id="about">
      <div className="wrap about">
        <div>
          <span className="eyebrow"><i className="dot"/> about</span>
          <h2 style={{ marginTop: 14 }}>A small studio,<br/>building friendly robots.</h2>
        </div>
        <div className="about-card gel">
          <p>
            <strong>tessel·la</strong> is a robotics studio shipping open tools for the people who actually build with robots — students, hobbyists, and the engineers who keep their lab&nbsp;robot in a duffel bag.
          </p>
          <p style={{ marginTop: 14 }}>
            We like our software like our hardware: <em>translucent</em>, a little nostalgic, and easy to take apart. Everything we make is open&nbsp;source.
          </p>
          <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="btn btn--ghost" href="https://github.com/tessel-la" target="_blank" rel="noopener">
              <Icon.github/> tessel-la on GitHub
            </a>
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
    setTimeout(() => setSent(false), 4500);
  };
  return (
    <section id="contact">
      <div className="wrap">
        <div className="contact gel">
          <div>
            <span className="eyebrow"><i className="dot"/> say hello</span>
            <h2 style={{ marginTop: 14 }}>Got a robot<br/>you'd like to wire up?</h2>
            <p className="lede" style={{ marginTop: 14 }}>
              Tell us about it. We answer every message — usually within a day, sometimes from a robot.
            </p>
          </div>
          <form className="contact-form" onSubmit={onSubmit}>
            <div className="row">
              <input required type="text" placeholder="Your name"/>
              <input required type="email" placeholder="you@robot.lab"/>
            </div>
            <textarea required placeholder="What are you building?"/>
            <button className="btn" type="submit">{sent ? "Sent! 📨" : "Send transmission"}</button>
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
        <div>© {new Date().getFullYear()} tessel·la — translucent robotics.</div>
        <div className="footer-links">
          <a href="https://github.com/tessel-la/robo-boy" target="_blank" rel="noopener">GITHUB</a>
          <a href="#roboboy">ROBOBOY</a>
          <a href="#future">ROADMAP</a>
          <a href="#contact">CONTACT</a>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Toy pet (easter egg) ---------- */
function ToyPet({ onMessage }) {
  const [msg, setMsg] = useState(null);
  const phrases = [
    "beep boop · /joy alive",
    "rosbridge: 60 hz, comfy",
    "battery: 87% — chill",
    "konami code? try ↑↑↓↓←→←→",
    "tip: arrow keys steer the device",
  ];
  const click = () => {
    const m = phrases[Math.floor(Math.random() * phrases.length)];
    setMsg(m);
    onMessage(m);
  };
  return (
    <button className="toy-pet" onClick={click} aria-label="poke the mascot">
      <svg width="56" height="56" viewBox="0 0 100 100">
        <rect x="22" y="14" width="56" height="46" rx="14" fill="#ffffff" opacity="0.9"/>
        <rect x="28" y="24" width="44" height="20" rx="8" fill="oklch(0.18 0.05 240)"/>
        <circle cx="40" cy="34" r="3.5" fill="oklch(0.86 0.18 130)"/>
        <circle cx="60" cy="34" r="3.5" fill="oklch(0.86 0.18 130)"/>
        <rect x="40" y="50" width="20" height="3.5" rx="1.5" fill="oklch(0.4 0.15 240 / 0.6)"/>
        <rect x="32" y="62" width="36" height="20" rx="6" fill="#ffffff" opacity="0.9"/>
        <circle cx="50" cy="72" r="2.6" fill="oklch(0.78 0.18 25)"/>
      </svg>
    </button>
  );
}

/* ---------- Toast ---------- */
function Toast({ message }) {
  return (
    <div className={"toast" + (message ? " show" : "")}>
      <span className="led"/> {message}
    </div>
  );
}

/* ---------- Tweaks panel ---------- */
function MyTweaks({ tweaks, setTweak }) {
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
  const [tweaks, setTweak] = (typeof useTweaks === "function")
    ? useTweaks(TWEAKS_DEFAULTS)
    : useState(TWEAKS_DEFAULTS).reduce ? null : null;

  // fallback if tweaks-panel not loaded yet
  const [localTweaks, setLocalTweaks] = useState(TWEAKS_DEFAULTS);
  const T = tweaks || localTweaks;
  const setT = (a, b) => {
    if (setTweak) setTweak(a, b);
    else setLocalTweaks((prev) => typeof a === "object" ? { ...prev, ...a } : { ...prev, [a]: b });
  };

  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("tessella-theme");
    return stored || (T.theme || "light");
  });
  const [toast, setToast] = useState(null);

  // theme persistence
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tessella-theme", theme);
    setT("theme", theme);
  }, [theme]);

  // sync from tweaks
  useEffect(() => { if (T.theme && T.theme !== theme) setTheme(T.theme); }, [T.theme]);

  // reveal-on-scroll
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // konami code
  useEffect(() => {
    const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    let idx = 0;
    const onKey = (e) => {
      const want = seq[idx];
      if (e.key === want || e.key.toLowerCase() === want) {
        idx++;
        if (idx === seq.length) {
          flash("✨ cheat code unlocked: extra plastic mode");
          document.body.style.filter = "saturate(1.4) hue-rotate(-8deg)";
          setTimeout(() => { document.body.style.filter = ""; }, 4000);
          idx = 0;
        }
      } else {
        idx = e.key === seq[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const flash = useCallback((m) => {
    setToast(m);
    clearTimeout(flash._t);
    flash._t = setTimeout(() => setToast(null), 2400);
  }, []);

  return (
    <>
      <Header theme={theme} setTheme={setTheme}/>
      <main>
        <Hero/>
        <Features/>
        <Demo/>
        <Future/>
        <About/>
        <Contact/>
      </main>
      <Footer/>
      <ToyPet onMessage={flash}/>
      <Toast message={toast}/>
      <MyTweaks tweaks={T} setTweak={setT}/>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
