export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const imageUrl = req.query.url;
    if (!imageUrl || !imageUrl.startsWith('https://')) {
      return res.status(400).send('Invalid URL');
    }

    const response = await fetch(imageUrl, {
      headers: {
        'Referer': 'https://mangadex.org',
        'User-Agent': 'MangaZen/1.0.0 (alrakaputra06@gmail.com)',
      },
    });

    if (!response.ok) return res.status(404).send('Page not found');

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(404).send('Page not found');
  }
}
