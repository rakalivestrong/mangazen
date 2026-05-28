import { GoogleGenAI } from "@google/genai";

export type TranslateTargetLang = 'id' | 'en' | 'pinyin';

// vite.config.ts injects GEMINI_API_KEY via `define` so process.env works client-side
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' });

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

export async function getMangaVibeCheck(
  title: string,
  description: string
): Promise<VibeCheck> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a manga critic with a "fresh and cool" personality. 
      Read this manga title and description and give me a:
      1. One-sentence "Vibe Check" (extremely short and catchy summary).
      2. "Mood" (3 emojis).
      3. "Verdict" (Why someone should read this).
      
      Manga Title: ${title}
      Description: ${description}
      
      Respond in JSON format:
      {
        "vibe": "...",
        "mood": "...",
        "verdict": "..."
      }`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return FALLBACK;
    return JSON.parse(text) as VibeCheck;
  } catch (error) {
    console.error("Gemini Vibe Check failed:", error);
    return FALLBACK;
  }
}

// Simple in-memory cache to avoid translating the same text twice per session
const translateCache = new Map<string, string>();

export async function translateText(
  text: string,
  targetLang: TranslateTargetLang
): Promise<string> {
  const trimmed = text?.trim();
  if (!trimmed) return text;

  const cacheKey = `${targetLang}:${trimmed.slice(0, 100)}`;
  if (translateCache.has(cacheKey)) return translateCache.get(cacheKey)!;

  let prompt: string;

  if (targetLang === 'pinyin') {
    prompt = `You are a Mandarin Chinese Pinyin expert.
Convert ALL Chinese characters (汉字/Hanzi) in the following text to Pinyin romanization with proper tone marks.
- Use tone marks: ā á ǎ à, ē é ě è, ī í ǐ ì, ō ó ǒ ò, ū ú ǔ ù, ǖ ǘ ǚ ǜ
- Example: 你好 → nǐ hǎo | 我爱你 → wǒ ài nǐ | 是 → shì
- If there are English/Indonesian words mixed in, keep those words as-is
- Only return the converted Pinyin text. No explanations, no original Hanzi, no brackets.

Text to convert:
${trimmed}`;
  } else {
    const langLabel = targetLang === 'id' ? 'Indonesian (Bahasa Indonesia)' : 'English';
    prompt = `Translate the following text to ${langLabel}. 
- Return ONLY the translated text, nothing else.
- Do not add explanations, notes, or quotation marks.
- If the text is already in ${langLabel}, still return it (do not say "already translated").

Text to translate:
${trimmed}`;
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  const translated = response.text?.trim();
  if (!translated) throw new Error('Empty response from Gemini');

  translateCache.set(cacheKey, translated);
  return translated;
}
