import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService, User } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoggedIn: boolean;
  updateAvatarPhoto: (dataUrl: string) => Promise<void>;
  removeAvatarPhoto: () => Promise<void>;
  updateBio: (bio: string) => Promise<void>;
  updateUsername: (username: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(AuthService.getCurrentUser());
  }, []);

  const login = async (email: string, password: string) => {
    const result = await AuthService.login(email, password);
    if (result.success && result.user) setUser(result.user);
    return { success: result.success, error: result.error };
  };

  const register = async (username: string, email: string, password: string) => {
    const result = await AuthService.register(username, email, password);
    if (result.success && result.user) setUser(result.user);
    return { success: result.success, error: result.error };
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const updateAvatarPhoto = async (dataUrl: string) => {
    if (!user) return;
    const updated = await AuthService.updateAvatarPhoto(user.id, dataUrl);
    if (updated) setUser(updated);
  };

  const removeAvatarPhoto = async () => {
    if (!user) return;
    const updated = await AuthService.removeAvatarPhoto(user.id);
    if (updated) setUser(updated);
  };

  const updateBio = async (bio: string) => {
    if (!user) return;
    const updated = await AuthService.updateBio(user.id, bio);
    if (updated) setUser(updated);
  };

  const updateUsername = async (username: string) => {
    if (!user) return { success: false, error: 'Not logged in' };
    const result = await AuthService.updateUsername(user.id, username);
    if (result.success && result.user) setUser(result.user);
    return { success: result.success, error: result.error };
  };

  return (
    <AuthContext.Provider value={{
      user, login, register, logout, isLoggedIn: !!user,
      updateAvatarPhoto, removeAvatarPhoto, updateBio, updateUsername,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
