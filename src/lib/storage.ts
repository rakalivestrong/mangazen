import { Manga } from './api';

export interface Bookmark {
  manga: Manga;
  status: 'favorite' | 'plan_to_read';
  addedAt: number;
}

export interface ReadingHistory {
  manga: Manga;
  lastChapterId: string;
  lastChapterNum: string;
  timestamp: number;
}

const BOOKMARKS_KEY = 'mangazen_bookmarks';
const HISTORY_KEY = 'mangazen_history';

export const StorageService = {
  getBookmarks(): Record<string, Bookmark> {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : {};
  },
  
  addBookmark(manga: Manga, status: 'favorite' | 'plan_to_read') {
    const bookmarks = this.getBookmarks();
    bookmarks[manga.id] = { manga, status, addedAt: Date.now() };
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  },
  
  removeBookmark(mangaId: string) {
    const bookmarks = this.getBookmarks();
    delete bookmarks[mangaId];
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  },
  
  getBookmarkStatus(mangaId: string): 'favorite' | 'plan_to_read' | null {
    const bookmarks = this.getBookmarks();
    return bookmarks[mangaId]?.status || null;
  },

  getReadingHistory(): Record<string, ReadingHistory> {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : {};
  },

  updateReadingHistory(manga: Manga, lastChapterId: string, lastChapterNum: string) {
    const history = this.getReadingHistory();
    history[manga.id] = { manga, lastChapterId, lastChapterNum, timestamp: Date.now() };
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  },
  
  getMangaHistory(mangaId: string): ReadingHistory | null {
    const history = this.getReadingHistory();
    return history[mangaId] || null;
  }
};
