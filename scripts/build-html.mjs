import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import posthtml from 'posthtml';
import include from 'posthtml-include';
import { applyBasePathToHtml, normalizeBasePath } from './build-paths.mjs';

const projectRoot = process.cwd();
const pagesDir = resolve(projectRoot, 'src/pages');
const distDir = resolve(projectRoot, 'dist');
const isDev = process.argv.includes('--dev');
const basePath = normalizeBasePath();

const htmlFiles = (await readdir(pagesDir)).filter((fileName) => fileName.endsWith('.html'));

const getBuiltFileName = async (dirName, prefix, extension) => {
  if (isDev) {
    return `${prefix}.${extension}`;
  }

  const files = await readdir(resolve(distDir, dirName));
  const matchedFile = files.find(
    (fileName) => fileName.startsWith(`${prefix}.`) && fileName.endsWith(`.${extension}`)
  );

  if (!matchedFile) {
    throw new Error(`Built file not found for ${dirName}/${prefix}.${extension}`);
  }

  return matchedFile;
};

await mkdir(distDir, { recursive: true });

const processor = posthtml([
  include({
    root: './src/pages',
    cwd: '.',
    encoding: 'utf8'
  })
]);

const cssFileName = await getBuiltFileName('css', 'index', 'css');
const jsFileName = await getBuiltFileName('js', 'index', 'js');

for (const fileName of htmlFiles) {
  const inputPath = resolve(pagesDir, fileName);
  const outputPath = resolve(distDir, fileName);
  const source = await readFile(inputPath, 'utf8');
  const result = await processor.process(source);
  const html = applyBasePathToHtml(result.html, {
    basePath,
    cssFileName,
    jsFileName
  });

  await writeFile(outputPath, html, 'utf8');
}
