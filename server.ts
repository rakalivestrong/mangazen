import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // In-memory cache for API responses to speed up loading
  const apiCache = new Map<string, { data: any, timestamp: number }>();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Proxy for MangaDex API
  app.get('/api/proxy/mangadex/*', async (req, res) => {
    try {
      const targetPath = req.params[0];
      const queryParams = req.query;
      
      const cacheKey = req.originalUrl;
      const cached = apiCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }
      
      const response = await axios({
        method: 'get',
        url: `https://api.mangadex.org/${targetPath}`,
        params: queryParams,
        headers: {
          'User-Agent': 'MangaZen/1.0.0 (alrakaputra06@gmail.com)',
        }
      });
      
      apiCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
      res.json(response.data);
    } catch (error: any) {
      console.error('Proxy Error:', error.message);
      res.status(error.response?.status || 500).json({
        error: error.message,
        details: error.response?.data
      });
    }
  });

  // Proxy for MangaDex Covers
  app.get('/api/proxy/covers/:mangaId/:fileName', async (req, res) => {
    try {
      const { mangaId, fileName } = req.params;
      const url = `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`;
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const contentType = response.headers['content-type'] as string || 'image/jpeg';
      res.set('Content-Type', contentType);
      res.send(response.data);
    } catch (error: any) {
      res.status(404).send('Cover not found');
    }
  });

  // Proxy for MangaDex At-Home server (for pages metadata)
  app.get('/api/proxy/at-home/server/:chapterId', async (req, res) => {
     try {
      const { chapterId } = req.params;
      const response = await axios({
        method: 'get',
        url: `https://api.mangadex.org/at-home/server/${chapterId}`,
        headers: {
          'User-Agent': 'MangaZen/1.0.0 (alrakaputra06@gmail.com)',
        }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error('At-Home Proxy Error:', error.message);
      res.status(error.response?.status || 500).json({ error: error.message });
    }
  });

  // Proxy for chapter page images (bypasses CORS/hotlink protection)
  app.get('/api/proxy/page', async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl || !imageUrl.startsWith('https://')) {
        return res.status(400).send('Invalid URL');
      }
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'Referer': 'https://mangadex.org',
          'User-Agent': 'MangaZen/1.0.0 (alrakaputra06@gmail.com)',
        }
      });
      const contentType = response.headers['content-type'] as string || 'image/jpeg';
      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=86400');
      res.send(response.data);
    } catch (error: any) {
      console.error('Page Proxy Error:', error.message);
      res.status(404).send('Page not found');
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
