import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService, User } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (username: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isLoggedIn: boolean;
  updateAvatarPhoto: (dataUrl: string) => void;
  removeAvatarPhoto: () => void;
  updateBio: (bio: string) => void;
  updateUsername: (username: string) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(AuthService.getCurrentUser());
  }, []);

  const login = (email: string, password: string) => {
    const result = AuthService.login(email, password);
    if (result.success && result.user) setUser(result.user);
    return { success: result.success, error: result.error };
  };

  const register = (username: string, email: string, password: string) => {
    const result = AuthService.register(username, email, password);
    if (result.success && result.user) setUser(result.user);
    return { success: result.success, error: result.error };
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const updateAvatarPhoto = (dataUrl: string) => {
    if (!user) return;
    const updated = AuthService.updateAvatarPhoto(user.id, dataUrl);
    if (updated) setUser(updated);
  };

  const removeAvatarPhoto = () => {
    if (!user) return;
    const updated = AuthService.removeAvatarPhoto(user.id);
    if (updated) setUser(updated);
  };

  const updateBio = (bio: string) => {
    if (!user) return;
    const updated = AuthService.updateBio(user.id, bio);
    if (updated) setUser(updated);
  };

  const updateUsername = (username: string) => {
    if (!user) return { success: false, error: 'Not logged in' };
    const result = AuthService.updateUsername(user.id, username);
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
