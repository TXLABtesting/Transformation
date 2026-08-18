// Static export for GitHub Pages / any static host.
// The app is fully client-side (localStorage persistence) in this mode, so the
// server-only API routes (the AI proxy) must be excluded — `next build` with
// `output: 'export'` cannot compile dynamic route handlers. We move them aside,
// build, then restore. In static mode the AI review uses its heuristic fallback.
import { execSync } from 'node:child_process';
import { existsSync, renameSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
// server-only dynamic routes that cannot compile under `output: export` —
// each is moved aside for the static build then restored
const DYNAMIC_DIRS = [
  ['app/api', '.api-stash'],
  ['app/callback', '.callback-stash'],
];
const pairs = DYNAMIC_DIRS.map(([d, st]) => [join(root, ...d.split('/')), join(root, st)]);

function restore() {
  for (const [dir, stash] of pairs) {
    if (existsSync(stash)) {
      if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
      renameSync(stash, dir);
    }
  }
}

process.on('exit', restore);
process.on('SIGINT', () => {
  restore();
  process.exit(1);
});

try {
  for (const [dir, stash] of pairs) {
    if (existsSync(dir)) {
      if (existsSync(stash)) rmSync(stash, { recursive: true, force: true });
      renameSync(dir, stash);
    }
  }
  mkdirSync(join(root, 'out'), { recursive: true });
  execSync('next build', {
    stdio: 'inherit',
    env: { ...process.env, BUILD_STATIC: '1' },
  });
} finally {
  restore();
}
