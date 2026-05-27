import { supabase } from './supabase';
import { AuthService } from './auth';

export interface Comment {
  id: string;
  chapterId: string; // we'll map this to manga_id in DB
  userId: string;
  username: string;
  avatarColor: string;
  avatarPhoto?: string;
  content: string;
  createdAt: number;
  likes: number;
}

export const CommentService = {
  async getComments(chapterId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        manga_id,
        user_id,
        content,
        created_at,
        likes,
        users ( username, avatar, "avatarPhoto" )
      `)
      .eq('manga_id', chapterId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((c: any) => ({
      id: c.id,
      chapterId: c.manga_id,
      userId: c.user_id,
      content: c.content,
      createdAt: c.created_at,
      likes: c.likes || 0,
      username: c.users?.username || 'Unknown',
      avatarColor: c.users?.avatar || '#333',
      avatarPhoto: c.users?.avatarPhoto,
    }));
  },

  async addComment(chapterId: string, content: string): Promise<Comment | null> {
    const user = AuthService.getCurrentUser();
    if (!user) return null;

    const newComment = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      manga_id: chapterId,
      user_id: user.id,
      content: content.trim(),
      created_at: Date.now(),
      likes: 0
    };

    const { error } = await supabase.from('comments').insert([newComment]);
    if (error) return null;

    return {
      id: newComment.id,
      chapterId: newComment.manga_id,
      userId: newComment.user_id,
      content: newComment.content,
      createdAt: newComment.created_at,
      likes: newComment.likes,
      username: user.username,
      avatarColor: user.avatar,
      avatarPhoto: user.avatarPhoto,
    };
  },

  async deleteComment(commentId: string): Promise<boolean> {
    const user = AuthService.getCurrentUser();
    if (!user) return false;

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    return !error;
  },

  async getTotalCommentCount(chapterId: string): Promise<number> {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('manga_id', chapterId);
      
    if (error) return 0;
    return count || 0;
  },
};
