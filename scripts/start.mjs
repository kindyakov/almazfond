import http from 'node:http';
import { constants, createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { normalizeBasePath, stripBasePath } from './build-paths.mjs';

const projectRoot = process.cwd();
const distDir = resolve(projectRoot, 'dist');
const port = Number(process.env.PORT || 3000);
const basePath = normalizeBasePath();

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8'
};

const ensureBuildExists = async () => {
  try {
    await access(resolve(distDir, 'index.html'), constants.F_OK);
  } catch {
    throw new Error('Production build was not found. Run "npm run build" before "npm run start".');
  }
};

const fileExists = async (filePath) => {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const getSafeFilePath = async (pathname) => {
  const normalizedRequestPath = stripBasePath(pathname, basePath);
  const normalizedPath = normalizedRequestPath === '/' ? '/index.html' : normalizedRequestPath;
  const decodedPath = decodeURIComponent(normalizedPath);
  const requestedPath = resolve(distDir, `.${decodedPath}`);

  if (!requestedPath.startsWith(distDir)) {
    return null;
  }

  if (await fileExists(requestedPath)) {
    const fileStats = await stat(requestedPath);
    return fileStats.isDirectory() ? null : requestedPath;
  }

  if (!extname(requestedPath)) {
    const htmlPath = `${requestedPath}.html`;

    if (await fileExists(htmlPath)) {
      return htmlPath;
    }
  }

  return null;
};

const serveFile = async (response, filePath) => {
  const type = mimeTypes[extname(filePath)] || 'application/octet-stream';

  response.writeHead(200, {
    'Cache-Control': 'public, max-age=300',
    'Content-Type': type
  });

  const stream = createReadStream(filePath);
  stream.pipe(response);
};

await ensureBuildExists();

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://localhost:${port}`);
    const filePath = await getSafeFilePath(url.pathname);

    if (!filePath) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    await serveFile(response, filePath);
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(error instanceof Error ? error.message : 'Server error');
  }
});

server.listen(port, () => {
  console.log(`Production server running at http://localhost:${port}`);
});

process.on('SIGINT', () => server.close());
process.on('SIGTERM', () => server.close());
