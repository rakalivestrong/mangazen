import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Local dev proxy — mirrors what Vercel serverless functions do in production
      proxy: {
        '/api/proxy/mangadex': {
          target: 'https://api.mangadex.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/proxy\/mangadex/, ''),
        },
        '/api/proxy/covers': {
          target: 'https://uploads.mangadex.org/covers',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/proxy\/covers/, ''),
        },
        '/api/proxy/at-home': {
          target: 'https://api.mangadex.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/proxy\/at-home/, '/at-home'),
        },
      },
    },
  };
});
