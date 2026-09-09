import http from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApp } from './app.js';
import { env } from './env.js';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const clientDir = resolve(rootDir, 'client');

async function main(): Promise<void> {
  const app = createApp();
  const server = http.createServer(app);

  if (env.NODE_ENV === 'production') {
    // Produção: serve o build estático do client com fallback de SPA.
    const distDir = resolve(clientDir, 'dist');
    app.use(express.static(distDir));
    app.get('{*splat}', (_req, res) => {
      res.sendFile(resolve(distDir, 'index.html'));
    });
  } else {
    // Dev: Vite em modo middleware — client e server na mesma porta, com HMR.
    // configFile: false + config importado direto: evita o bundle temporário do
    // vite.config.ts em node_modules/.vite-temp, que faria o tsx watch reiniciar em loop.
    const { createServer: createViteServer } = await import('vite');
    const { default: clientConfig } = await import('../../client/vite.config.js');
    const vite = await createViteServer({
      ...clientConfig,
      configFile: false,
      root: clientDir,
      appType: 'spa',
      server: { middlewareMode: true, hmr: { server } },
    });
    app.use(vite.middlewares);
  }

  server.listen(env.PORT, () => {
    console.log(`Aura Finance no ar em http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
}

void main();
