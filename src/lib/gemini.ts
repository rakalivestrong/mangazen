import { GoogleGenAI } from "@google/genai";

export type TranslateTargetLang = 'id' | 'en';

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
  if (!text) return text;
  const cacheKey = `${targetLang}:${text.slice(0, 80)}`;
  if (translateCache.has(cacheKey)) return translateCache.get(cacheKey)!;

  const langLabel = targetLang === 'id' ? 'Indonesian (Bahasa Indonesia)' : 'English';

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Translate the following text accurately to ${langLabel}. Only return the translated text, no explanations or extra content.\n\nText to translate:\n${text}`,
    });

    const translated = response.text?.trim() ?? text;
    translateCache.set(cacheKey, translated);
    return translated;
  } catch (error) {
    console.error("Gemini translation failed:", error);
    return text; // fallback to original
  }
}
