# tessel·la Website

[Visit the website](https://ricfrr.github.io/tessella-web/)

## Description
The site for tessel·la, an independent project for open, friendly robotics tools, and the home of Robo·Boy.
It follows the design language of the Robo·Boy teaser: a cream ground, cobalt letters and a tangerine dot,
night-black "footage" scenes, kinetic lowercase headlines, and a HUD with a section label and a scroll rail.

The dedicated [Robo-Boy documentation experience](docs.html) covers setup, ROS 2 connectivity, application
architecture, built-in panels, and the complete external Panel SDK authoring and distribution workflow.

## Structure
- `index.html`, `site.css`, `site.js`: the home page (static HTML, no build step).
- `docs.html`, `docs.css`, `docs.js`: the Robo·Boy documentation.
- `tokens.css`: the shared design tokens (palette, type roles, brand mark, buttons, chips) used by both pages.
- `fonts/`: self-hosted Bricolage Grotesque, Courier Prime and Doto (SIL OFL 1.1, licences included).
- `media/videos/robo-boy/`: the teaser (H.264, 1080p30) and its poster.
- `count.js`: anonymous visitor counts (below).
- `tools/stats/`: the local dashboard for those counts. It is left out of the published site.

Both pages share the theme choice (`tessella-theme` in localStorage) and follow the system theme until one is picked.

## Technologies
- HTML
- CSS
- JavaScript

## Visitor counts

The site counts visits **without tracking people**. `count.js` is our own counter (about 150 lines, no
third-party script). Per page view it sends one request to a [GoatCounter](https://www.goatcounter.com) site with the page,
its title, the site the visitor came from (address only, no query string), any `ref`/`utm_*` campaign tag and the
screen width. It sets no cookies, stores nothing in the browser and sends no identifier. GoatCounter works out the
country, browser and system from the request and doesn't keep the IP address. No cookie banner is needed; it's still
polite to say so on the site.

It sends nothing at all when the visitor's browser asks not to be tracked (Global Privacy Control or Do Not Track),
when the page runs from disk, localhost or a private network, inside a frame, or in an automated browser.

**What it does not protect:** GoatCounter, a third party, receives each visit (with the visitor's IP address in
transit, as any web request does). Visitors who block it or send GPC/DNT are not counted, so the numbers are a floor.

### Setup

1. On [goatcounter.com](https://www.goatcounter.com), add a site with the code **`tessella`** (from your existing
   account's settings, or by signing up anew). If that code is taken, pick another and change `COUNTER`
   at the top of `count.js` to `https://<code>.goatcounter.com/count`. While `COUNTER` is empty, nothing is sent.
2. Exclude your own visits: open the site once in each of your browsers with `#notrack` at the end of the address
   (`#track` undoes it).

### What is counted

Page views of `/` and `/docs` (the same names on GitHub Pages and on tessel.la), plus these events:

| Event | When |
| --- | --- |
| `download-<platform>` | a click on a release file (`macos`, `windows`, `linux-deb`, `linux-rpm`, `android`, `ios`) |
| `out-<host/path>` | a click on a link to another site |
| `reached-<scene>` | the home page scrolled to Robo·Boy, About, Contact (once per visit) |
| `teaser-play`, `teaser-half`, `teaser-end` | the teaser started, passed half way, finished (once per visit) |
| `teaser-chapter-<name>` | a chapter button |
| `docs-read-<section>` | a docs section stayed current for 3 s (once per visit) |
| `docs-copy-<language>` | a Copy button in the docs |
| `contact-send` | the contact form opened the mail app (never what the message says) |
| `theme-dark`, `theme-light` | the theme toggle |

To count another control, add `data-count="name"` to it, or call `window.tessellaCount("name")`.

To check the counter on your machine, run `localStorage.setItem("tessella-count-debug", "1")` in the browser
console and reload: it logs what it would send instead of sending, also on localhost.

### The dashboard

GoatCounter's own page works but is plain, so there's a dashboard in the tessel·la style that reads the same numbers:
visits per day, pages, referrers, downloads by platform, the teaser funnel and chapters, how far people read the
docs, how far they scroll the home page, links out, countries, systems, browsers, screens and languages. It runs
**only on your computer** and needs Node 20 or later (no `npm install`, there are no dependencies).

```bash
npm run stats
```

Open http://localhost:4401. The first time it needs a read-only key: on `tessella.goatcounter.com` open your name
(top right) → API → "Create new token", tick **Read statistics**, then put it in a file called `.env.local` in the
project folder (git ignores it, so it's never published):

```
GOATCOUNTER_TOKEN=paste-the-token-here
```

`npm run stats:demo` shows the dashboard with made-up numbers.

To keep it running in the background on macOS (a LaunchAgent in your account, no admin rights; idle it uses about 0%
CPU and only calls GoatCounter when you open the dashboard, caching the answer for a minute):

```bash
npm run stats:install     # start it now and at every login
npm run stats:status      # running? how much CPU and memory?
npm run stats:logs        # the last lines of its log
npm run stats:restart
npm run stats:uninstall   # stop and remove it
```

The dashboard is also an installable app: in Chrome or Edge use the install icon in the address bar; in Safari use
File → Add to Dock. The server listens on loopback only and answers only to `localhost`, the token never reaches the
browser, and visitor-supplied text (referrers, paths) is always shown as plain text.

