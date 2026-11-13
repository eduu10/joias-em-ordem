// Servidor estatico local para desenvolver: `npm run dev` e abra http://localhost:5173
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Uso: node tools/serve.mjs [pasta do jogo] [porta]
const FOLDER = process.argv[2] ?? 'game';
const ROOT = resolve(fileURLToPath(new URL(`../${FOLDER}`, import.meta.url)));
const PORT = Number(process.argv[3] ?? process.env.PORT) || 5173;
const TYPES = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wasm': 'application/wasm',
});

const resolvePath = (url) => {
  const pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  const target = resolve(join(ROOT, normalize(pathname === '/' ? '/index.html' : pathname)));
  return target === ROOT || target.startsWith(ROOT + sep) ? target : null;
};

createServer(async (req, res) => {
  const target = resolvePath(req.url);
  if (!target) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const body = await readFile(target);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(target)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Jogo rodando em http://localhost:${PORT}`);
});
