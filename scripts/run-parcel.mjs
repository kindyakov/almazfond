import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

import { getPublicUrl } from './build-paths.mjs';

const [mode, targetName] = process.argv.slice(2);

const targets = {
  css: {
    entry: 'src/assets/css/index.css',
    distDir: mode === 'watch' ? '.dev/css' : 'dist/css',
    publicSegment: 'css'
  },
  js: {
    entry: 'src/assets/js/index.js',
    distDir: mode === 'watch' ? '.dev/js' : 'dist/js',
    publicSegment: 'js'
  }
};

if (!['build', 'watch'].includes(mode) || !targets[targetName]) {
  throw new Error('Usage: node scripts/run-parcel.mjs <build|watch> <css|js>');
}

const projectRoot = process.cwd();
const parcelCliPath = resolve(projectRoot, 'node_modules/parcel/lib/cli.js');
const target = targets[targetName];
const args = [
  parcelCliPath,
  mode,
  target.entry,
  '--dist-dir',
  target.distDir,
  '--public-url',
  getPublicUrl(target.publicSegment),
  '--no-source-maps'
];

if (mode === 'watch') {
  args.push('--no-content-hash', '--no-hmr');
}

const child = spawn(process.execPath, args, {
  cwd: projectRoot,
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
