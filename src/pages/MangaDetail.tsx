import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MangaDexService, Manga, Chapter } from '../lib/api';
import { StorageService } from '../lib/storage';
import { getMangaVibeCheck } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Sparkles, ExternalLink, Search, Heart, BookmarkPlus, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function MangaDetail() {
  const { id } = useParams<{ id: string }>();
  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [vibe, setVibe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkStatus, setBookmarkStatus] = useState<'favorite' | 'plan_to_read' | null>(null);

  useEffect(() => {
    if (id) {
      setBookmarkStatus(StorageService.getBookmarkStatus(id));
    }
  }, [id]);

  const toggleBookmark = (status: 'favorite' | 'plan_to_read') => {
    if (!manga) return;
    if (bookmarkStatus === status) {
      StorageService.removeBookmark(manga.id);
      setBookmarkStatus(null);
    } else {
      StorageService.addBookmark(manga, status);
      setBookmarkStatus(status);
    }
  };

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const [mangaData, chapterData] = await Promise.all([
          MangaDexService.getMangaDetails(id),
          MangaDexService.getAllMangaChapters(id)
        ]);
        setManga(mangaData);
        setChapters(chapterData);
        
        const vibeData = await getMangaVibeCheck(mangaData.title, mangaData.description);
        setVibe(vibeData);
      } catch (error) {
        console.error('Error loading manga details:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const filteredChapters = chapters.filter(c => 
    c.chapter?.includes(searchQuery) || 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="pt-32 pb-40 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 animate-pulse">
      <div className="w-full lg:w-96 aspect-[3/4] bg-surface rounded-lg"></div>
      <div className="flex-1 space-y-6">
        <div className="h-8 w-32 bg-surface rounded"></div>
        <div className="h-24 w-3/4 bg-surface rounded"></div>
        <div className="h-40 w-full bg-surface rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-10">
          <div className="h-16 bg-surface rounded"></div>
          <div className="h-16 bg-surface rounded"></div>
          <div className="h-16 bg-surface rounded"></div>
          <div className="h-16 bg-surface rounded"></div>
        </div>
      </div>
    </div>
  );
  if (!manga) return <div className="pt-32 text-center font-mono opacity-50 uppercase tracking-widest text-sm italic">UNRECOVERABLE_ERROR: ENTITY_NOT_FOUND</div>;

  return (
    <div className="min-h-screen relative">
      {/* Immersive Background Banner */}
      <div className="absolute top-0 left-0 right-0 h-[70vh] overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-canvas/10 via-canvas/60 to-canvas z-10" />
        <motion.img 
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src={manga.bannerArt || manga.coverArt || ''} 
          alt="Background" 
          className="w-full h-full object-cover blur-sm"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="pt-32 pb-40 px-6 max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full lg:w-96 flex-shrink-0"
        >
          <div className="relative group">
            <div className="absolute -inset-2 border-2 border-primary/20 group-hover:border-primary/50 transition-colors pointer-events-none" />
            <img 
              src={manga.coverArt || ''} 
              alt={manga.title} 
              className="w-full relative z-10 transition-all duration-700 shadow-[20px_20px_0px_rgba(188,255,0,0.1)] group-hover:shadow-[20px_20px_0px_rgba(188,255,0,0.2)]"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <div className="mt-16 grid grid-cols-2 gap-px bg-white/10 border border-white/10">
            <div className="p-6 bg-surface">
              <p className="text-[9px] uppercase tracking-[0.3em] text-primary font-black mb-2">Node_Status</p>
              <p className="uppercase text-sm font-bold italic">{manga.status || 'Active'}</p>
            </div>
            <div className="p-6 bg-surface">
              <p className="text-[9px] uppercase tracking-[0.3em] text-primary font-black mb-2">Timestamp</p>
              <p className="uppercase text-sm font-bold italic">{manga.year || '2024'}</p>
            </div>
          </div>
        </motion.div>

        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="inline-block px-3 py-1 bg-primary text-black text-[10px] font-black uppercase italic tracking-widest mb-6">
              MangaDex_Database_01
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-black tracking-tighter uppercase italic leading-[0.8] mb-8">
              {manga.title}
            </h1>

            <div className="flex flex-wrap gap-4 mb-12">
              <button 
                onClick={() => toggleBookmark('favorite')}
                className={`flex items-center gap-2 px-6 py-3 rounded-none border font-mono text-xs tracking-widest uppercase transition-all ${
                  bookmarkStatus === 'favorite' 
                  ? 'bg-primary border-primary text-black font-black' 
                  : 'border-white/20 text-white hover:border-primary hover:text-primary'
                }`}
              >
                {bookmarkStatus === 'favorite' ? <Check className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
                Favorite
              </button>
              <button 
                onClick={() => toggleBookmark('plan_to_read')}
                className={`flex items-center gap-2 px-6 py-3 rounded-none border font-mono text-xs tracking-widest uppercase transition-all ${
                  bookmarkStatus === 'plan_to_read' 
                  ? 'bg-white border-white text-black font-black' 
                  : 'border-white/20 text-white hover:border-white'
                }`}
              >
                {bookmarkStatus === 'plan_to_read' ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                Plan to Read
              </button>
            </div>
          </motion.div>

          <AnimatePresence>
            {vibe && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border-l-4 border-primary p-8 mb-12 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-2 font-mono text-[8px] text-white/10 uppercase font-black">AI_CORE_V1</div>
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-primary flex items-center justify-center shrink-0">
                    <span className="text-4xl group-hover:scale-125 transition-transform">{vibe.mood}</span>
                  </div>
                  <div>
                    <h3 className="text-[10px] uppercase tracking-[0.5em] text-primary font-black mb-3">Vibe_Protocol_Activated</h3>
                    <p className="text-2xl md:text-3xl font-bold uppercase italic leading-tight mb-4">"{vibe.vibe}"</p>
                    <p className="text-xs opacity-50 uppercase tracking-widest leading-relaxed line-clamp-2 md:line-clamp-none">{vibe.verdict}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mb-20 max-w-3xl">
            <div className="prose prose-sm prose-invert italic opacity-50 text-base border-t border-white/10 pt-8">
              <ReactMarkdown>{manga.description}</ReactMarkdown>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/20 pb-4 gap-4">
              <div>
                <h2 className="text-4xl font-black uppercase italic italic tracking-tighter">Memory_Clusters</h2>
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">{chapters.length} Fragments Found</span>
              </div>
              
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="JUMP TO CHAPTER..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-xs font-mono tracking-widest uppercase focus:outline-none focus:border-primary/50 transition-colors placeholder:text-white/20"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredChapters.map((chapter) => {
                const isExternal = !!chapter.externalUrl;
                const className = "flex items-center justify-between p-6 bg-surface border border-white/5 hover:border-primary/50 transition-all group overflow-hidden relative";
                
                const innerContent = (
                  <>
                    <div className="absolute inset-y-0 left-0 w-0.5 bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform" />
                    <div className="flex items-center gap-6">
                      <span className="text-xs font-mono text-primary font-bold opacity-40 group-hover:opacity-100 transition-opacity">#{chapter.chapter}</span>
                      <span className="uppercase tracking-widest font-bold text-xs group-hover:translate-x-1 transition-transform">{chapter.title || `Chapter ${chapter.chapter}`}</span>
                    </div>
                    {isExternal ? (
                      <ExternalLink className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <Play className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </>
                );

                return isExternal ? (
                  <a 
                    key={chapter.id} 
                    href={chapter.externalUrl!} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {innerContent}
                  </a>
                ) : (
                  <Link 
                    key={chapter.id} 
                    to={`/read/${chapter.id}`}
                    className={className}
                  >
                    {innerContent}
                  </Link>
                );
              })}
              
              {filteredChapters.length === 0 && (
                <div className="col-span-1 md:col-span-2 py-10 text-center font-mono opacity-50 uppercase text-xs">
                  NO FRAGMENTS MATCH YOUR SEARCH.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
