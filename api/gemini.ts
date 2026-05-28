import { GoogleGenAI } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'http';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' });

function setCors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res: ServerResponse, status: number, data: object) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk.toString()));
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return json(res, 200, {});
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  if (!process.env.GEMINI_API_KEY) {
    return json(res, 500, {
      error: 'GEMINI_API_KEY is missing on the server. Please check Vercel Environment Variables.',
    });
  }

  const { action, text, targetLang, title, description } = await parseBody(req);

  try {
    // ── TRANSLATE ──────────────────────────────────────────────────
    if (action === 'translate') {
      if (!text?.trim()) return json(res, 400, { error: 'No text provided' });
      if (!['id', 'en', 'pinyin'].includes(targetLang))
        return json(res, 400, { error: 'Invalid targetLang. Use: id | en | pinyin' });

      let prompt: string;

      if (targetLang === 'pinyin') {
        prompt = `You are a Mandarin Chinese Pinyin expert.
Convert ALL Chinese characters (汉字/Hanzi) in the following text to Pinyin with proper tone marks.
- Tone marks: ā á ǎ à / ē é ě è / ī í ǐ ì / ō ó ǒ ò / ū ú ǔ ù / ǖ ǘ ǚ ǜ
- Examples: 你好 → nǐ hǎo | 我爱你 → wǒ ài nǐ | 是 → shì
- If the text already has no Chinese characters, return it unchanged.
- Only return the Pinyin/plain text. No Hanzi, no brackets, no explanation.

Text:
${text.trim()}`;
      } else {
        const langLabel = targetLang === 'id' ? 'Indonesian (Bahasa Indonesia)' : 'English';
        prompt = `Translate the following text to ${langLabel}.
- Return ONLY the translated text. No quotes, no explanation, no notes.
- Preserve paragraph structure.
- If already in ${langLabel}, return it as-is without any comment.

Text:
${text.trim()}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      const result = response.text?.trim();
      if (!result) return json(res, 500, { error: 'Empty response from Gemini' });
      return json(res, 200, { result });
    }

    // ── VIBE CHECK ─────────────────────────────────────────────────
    if (action === 'vibe-check') {
      if (!title) return json(res, 400, { error: 'No title provided' });

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `You are a manga critic with a "fresh and cool" personality.
Read this manga/manhwa/manhua title and description:

Title: ${title}
Description: ${description ?? '(no description)'}

Give me:
1. "vibe" – one catchy sentence summary (max 10 words)
2. "mood" – exactly 3 emojis
3. "verdict" – why someone should read this (1-2 sentences)

Respond ONLY in this JSON format:
{"vibe":"...","mood":"...","verdict":"..."}`,
        config: { responseMimeType: 'application/json' },
      });

      const raw = response.text?.trim();
      if (!raw) return json(res, 500, { error: 'Empty response from Gemini' });
      const parsed = JSON.parse(raw);
      return json(res, 200, parsed);
    }

    return json(res, 400, { error: `Unknown action: "${action}"` });

  } catch (err: any) {
    console.error('[/api/gemini error]', err?.message ?? err);
    return json(res, 500, { error: err?.message ?? 'Internal server error' });
  }
}
