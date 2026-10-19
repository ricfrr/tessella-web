/* ==========================================================================
   Visitor counts without tracking people (see "Visitor counts" in the README).

   This is our own counter, not a third-party script. Per page view it sends one
   cookieless request to a GoatCounter site with the page, the title, the site the
   visitor came from (no query string) and the screen width. Nothing is stored in
   the browser, and no identifier is sent. GoatCounter derives country, browser
   and system from the request, then discards the IP address.

   It sends nothing when:
   - COUNTER below is empty;
   - the browser asks not to be tracked (Global Privacy Control or Do Not Track);
   - the page runs from disk, localhost or a private network, or inside a frame;
   - the browser is automated (navigator.webdriver);
   - this browser opted out: open any page with #notrack (and #track to undo).

   Events: window.tessellaCount("name") counts a named action. Clicks on download
   links, on links to other sites and on anything with data-count="name" are
   counted on their own.
   ========================================================================== */
(() => {
  // The GoatCounter endpoint. Empty means the counter is off.
  const COUNTER = "https://tessella.goatcounter.com/count";

  const OPT_OUT = "tessella-notrack";
  const DEBUG = "tessella-count-debug"; // "1": log instead of sending, also on localhost
  const store = (fn) => { try { return fn(localStorage); } catch (e) { return null; } };

  // #notrack / #track: the owner's switch for their own browsers, on load or typed onto an open page.
  const optSwitch = () => {
    if (location.hash !== "#notrack" && location.hash !== "#track") return;
    const off = location.hash === "#notrack";
    store((s) => (off ? s.setItem(OPT_OUT, "1") : s.removeItem(OPT_OUT)));
    history.replaceState(null, "", location.pathname + location.search);
    window.alert(off ? "This browser is no longer counted on tessel·la." : "This browser is counted again on tessel·la.");
  };
  optSwitch();
  window.addEventListener("hashchange", optSwitch);

  const debug = store((s) => s.getItem(DEBUG)) === "1";
  const blocked = () => {
    if (!COUNTER) return "no counter configured";
    if (navigator.globalPrivacyControl === true) return "Global Privacy Control";
    if ([navigator.doNotTrack, window.doNotTrack, navigator.msDoNotTrack].some((v) => v === "1" || v === "yes")) return "Do Not Track";
    if (store((s) => s.getItem(OPT_OUT)) === "1") return "opted out with #notrack";
    if (navigator.webdriver) return "automated browser";
    try { if (window.top !== window) return "inside a frame"; } catch (e) { return "inside a frame"; }
    if (debug) return false;
    if (location.protocol === "file:") return "opened from disk";
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0$|\[::1\]$)|\.(localhost|local|test)$/.test(location.hostname)) return "local address";
    return false;
  };

  // The same page has one name wherever the site is served: GitHub's /tessella-web/ base, index.html
  // and the .html suffix are dropped, so "/" and "/docs" stay stable when the domain changes.
  const pagePath = () => {
    let p = location.pathname.replace(/^\/tessella-web(?=\/|$)/, "") || "/";
    p = p.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
    return p || "/";
  };

  // Where the visitor came from: another site's address without its query or fragment, which can
  // carry search terms or tokens. Links inside this site are not a referrer.
  const referrer = () => {
    try {
      const r = new URL(document.referrer);
      if (r.hostname === location.hostname || !/^https?:$/.test(r.protocol)) return "";
      return r.origin + r.pathname;
    } catch (e) {
      return "";
    }
  };

  // Only campaign tags survive from the query string (GoatCounter reads them as "campaign").
  const campaign = () => {
    const q = new URLSearchParams(location.search);
    const keep = new URLSearchParams();
    for (const [k, v] of q) if (k === "ref" || /^utm_(source|medium|campaign)$/.test(k)) keep.set(k, v.slice(0, 80));
    const s = keep.toString();
    return s ? `?${s}` : "";
  };

  const send = (data) => {
    const why = blocked();
    if (why) {
      if (debug) console.info(`[count] not sent (${why}):`, data);
      return;
    }
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...data, rnd: Math.random().toString(36).slice(2, 7) })) {
      if (v !== "" && v !== false && v != null) params.set(k, String(v));
    }
    const url = `${COUNTER}?${params}`;
    if (debug) {
      console.info("[count] would send:", Object.fromEntries(params));
      return;
    }
    if (!navigator.sendBeacon?.(url)) {
      const img = new Image(1, 1);
      img.referrerPolicy = "no-referrer";
      img.src = url;
    }
  };

  const once = new Set();
  /** Count a named action. With { once: true } it is counted at most once per page view. */
  const event = (name, opts = {}) => {
    name = String(name).toLowerCase().replace(/[^a-z0-9./_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
    if (!name || (opts.once && once.has(name))) return;
    once.add(name);
    send({ p: name, t: name, e: true });
  };
  window.tessellaCount = event;

  const pageview = () => send({ p: pagePath(), t: document.title, r: referrer(), q: campaign(), s: window.screen?.width });
  if (document.visibilityState === "prerender") {
    document.addEventListener("visibilitychange", function wait() {
      if (document.visibilityState === "prerender") return;
      document.removeEventListener("visibilitychange", wait);
      pageview();
    });
  } else {
    pageview();
  }

  // Release downloads are named by platform, so the dashboard can group them however the files are renamed.
  const platformOf = (file) => {
    const f = file.toLowerCase();
    if (/\.deb$/.test(f)) return "linux-deb";
    if (/\.rpm$/.test(f)) return "linux-rpm";
    if (/\.appimage$/.test(f)) return "linux-appimage";
    if (/mac|darwin|\.dmg$/.test(f)) return "macos";
    if (/win|\.exe$|\.msi$/.test(f)) return "windows";
    if (/android|\.apk$|\.aab$/.test(f)) return "android";
    if (/ios|iphone|\.ipa$/.test(f)) return "ios";
    return f.replace(/^robo-boy-/, "");
  };

  document.addEventListener("click", (e) => {
    const el = e.target instanceof Element ? e.target.closest("[data-count], a[href]") : null;
    if (!el) return;
    if (el.dataset.count) return event(el.dataset.count);
    let url;
    try { url = new URL(el.href, location.href); } catch (e) { return; }
    if (!/^https?:$/.test(url.protocol) || url.hostname === location.hostname) return;
    const dl = url.pathname.match(/\/releases\/(?:latest\/)?download\/(?:[^/]+\/)?([^/]+)$/);
    if (dl) return event(`download-${platformOf(decodeURIComponent(dl[1]))}`);
    event(`out-${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/$/, "")}`);
  }, { capture: true });
})();
