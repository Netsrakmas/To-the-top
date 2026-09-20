import http from 'node:http';
import { realpath, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { pipeline } from 'node:stream/promises';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.woff2', 'font/woff2'],
  ['.mp3', 'audio/mpeg'],
  ['.wav', 'audio/wav'],
  ['.ogg', 'audio/ogg'],
]);

function isWithin(root, target) {
  const path = relative(root, target);
  return path === '' || (!isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`));
}

function reply(response, status, message, method) {
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
  });
  response.end(method === 'HEAD' ? undefined : message);
}

/** Serve a directory without exposing hidden files, traversal paths, or external symlinks. */
export async function createStaticServer({ root = projectRoot } = {}) {
  const publicRoot = await realpath(root);
  if (!(await stat(publicRoot)).isDirectory()) throw new Error('The server root must be a directory.');

  return http.createServer(async (request, response) => {
    const method = request.method;
    if (method !== 'GET' && method !== 'HEAD') {
      response.setHeader('Allow', 'GET, HEAD');
      reply(response, 405, 'Method not allowed.', method);
      return;
    }

    let pathname;
    try {
      // Inspect the original path before URL normalization could discard a traversal segment.
      pathname = decodeURIComponent((request.url || '/').split(/[?#]/, 1)[0]);
    } catch {
      reply(response, 400, 'Invalid URL encoding.', method);
      return;
    }

    if (!pathname.startsWith('/') || /[\\\0:]/.test(pathname)
      || pathname.split('/').some(segment => segment.startsWith('.'))) {
      reply(response, 403, 'Forbidden.', method);
      return;
    }

    try {
      let target = resolve(publicRoot, `.${pathname}`);
      if (!isWithin(publicRoot, target)) {
        reply(response, 403, 'Forbidden.', method);
        return;
      }
      target = await realpath(target);
      if (!isWithin(publicRoot, target)) {
        reply(response, 403, 'Forbidden.', method);
        return;
      }
      let info = await stat(target);
      if (info.isDirectory()) {
        target = await realpath(join(target, 'index.html'));
        if (!isWithin(publicRoot, target)) {
          reply(response, 403, 'Forbidden.', method);
          return;
        }
        info = await stat(target);
      }
      if (!info.isFile()) {
        reply(response, 404, 'Not found.', method);
        return;
      }
      response.writeHead(200, {
        'Content-Type': contentTypes.get(extname(target).toLowerCase()) || 'application/octet-stream',
        'Content-Length': info.size,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
      });
      if (method === 'HEAD') response.end();
      else await pipeline(createReadStream(target), response);
    } catch (error) {
      if (response.headersSent) {
        response.destroy();
      } else if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
        reply(response, 404, 'Not found.', method);
      } else if (error.code === 'EACCES' || error.code === 'EPERM') {
        reply(response, 403, 'Forbidden.', method);
      } else {
        console.error('Unable to serve request:', error.message);
        reply(response, 500, 'Unable to serve this file.', method);
      }
    }
  });
}

async function main() {
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  const root = process.argv.includes('--dist') ? join(projectRoot, 'dist') : projectRoot;
  const server = await createStaticServer({ root });
  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(port, host, resolveListen);
  });
  const urlHost = host.includes(':') ? `[${host}]` : host;
  console.log(`To the Top is running at http://${urlHost}:${port}`);
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => server.close(() => process.exit(0)));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
