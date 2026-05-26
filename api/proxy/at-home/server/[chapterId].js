export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { chapterId } = req.query;
    const response = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`, {
      headers: {
        'User-Agent': 'MangaZen/1.0.0 (alrakaputra06@gmail.com)',
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
