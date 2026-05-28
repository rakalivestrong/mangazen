import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { MangaDexService, Manga } from '../lib/api';
import { MangaCard } from '../components/MangaCard';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Star } from 'lucide-react';

export default function Home() {
  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [trending, setTrending] = useState<Manga[]>([]);
  const [activeHero, setActiveHero] = useState(0);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState<'all' | 'manga' | 'manhwa' | 'manhua'>('all');
  const [page, setPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState<'all-time' | 'yearly' | 'monthly' | 'weekly' | 'daily'>('all-time');
  const [availableTags, setAvailableTags] = useState<{ id: string; name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';
  const limit = 20;

  // Auto-rotate hero
  useEffect(() => {
    if (trending.length === 0) return;
    const interval = setInterval(() => {
      setActiveHero(prev => (prev + 1) % trending.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [trending]);

  // Fetch available tags on mount
  useEffect(() => {
    async function loadTags() {
      try {
        const tags = await MangaDexService.getTags();
        setAvailableTags(tags);
      } catch (err) {
        console.error('Failed to load tags', err);
      }
    }
    loadTags();
  }, []);

  // Reset page when query, origin, tags, or time filter change
  useEffect(() => {
    setPage(1);
  }, [query, origin, selectedTags.join(','), timeFilter]);

  useEffect(() => {
    async function loadManga() {
      setLoading(true);
      try {
        const offset = (page - 1) * limit;
        const [results, trendingResults, latestResults] = await Promise.all([
          query 
            ? MangaDexService.searchManga(query, limit, origin, offset, selectedTags, timeFilter)
            : MangaDexService.getLatestManga(limit, origin, offset, selectedTags, timeFilter),
          (!query && page === 1) ? MangaDexService.getTrendingManga(3) : Promise.resolve([]),
          (!query && page === 1) ? MangaDexService.getLatestManga(2) : Promise.resolve([])
        ]);
        setMangaList(results);
        if (trendingResults.length > 0) {
          setTrending([...trendingResults, ...latestResults]);
        }
      } catch (error) {
        console.error('Error loading manga:', error);
      } finally {
        setLoading(false);
      }
    }
    loadManga();
  }, [query, origin, page, selectedTags, timeFilter]);

  return (
    <div className="w-full pb-20">
      {/* Hero Section */}
      {!query && page === 1 && trending.length > 0 && (
        <div className="relative w-full h-[85vh] overflow-hidden bg-canvas mb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeHero}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <img 
                src={trending[activeHero].bannerArt || trending[activeHero].coverArt || ''} 
                className="w-full h-full object-cover opacity-60 object-top" 
                alt="hero" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/40 to-transparent" />
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-0 left-0 w-full p-8 md:px-16 md:pb-24 flex flex-col justify-end h-full">
            <div className="max-w-7xl mx-auto w-full">
              <motion.div
                key={`info-${activeHero}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="max-w-2xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-primary text-black text-[10px] font-black uppercase tracking-widest">
                    {activeHero < 3 ? 'Trending' : 'New Release'}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-mono text-primary">
                    {activeHero < 3 && <Star className="w-3 h-3 fill-primary" />}
                    {activeHero < 3 ? `Top ${activeHero + 1}` : 'Just Updated'}
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black italic tracking-tighter uppercase mb-4 leading-[1.1] text-ink line-clamp-2">
                  {trending[activeHero].title}
                </h2>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {trending[activeHero].tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs text-ink/60 uppercase tracking-widest border border-white/10 px-2 py-0.5">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm md:text-base text-ink/60 line-clamp-3 mb-8 max-w-xl">
                  {trending[activeHero].description || 'No description available for this archive.'}
                </p>
                
                <div className="flex items-center gap-4">
                  <Link
                    to={`/manga/${trending[activeHero].id}`}
                    className="flex items-center gap-2 px-8 py-4 bg-primary text-black font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    Read Now
                  </Link>
                </div>
              </motion.div>

              {/* Pagination dots */}
              <div className="flex gap-2 mt-12">
                {trending.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveHero(i)}
                    className={`w-12 h-1 rounded-full transition-all duration-300 ${i === activeHero ? 'bg-primary' : 'bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className={`${(!query && page === 1 && trending.length > 0) ? 'pt-8' : 'pt-32'} px-6 max-w-7xl mx-auto`}>
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-semibold text-primary">
              {query ? 'Search Results' : 'MOHON MAAF KEPADA SELURUH PENGGUNA KARNA WEB INI MASIH BELUM LENGKAP DI KARENAKAN INI PROJECT SOLO DEV, TAPI SAYA AKAN USAHAKAN UNTUK UPDATE SETIAP HARINYA.'}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            {query ? `Results for "${query}"` : 'Releases'}
          </h1>
          
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex gap-2">
                  {(['all', 'manga', 'manhwa', 'manhua'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setOrigin(t)}
                      className={`px-6 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${
                        origin === t 
                          ? 'bg-primary text-black border-primary' 
                          : 'bg-transparent text-ink/60 border-white/10 hover:border-primary/50 hover:text-ink'
                      }`}
                    >
                      {t === 'all' ? 'All' : t === 'manga' ? '🇯🇵 Manga' : t === 'manhwa' ? '🇰🇷 Manhwa' : '🇨🇳 Manhua'}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-6 py-2 text-xs font-bold uppercase tracking-widest border transition-colors flex items-center gap-2 ${showFilters || selectedTags.length > 0 ? 'bg-white/10 text-white border-white/30' : 'bg-transparent text-ink/60 border-white/10 hover:border-white/30 hover:text-ink'}`}
                >
                  Genres {selectedTags.length > 0 && `(${selectedTags.length})`}
                </button>
              </div>

              <div className="flex flex-wrap gap-1 bg-surface p-1 border border-white/5">
                {(['all-time', 'yearly', 'monthly', 'weekly', 'daily'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeFilter(t)}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      timeFilter === t 
                        ? 'bg-primary text-black' 
                        : 'bg-transparent text-ink/50 hover:text-ink hover:bg-white/5'
                    }`}
                  >
                    {t.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
            
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5 pb-4">
                    {availableTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => setSelectedTags(prev => 
                          prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                        )}
                        className={`px-3 py-1 text-[10px] uppercase font-mono tracking-widest border transition-colors ${
                          selectedTags.includes(tag.id)
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-transparent border-white/10 text-ink/50 hover:border-white/30 hover:text-ink'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-primary/50 to-transparent mb-8" />
        </header>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-lg bg-surface border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {mangaList.map((manga) => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>
        )}

        {mangaList.length === 0 && !loading ? (
          <div className="py-32 text-center">
            <h2 className="font-serif text-3xl opacity-50">The archives are silent.</h2>
            <p className="mt-2 opacity-30 uppercase tracking-widest text-sm">Try another frequency</p>
          </div>
        ) : (
          !loading && (
            <div className="flex items-center justify-center gap-4 mt-16">
              <button
                disabled={page === 1}
                onClick={() => {
                  setPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-2 border border-white/10 hover:border-primary disabled:opacity-30 disabled:hover:border-white/10 transition-colors font-mono text-sm"
              >
                Prev
              </button>
              <span className="font-mono text-sm text-primary">Page {page}</span>
              <button
                disabled={mangaList.length < limit}
                onClick={() => {
                  setPage(p => p + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-2 border border-white/10 hover:border-primary disabled:opacity-30 disabled:hover:border-white/10 transition-colors font-mono text-sm"
              >
                Next
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
