const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.zip': 'application/zip'
};

function safePath(urlPath) {
  let decoded = '/';
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  } catch (error) {
    decoded = '/';
  }
  if (decoded === '/') decoded = '/home/index.html';
  if (decoded.endsWith('/')) decoded += 'index.html';
  const full = path.resolve(ROOT, '.' + decoded);
  if (!full.startsWith(ROOT + path.sep) && full !== ROOT) return null;
  return full;
}

const server = http.createServer((request, response) => {
  const file = safePath(request.url || '/');
  if (!file) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  fs.stat(file, (error, stats) => {
    if (error || !stats.isFile()) {
      response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end('<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px"><h1>Page not found</h1><p>Open <a href="/home/index.html">the project home</a> or <a href="/pagsubok/">the practice pages</a>.</p></body></html>');
      return;
    }

    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    response.writeHead(200, {
      'Content-Type': type,
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(file).pipe(response);
  });
});

server.listen(PORT, HOST, () => {
  console.log('LigtasPangan local server');
  console.log(`Home         http://${HOST}:${PORT}/home/index.html`);
  console.log(`Practice     http://${HOST}:${PORT}/pagsubok/`);
  console.log('Press Ctrl+C to stop.');
});
