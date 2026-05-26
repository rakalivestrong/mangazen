import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MangaDexService, Chapter, Manga } from '../lib/api';
import { StorageService } from '../lib/storage';
import { motion } from 'motion/react';
import { ArrowLeft, Maximize, Minimize, AlertTriangle, ArrowRight } from 'lucide-react';
import { MangaCard } from '../components/MangaCard';

export default function ReaderPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const [pages, setPages] = useState<string[]>([]);
  const [nextChapter, setNextChapter] = useState<Chapter | null>(null);
  const [recommendations, setRecommendations] = useState<Manga[]>([]);
  const [mangaId, setMangaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadPages() {
      if (!chapterId) return;
      setLoading(true);
      setError(null);
      setNextChapter(null);
      
      // Scroll to top when changing chapters
      window.scrollTo(0, 0);
      
      try {
        const [pageUrls, chapterInfo, trendingRecs, latestRecs] = await Promise.all([
          MangaDexService.getChapterPages(chapterId),
          MangaDexService.getChapterInfo(chapterId),
          MangaDexService.getTrendingManga(2),
          MangaDexService.getLatestManga(2)
        ]);
        
        const recs = [...trendingRecs, ...latestRecs];
        
        if (!pageUrls || pageUrls.length === 0) {
          setError('Chapter ini tidak tersedia atau merupakan chapter eksternal yang tidak bisa dibaca di sini.');
        } else {
          setPages(pageUrls);
          setMangaId(chapterInfo.mangaId);
          setRecommendations(recs);
          if (chapterInfo.mangaId) {
            // Fetch all chapters to find the next one
            const [chapters, mangaDetails] = await Promise.all([
              MangaDexService.getAllMangaChapters(chapterInfo.mangaId),
              MangaDexService.getMangaDetails(chapterInfo.mangaId)
            ]);

            // Save to history
            if (mangaDetails) {
              StorageService.updateReadingHistory(mangaDetails, chapterId, chapterInfo.chapterNum);
            }

            const currentIndex = chapters.findIndex(c => c.id === chapterId);
            // Chapters are sorted desc, so next chapter is index - 1
            if (currentIndex > 0) {
              setNextChapter(chapters[currentIndex - 1]);
            }
          }
        }
      } catch (err) {
        console.error('Error loading pages:', err);
        setError('Gagal memuat halaman chapter. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    }
    loadPages();
  }, [chapterId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-canvas z-[100]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-white/10 border-t-primary rounded-full animate-spin" />
          <p className="font-mono text-xs uppercase tracking-widest text-primary/80">Loading Chapter...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-canvas z-[100]">
        <div className="flex flex-col items-center gap-6 text-center px-8 max-w-md">
          <AlertTriangle className="w-12 h-12 text-primary" />
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-primary">Transmission_Error</p>
          <p className="opacity-60 text-sm">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-4 bg-primary text-black font-black uppercase italic text-sm hover:scale-105 transition-transform"
          >
            Return_to_Node
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink selection:bg-transparent">
      {/* HUD */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 p-6 flex items-center justify-between z-50 text-white mix-blend-difference pointer-events-none"
      >
        <button 
          onClick={() => navigate(mangaId ? `/manga/${mangaId}` : '/')} 
          className="pointer-events-auto flex items-center gap-2 uppercase text-[10px] font-black tracking-widest hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go to home page 
        </button>
        <button onClick={toggleFullscreen} className="pointer-events-auto hover:text-primary transition-colors">
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </motion.div>

      {/* Pages Container */}
      <div className="max-w-4xl mx-auto py-24 space-y-8 px-2 md:px-4">
        {pages.map((url, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] group"
          >
            <img 
              src={url} 
              alt={`Page ${index + 1}`} 
              className="w-full h-auto select-none transition-all duration-700"
              loading={index < 3 ? "eager" : "lazy"}
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-4 left-4 bg-primary text-black px-2 py-0.5 text-[8px] font-mono font-black opacity-0 group-hover:opacity-100 transition-opacity">
              FRAGMENT_{index + 1}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <footer className="pt-32 pb-16 flex flex-col items-center justify-center border-t border-white/5 bg-canvas/50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 text-ink/80">
            End of Chapter
          </h2>
          <p className="text-sm text-ink/40 mb-10 max-w-md mx-auto px-4">
            You've reached the end of this chapter. {nextChapter ? "Ready for the next one?" : "Return to the manga page to read more or find something new."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate(mangaId ? `/manga/${mangaId}` : '/')}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-full border border-white/10 hover:border-primary text-ink hover:text-primary transition-colors duration-300 font-medium text-sm w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Info
            </button>
            {nextChapter && (
              <button 
                onClick={() => {
                  if (nextChapter.externalUrl) {
                    window.open(nextChapter.externalUrl, '_blank');
                  } else {
                    navigate(`/read/${nextChapter.id}`);
                  }
                }}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-primary text-black hover:bg-white transition-colors duration-300 font-medium text-sm w-full sm:w-auto"
              >
                Next: {nextChapter.title || `Chapter ${nextChapter.chapter}`}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="w-full max-w-6xl mx-auto px-6 border-t border-white/10 pt-16">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary/80 mb-8 text-center">
              Recommended for You
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recommendations.map(manga => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
