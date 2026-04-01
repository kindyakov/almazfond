import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const projectRoot = process.cwd();
const srcAssetsDir = resolve(projectRoot, 'src/assets');
const distAssetsDir = resolve(projectRoot, 'dist/assets');
const excludedSourceDirs = new Set(['css', 'js']);
const sourceDirs = existsSync(srcAssetsDir)
  ? readdirSync(srcAssetsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !excludedSourceDirs.has(entry.name))
      .map((entry) => resolve(srcAssetsDir, entry.name))
  : [];

sourceDirs.push(resolve(projectRoot, 'public/assets'));

mkdirSync(distAssetsDir, { recursive: true });

for (const sourceDir of sourceDirs) {
  if (!existsSync(sourceDir)) {
    continue;
  }

  cpSync(sourceDir, resolve(distAssetsDir, basename(sourceDir)), {
    recursive: true,
    force: true
  });
}
