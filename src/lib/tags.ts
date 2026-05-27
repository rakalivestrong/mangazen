// Tag service — user-created tags per manga + aggregate popular tags

const USER_TAGS_KEY = 'mangazen_user_tags';        // per-user per-manga tags
const GLOBAL_TAGS_KEY = 'mangazen_global_tags';    // aggregate: tagName -> Set<mangaId>
const USER_RATINGS_KEY = 'mangazen_ratings';        // per-manga star ratings (1-5)
const USER_STATUS_KEY = 'mangazen_read_status';     // per-manga reading status

export type ReadingStatus = 'want_to_read' | 'reading' | 'already_read';

export interface MangaUserData {
  mangaId: string;
  tags: string[];
  rating: number;           // 0 = unrated, 1-5
  status: ReadingStatus | null;
}

// ─── Internal types ───────────────────────────────────────────────
interface UserTagsStore {
  [mangaId: string]: string[];  // mangaId -> list of tag strings
}

interface GlobalTagsStore {
  [tagName: string]: string[];  // tagName (lowercase) -> mangaId[]
}

interface RatingsStore {
  [mangaId: string]: number;
}

interface StatusStore {
  [mangaId: string]: ReadingStatus;
}

// ─── Helpers ──────────────────────────────────────────────────────
function getUserTags(): UserTagsStore {
  const d = localStorage.getItem(USER_TAGS_KEY);
  return d ? JSON.parse(d) : {};
}

function saveUserTags(store: UserTagsStore) {
  localStorage.setItem(USER_TAGS_KEY, JSON.stringify(store));
}

function getGlobalTags(): GlobalTagsStore {
  const d = localStorage.getItem(GLOBAL_TAGS_KEY);
  return d ? JSON.parse(d) : {};
}

function saveGlobalTags(store: GlobalTagsStore) {
  localStorage.setItem(GLOBAL_TAGS_KEY, JSON.stringify(store));
}

function getRatings(): RatingsStore {
  const d = localStorage.getItem(USER_RATINGS_KEY);
  return d ? JSON.parse(d) : {};
}

function saveRatings(store: RatingsStore) {
  localStorage.setItem(USER_RATINGS_KEY, JSON.stringify(store));
}

function getStatusStore(): StatusStore {
  const d = localStorage.getItem(USER_STATUS_KEY);
  return d ? JSON.parse(d) : {};
}

function saveStatusStore(store: StatusStore) {
  localStorage.setItem(USER_STATUS_KEY, JSON.stringify(store));
}

// ─── Public API ───────────────────────────────────────────────────
export const TagService = {
  // ── User tags for a specific manga ──────────────────────────────
  getMangaTags(mangaId: string): string[] {
    return getUserTags()[mangaId] || [];
  },

  addTag(mangaId: string, tag: string): string[] {
    const clean = tag.trim().toLowerCase();
    if (!clean) return this.getMangaTags(mangaId);

    const store = getUserTags();
    const current = store[mangaId] || [];
    if (current.includes(clean)) return current;

    current.push(clean);
    store[mangaId] = current;
    saveUserTags(store);

    // Also register in global tags
    const global = getGlobalTags();
    if (!global[clean]) global[clean] = [];
    if (!global[clean].includes(mangaId)) global[clean].push(mangaId);
    saveGlobalTags(global);

    return current;
  },

  removeTag(mangaId: string, tag: string): string[] {
    const clean = tag.trim().toLowerCase();
    const store = getUserTags();
    const current = store[mangaId] || [];
    const updated = current.filter(t => t !== clean);
    store[mangaId] = updated;
    saveUserTags(store);

    // Remove from global if no other manga uses this tag entry
    const global = getGlobalTags();
    if (global[clean]) {
      global[clean] = global[clean].filter(id => id !== mangaId);
      if (global[clean].length === 0) delete global[clean];
      saveGlobalTags(global);
    }

    return updated;
  },

  // Tags the current user has used across ALL manga (for suggestions)
  getAllUserTags(): string[] {
    const store = getUserTags();
    const tags = new Set<string>();
    Object.values(store).forEach(list => list.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  },

  // Tags other users added to a specific manga (popular tags)
  getPopularTagsForManga(mangaId: string, limit = 12): string[] {
    const global = getGlobalTags();
    return Object.entries(global)
      .filter(([, ids]) => ids.includes(mangaId))
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, limit)
      .map(([tag]) => tag);
  },

  // Top tags globally (for homepage)
  getTopTags(limit = 20): { tag: string; count: number }[] {
    const global = getGlobalTags();
    return Object.entries(global)
      .map(([tag, ids]) => ({ tag, count: ids.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  // Get all manga IDs tagged with a specific tag
  getMangasByTag(tag: string): string[] {
    const clean = tag.trim().toLowerCase();
    const global = getGlobalTags();
    return global[clean] || [];
  },

  // ── Rating ──────────────────────────────────────────────────────
  getRating(mangaId: string): number {
    return getRatings()[mangaId] || 0;
  },

  setRating(mangaId: string, rating: number) {
    const store = getRatings();
    if (rating === 0) {
      delete store[mangaId];
    } else {
      store[mangaId] = Math.min(5, Math.max(1, Math.round(rating)));
    }
    saveRatings(store);
  },

  // ── Reading Status ───────────────────────────────────────────────
  getStatus(mangaId: string): ReadingStatus | null {
    return getStatusStore()[mangaId] || null;
  },

  setStatus(mangaId: string, status: ReadingStatus | null) {
    const store = getStatusStore();
    if (status === null) {
      delete store[mangaId];
    } else {
      store[mangaId] = status;
    }
    saveStatusStore(store);
  },

  // ── Combined user data ───────────────────────────────────────────
  getMangaUserData(mangaId: string): MangaUserData {
    return {
      mangaId,
      tags: this.getMangaTags(mangaId),
      rating: this.getRating(mangaId),
      status: this.getStatus(mangaId),
    };
  },
};
