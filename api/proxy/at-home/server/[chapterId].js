export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const chapterId = req.query.chapterId;
    if (!chapterId) return res.status(400).json({ error: 'Missing chapterId' });

    const response = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`, {
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
    res.status(response.status).json(data);
  } catch (error) {
    console.error('At-home proxy error:', error.message);
    res.status(500).json({ error: error.message });
  }
}
