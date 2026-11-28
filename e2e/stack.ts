// Isolated E2E backend: throwaway Postgres container + the server binary built from the sibling
// checkout. Removes only the container and temp directory it created.
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';

const API_PORT = '18080';
const APP_ORIGIN = 'http://127.0.0.1:4173';
// second server, EMAIL_VERIFICATION=enforce, with its own dashboard build and a Mailpit catcher
const ENFORCE_API_PORT = '18081';
const ENFORCE_APP_ORIGIN = 'http://127.0.0.1:4174';
const MAIL_SMTP_PORT = '11025';
const MAIL_HTTP_PORT = '18025';
const SERVER_DIR = path.resolve(process.env.E2E_SERVER_DIR ?? '../meta-frames-server');
const RUN_ID = randomUUID();

const CLEANUP_BUDGET_MS = 12_000; // inside the 15 s gracefulShutdown in playwright.config.ts
const WAIT_MS = 30_000;

let containerId = '';
const containerIds = new Set<string>(); // fallback for removal when the label listing fails
let workDir = '';
const children = new Set<ChildProcess>(); // every API child, so cleanup also sees a late one
let inflight: ChildProcess | undefined; // long async step (docker run, go build), killed on cleanup
let inflightSettled: Promise<void> = Promise.resolve();
let inflightCreates = false; // the in-flight step is a `docker run` that creates a container
let stopping = false; // set first by cleanup(): startup checks it and starts nothing more
let cleanupDone: Promise<boolean> | undefined;

interface Server {
  child: ChildProcess;
  listening: boolean; // the server logged its `msg=listening addr=:<port>` line
}

async function fail(message: string): Promise<never> {
  console.error(`[e2e-stack] ${message}`);
  await cleanup();
  process.exit(1);
}

function run(
  command: string,
  args: string[],
  options: { cwd?: string; timeout?: number } = {},
): string {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options,
  }).trim();
}

// Never waits past `milliseconds`: on timeout the child gets SIGKILL and the call reports failure,
// even if the child ignores SIGTERM or never closes its pipes.
function runBounded(
  command: string,
  args: string[],
  milliseconds: number,
): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    let output = '';
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ok, output: output.trim() });
    };
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'inherit'] });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(false);
    }, milliseconds);
    child.stdout.on('data', (chunk) => (output += chunk));
    child.on('error', () => finish(false));
    // close, not exit: stdout can still deliver data after exit
    child.on('close', (code) => finish(code === 0));
  });
}

// Async so SIGTERM/SIGINT handlers can run during long steps. Resolves with trimmed stdout.
function runAsync(
  command: string,
  args: string[],
  options: { cwd?: string; quiet?: boolean; creates?: boolean } = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: ['ignore', options.quiet ? 'pipe' : 'inherit', 'inherit'],
    });
    inflight = child;
    inflightCreates = options.creates ?? false;
    inflightSettled = new Promise((settled) => child.once('close', () => settled()));
    let output = '';
    child.stdout?.on('data', (chunk) => (output += chunk));
    child.on('error', reject);
    // close, not exit: the container ID on stdout can arrive after exit
    child.on('close', (code, signal) => {
      inflight = undefined;
      if (code === 0) resolve(output.trim());
      else reject(new Error(`${command} ${args[0]} exited with ${code ?? signal}`));
    });
  });
}

// Idempotent. One budget (CLEANUP_BUDGET_MS) covers the in-flight wait, the Docker calls and the
// API reap; no step waits past it. Resolves false when the containers may still exist.
function cleanup(): Promise<boolean> {
  cleanupDone ??= (async () => {
    stopping = true;
    // a `docker run` cut short here may still create its container after the listing
    const interruptedCreate = inflight !== undefined && inflightCreates;
    const recorded = containerIds.size;
    const deadline = Date.now() + CLEANUP_BUDGET_MS;
    const left = (cap: number) => Math.max(0, Math.min(cap, deadline - Date.now()));
    inflight?.kill('SIGTERM');
    for (const child of children) child.kill('SIGTERM');
    // a `docker run` may still be creating a container
    await Promise.race([inflightSettled, sleep(left(3000))]);
    inflight?.kill('SIGKILL');
    // By label, so a container created while `docker run` was still pulling is found too.
    const listing = await runBounded(
      'docker',
      ['ps', '-aq', '--no-trunc', '--filter', `label=meta-frames-e2e=${RUN_ID}`],
      left(3000),
    );
    const ids = new Set(containerIds);
    if (listing.ok) for (const id of listing.output.split('\n').filter(Boolean)) ids.add(id);
    // the interrupted container is accounted for only if the listing found one beyond the recorded IDs
    const unaccounted = interruptedCreate && ids.size <= recorded;
    if (unaccounted) {
      console.error('[e2e-stack] a container creation was interrupted; check label', RUN_ID);
    }
    let removed = listing.ok || ids.size > 0;
    if (ids.size > 0) {
      removed = (await runBounded('docker', ['rm', '-f', '-v', ...ids], left(4000))).ok;
    }
    if (!removed) console.error('[e2e-stack] could not remove the containers of run', RUN_ID);
    await Promise.all([...children].map((child) => reap(child, deadline)));
    if (workDir) rmSync(workDir, { recursive: true, force: true });
    return removed && listing.ok && !unaccounted;
  })();
  return cleanupDone;
}

