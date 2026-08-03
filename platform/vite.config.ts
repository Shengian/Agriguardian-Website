import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { ServerResponse } from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(__dirname, '..');

const marketingPages = new Set([
  'index.html',
  'portals.html',
  'employee-login.html',
  'intern-login.html',
  'employer-login.html',
  'intern-dashboard.html',
]);

const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendWebsiteFile(res: ServerResponse, filePath: string) {
  const ext = path.extname(filePath);
  if (mimeTypes[ext]) res.setHeader('Content-Type', mimeTypes[ext]);
  fs.createReadStream(filePath).pipe(res);
}

function marketingSitePlugin(): Plugin {
  const handler = (req: import('http').IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = (req.url ?? '').split('?')[0];

    if (url === '/' || url === '') {
      const homePath = path.join(websiteRoot, 'index.html');
      if (fs.existsSync(homePath)) {
        sendWebsiteFile(res, homePath);
        return;
      }
    }

    if (url.startsWith('/css/') || url.startsWith('/js/') || url.startsWith('/assets/')) {
      const filePath = path.join(websiteRoot, url);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        sendWebsiteFile(res, filePath);
        return;
      }
    }

    const page = url.startsWith('/') ? url.slice(1) : url;
    if (marketingPages.has(page)) {
      const filePath = path.join(websiteRoot, page);
      if (fs.existsSync(filePath)) {
        sendWebsiteFile(res, filePath);
        return;
      }
    }

    next();
  };

  return {
    name: 'agriguardian-marketing-site',
    configureServer(server) {
      server.middlewares.stack.unshift({ route: '', handle: handler });
    },
  };
}

export default defineConfig({
  plugins: [react(), marketingSitePlugin()],
  server: {
    port: 5173,
    open: '/index.html',
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
  build: {
    outDir: 'dist',
  },
});
