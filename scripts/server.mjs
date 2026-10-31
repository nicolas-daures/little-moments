import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { outputDirectory } from './project.mjs';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

export function createRequestHandler({ development = false } = {}) {
  return async function handleRequest(request, response) {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end('Method not allowed');
      return;
    }

    let pathname;
    let requestUrl;
    try {
      requestUrl = new URL(request.url, 'http://localhost');
      pathname = decodeURIComponent(requestUrl.pathname);
    } catch {
      response.writeHead(400);
      response.end('Invalid URL');
      return;
    }

    const filename = path.resolve(outputDirectory, `.${pathname}`);
    if (filename !== outputDirectory && !filename.startsWith(outputDirectory + path.sep)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    try {
      const directory = (await stat(filename)).isDirectory();
      if (directory && !requestUrl.pathname.endsWith('/')) {
        response.writeHead(308, { Location: `${requestUrl.pathname}/${requestUrl.search}` });
        response.end();
        return;
      }
      const target = directory ? path.join(filename, 'index.html') : filename;
      let content = await readFile(target);
      const type = mimeTypes[path.extname(target)] || 'application/octet-stream';
      if (development && type.startsWith('text/html')) {
        content = Buffer.from(
          content
            .toString('utf8')
            .replace('</head>', '<script>window.__DEV__ = true;</script></head>'),
        );
      }
      response.writeHead(200, {
        'Content-Type': type,
        'Content-Length': content.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
      const status = ['ENOENT', 'ENOTDIR'].includes(error.code) ? 404 : 500;
      if (status === 500) console.error(error);
      response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(status === 404 ? 'Page not found' : 'Server error');
    }
  };
}

export function startServer({ development = false, defaultPort = 4173 } = {}) {
  const portOption = process.argv.indexOf('--port');
  const port = portOption === -1 ? defaultPort : Number(process.argv[portOption + 1]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Use --port with a number between 1 and 65535.');
  }
  const server = createServer(createRequestHandler({ development }));
  server.on('error', (error) => {
    console.error(
      error.code === 'EADDRINUSE' ? `Port ${port} is in use. Choose another --port.` : error,
    );
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`Local site: http://127.0.0.1:${port}/`);
    console.log(`English:   http://127.0.0.1:${port}/en/`);
  });
  return server;
}
