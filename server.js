#!/usr/bin/env node

/**
 * Simple HTTP Server for Terraria Companion
 * Run with: node server.js
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { spawn } from 'node:child_process';
import { isPathWithinDir } from './src/lib/serverPathGuard.mjs';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8000;
const DIST_DIR = path.join(__dirname, 'dist');

// MIME types mapping
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function buildSecurityHeaders(contentType) {
  return {
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = path.join(DIST_DIR, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);

  // Prevent directory traversal
  const normalizedPathname = path.normalize(pathname);
  if (!isPathWithinDir(normalizedPathname, DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  pathname = normalizedPathname;

  // If file doesn't exist and it's not the root, try index.html (SPA routing)
  if (!fs.existsSync(pathname)) {
    if (!pathname.endsWith('.html') && !pathname.includes('.')) {
      pathname = path.join(DIST_DIR, 'index.html');
    }
  }

  fs.stat(pathname, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    if (stats.isDirectory()) {
      pathname = path.join(pathname, 'index.html');
      fs.readFile(pathname, (err, content) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        const ext = path.extname(pathname);
        res.writeHead(200, buildSecurityHeaders(mimeTypes[ext] || 'text/html'));
        res.end(content);
      });
    } else {
      fs.readFile(pathname, (err, content) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
          return;
        }
        const ext = path.extname(pathname);
        res.writeHead(200, buildSecurityHeaders(mimeTypes[ext] || 'application/octet-stream'));
        res.end(content);
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Terraria Companion Server Running    ║
╠════════════════════════════════════════╣
║  📍 http://localhost:${PORT}                 ║
║  📂 Serving from: ${path.relative(process.cwd(), DIST_DIR)}  ║
║  🔴 Press Ctrl+C to stop                ║
╚════════════════════════════════════════╝
  `);
  
  // Auto-open browser if possible
  try {
    const platform = process.platform;
    if (platform === 'win32') {
      spawn('start', [`http://localhost:${PORT}`], { shell: true });
    } else if (platform === 'darwin') {
      spawn('open', [`http://localhost:${PORT}`]);
    } else if (platform === 'linux') {
      spawn('xdg-open', [`http://localhost:${PORT}`]);
    }
  } catch (e) {
    console.log(`\n➜ Open your browser and visit http://localhost:${PORT}`);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`Try: PORT=3000 node server.js`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});