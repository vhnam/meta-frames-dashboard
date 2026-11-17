// Isolated E2E backend: throwaway Postgres container + the server binary built from the sibling
// checkout. Removes only the container and temp directory it created.
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const API_PORT = '18080';
const APP_ORIGIN = 'http://127.0.0.1:4173';
const SERVER_DIR = path.resolve(process.env.E2E_SERVER_DIR ?? '../meta-frames-server');
const RUN_ID = randomUUID();

let containerId = '';
let workDir = '';
let api: ChildProcess | undefined;
let inflight: ChildProcess | undefined; // long async step (docker run, go build), killed on cleanup
let cleaned = false;

function fail(message: string): never {
  console.error(`[e2e-stack] ${message}`);
  cleanup();
  process.exit(1);
}

function run(command: string, args: string[], options: { cwd?: string } = {}): string {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options,
  }).trim();
}

// Async so SIGTERM/SIGINT handlers can run during long steps. Resolves with trimmed stdout.
function runAsync(
  command: string,
  args: string[],
  options: { cwd?: string; quiet?: boolean } = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: ['ignore', options.quiet ? 'pipe' : 'inherit', 'inherit'],
    });
    inflight = child;
    let output = '';
    child.stdout?.on('data', (chunk) => (output += chunk));
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      inflight = undefined;
      if (code === 0) resolve(output.trim());
      else reject(new Error(`${command} ${args[0]} exited with ${code ?? signal}`));
    });
  });
}

function cleanup() {
  if (cleaned) return;
  cleaned = true;
  inflight?.kill('SIGTERM');
  api?.kill('SIGTERM');
  // By label, so a container created while `docker run` was still pulling is found too.
  try {
    const ids = run('docker', ['ps', '-aq', '--filter', `label=meta-frames-e2e=${RUN_ID}`])
      .split('\n')
      .filter(Boolean);
    if (ids.length > 0) run('docker', ['rm', '-f', '-v', ...ids]);
  } catch (error) {
    console.error('[e2e-stack] could not remove container for run', RUN_ID, error);
  }
  if (workDir) rmSync(workDir, { recursive: true, force: true });
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    cleanup();
    process.exit(0);
  });
}

try {
  run('docker', ['info']);
} catch {
  fail('Docker is missing or not running.');
}
try {
  run('go', ['version']);
} catch {
  fail('Go is missing.');
}
if (!existsSync(path.join(SERVER_DIR, 'cmd/api'))) {
  fail(`Server directory not found: ${SERVER_DIR} (set E2E_SERVER_DIR).`);
}

try {
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
    { quiet: true },
  );
  const mapping = run('docker', ['port', containerId, '5432/tcp']).split('\n')[0];
  const dbPort = mapping.slice(mapping.lastIndexOf(':') + 1);

  // TCP check: during first-boot init the server listens on the unix socket only.
  let ready = false;
  for (let attempt = 0; attempt < 60 && !ready; attempt++) {
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
  if (!ready) fail('Postgres did not become ready in 30 s.');

  workDir = mkdtempSync(path.join(tmpdir(), 'meta-frames-e2e-'));
  const binary = path.join(workDir, 'api');
  console.log('[e2e-stack] building server from', SERVER_DIR);
  await runAsync('go', ['build', '-o', binary, './cmd/api'], { cwd: SERVER_DIR });

  // Explicit env only: no developer .env, ENV unset so the session cookie is not Secure.
  api = spawn(binary, [], {
    cwd: workDir,
    stdio: 'inherit',
    env: {
      PATH: process.env.PATH,
      PORT: API_PORT,
      DATABASE_URL: `postgres://postgres:e2e@127.0.0.1:${dbPort}/e2e?sslmode=disable`,
      CORS_ORIGINS: APP_ORIGIN,
      APP_URL: APP_ORIGIN,
      API_URL: `http://127.0.0.1:${API_PORT}`,
      STORAGE_DIR: path.join(workDir, 'scans'),
    },
  });
  api.on('exit', (code) => {
    if (cleaned) return;
    console.error(`[e2e-stack] server exited with code ${code}`);
    cleanup();
    process.exit(1);
  });
} catch (error) {
  fail(`startup failed: ${error instanceof Error ? error.message : String(error)}`);
}
