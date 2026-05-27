import { supabase } from './supabase';
import { AuthService } from './auth';

export type ReadingStatus = 'want_to_read' | 'reading' | 'already_read';

export interface MangaUserData {
  mangaId: string;
  tags: string[];
  rating: number;           // 0 = unrated, 1-5
  status: ReadingStatus | null;
}

export const TagService = {
  
  async getMangaUserData(mangaId: string): Promise<MangaUserData> {
    const user = AuthService.getCurrentUser();
    if (!user) {
      return { mangaId, tags: [], rating: 0, status: null };
    }
    const { data, error } = await supabase
      .from('user_tags')
      .select('tags, rating, status')
      .eq('user_id', user.id)
      .eq('manga_id', mangaId)
      .single();
      
    if (error || !data) {
      return { mangaId, tags: [], rating: 0, status: null };
    }
    
    return {
      mangaId,
      tags: data.tags || [],
      rating: data.rating || 0,
      status: data.status as ReadingStatus | null
    };
  },
  
  async setStatus(mangaId: string, status: ReadingStatus | null) {
    const user = AuthService.getCurrentUser();
    if (!user) return;
    
    // Upsert the row
    await supabase.from('user_tags').upsert({
      user_id: user.id,
      manga_id: mangaId,
      status,
      updated_at: Date.now()
    }, { onConflict: 'user_id,manga_id' });
  },

  async setRating(mangaId: string, rating: number) {
    const user = AuthService.getCurrentUser();
    if (!user) return;
    
    await supabase.from('user_tags').upsert({
      user_id: user.id,
      manga_id: mangaId,
      rating: Math.min(5, Math.max(1, Math.round(rating))),
      updated_at: Date.now()
    }, { onConflict: 'user_id,manga_id' });
  },

  async addTag(mangaId: string, tag: string): Promise<string[]> {
    const user = AuthService.getCurrentUser();
    if (!user) return [];
    const clean = tag.trim().toLowerCase();
    if (!clean) return [];

    const currentData = await this.getMangaUserData(mangaId);
    const tags = new Set(currentData.tags);
    tags.add(clean);
    const newTags = Array.from(tags) as string[];

    await supabase.from('user_tags').upsert({
      user_id: user.id,
      manga_id: mangaId,
      tags: newTags,
      updated_at: Date.now()
    }, { onConflict: 'user_id,manga_id' });
    
    // Update global tags
    await this._syncGlobalTagAdd(clean, mangaId);
    return newTags;
  },

  async removeTag(mangaId: string, tag: string): Promise<string[]> {
    const user = AuthService.getCurrentUser();
    if (!user) return [];
    const clean = tag.trim().toLowerCase();
    
    const currentData = await this.getMangaUserData(mangaId);
    const newTags = currentData.tags.filter(t => t !== clean);

    await supabase.from('user_tags').upsert({
      user_id: user.id,
      manga_id: mangaId,
      tags: newTags,
      updated_at: Date.now()
    }, { onConflict: 'user_id,manga_id' });
    
    // Update global tags
    await this._syncGlobalTagRemove(clean, mangaId);
    return newTags;
  },
  
  async _syncGlobalTagAdd(tag: string, mangaId: string) {
    const { data } = await supabase.from('global_tags').select('manga_ids').eq('tag_name', tag).single();
    const ids = new Set(data ? (data.manga_ids as string[]) : []);
    ids.add(mangaId);
    await supabase.from('global_tags').upsert({ tag_name: tag, manga_ids: Array.from(ids) });
  },
  
  async _syncGlobalTagRemove(tag: string, mangaId: string) {
    const { data } = await supabase.from('global_tags').select('manga_ids').eq('tag_name', tag).single();
    if (data) {
      const ids = new Set(data.manga_ids as string[]);
      ids.delete(mangaId);
      if (ids.size === 0) {
        await supabase.from('global_tags').delete().eq('tag_name', tag);
      } else {
        await supabase.from('global_tags').update({ manga_ids: Array.from(ids) }).eq('tag_name', tag);
      }
    }
  },

  async getTopTags(limit = 20): Promise<{ tag: string; count: number }[]> {
    const { data, error } = await supabase.from('global_tags').select('tag_name, manga_ids');
    if (error || !data) return [];
    return data
      .map(row => ({ tag: row.tag_name, count: (row.manga_ids as string[]).length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  async getPopularTagsForManga(mangaId: string, limit = 12): Promise<string[]> {
    const { data, error } = await supabase.from('global_tags').select('tag_name, manga_ids');
    if (error || !data) return [];
    return data
      .filter(row => (row.manga_ids as string[]).includes(mangaId))
      .sort((a, b) => (b.manga_ids as string[]).length - (a.manga_ids as string[]).length)
      .slice(0, limit)
      .map(row => row.tag_name);
  },

  async getAllUserTags(): Promise<string[]> {
    const user = AuthService.getCurrentUser();
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('user_tags')
      .select('tags')
      .eq('user_id', user.id);
      
    if (error || !data) return [];
    const tags = new Set<string>();
    data.forEach(row => {
      (row.tags as string[]).forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
  },

  async getMangasByTag(tag: string): Promise<string[]> {
    const clean = tag.trim().toLowerCase();
    const { data } = await supabase.from('global_tags').select('manga_ids').eq('tag_name', clean).single();
    return data ? (data.manga_ids as string[]) : [];
  },
  
  async getUserLibrary(userId: string): Promise<{mangaId: string, status: string | null}[]> {
    const { data } = await supabase.from('user_tags').select('manga_id, status').eq('user_id', userId);
    return data ? data.map(r => ({ mangaId: r.manga_id, status: r.status })) : [];
  },
  
  async getUserTags(userId: string): Promise<{tag: string, count: number}[]> {
    const { data } = await supabase.from('user_tags').select('tags').eq('user_id', userId);
    if (!data) return [];
    const counts: Record<string, number> = {};
    data.forEach(r => {
      (r.tags as string[]).forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([tag, count]) => ({tag, count})).sort((a, b) => b.count - a.count);
  }
};
