import axios from 'axios';

const MANGADEX_BASE_URL = '/api/proxy/mangadex';
const MANGADEX_COVERS_PROXY = '/api/proxy/covers';

const api = axios.create({
  baseURL: MANGADEX_BASE_URL,
});

export interface Manga {
  id: string;
  title: string;
  description: string;
  coverArt: string | null;
  bannerArt: string | null;
  status: string;
  year: number | null;
  tags: string[];
}

export interface Chapter {
  id: string;
  title: string;
  chapter: string;
  pages: string[];
  mangaId: string;
  externalUrl?: string | null;
  publishAt: string;
}

export const MangaDexService = {
  async searchManga(query: string, limit = 20, origin: string = 'all', offset = 0, includedTags: string[] = [], timeFilter: string = 'all-time'): Promise<Manga[]> {
    const originalLanguage = origin === 'manga' ? ['ja'] : origin === 'manhwa' ? ['ko'] : undefined;
    
    let createdAtSince: string | undefined = undefined;
    if (timeFilter !== 'all-time') {
      const now = new Date();
      if (timeFilter === 'yearly') now.setFullYear(now.getFullYear() - 1);
      else if (timeFilter === 'monthly') now.setMonth(now.getMonth() - 1);
      else if (timeFilter === 'weekly') now.setDate(now.getDate() - 7);
      else if (timeFilter === 'daily') now.setDate(now.getDate() - 1);
      createdAtSince = now.toISOString().split('.')[0];
    }

    const response = await api.get('/manga', {
      params: {
        title: query || undefined,
        limit,
        offset,
        originalLanguage,
        createdAtSince,
        includedTags: includedTags.length > 0 ? includedTags : undefined,
        includes: ['cover_art'],
        contentRating: ['safe', 'suggestive'],
        availableTranslatedLanguage: ['id', 'en'],
        hasAvailableChapters: 'true',
        order: { followedCount: 'desc' },
      },
    });

    return response.data.data.map((item: any) => this.mapMangaData(item));
  },

  async getTrendingManga(limit = 5): Promise<Manga[]> {
    const response = await api.get('/manga', {
      params: {
        limit,
        includes: ['cover_art'],
        contentRating: ['safe', 'suggestive'],
        availableTranslatedLanguage: ['id', 'en'],
        hasAvailableChapters: 'true',
        order: { followedCount: 'desc' },
      },
    });

    return response.data.data.map((item: any) => this.mapMangaData(item));
  },

  async getLatestManga(limit = 20, origin: string = 'all', offset = 0, includedTags: string[] = [], timeFilter: string = 'all-time'): Promise<Manga[]> {
    const originalLanguage = origin === 'manga' ? ['ja'] : origin === 'manhwa' ? ['ko'] : undefined;
    
    let createdAtSince: string | undefined = undefined;
    if (timeFilter !== 'all-time') {
      const now = new Date();
      if (timeFilter === 'yearly') now.setFullYear(now.getFullYear() - 1);
      else if (timeFilter === 'monthly') now.setMonth(now.getMonth() - 1);
      else if (timeFilter === 'weekly') now.setDate(now.getDate() - 7);
      else if (timeFilter === 'daily') now.setDate(now.getDate() - 1);
      createdAtSince = now.toISOString().split('.')[0];
    }

    const response = await api.get('/manga', {
      params: {
        limit,
        offset,
        originalLanguage,
        createdAtSince,
        includedTags: includedTags.length > 0 ? includedTags : undefined,
        includes: ['cover_art'],
        contentRating: ['safe', 'suggestive'],
        availableTranslatedLanguage: ['id', 'en'],
        hasAvailableChapters: 'true',
        order: { latestUploadedChapter: 'desc' },
      },
    });

    return response.data.data.map((item: any) => this.mapMangaData(item));
  },

  async getTags(): Promise<{ id: string; name: string }[]> {
    const response = await api.get('/manga/tag');
    return response.data.data
      .filter((tag: any) => tag.attributes.group === 'genre' || tag.attributes.group === 'theme')
      .map((tag: any) => ({
        id: tag.id,
        name: tag.attributes.name.en,
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
  },

  async getChapterInfo(chapterId: string): Promise<{ mangaId: string; chapterNum: string }> {
    const response = await api.get(`/chapter/${chapterId}`);
    const mangaRel = response.data.data.relationships.find((r: any) => r.type === 'manga');
    return {
      mangaId: mangaRel?.id || '',
      chapterNum: response.data.data.attributes.chapter || '0',
    };
  },

  async getMangaDetails(id: string): Promise<Manga> {
    const response = await api.get(`/manga/${id}`, {
      params: {
        includes: ['cover_art'],
      },
    });
    return this.mapMangaData(response.data.data);
  },

  async getMangaChapters(mangaId: string, offset = 0, limit = 500): Promise<{ chapters: Chapter[]; total: number }> {
    const response = await api.get(`/manga/${mangaId}/feed`, {
      params: {
        limit,
        offset,
        translatedLanguage: ['id', 'en'],
        order: { chapter: 'desc' },
      },
    });

    const chapters = (response.data.data as any[])
      .map((item: any): Chapter => ({
        id: item.id,
        title: item.attributes.title || '',
        chapter: item.attributes.chapter,
        pages: [],
        mangaId,
        externalUrl: item.attributes.externalUrl ?? null,
        publishAt: item.attributes.publishAt,
      }));

    return { chapters, total: response.data.total || 0 };
  },

  async getAllMangaChapters(mangaId: string): Promise<Chapter[]> {
    let allChapters: Chapter[] = [];
    let offset = 0;
    const limit = 500;
    let total = 0;

    do {
      const { chapters, total: fetchTotal } = await this.getMangaChapters(mangaId, offset, limit);
      total = fetchTotal;
      allChapters = allChapters.concat(chapters);
      offset += limit;
    } while (offset < total);

    // Filter out duplicates (multiple scanlation groups uploading the same chapter)
    const uniqueChapters: Chapter[] = [];
    const seenChapters = new Set<string>();

    for (const chapter of allChapters) {
      if (chapter.chapter) {
        // If chapter has a number, use that as unique key
        if (!seenChapters.has(chapter.chapter)) {
          seenChapters.add(chapter.chapter);
          uniqueChapters.push(chapter);
        }
      } else {
        // For oneshots/prologues with no chapter number, try to use title
        const key = `no-chap-${chapter.title?.toLowerCase() || 'unknown'}`;
        if (!seenChapters.has(key)) {
          seenChapters.add(key);
          uniqueChapters.push(chapter);
        }
      }
    }

    return uniqueChapters;
  },

  async getChapterPages(chapterId: string): Promise<string[]> {
    const response = await axios.get(`/api/proxy/at-home/server/${chapterId}`);
    const { baseUrl, chapter } = response.data as {
      baseUrl: string;
      chapter: { hash: string; data: string[] };
    };
    const { hash, data } = chapter;
    
    return data.map((fileName: string) => {
      const url = `${baseUrl}/data/${hash}/${fileName}`;
      return `/api/proxy/page?url=${encodeURIComponent(url)}`;
    });
  },

  mapMangaData(item: any): Manga {
    const title =
      (item.attributes.title as Record<string, string>).en ||
      (Object.values(item.attributes.title)[0] as string) ||
      'Unknown Title';
    const description =
      (item.attributes.description as Record<string, string>).en ||
      (Object.values(item.attributes.description)[0] as string) ||
      '';

    const coverArtRel = (item.relationships as any[]).find(
      (r: any) => r.type === 'cover_art'
    );
    const coverFileName: string | undefined = coverArtRel?.attributes?.fileName;
    const coverArt = coverFileName
      ? `${MANGADEX_COVERS_PROXY}/${item.id}/${coverFileName}.256.jpg`
      : null;
    const bannerArt = coverFileName
      ? `${MANGADEX_COVERS_PROXY}/${item.id}/${coverFileName}`
      : null;

    return {
      id: item.id,
      title,
      description,
      coverArt,
      bannerArt,
      status: item.attributes.status,
      year: item.attributes.year,
      tags: (item.attributes.tags as any[]).map(
        (t: any) => t.attributes.name.en as string
      ),
    };
  },
};
