import { spawn } from 'node:child_process';

const projectRoot = process.cwd();
const packageName = process.env.npm_package_name;
const npmExecPath = process.env.npm_execpath;
const basePath = process.env.BASE_PATH || packageName;

if (!basePath) {
  throw new Error('BASE_PATH or npm_package_name is required to derive the GitHub Pages base path.');
}

if (!npmExecPath) {
  throw new Error('npm_execpath is required to run the nested build command.');
}

const child = spawn(process.execPath, [npmExecPath, 'run', 'build'], {
  cwd: projectRoot,
  env: {
    ...process.env,
    BASE_PATH: basePath
  },
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
