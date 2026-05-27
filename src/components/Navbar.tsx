import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, BookOpen, LogIn, LogOut, User, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
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

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
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
        <Link to="/" className="flex items-center gap-2 md:gap-4 group shrink-0">
          <img src="/logo.png" alt="MangaZen Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain group-hover:scale-110 transition-transform duration-500" />
          <span className="font-bold text-xl md:text-2xl tracking-tighter uppercase italic">
            Manga<span className="text-primary font-normal">Zen</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6 text-sm font-black uppercase italic tracking-wider hidden md:flex">
          <Link to="/" className="hover:text-primary transition-colors">Releases</Link>
          <Link to="/library" className="hover:text-primary transition-colors">My Library</Link>
        </div>

        <div className="flex items-center gap-3 flex-1 md:flex-none justify-end">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative block group flex-1 max-w-[150px] md:max-w-xs">
            <input
              type="text"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/5 focus:border-primary/50 outline-none px-3 md:px-4 py-2 text-[9px] md:text-[10px] tracking-widest uppercase transition-all w-full placeholder:text-white/20"
            />
            <button type="submit" className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-primary">
              <Search className="w-3 h-3 md:w-4 md:h-4" />
            </button>
          </form>

          {/* Library (mobile) */}
          <Link to="/library" className="md:hidden text-primary/80 hover:text-primary transition-colors shrink-0" title="My Library">
            <BookOpen className="w-4 h-4" />
          </Link>

          {/* Auth area */}
          {isLoggedIn && user ? (
            <div ref={menuRef} className="relative shrink-0">
              <button
                onClick={() => setShowUserMenu(v => !v)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                id="user-menu-btn"
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-black font-black text-xs shrink-0"
                  style={{ backgroundColor: user.avatar }}
                >
                  {user.username[0].toUpperCase()}
                </div>
                <span className="hidden md:block text-[10px] font-black uppercase tracking-widest max-w-[100px] truncate">
                  {user.username}
                </span>
                <ChevronDown className={cn("w-3 h-3 text-white/40 transition-transform hidden md:block", showUserMenu && "rotate-180")} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-surface border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden z-50"
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-xs font-black uppercase text-ink">{user.username}</p>
                      <p className="text-[10px] text-white/30 font-mono truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Logout
                    </button>
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
