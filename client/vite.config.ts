import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// O .env vive na raiz do monorepo (compartilhado com o server), não em client/.
const monorepoRoot = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: monorepoRoot,
  build: {
    rollupOptions: {
      output: {
        /**
         * Vendors em chunks próprios. Além de tirar o entry do limite de 500 kB,
         * separa o que quase nunca muda (React, Supabase) do código do app, que
         * muda a cada deploy — o navegador reaproveita o cache dos dois.
         * As rotas de /app já entram por lazy em client/src/App.tsx.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\/]node_modules[\/](react|react-dom|scheduler|react-router)/.test(id)) {
            return 'vendor-react';
          }
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          return undefined;
        },
      },
    },
  },
});
