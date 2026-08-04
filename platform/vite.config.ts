import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { ServerResponse } from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(__dirname, '..');

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

// Routes that belong to the React platform — never intercept these
const platformRoutes = ['/portals', '/login', '/admin', '/employee', '/src', '/@', '/node_modules'];

function marketingSitePlugin(): Plugin {
  return {
    name: 'agriguardian-marketing-site',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0];

        // Never intercept platform routes
        if (platformRoutes.some(r => url.startsWith(r))) {
          return next();
        }

        // Serve marketing homepage for "/"
        if (url === '/' || url === '') {
          const homePath = path.join(websiteRoot, 'index.html');
          if (fs.existsSync(homePath)) {
            const ext = path.extname(homePath);
            if (mimeTypes[ext]) res.setHeader('Content-Type', mimeTypes[ext]);
            fs.createReadStream(homePath).pipe(res);
            return;
          }
        }

        // Serve marketing static assets (css, js, images)
        if (url.startsWith('/css/') || url.startsWith('/js/') || url.startsWith('/assets/') || url.startsWith('/images/')) {
          const filePath = path.join(websiteRoot, url);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath);
            if (mimeTypes[ext]) res.setHeader('Content-Type', mimeTypes[ext]);
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }

        // Serve other marketing HTML pages (e.g. /index.html, /portals.html)
        const page = url.startsWith('/') ? url.slice(1) : url;
        if (page.endsWith('.html')) {
          const filePath = path.join(websiteRoot, page);
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'text/html');
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), marketingSitePlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
  build: {
    outDir: 'dist',
  },
});
