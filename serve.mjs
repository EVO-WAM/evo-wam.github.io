// Local preview with byte ranges, so video seeking behaves like GitHub Pages.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.vtt': 'text/vtt', '.ttf': 'font/ttf', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8' };
const port = Number(process.env.PORT || 4173);
http.createServer(async (req, res) => {
  const fail = (code, message) => { res.writeHead(code); res.end(message); };
  if (!['GET', 'HEAD'].includes(req.method)) return fail(405, 'Method not allowed');
  let relative;
  try { relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { return fail(400, 'Bad request'); }
  if (relative.split('/').some(segment => segment.startsWith('.'))) return fail(404, 'Not found');
  const file = path.resolve(root, '.' + (relative.endsWith('/') ? relative + 'index.html' : relative));
  if (!file.startsWith(root + path.sep)) return fail(403, 'Forbidden');
  let stat;
  try {
    const realFile = await fs.promises.realpath(file);
    if (!realFile.startsWith(root + path.sep)) return fail(403, 'Forbidden');
    stat = await fs.promises.stat(file);
    if (!stat.isFile()) return fail(404, 'Not found');
  } catch { return fail(404, 'Not found'); }
  const headers = { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
  let start = 0, end = stat.size - 1, code = 200;
  if (req.headers.range && stat.size) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (!match || (!match[1] && !match[2])) { res.setHeader('Content-Range', `bytes */${stat.size}`); return fail(416, 'Invalid range'); }
    start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2]));
    end = match[1] && match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
    if (start >= stat.size || start > end) { res.setHeader('Content-Range', `bytes */${stat.size}`); return fail(416, 'Invalid range'); }
    code = 206;
    headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
  }
  headers['Content-Length'] = Math.max(0, end - start + 1);
  res.writeHead(code, headers);
  if (req.method === 'HEAD' || !stat.size) return res.end();
  const stream = fs.createReadStream(file, { start, end });
  stream.on('error', () => res.destroy());
  res.on('close', () => stream.destroy());
  stream.pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`EVO-WAM preview: http://127.0.0.1:${port}/`));
