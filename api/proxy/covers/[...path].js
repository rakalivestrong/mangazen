export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Extract everything after /api/proxy/covers/ to get mangaId/fileName
    const fullPath = req.url.replace(/^\/api\/proxy\/covers\/?/, '').split('?')[0];
    const url = `https://uploads.mangadex.org/covers/${fullPath}`;

    const response = await fetch(url, {
      headers: {
        'Referer': 'https://mangadex.org',
        'User-Agent': 'MangaZen/1.0.0 (alrakaputra06@gmail.com)',
      },
    });

    if (!response.ok) return res.status(404).send('Cover not found');

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Cover proxy error:', error.message);
    res.status(404).send('Cover not found');
  }
}
