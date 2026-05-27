// Auth service — localStorage based authentication

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;       // hex color for initials avatar (fallback)
  avatarPhoto?: string; // base64 data URL for custom photo
  bio?: string;
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
    '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
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

function syncSession(user: StoredUser) {
  const { passwordHash: _, ...publicUser } = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(publicUser));
  return publicUser as User;
}

export const AuthService = {
  register(username: string, email: string, password: string): { success: boolean; error?: string; user?: User } {
    const users = getAllUsers();

    const emailExists = Object.values(users).some(u => u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) return { success: false, error: 'Email sudah digunakan.' };

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
    return { success: true, user: syncSession(user) };
  },

  login(email: string, password: string): { success: boolean; error?: string; user?: User } {
    const users = getAllUsers();
    const storedUser = Object.values(users).find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!storedUser) return { success: false, error: 'Email tidak terdaftar.' };

    const hash = simpleHash(password + storedUser.email);
    if (hash !== storedUser.passwordHash) return { success: false, error: 'Password salah.' };

    return { success: true, user: syncSession(storedUser) };
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

  // Update profile photo (base64 data URL)
  updateAvatarPhoto(userId: string, dataUrl: string): User | null {
    const users = getAllUsers();
    if (!users[userId]) return null;
    users[userId].avatarPhoto = dataUrl;
    saveUsers(users);
    return syncSession(users[userId]);
  },

  // Remove custom photo (revert to initials)
  removeAvatarPhoto(userId: string): User | null {
    const users = getAllUsers();
    if (!users[userId]) return null;
    delete users[userId].avatarPhoto;
    saveUsers(users);
    return syncSession(users[userId]);
  },

  // Update bio
  updateBio(userId: string, bio: string): User | null {
    const users = getAllUsers();
    if (!users[userId]) return null;
    users[userId].bio = bio.trim();
    saveUsers(users);
    return syncSession(users[userId]);
  },

  // Update username (must be unique)
  updateUsername(userId: string, username: string): { success: boolean; error?: string; user?: User } {
    if (username.length < 3) return { success: false, error: 'Username minimal 3 karakter.' };
    const users = getAllUsers();
    const taken = Object.values(users).some(
      u => u.id !== userId && u.username.toLowerCase() === username.toLowerCase()
    );
    if (taken) return { success: false, error: 'Username sudah digunakan.' };
    users[userId].username = username;
    saveUsers(users);
    return { success: true, user: syncSession(users[userId]) };
  },

  getAllUsersPublic(): User[] {
    const users = getAllUsers();
    return Object.values(users).map(u => {
      const { passwordHash: _, ...publicUser } = u;
      return publicUser as User;
    });
  },
  
  getUserById(userId: string): User | null {
    const users = getAllUsers();
    if (!users[userId]) return null;
    const { passwordHash: _, ...publicUser } = users[userId];
    return publicUser as User;
  }
};
