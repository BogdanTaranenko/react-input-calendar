// Packs the library and installs the tarball into each example app, the way a consumer would
// get it from npm. The examples do not list the library, so a plain `npm install` never
// resolves it from the registry.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tarball = join(root, '.tmp', 'ric.tgz');
const examples = ['nextjs-app-router', 'vite-react18'];

function run(command, args, cwd) {
  console.log(`$ ${command} ${args.join(' ')}   (in ${cwd})`);
  try {
    execFileSync(command, args, { cwd, stdio: 'inherit' });
  } catch {
    console.error(`pack-and-install: "${command} ${args.join(' ')}" failed in ${cwd}`);
    process.exit(1);
  }
}

// Absolute paths throughout: pnpm resolves `--out` from where it runs, not from the package.
mkdirSync(dirname(tarball), { recursive: true });
run('pnpm', ['--filter', '@b.taranenko/react-input-calendar', 'pack', '--out', tarball], root);

for (const example of examples) {
  const cwd = join(root, 'examples', example);
  run('npm', ['install', '--no-package-lock'], cwd);
  run('npm', ['install', '--no-save', '--no-package-lock', tarball], cwd);
}
