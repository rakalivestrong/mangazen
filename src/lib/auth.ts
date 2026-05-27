import { supabase } from './supabase';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  avatarPhoto?: string;
  bio?: string;
  createdAt: number;
}

const SESSION_KEY = 'mangazen_session';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function getAvatarColor(username: string): string {
  const colors = [
    '#BCFF00', '#FF6B6B', '#4ECDC4', '#45B7D1',
    '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
  ];
  let hash = 0;
  for (const c of username) hash += c.charCodeAt(0);
  return colors[hash % colors.length];
}

function syncSession(publicUser: User) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(publicUser));
  return publicUser;
}

export const AuthService = {
  async register(username: string, email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
    if (username.length < 3) return { success: false, error: 'Username minimal 3 karakter.' };
    if (password.length < 6) return { success: false, error: 'Password minimal 6 karakter.' };

    const lowerEmail = email.toLowerCase();
    
    // Check if email or username exists
    const { data: existing } = await supabase
      .from('users')
      .select('email, username')
      .or(`email.eq.${lowerEmail},username.ilike.${username}`);
      
    if (existing && existing.length > 0) {
      if (existing.some(u => u.email === lowerEmail)) return { success: false, error: 'Email sudah digunakan.' };
      if (existing.some(u => u.username.toLowerCase() === username.toLowerCase())) return { success: false, error: 'Username sudah digunakan.' };
    }

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    
    const user = {
      id,
      username,
      email: lowerEmail,
      avatar: getAvatarColor(username),
      createdAt: Date.now(),
      passwordHash: simpleHash(password + lowerEmail),
    };

    const { error } = await supabase.from('users').insert([user]);
    
    if (error) return { success: false, error: error.message };

    const { passwordHash: _, ...publicUser } = user;
    return { success: true, user: syncSession(publicUser as User) };
  },

  async login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
    const lowerEmail = email.toLowerCase();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', lowerEmail)
      .single();

    if (error || !data) return { success: false, error: 'Email tidak terdaftar.' };

    const hash = simpleHash(password + lowerEmail);
    if (hash !== data.passwordHash) return { success: false, error: 'Password salah.' };

    const { passwordHash: _, ...publicUser } = data;
    return { success: true, user: syncSession(publicUser as User) };
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser(): User | null {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },

  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  },

  async updateAvatarPhoto(userId: string, dataUrl: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update({ avatarPhoto: dataUrl })
      .eq('id', userId)
      .select()
      .single();
      
    if (error || !data) return null;
    const { passwordHash: _, ...publicUser } = data;
    return syncSession(publicUser as User);
  },

  async removeAvatarPhoto(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update({ avatarPhoto: null })
      .eq('id', userId)
      .select()
      .single();
      
    if (error || !data) return null;
    const { passwordHash: _, ...publicUser } = data;
    return syncSession(publicUser as User);
  },

  async updateBio(userId: string, bio: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update({ bio: bio.trim() })
      .eq('id', userId)
      .select()
      .single();
      
    if (error || !data) return null;
    const { passwordHash: _, ...publicUser } = data;
    return syncSession(publicUser as User);
  },

  async updateUsername(userId: string, username: string): Promise<{ success: boolean; error?: string; user?: User }> {
    if (username.length < 3) return { success: false, error: 'Username minimal 3 karakter.' };
    
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .ilike('username', username)
      .neq('id', userId);
      
    if (existing && existing.length > 0) return { success: false, error: 'Username sudah digunakan.' };
    
    const { data, error } = await supabase
      .from('users')
      .update({ username })
      .eq('id', userId)
      .select()
      .single();
      
    if (error || !data) return { success: false, error: 'Gagal update username.' };
    
    const { passwordHash: _, ...publicUser } = data;
    return { success: true, user: syncSession(publicUser as User) };
  },

  async getAllUsersPublic(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, avatar, avatarPhoto, bio, createdAt')
      .order('createdAt', { ascending: false });
      
    if (error || !data) return [];
    return data as User[];
  },
  
  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, avatar, avatarPhoto, bio, createdAt')
      .eq('id', userId)
      .single();
      
    if (error || !data) return null;
    return data as User;
  }
};
