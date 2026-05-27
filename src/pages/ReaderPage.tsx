import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MangaDexService, Chapter, Manga } from '../lib/api';
import { StorageService } from '../lib/storage';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Maximize, Minimize, AlertTriangle,
  ArrowRight, ChevronDown, ChevronLeft, ChevronRight, List
} from 'lucide-react';
import { MangaCard } from '../components/MangaCard';
import { CommentSection } from '../components/CommentSection';

export default function ReaderPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const [pages, setPages] = useState<string[]>([]);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [nextChapter, setNextChapter] = useState<Chapter | null>(null);
  const [prevChapter, setPrevChapter] = useState<Chapter | null>(null);
  const [recommendations, setRecommendations] = useState<Manga[]>([]);
  const [mangaId, setMangaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChapterMenu, setShowChapterMenu] = useState(false);
  const chapterMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadPages() {
      if (!chapterId) return;
      setLoading(true);
      setError(null);
      setNextChapter(null);
      setPrevChapter(null);
      setCurrentChapter(null);
      setShowChapterMenu(false);

      window.scrollTo(0, 0);

      try {
        const [pageUrls, chapterInfo, trendingRecs, latestRecs] = await Promise.all([
          MangaDexService.getChapterPages(chapterId),
          MangaDexService.getChapterInfo(chapterId),
          MangaDexService.getTrendingManga(2),
          MangaDexService.getLatestManga(2),
        ]);

        const recs = [...trendingRecs, ...latestRecs];

        if (!pageUrls || pageUrls.length === 0) {
          setError('Chapter ini tidak tersedia atau merupakan chapter eksternal yang tidak bisa dibaca di sini.');
        } else {
          setPages(pageUrls);
          setMangaId(chapterInfo.mangaId);
          setRecommendations(recs);

          if (chapterInfo.mangaId) {
            const [chapters, mangaDetails] = await Promise.all([
              MangaDexService.getAllMangaChapters(chapterInfo.mangaId),
              MangaDexService.getMangaDetails(chapterInfo.mangaId),
            ]);

            // chapters are sorted desc — so index 0 is the latest
            setAllChapters(chapters);

            const currentIndex = chapters.findIndex(c => c.id === chapterId);
            if (currentIndex !== -1) {
              setCurrentChapter(chapters[currentIndex]);
              // Next = lower index (newer), Prev = higher index (older)
              if (currentIndex > 0) setNextChapter(chapters[currentIndex - 1]);
              if (currentIndex < chapters.length - 1) setPrevChapter(chapters[currentIndex + 1]);
            }

            if (mangaDetails) {
              StorageService.updateReadingHistory(mangaDetails, chapterId, chapterInfo.chapterNum);
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

  // Close chapter menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (chapterMenuRef.current && !chapterMenuRef.current.contains(e.target as Node)) {
        setShowChapterMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const navigateToChapter = (chapter: Chapter) => {
    if (chapter.externalUrl) {
      window.open(chapter.externalUrl, '_blank');
    } else {
      navigate(`/read/${chapter.id}`);
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

  const chapterLabel = currentChapter
    ? (currentChapter.chapter ? `Ch. ${currentChapter.chapter}` : currentChapter.title || 'Chapter')
    : 'Chapter';

  return (
    <div className="min-h-screen bg-canvas text-ink selection:bg-transparent">
      {/* ── HUD ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        {/* Main HUD bar */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 bg-canvas/80 backdrop-blur-xl border-b border-white/5">
          {/* Left: back button */}
          <button
            onClick={() => navigate(mangaId ? `/manga/${mangaId}` : '/')}
            className="flex items-center gap-2 uppercase text-[10px] font-black tracking-widest hover:text-primary transition-colors text-white/60"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali</span>
          </button>

          {/* Center: chapter selector */}
          <div ref={chapterMenuRef} className="relative">
            <button
              onClick={() => setShowChapterMenu(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-white/10 hover:border-primary/50 transition-colors group"
              id="chapter-selector-btn"
            >
              <List className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-black uppercase tracking-widest">{chapterLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${showChapterMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {showChapterMenu && allChapters.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 bg-[#12121A] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden z-[100]"
                >
                  {/* Header */}
                  <div className="px-3 py-2 border-b border-white/10 bg-white/5">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">
                      Pilih Chapter
                    </p>
                  </div>
                  <div className="overflow-y-auto max-h-64 custom-scrollbar">
                    {allChapters.map((ch) => {
                      const isActive = ch.id === chapterId;
                      const label = ch.chapter ? `Ch. ${ch.chapter}` : ch.title || 'Chapter';
                      return (
                        <button
                          key={ch.id}
                          onClick={() => {
                            setShowChapterMenu(false);
                            navigateToChapter(ch);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-mono transition-colors flex items-center justify-between gap-2 ${
                            isActive
                              ? 'bg-primary text-black font-black'
                              : 'text-white/60 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span>{label}</span>
                          {isActive && <span className="text-[9px] font-black">▶</span>}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: prev / next / fullscreen */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => prevChapter && navigateToChapter(prevChapter)}
              disabled={!prevChapter}
              title="Chapter sebelumnya"
              className="p-1.5 border border-white/10 hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => nextChapter && navigateToChapter(nextChapter)}
              disabled={!nextChapter}
              title="Chapter berikutnya"
              className="p-1.5 border border-white/10 hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 border border-white/10 hover:border-primary/50 hover:text-primary transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Pages Container ─────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto pt-24 pb-8 space-y-8 px-2 md:px-4">
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

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="pt-16 pb-8 flex flex-col items-center border-t border-white/5 bg-canvas/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 px-4"
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 text-ink/80">
            End of Chapter
          </h2>
          <p className="text-sm text-ink/40 mb-10 max-w-md mx-auto">
            {nextChapter ? "Lanjut ke chapter berikutnya?" : "Kembali ke halaman manga untuk baca lebih atau temukan yang baru."}
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
                onClick={() => navigateToChapter(nextChapter)}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-primary text-black hover:bg-white transition-colors duration-300 font-medium text-sm w-full sm:w-auto"
              >
                Next: {nextChapter.title || `Chapter ${nextChapter.chapter}`}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Chapter Bottom Selector ─── */}
        {allChapters.length > 0 && (
          <div className="w-full max-w-3xl mx-auto px-4 md:px-6 mb-4">
            <div className="flex items-center gap-3 justify-center border border-white/10 bg-white/[0.02] py-3 px-4">
              <button
                onClick={() => prevChapter && navigateToChapter(prevChapter)}
                disabled={!prevChapter}
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              <span className="text-[10px] font-mono text-white/30 flex-1 text-center">{chapterLabel}</span>
              <button
                onClick={() => nextChapter && navigateToChapter(nextChapter)}
                disabled={!nextChapter}
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Comments ──────────────────────────────────────────── */}
        {chapterId && <CommentSection chapterId={chapterId} />}

        {/* ── Recommendations ───────────────────────────────────── */}
        {recommendations.length > 0 && (
          <div className="w-full max-w-6xl mx-auto px-6 border-t border-white/10 pt-16 mt-8">
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
