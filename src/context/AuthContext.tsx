import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService, User } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (username: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isLoggedIn: boolean;
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

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
