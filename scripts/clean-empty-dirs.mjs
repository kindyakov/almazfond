import { readdir, rmdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const rootDir = resolve(process.cwd(), 'dist');

const removeEmptyDirs = async (dirPath) => {
  const entries = await readdir(dirPath, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => removeEmptyDirs(resolve(dirPath, entry.name)))
  );

  const remainingEntries = await readdir(dirPath, { withFileTypes: true });
  if (remainingEntries.length === 0 && dirPath !== rootDir) {
    await rmdir(dirPath);
  }
};

await removeEmptyDirs(rootDir);
