export const config = {
  runtime: 'nodejs18.x',
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const path = req.query.path ? req.query.path.join('/') : '';
    const url = new URL(`https://api.mangadex.org/${path}`);

    // Forward query params (excluding 'path' param from Next.js routing)
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (key === 'path') continue;
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else {
        params.append(key, value);
      }
    }
    if (params.toString()) {
      url.search = params.toString();
    }

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'MangaZen/1.0.0 (alrakaputra06@gmail.com)',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed', message: error.message });
  }
}
