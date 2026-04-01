import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const projectRoot = process.cwd();
const devDir = resolve(projectRoot, '.dev');
const cssDir = resolve(devDir, 'css');
const jsDir = resolve(devDir, 'js');

mkdirSync(cssDir, { recursive: true });
mkdirSync(jsDir, { recursive: true });

let isShuttingDown = false;

const createChild = (label, args) => {
  const child = spawn(process.execPath, args, {
    cwd: projectRoot,
    stdio: 'inherit'
  });

  child.on('error', (error) => {
    console.error(`${label} failed:`, error.message);
    shutdown(1);
  });

  child.on('exit', (code) => {
    if (isShuttingDown) {
      return;
    }

    if (code !== 0 && code !== null) {
      console.error(`${label} exited with code ${code}`);
      shutdown(code);
    }
  });

  return child;
};

const processes = [
  createChild('Parcel CSS watcher', ['scripts/run-parcel.mjs', 'watch', 'css']),
  createChild('Parcel JS watcher', ['scripts/run-parcel.mjs', 'watch', 'js']),
  createChild('Dev server', ['scripts/dev-server.mjs'])
];

function shutdown(exitCode = 0) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  processes.forEach((child) => {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  });

  setTimeout(() => {
    processes.forEach((child) => {
      if (!child.killed) {
        child.kill('SIGKILL');
      }
    });

    process.exit(exitCode);
  }, 150);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
