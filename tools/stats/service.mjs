#!/usr/bin/env node
/**
 * Keeps the stats dashboard running in the background on macOS (what systemd does on Linux, launchd does on a Mac).
 *
 *   npm run stats:install     start it now, and every time you log in
 *   npm run stats:status      is it running?
 *   npm run stats:logs        the last lines of its log
 *   npm run stats:restart
 *   npm run stats:uninstall   stop it and remove it
 *
 * It's a LaunchAgent in your own account (no admin rights, nothing system-wide). Idle, it uses practically no
 * CPU: it only talks to GoatCounter when you open the dashboard, and caches the answer for a minute.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const label = 'la.tessel.stats';
const plist = join(homedir(), 'Library/LaunchAgents', `${label}.plist`);
const logFile = join(homedir(), 'Library/Logs/tessella-stats.log');
const uid = process.getuid?.() ?? 501;
const domain = `gui/${uid}`;
const port = Number(process.env.PORT || 4401);
const url = `http://localhost:${port}`;

if (process.platform !== 'darwin') {
  console.error('This script is for macOS only (it uses launchd). On Linux, a systemd user service that runs node tools/stats/server.mjs does the same.');
  process.exit(1);
}

const launchctl = (...args) => spawnSync('launchctl', args, { encoding: 'utf8' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const escapeXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function ping(tries = 1) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(`${url}/`, { signal: AbortSignal.timeout(1500) });
      if (r.ok) return true;
    } catch {
      /* not up yet */
    }
    await sleep(700);
  }
  return false;
}

/** Who is listening on our port, if anyone: [pid, command]. */
function portOwner() {
  const r = spawnSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], { encoding: 'utf8' });
  const pid = r.stdout.trim().split('\n')[0];
  if (!pid) return null;
  const cmd = spawnSync('ps', ['-p', pid, '-o', 'command='], { encoding: 'utf8' }).stdout.trim();
  return [Number(pid), cmd];
}

function loaded() {
  return launchctl('print', `${domain}/${label}`).status === 0;
}

async function install() {
  const env = existsSync(join(root, '.env.local')) ? readFileSync(join(root, '.env.local'), 'utf8') : '';
  if (!/^\s*GOATCOUNTER_TOKEN=\S{10,}/m.test(env)) {
    console.error('The GoatCounter token is missing from .env.local (see "Visitor counts" in the README). The service cannot start without it.');
    process.exit(1);
  }
  // the node that works in your terminal (the stable path, not one that changes on every update)
  const node = execFileSync('/bin/sh', ['-lc', 'command -v node'], { encoding: 'utf8' }).trim() || process.execPath;

  // a copy started by hand on the same port would block the service: if it's ours, stop it
  const owner = portOwner();
  if (owner && !loaded()) {
    if (owner[1].includes('tools/stats/server.mjs')) {
      console.log(`Stopping the copy started by hand (pid ${owner[0]}): the service replaces it.`);
      process.kill(owner[0], 'SIGTERM');
      await sleep(800);
    } else {
      console.error(`Port ${port} is taken by another program (${owner[1]}). Free it or set PORT=…`);
      process.exit(1);
    }
  }

  mkdirSync(dirname(plist), { recursive: true });
  mkdirSync(dirname(logFile), { recursive: true });
  const x = escapeXml;
  writeFileSync(
    plist,
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${label}</string>
  <key>ProgramArguments</key>
  <array><string>${x(node)}</string><string>${x(join(root, 'tools/stats/server.mjs'))}</string></array>
  <key>WorkingDirectory</key><string>${x(root)}</string>
  <key>EnvironmentVariables</key>
  <dict><key>PORT</key><string>${port}</string><key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>20</integer>
  <key>ProcessType</key><string>Background</string>
  <key>Nice</key><integer>10</integer>
  <key>StandardOutPath</key><string>${x(logFile)}</string>
  <key>StandardErrorPath</key><string>${x(logFile)}</string>
</dict>
</plist>
`,
  );

  if (loaded()) launchctl('bootout', `${domain}/${label}`);
  const r = launchctl('bootstrap', domain, plist);
  if (r.status !== 0) {
    console.error(`launchctl could not start it:\n${r.stderr || r.stdout}`);
    process.exit(1);
  }
  if (await ping(8)) {
    console.log(`\n  Running. The dashboard is at ${url}\n  It starts again at every login. To stop it: npm run stats:uninstall\n`);
  } else {
    console.error(`\n  The service is loaded but not answering yet. See what it says: npm run stats:logs\n`);
    process.exit(1);
  }
}

async function uninstall() {
  if (loaded()) launchctl('bootout', `${domain}/${label}`);
  if (existsSync(plist)) unlinkSync(plist);
  console.log('Service stopped and removed. (Your numbers on GoatCounter are untouched.)');
}

async function status() {
  const isLoaded = loaded();
  const up = await ping(1);
  console.log(`Service ${isLoaded ? 'installed' : 'not installed'} · ${up ? `answering at ${url}` : 'not answering'}`);
  if (isLoaded) {
    const out = launchctl('print', `${domain}/${label}`).stdout;
    const pid = out.match(/\bpid = (\d+)/)?.[1];
    const state = out.match(/\bstate = (\w+)/)?.[1];
    console.log(`launchd: state ${state ?? '?'}${pid ? `, pid ${pid}` : ''}`);
    if (pid) {
      const ps = spawnSync('ps', ['-p', pid, '-o', '%cpu=,rss='], { encoding: 'utf8' }).stdout.trim().split(/\s+/);
      if (ps.length === 2) console.log(`Using now: CPU ${ps[0]}%, memory ${(Number(ps[1]) / 1024).toFixed(0)} MB`);
    }
  }
  process.exit(isLoaded && up ? 0 : 1);
}

function logs() {
  if (!existsSync(logFile)) return console.log('No log yet.');
  const lines = readFileSync(logFile, 'utf8').trimEnd().split('\n');
  console.log(lines.slice(-40).join('\n'));
}

async function restart() {
  if (!loaded()) return console.log('The service is not installed: npm run stats:install');
  launchctl('kickstart', '-k', `${domain}/${label}`);
  console.log((await ping(8)) ? `Restarted: ${url}` : 'Restarted, but not answering yet: npm run stats:logs');
}

const commands = { install, uninstall, status, logs, restart };
const run = commands[process.argv[2]];
if (!run) {
  console.error('Usage: node tools/stats/service.mjs install | uninstall | status | logs | restart');
  process.exit(1);
}
await run();
