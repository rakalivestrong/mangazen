import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, LogIn, ChevronDown, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';
import { motion, AnimatePresence } from 'motion/react';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        isScrolled
          ? "bg-surface/90 backdrop-blur-xl py-3 border-white/10"
          : "bg-transparent py-4 md:py-6 border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-wrap gap-4 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 md:gap-4 group shrink-0">
          <img
            src="/logo.png"
            alt="MangaZen Logo"
            className="w-8 h-8 md:w-10 md:h-10 object-contain group-hover:scale-110 transition-transform duration-500"
          />
          <span className="font-bold text-xl md:text-2xl tracking-tighter uppercase italic">
            Manga<span className="text-primary font-normal">Zen</span>
          </span>
        </Link>

        <div className="items-center gap-6 text-sm font-black uppercase italic tracking-wider hidden md:flex">
          <Link to="/" className="hover:text-primary transition-colors">Releases</Link>
          <Link to="/users" className="hover:text-primary transition-colors">Users</Link>
          {isLoggedIn && (
            <Link to="/profile" className="hover:text-primary transition-colors">My Library</Link>
          )}
        </div>

        <div className="flex items-center gap-3 flex-1 md:flex-none justify-end">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative block group flex-1 max-w-[150px] md:max-w-xs">
            <input
              type="text"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/5 focus:border-primary/50 outline-none px-3 md:px-4 py-2 text-[9px] md:text-[10px] tracking-widest uppercase transition-all w-full placeholder:text-white/20"
            />
            <button type="submit" className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-primary">
              <Search className="w-3 h-3 md:w-4 md:h-4" />
            </button>
          </form>

          {/* Auth area */}
          {isLoggedIn && user ? (
            <div ref={menuRef} className="relative shrink-0">
              <button
                onClick={() => setShowUserMenu(v => !v)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                id="user-menu-btn"
              >
                <Avatar user={user} size="sm" />
                <span className="hidden md:block text-[10px] font-black uppercase tracking-widest max-w-[80px] truncate">
                  {user.username}
                </span>
                <ChevronDown className={cn(
                  "w-3 h-3 text-white/40 transition-transform hidden md:block",
                  showUserMenu && "rotate-180"
                )} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-surface border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden z-50"
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
                      <Avatar user={user} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase text-ink truncate">{user.username}</p>
                        <p className="text-[10px] text-white/30 font-mono truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Links */}
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-white/60 hover:bg-white/5 hover:text-primary transition-colors"
                    >
                      <User className="w-3.5 h-3.5" />
                      My Profile
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-white/60 hover:bg-white/5 hover:text-primary transition-colors border-t border-white/5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      My Library
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary pb-px hover:opacity-70 transition-opacity shrink-0"
            >
              <LogIn className="w-3 h-3" />
              <span className="hidden md:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
