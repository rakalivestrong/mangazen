export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Use req.url directly to preserve the raw query string (including [] bracket notation)
    // req.url = /api/proxy/mangadex/manga?includes[]=cover_art&...
    const fullPath = req.url.replace(/^\/api\/proxy\/mangadex\/?/, '');
    const targetUrl = `https://api.mangadex.org/${fullPath}`;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'MangaZen/1.0.0 (alrakaputra06@gmail.com)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.status(response.status).json(data);
  } catch (error) {
    console.error('MangaDex proxy error:', error.message);
    res.status(500).json({ error: 'Proxy request failed', message: error.message });
  }
}
