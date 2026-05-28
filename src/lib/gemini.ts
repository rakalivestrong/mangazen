export type TranslateTargetLang = 'id' | 'en' | 'pinyin';

export interface VibeCheck {
  vibe: string;
  mood: string;
  verdict: string;
}

const FALLBACK: VibeCheck = {
  vibe: "A mysterious journey awaits.",
  mood: "📖✨🌌",
  verdict: "Dive in to discover the secrets within.",
};

// Simple in-memory cache to avoid redundant server calls per session
const translateCache = new Map<string, string>();

/**
 * Translate text via the /api/gemini serverless function.
 * Supports: 'id' (Indonesian), 'en' (English), 'pinyin' (Mandarin romanization)
 */
export async function translateText(
  text: string,
  targetLang: TranslateTargetLang
): Promise<string> {
  const trimmed = text?.trim();
  if (!trimmed) return text;

  const cacheKey = `${targetLang}:${trimmed.slice(0, 100)}`;
  if (translateCache.has(cacheKey)) return translateCache.get(cacheKey)!;

  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'translate', text: trimmed, targetLang }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown server error' }));
    throw new Error(err.error ?? `Server error ${res.status}`);
  }

  const data = await res.json();
  if (!data.result) throw new Error('Empty response from server');

  translateCache.set(cacheKey, data.result);
  return data.result;
}

/**
 * Get a Vibe Check for a manga via the /api/gemini serverless function.
 */
export async function getMangaVibeCheck(
  title: string,
  description: string
): Promise<VibeCheck> {
  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vibe-check', title, description }),
    });

    if (!res.ok) return FALLBACK;

    const data = await res.json();
    if (data.vibe && data.mood && data.verdict) return data as VibeCheck;
    return FALLBACK;
  } catch {
    return FALLBACK;
  }
}
