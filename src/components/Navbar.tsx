import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Moon, Sun, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

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

        <div className="flex items-center gap-4 flex-1 md:flex-none justify-end">
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

          <Link to="/library" className="md:hidden text-primary/80 hover:text-primary transition-colors shrink-0" title="My Library">
            <BookOpen className="w-4 h-4" />
          </Link>

          <button 
            onClick={toggleTheme}
            className="hidden md:block text-[10px] uppercase tracking-widest text-primary font-black border-b border-primary pb-px hover:opacity-70 transition-opacity shrink-0"
          >
            {isDark ? "Light" : "Dark"}
          </button>
          <button 
            onClick={toggleTheme}
            className="md:hidden text-[9px] uppercase tracking-widest text-primary font-black border-b border-primary pb-px hover:opacity-70 transition-opacity shrink-0"
          >
            {isDark ? "LGT" : "DRK"}
          </button>
        </div>
      </div>
    </nav>
  );
}

function BookCardLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:rotate-12 transition-transform duration-500">
      <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M4 18H20" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 6H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 14H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