// Waits for `child` to exit until 1 s before the deadline, then SIGKILL and a last short wait.
async function reap(child: ChildProcess, deadline: number) {
  const gone = () =>
    child.pid === undefined || child.exitCode !== null || child.signalCode !== null;
  if (gone()) return;
  const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()));
  await Promise.race([exited, sleep(Math.max(0, deadline - 1000 - Date.now()))]);
  if (!gone()) {
    child.kill('SIGKILL');
    await Promise.race([exited, sleep(Math.max(0, Math.min(500, deadline - Date.now())))]);
  }
}

// Any listener counts, whatever it answers: a foreign process on the port must stop the run.
function portInUse(port: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port: Number(port) });
    socket.setTimeout(1000, () => (socket.destroy(), resolve(true)));
    socket.once('connect', () => (socket.destroy(), resolve(true)));
    socket.once('error', () => resolve(false));
  });
}

// Resolves when `url` answers OK. With `server`, it waits for the server's own listening line first
// and ends the run at once when the child exits. A 200 alone does not prove which process answered:
// proveOwnership runs first.
async function waitFor(url: string, what: string, server?: Server) {
  const gone = () =>
    !!server &&
    (server.child.pid === undefined ||
      server.child.exitCode !== null ||
      server.child.signalCode !== null);
  const limit = Date.now() + WAIT_MS;
  while (Date.now() < limit) {
    if (stopping) return;
    if (gone()) await fail(`${what} exited before it answered.`);
    if (!server || server.listening) {
      try {
        const timeout = Math.max(1, Math.min(2000, limit - Date.now()));
        if ((await fetch(url, { signal: AbortSignal.timeout(timeout) })).ok) return;
      } catch {
        // not listening yet
      }
    }
    await sleep(Math.max(0, Math.min(300, limit - Date.now())));
  }
  await fail(`${what} did not answer at ${url} in ${WAIT_MS / 1000} s.`);
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, async () => {
    process.exit((await cleanup()) ? 0 : 1);
  });
}

try {
  run('docker', ['info']);
} catch {
  await fail('Docker is missing or not running.');
}
try {
  run('go', ['version']);
} catch {
  await fail('Go is missing.');
}
if (!existsSync(path.join(SERVER_DIR, 'cmd/api'))) {
  await fail(`Server directory not found: ${SERVER_DIR} (set E2E_SERVER_DIR).`);
}

