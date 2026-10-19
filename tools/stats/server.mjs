#!/usr/bin/env node
/**
 * A local dashboard for the site's visitor counts (see "Visitor counts" in the README).
 *
 *   npm run stats            real numbers (needs a read-only GoatCounter API token)
 *   npm run stats:demo       made-up numbers, to see how it looks
 *
 * It runs on your computer only (http://localhost:4401, bound to loopback). The token is read from the
 * environment or from `.env.local` (git ignores it) and never reaches the browser. No dependencies:
 * Node 20 or later is enough.
 */
import http from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const demo = process.argv.includes('--demo');
const port = Number(process.env.PORT || 4401);

// ---------- settings ----------
const envFile = join(root, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
// The site code comes from the counter itself, so the dashboard always reads the site the pages report to.
const code =
  process.env.GOATCOUNTER_CODE || readFileSync(join(root, 'count.js'), 'utf8').match(/COUNTER\s*=\s*"https:\/\/([a-z0-9-]+)\.goatcounter\.com\/count"/)?.[1];
const token = process.env.GOATCOUNTER_TOKEN;
if (!demo && (!code || !token)) {
  console.error(`
The dashboard needs two things to show real numbers:
  1. ${code ? `the GoatCounter site "${code}" (from count.js)  ✓` : 'a GoatCounter site: set COUNTER in count.js to https://<code>.goatcounter.com/count'}
  2. a read-only API token: on https://${code || '<code>'}.goatcounter.com open your name (top right) → API →
     "Create new token", tick "Read statistics", then put it in a file called .env.local in the project folder:
         GOATCOUNTER_TOKEN=paste-the-token-here
Then run npm run stats again. To see the dashboard with made-up numbers: npm run stats:demo
`);
  process.exit(1);
}

// ---------- names from the pages themselves, so the dashboard follows the site ----------
function siteNames() {
  const read = (f) => (existsSync(join(root, f)) ? readFileSync(join(root, f), 'utf8') : '');
  const text = (html) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const docs = read('docs.html');
  const sections = [];
  const toc = docs.match(/<aside class="toc"[\s\S]*?<\/aside>/)?.[0] ?? '';
  let group = '';
  for (const m of toc.matchAll(/<span class="toc-label">([\s\S]*?)<\/span>|<a href="#([\w-]+)">([\s\S]*?)<\/a>/g)) {
    if (m[1]) group = text(m[1]);
    else sections.push({ id: m[2], label: text(m[3]), group });
  }
  const chapters = [...read('index.html').matchAll(/<button type="button" data-t="(\d+)">([\s\S]*?)<\/button>/g)].map((m) => {
    const label = text(m[2]).replace(/^[\d:]+\s*/, '');
    return { id: label.toLowerCase().replace(/[^a-z0-9./_-]+/g, '-'), label, at: Number(m[1]) };
  });
  const scenes = [...read('index.html').matchAll(/<section id="([\w-]+)" class="scene[^"]*" data-label="([^"]+)"/g)]
    .filter((m) => m[1] !== 'top')
    .map((m) => ({ id: m[1], label: text(m[2]).replace(/^\d+\s*[—-]\s*/, '') }));
  return { sections, chapters, scenes };
}

const platforms = {
  macos: 'macOS',
  windows: 'Windows',
  'linux-deb': 'Linux · .deb',
  'linux-rpm': 'Linux · .rpm',
  'linux-appimage': 'Linux · AppImage',
  android: 'Android',
  ios: 'iOS (unsigned)',
};

// ---------- GoatCounter API ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function gc(path, params = {}) {
  const url = new URL(`https://${code}.goatcounter.com/api/v0${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    if (r.status === 429) {
      await sleep((Number(r.headers.get('x-rate-limit-reset')) || 1) * 1000 + 250);
      continue;
    }
    if (!r.ok) {
      const hint = r.status === 403 ? ' (does the token have "Read statistics"?)' : r.status === 401 ? ' (wrong token, or a token from another GoatCounter account)' : '';
      throw new Error(`${path} → HTTP ${r.status}${hint}`);
    }
    await sleep(260); // the API allows 4 requests per second
    return r.json();
  }
  throw new Error(`${path} → rate limited`);
}

const iso = (d) => d.toISOString().replace(/\.\d+Z$/, 'Z');

async function collectReal(days) {
  const end = new Date();
  end.setMinutes(0, 0, 0);
  end.setHours(end.getHours() + 1);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const range = { start: iso(start), end: iso(end) };
  const warnings = [];
  const safe = async (fn) => {
    try {
      return await fn();
    } catch (e) {
      warnings.push(e.message);
      return null;
    }
  };

  // Every event is its own "path", so ask for plenty of them.
  let hits;
  try {
    hits = await gc('/stats/hits', { ...range, limit: 200 });
  } catch (e) {
    if (!/HTTP 400/.test(e.message)) throw e;
    hits = await gc('/stats/hits', { ...range, limit: 100 });
  }
  if (hits.more) warnings.push('more than the listed pages and events exist; the smallest ones are left out');
  const total = await safe(() => gc('/stats/total', range));
  const side = {};
  for (const page of ['toprefs', 'locations', 'systems', 'browsers', 'sizes', 'languages', 'campaigns']) {
    side[page] = (await safe(() => gc(`/stats/${page}`, { ...range, limit: 12 })))?.stats ?? [];
  }
  return { hits: hits.hits ?? [], total, side, warnings, days };
}

// ---------- made-up numbers for --demo ----------
function collectDemo(days) {
  let seed = 11;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const { sections, chapters, scenes } = siteNames();
  const dayKey = (i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().slice(0, 10);
  };
  // A quiet weekday rhythm, a release spike a week ago and a link from a forum near the end.
  const series = Array.from({ length: days }, (_, i) => {
    const wd = new Date(dayKey(i)).getDay();
    const base = 22 + (wd === 0 || wd === 6 ? -8 : 0) + (i === days - 8 ? 90 : 0) + (i === days - 7 ? 40 : 0) + (i > days - 4 ? 18 : 0);
    return Math.max(2, Math.round(base * (0.65 + rnd() * 0.7)));
  });
  const sum = series.reduce((a, b) => a + b, 0);
  const page = (path, title, count, share) => ({
    path, title, count, event: false, stats: series.map((n, i) => ({ day: dayKey(i), daily: Math.round(n * share) })),
  });
  const home = Math.round(sum * 0.64);
  const docs = sum - home;
  const hits = [page('/', 'tessel·la', home, 0.64), page('/docs', 'Robo·Boy Documentation · tessel·la', docs, 0.36)];
  const ev = (name, count) => hits.push({ path: name, title: name, count: Math.max(0, Math.round(count)), event: true, stats: [] });

  const reach = [0.78, 0.46, 0.31];
  scenes.forEach((s, i) => ev(`reached-${s.id}`, home * (reach[i] ?? 0.2)));
  const plays = home * 0.27;
  ev('teaser-play', plays);
  ev('teaser-half', plays * 0.58);
  ev('teaser-end', plays * 0.41);
  chapters.forEach((c, i) => ev(`teaser-chapter-${c.id}`, plays * (0.16 - i * 0.014)));

  const dl = { macos: 0.38, 'linux-deb': 0.27, windows: 0.18, android: 0.1, 'linux-rpm': 0.04, ios: 0.03 };
  const downloads = (home + docs) * 0.11;
  for (const [k, share] of Object.entries(dl)) ev(`download-${k}`, downloads * share);

  sections.forEach((s, i) => ev(`docs-read-${s.id}`, docs * Math.max(0.05, 0.86 * Math.pow(0.8, i)) * (0.85 + rnd() * 0.3)));
  ev('docs-copy-bash', docs * 0.21);
  ev('docs-copy-typescript', docs * 0.08);
  ev('docs-copy-json', docs * 0.05);
  ev('docs-copy-yaml', docs * 0.03);

  ev('out-github.com/tessel-la/robo-boy', sum * 0.09);
  ev('out-github.com/tessel-la', sum * 0.03);
  ev('out-github.com/tessel-la/robo-boy/releases/latest', docs * 0.06);
  ev('out-github.com/tessel-la/robo-boy/tree/main/panel-sdk', docs * 0.05);
  ev('out-github.com/tessel-la/robo-boy-webrtc-panel', docs * 0.02);
  ev('out-github.com/filosottile/mkcert', docs * 0.015);
  ev('contact-send', 4);
  ev('theme-dark', sum * 0.04);
  ev('theme-light', sum * 0.012);

  const list = (rows) => rows.map(([name, count], i) => ({ id: String(i), name, count: Math.round(count) }));
  return {
    hits,
    total: { total: sum, stats: series.map((n, i) => ({ day: dayKey(i), daily: n })) },
    side: {
      toprefs: list([['github.com', sum * 0.31], ['', sum * 0.27], ['news.ycombinator.com', sum * 0.12], ['discourse.ros.org', sum * 0.09], ['google.com', sum * 0.08], ['linkedin.com', sum * 0.04], ['reddit.com', sum * 0.03]]),
      locations: list([['Italy', sum * 0.22], ['United States', sum * 0.19], ['Germany', sum * 0.12], ['Japan', sum * 0.06], ['United Kingdom', sum * 0.05], ['Spain', sum * 0.04], ['India', sum * 0.04]]),
      systems: list([['Linux', sum * 0.36], ['macOS', sum * 0.27], ['Windows', sum * 0.18], ['Android', sum * 0.1], ['iOS', sum * 0.08]]),
      browsers: list([['Chrome', sum * 0.52], ['Firefox', sum * 0.21], ['Safari', sum * 0.16], ['Edge', sum * 0.06], ['Brave', sum * 0.02]]),
      sizes: list([['Computer monitors', sum * 0.71], ['Phones', sum * 0.18], ['Large phones, small tablets', sum * 0.07], ['Tablets and small laptops', sum * 0.04]]),
      languages: list([['English', sum * 0.58], ['Italian', sum * 0.17], ['German', sum * 0.1], ['Japanese', sum * 0.05], ['Spanish', sum * 0.04]]),
      campaigns: list([['ros-discourse', 21], ['release-notes', 12]]),
    },
    warnings: [],
    days,
    demo: true,
  };
}

// ---------- turn raw numbers into what the page draws ----------
function shape(raw) {
  const { sections, chapters, scenes } = siteNames();
  const days = raw.days;
  const pageLabel = (path) => ({ '/': 'Home', '/docs': 'Docs' })[path] ?? path;
  const pages = raw.hits.filter((h) => !h.event).map((h) => ({ path: h.path, name: pageLabel(h.path), count: h.count }));
  const events = new Map(raw.hits.filter((h) => h.event).map((h) => [h.path, h.count]));
  const get = (n) => events.get(n) ?? 0;
  const withPrefix = (prefix) => [...events].filter(([n]) => n.startsWith(prefix)).map(([n, count]) => ({ key: n.slice(prefix.length), count }));
  const byCount = (a, b) => b.count - a.count;

  // Visits per day, summed from the pages (so clicks on buttons are not counted as visits).
  const perDay = new Map();
  const pageHits = raw.hits.filter((h) => !h.event && h.stats?.length);
  if (pageHits.length) {
    for (const h of pageHits) for (const st of h.stats) perDay.set(st.day.slice(0, 10), (perDay.get(st.day.slice(0, 10)) ?? 0) + (st.daily ?? 0));
  } else {
    for (const s of raw.total?.stats ?? []) perDay.set(s.day.slice(0, 10), s.daily ?? 0);
  }
  const daily = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    daily.push({ day: k, count: perDay.get(k) ?? 0 });
  }

  const visitsOf = (path) => pages.filter((p) => p.path === path).reduce((a, p) => a + p.count, 0);
  const known = new Set(sections.map((s) => s.id));
  const docsRead = sections.map((s) => ({ ...s, count: get(`docs-read-${s.id}`) }));
  // sections that were renamed or removed since: still shown, at the end
  for (const { key, count } of withPrefix('docs-read-')) if (!known.has(key)) docsRead.push({ id: key, label: `#${key}`, group: 'Older', count });

  const knownChapters = new Set(chapters.map((c) => c.id));
  const chapterClicks = chapters.map((c) => ({ name: c.label, at: c.at, count: get(`teaser-chapter-${c.id}`) }));
  for (const { key, count } of withPrefix('teaser-chapter-')) if (!knownChapters.has(key)) chapterClicks.push({ name: key, count });

  return {
    demo: !!raw.demo,
    days,
    code,
    generatedAt: new Date().toISOString(),
    warnings: raw.warnings,
    totalVisits: pages.reduce((a, p) => a + p.count, 0),
    totalEvents: [...events.values()].reduce((a, b) => a + b, 0),
    daily,
    pages: pages.sort(byCount).slice(0, 12),
    homeVisits: visitsOf('/'),
    docsVisits: visitsOf('/docs'),
    reached: scenes.map((s) => ({ name: s.label, count: get(`reached-${s.id}`) })),
    teaser: { play: get('teaser-play'), half: get('teaser-half'), end: get('teaser-end') },
    chapters: chapterClicks,
    downloads: withPrefix('download-').map(({ key, count }) => ({ name: platforms[key] ?? key, count })).sort(byCount),
    docsRead,
    copies: withPrefix('docs-copy-').map(({ key, count }) => ({ name: key, count })).sort(byCount),
    outbound: withPrefix('out-').map(({ key, count }) => ({ name: key, count })).sort(byCount).slice(0, 12),
    contact: get('contact-send'),
    theme: { dark: get('theme-dark'), light: get('theme-light') },
    // visits with no referrer (bookmarks, typed addresses, links from apps and chats) come back with an empty name
    refs: raw.side.toprefs.map((r) => ({ ...r, name: r.name?.trim() || 'Direct (bookmarks, apps, chats)' })),
    campaigns: raw.side.campaigns,
    countries: raw.side.locations,
    systems: raw.side.systems,
    browsers: raw.side.browsers,
    sizes: raw.side.sizes,
    languages: raw.side.languages,
  };
}

// ---------- server ----------
const cache = new Map();
async function data(days) {
  const hit = cache.get(days);
  if (hit && Date.now() - hit.at < 60_000) return hit.value;
  const value = shape(demo ? collectDemo(days) : await collectReal(days));
  cache.set(days, { at: Date.now(), value });
  return value;
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};
// What the browser may load: the dashboard, its app files, and the site's own tokens and fonts.
function staticFile(pathname) {
  if (pathname === '/') return join(here, 'dashboard.html');
  if (pathname === '/tokens.css') return join(root, 'tokens.css');
  if (/^\/fonts\/[\w.-]+\.(woff2|css)$/.test(pathname)) return join(root, normalize(pathname));
  if (/^\/[\w-][\w.-]*$/.test(pathname)) return join(here, 'app', pathname.slice(1));
  return null;
}

http
  .createServer(async (req, res) => {
    // Only answer to this computer's own names, so a web page can't reach it through DNS rebinding.
    if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(req.headers.host ?? '')) return res.writeHead(403).end('forbidden');
    const url = new URL(req.url ?? '/', `http://localhost:${port}`);
    try {
      if (url.pathname === '/api/data') {
        const days = [7, 30, 90].includes(Number(url.searchParams.get('days'))) ? Number(url.searchParams.get('days')) : 30;
        if (url.searchParams.has('fresh')) cache.delete(days);
        const body = JSON.stringify(await data(days));
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return res.end(body);
      }
      const file = staticFile(url.pathname);
      if (file && existsSync(file)) {
        const cacheable = url.pathname.startsWith('/fonts/');
        res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': cacheable ? 'max-age=86400' : 'no-cache' });
        return res.end(readFileSync(file));
      }
      res.writeHead(404).end('not found');
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  })
  .listen(port, '127.0.0.1', () => {
    console.log(`\n  tessel·la numbers${demo ? ' (demo data)' : ''}: http://localhost:${port}\n  Stop with Ctrl+C.\n`);
  });
