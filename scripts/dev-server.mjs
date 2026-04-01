import http from 'node:http';
import { access, readFile } from 'node:fs/promises';
import { constants, createReadStream, existsSync, readdirSync, statSync, watch } from 'node:fs';
import { extname, resolve } from 'node:path';

import posthtml from 'posthtml';
import include from 'posthtml-include';
import { applyBasePathToHtml, normalizeBasePath, stripBasePath } from './build-paths.mjs';
import { normalizeRequestPathname } from './dev-server-paths.mjs';

const projectRoot = process.cwd();
const pagesDir = resolve(projectRoot, 'src/pages');
const devDir = resolve(projectRoot, '.dev');
const partialsDir = resolve(projectRoot, 'src/partials');
const srcAssetsDir = resolve(projectRoot, 'src/assets');
const publicAssetsDir = resolve(projectRoot, 'public/assets');
const port = Number(process.env.PORT || 1234);
const basePath = normalizeBasePath();
const liveReloadClients = new Set();
let reloadTimeoutId = null;
const excludedSourceDirs = new Set(['css', 'js']);
const assetSourceDirs = existsSync(srcAssetsDir)
  ? readdirSync(srcAssetsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !excludedSourceDirs.has(entry.name))
    .map((entry) => resolve(srcAssetsDir, entry.name))
  : [];

const processor = posthtml([
  include({
    root: './src/pages',
    cwd: '.',
    encoding: 'utf8'
  })
]);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8'
};

const getCacheControl = (filePath) => {
  const extension = extname(filePath);

  if (extension === '.html' || extension === '.css' || extension === '.js') {
    return 'no-store, no-cache, must-revalidate';
  }

  return 'public, max-age=3600';
};