async function startup() {
  containerId = await runAsync(
    'docker',
    [
      'run',
      '-d',
      '--rm',
      '--label',
      `meta-frames-e2e=${RUN_ID}`,
      '-e',
      'POSTGRES_PASSWORD=e2e',
      '-e',
      'POSTGRES_DB=e2e',
      '-p',
      '127.0.0.1::5432',
      'postgres:18-alpine',
    ],
    { quiet: true, creates: true },
  );
  containerIds.add(containerId);
  if (stopping) return;
  const mapping = run('docker', ['port', containerId, '5432/tcp']).split('\n')[0];
  const dbPort = mapping.slice(mapping.lastIndexOf(':') + 1);

  // TCP check: during first-boot init the server listens on the unix socket only.
  let ready = false;
  for (let attempt = 0; attempt < 60 && !ready && !stopping; attempt++) {
    try {
      run('docker', [
        'exec',
        containerId,
        'pg_isready',
        '-h',
        '127.0.0.1',
        '-U',
        'postgres',
        '-d',
        'e2e',
      ]);
      ready = true;
    } catch {
      await sleep(500);
    }
  }
  if (stopping) return;
  if (!ready) await fail('Postgres did not become ready in 30 s.');

  workDir = mkdtempSync(path.join(tmpdir(), 'meta-frames-e2e-'));
  const binary = path.join(workDir, 'api');
  console.log('[e2e-stack] building server from', SERVER_DIR);
  await runAsync('go', ['build', '-o', binary, './cmd/api'], { cwd: SERVER_DIR });
  if (stopping) return;

  // Fixed host ports, like the API: an occupied port stops the run.
  const mailId = await runAsync(
    'docker',
    [
      'run',
      '-d',
      '--rm',
      '--label',
      `meta-frames-e2e=${RUN_ID}`,
      '-p',
      `127.0.0.1:${MAIL_SMTP_PORT}:1025`,
      '-p',
      `127.0.0.1:${MAIL_HTTP_PORT}:8025`,
      'axllent/mailpit',
    ],
    { quiet: true, creates: true },
  );
  containerIds.add(mailId);
  if (stopping) return;
  await waitFor(`http://127.0.0.1:${MAIL_HTTP_PORT}/api/v1/info`, 'Mailpit');
  if (stopping) return;

  // Explicit env only: no developer .env, ENV unset so the session cookie is not Secure.
  function startServer(port: string, origin: string, extraEnv: Record<string, string> = {}) {
    if (stopping) return undefined;
    const child = spawn(binary, [], {
      cwd: workDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        PATH: process.env.PATH,
        PORT: port,
        DATABASE_URL: `postgres://postgres:e2e@127.0.0.1:${dbPort}/e2e?sslmode=disable`,
        CORS_ORIGINS: origin,
        APP_URL: origin,
        API_URL: `http://127.0.0.1:${port}`,
        STORAGE_DIR: path.join(workDir, 'scans'),
        ...extraEnv,
      },
    });
    children.add(child);
    if (stopping) child.kill('SIGTERM');
    const server: Server = { child, listening: false };
    // forward the logs, and watch for the server's own listening line
    for (const [stream, sink] of [
      [child.stdout, process.stdout],
      [child.stderr, process.stderr],
    ] as const) {
      let pending = '';
      stream.on('data', (chunk: Buffer) => {
        sink.write(chunk);
        const lines = (pending + chunk.toString()).split('\n');
        pending = lines.pop() ?? '';
        if (
          lines.some((line) => line.includes('msg=listening') && line.includes(`addr=:${port}`))
        ) {
          server.listening = true;
        }
      });
    }
    child.on('exit', (code) => {
      if (stopping) return;
      void fail(`server on port ${port} exited with code ${code}`);
    });
    child.on('error', (error) => {
      if (stopping) return;
      void fail(`server on port ${port} failed to start: ${error.message}`);
    });
    return server;
  }

  for (const port of [ENFORCE_API_PORT, API_PORT]) {
    if (await portInUse(port)) await fail(`port ${port} is already in use.`);
  }
  if (stopping) return;

  // enforce first, and ready before the off server starts: the two do not migrate at once, and
  // the off server's /health (the Playwright readiness check) then covers both.
  const enforce = startServer(ENFORCE_API_PORT, ENFORCE_APP_ORIGIN, {
    EMAIL_VERIFICATION: 'enforce',
    SMTP_ADDR: `127.0.0.1:${MAIL_SMTP_PORT}`,
    MAIL_FROM: 'no-reply@e2e.test',
  });
  if (!enforce) return;
  await proveOwnership(enforce);
  if (stopping) return;
  await waitFor(`http://127.0.0.1:${ENFORCE_API_PORT}/health`, 'enforce server', enforce);
  if (stopping) return;
  startServer(API_PORT, APP_ORIGIN);
}

// Read-only: sends no request to the port. The server logs `listening` before it binds, so wait
// until the only process listening on the enforce port is our child; any other holder stops the run.
async function proveOwnership(server: Server) {
  const pid = String(server.child.pid);
  const limit = Date.now() + WAIT_MS;
  while (Date.now() < limit) {
    if (stopping) return;
    if (server.child.exitCode !== null || server.child.signalCode !== null) {
      await fail(`enforce server exited before it listened on ${ENFORCE_API_PORT}.`);
    }
    // lsof exits 1 when nothing listens yet
    const holders = await runBounded(
      'lsof',
      ['-nP', `-iTCP:${ENFORCE_API_PORT}`, '-sTCP:LISTEN', '-t'],
      Math.max(1, Math.min(3000, limit - Date.now())),
    );
    if (stopping) return;
    const pids = new Set(holders.output.split('\n').filter(Boolean));
    // Accept only a complete lsof run; a foreign pid stops the run even from partial output.
    if (holders.ok && pids.size === 1 && pids.has(pid)) return;
    if ([...pids].some((holder) => holder !== pid)) {
      await fail(
        `port ${ENFORCE_API_PORT} is held by another process (pids ${[...pids].join(', ')}).`,
      );
    }
    await sleep(Math.max(0, Math.min(300, limit - Date.now())));
  }
  await fail(
    `enforce server did not listen on ${ENFORCE_API_PORT} in ${WAIT_MS / 1000} s (lsof must be installed).`,
  );
}

try {
  await startup();
} catch (error) {
  if (!stopping) {
    await fail(`startup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
