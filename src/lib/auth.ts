// Auth service — localStorage based authentication

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string; // initials-based avatar color
  createdAt: number;
}

interface StoredUser extends User {
  passwordHash: string;
}

const USERS_KEY = 'mangazen_users';
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

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getAvatarColor(username: string): string {
  const colors = [
    '#BCFF00', '#FF6B6B', '#4ECDC4', '#45B7D1',
    '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'
  ];
  let hash = 0;
  for (const c of username) hash += c.charCodeAt(0);
  return colors[hash % colors.length];
}

function getAllUsers(): Record<string, StoredUser> {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : {};
}

function saveUsers(users: Record<string, StoredUser>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export const AuthService = {
  register(username: string, email: string, password: string): { success: boolean; error?: string; user?: User } {
    const users = getAllUsers();
    
    // Check duplicate email
    const emailExists = Object.values(users).some(u => u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) return { success: false, error: 'Email sudah digunakan.' };
    
    // Check duplicate username
    const usernameExists = Object.values(users).some(
      u => u.username.toLowerCase() === username.toLowerCase()
    );
    if (usernameExists) return { success: false, error: 'Username sudah digunakan.' };
    
    if (username.length < 3) return { success: false, error: 'Username minimal 3 karakter.' };
    if (password.length < 6) return { success: false, error: 'Password minimal 6 karakter.' };

    const user: StoredUser = {
      id: generateId(),
      username,
      email: email.toLowerCase(),
      avatar: getAvatarColor(username),
      createdAt: Date.now(),
      passwordHash: simpleHash(password + email),
    };

    users[user.id] = user;
    saveUsers(users);
    
    // Auto login
    const { passwordHash: _, ...publicUser } = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(publicUser));
    return { success: true, user: publicUser };
  },

  login(email: string, password: string): { success: boolean; error?: string; user?: User } {
    const users = getAllUsers();
    const storedUser = Object.values(users).find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!storedUser) return { success: false, error: 'Email tidak terdaftar.' };

    const hash = simpleHash(password + storedUser.email);
    if (hash !== storedUser.passwordHash) return { success: false, error: 'Password salah.' };

    const { passwordHash: _, ...publicUser } = storedUser;
    localStorage.setItem(SESSION_KEY, JSON.stringify(publicUser));
    return { success: true, user: publicUser };
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
};