const fileExists = async (filePath) => {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const resolvePageName = async (pathname) => {
  if (pathname === '/' || pathname === '/index.html') {
    return 'index.html';
  }

  const normalizedPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const candidates = normalizedPath.endsWith('.html')
    ? [normalizedPath]
    : [`${normalizedPath}.html`];

  for (const candidate of candidates) {
    if (await fileExists(resolve(pagesDir, candidate))) {
      return candidate;
    }
  }

  return null;
};

const renderHtml = async (pageName) => {
  const source = await readFile(resolve(pagesDir, pageName), 'utf8');
  const result = await processor.process(source);
  const html = applyBasePathToHtml(result.html, {
    basePath,
    cssFileName: 'index.css',
    jsFileName: 'index.js'
  });

  return injectLiveReload(html);
};

const serveFile = async (request, response, filePath) => {
  const type = mimeTypes[extname(filePath)] || 'application/octet-stream';
  const cacheControl = getCacheControl(filePath);
  const fileStats = statSync(filePath);
  const rangeHeader = request.headers.range;

  if (rangeHeader) {
    const matches = /bytes=(\d*)-(\d*)/.exec(rangeHeader);

    if (matches) {
      const [, startToken, endToken] = matches;
      const start = startToken ? Number(startToken) : 0;
      const end = endToken ? Number(endToken) : fileStats.size - 1;

      if (
        Number.isInteger(start) &&
        Number.isInteger(end) &&
        start >= 0 &&
        end >= start &&
        end < fileStats.size
      ) {
        response.writeHead(206, {
          'Accept-Ranges': 'bytes',
          'Cache-Control': cacheControl,
          'Content-Length': end - start + 1,
          'Content-Range': `bytes ${start}-${end}/${fileStats.size}`,
          'Content-Type': type,
          Pragma: 'no-cache'
        });

        createReadStream(filePath, { start, end }).pipe(response);
        return;
      }
    }

    response.writeHead(416, {
      'Content-Range': `bytes */${fileStats.size}`
    });
    response.end();
    return;
  }

  response.writeHead(200, {
    'Accept-Ranges': 'bytes',
    'Cache-Control': cacheControl,
    'Content-Type': type,
    'Content-Length': fileStats.size,
    Pragma: 'no-cache'
  });

  createReadStream(filePath).pipe(response);
};

const injectLiveReload = (html) => {
  const snippet = `
<script>
  (() => {
    const source = new EventSource('/__dev_reload');
    source.addEventListener('reload', () => window.location.reload());
  })();
</script>`;

  return html.includes('</body>')
    ? html.replace('</body>', `${snippet}\n</body>`)
    : `${html}\n${snippet}`;
};

const broadcastReload = () => {
  liveReloadClients.forEach((client) => {
    client.write('event: reload\n');
    client.write('data: now\n\n');
  });
};

const scheduleReload = () => {
  if (reloadTimeoutId) {
    clearTimeout(reloadTimeoutId);
  }

  reloadTimeoutId = setTimeout(() => {
    broadcastReload();
    reloadTimeoutId = null;
  }, 120);
};

const registerWatcher = (targetPath) => {
  try {
    const watcher = watch(targetPath, { recursive: true }, () => {
      scheduleReload();
    });

    watcher.on('error', (error) => {
      console.error(`Watch error for ${targetPath}:`, error.message);
    });

    return watcher;
  } catch (error) {
    console.error(`Failed to watch ${targetPath}:`, error instanceof Error ? error.message : error);
    return null;
  }
};

const watchers = [
  registerWatcher(devDir),
  registerWatcher(pagesDir),
  registerWatcher(partialsDir),
  ...assetSourceDirs.map((assetDir) => registerWatcher(assetDir)),
  registerWatcher(publicAssetsDir)
].filter(Boolean);

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://localhost:${port}`);
    const pathname = stripBasePath(normalizeRequestPathname(url.pathname), basePath);

    if (pathname === '/__dev_reload') {
      response.writeHead(200, {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream; charset=utf-8',
        Pragma: 'no-cache'
      });
      response.write(':ok\n\n');
      liveReloadClients.add(response);
      request.on('close', () => {
        liveReloadClients.delete(response);
      });
      return;
    }

    const pageName = await resolvePageName(pathname);

    if (pageName) {
      response.writeHead(200, {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': mimeTypes['.html'],
        Pragma: 'no-cache'
      });
      response.end(await renderHtml(pageName));
      return;
    }

    if (pathname.startsWith('/css/') || pathname.startsWith('/js/')) {
      const devAssetPath = resolve(devDir, `.${pathname}`);

      if (!(await fileExists(devAssetPath))) {
        response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end(
          'Dev asset is not built yet. Start or restart "npm run dev" and wait for Parcel to emit .dev/css/index.css and .dev/js/index.js.'
        );
        return;
      }

      await serveFile(request, response, devAssetPath);
      return;
    }

    if (pathname.startsWith('/assets/')) {
      const relativePath = pathname.replace('/assets/', '');
      const devAssetCandidate = resolve(devDir, 'assets', relativePath);
      const sourceAssetCandidate = resolve(srcAssetsDir, relativePath);
      const publicCandidate = resolve(publicAssetsDir, relativePath);

      if (await fileExists(devAssetCandidate)) {
        await serveFile(request, response, devAssetCandidate);
        return;
      }

      if (
        !relativePath.startsWith('css/') &&
        !relativePath.startsWith('js/') &&
        existsSync(sourceAssetCandidate)
      ) {
        await serveFile(request, response, sourceAssetCandidate);
        return;
      }

      if (await fileExists(publicCandidate)) {
        await serveFile(request, response, publicCandidate);
        return;
      }
    }

    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(error instanceof Error ? error.message : 'Server error');
  }
});

server.listen(port, () => {
  console.log(`Dev server running at http://localhost:${port}`);
});

const shutdown = () => {
  watchers.forEach((watcher) => watcher.close());
  liveReloadClients.forEach((client) => client.end());
  server.close();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
