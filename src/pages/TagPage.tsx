import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Tag, ArrowLeft, Hash } from 'lucide-react';
import { TagService } from '../lib/tags';
import { MangaDexService, Manga } from '../lib/api';
import { MangaCard } from '../components/MangaCard';

export default function TagPage() {
  const { tagName } = useParams<{ tagName: string }>();
  const decoded = decodeURIComponent(tagName || '');

  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [relatedTags, setRelatedTags] = useState<{ tag: string; count: number }[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setNotFound(false);

      const [mangaIds, topTags] = await Promise.all([
        TagService.getMangasByTag(decoded),
        TagService.getTopTags(10)
      ]);
      
      setRelatedTags(topTags.filter(({ tag }) => tag !== decoded).slice(0, 8));

      if (mangaIds.length === 0) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // Fetch details for each manga ID (in parallel, max 12)
        const results = await Promise.allSettled(
          mangaIds.slice(0, 12).map(id => MangaDexService.getMangaDetails(id))
        );
        const loaded: Manga[] = results
          .filter((r): r is PromiseFulfilledResult<Manga> => r.status === 'fulfilled')
          .map(r => r.value);
        setMangas(loaded);
      } catch (e) {
        console.error('Tag page error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [decoded]);

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 md:px-6 max-w-7xl mx-auto">
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors mb-10"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary flex items-center justify-center">
            <Hash className="w-5 h-5 text-black" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/60 mb-1">Manga Tag</p>
            <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tight leading-none">
              {decoded}
            </h1>
          </div>
        </div>
        <p className="text-xs text-white/30 font-mono">
          {loading ? 'Loading...' : `${mangas.length} manga tagged`}
        </p>
      </motion.div>

      {/* Related tags */}
      {relatedTags.length > 0 && (
        <div className="mb-10">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-3">Other Tags</p>
          <div className="flex flex-wrap gap-2">
            {relatedTags.map(({ tag, count }) => (
              <Link
                key={tag}
                to={`/tag/${encodeURIComponent(tag)}`}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 text-white/50 text-xs font-mono hover:border-primary/50 hover:text-primary transition-colors"
              >
                <Tag className="w-3 h-3" />
                {tag}
                <span className="text-[9px] opacity-50">({count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-surface animate-pulse rounded" />
          ))}
        </div>
      ) : notFound || mangas.length === 0 ? (
        <div className="text-center py-24">
          <Tag className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-sm font-mono text-white/30 uppercase tracking-widest">
            No manga found with tag "{decoded}"
          </p>
          <Link
            to="/"
            className="inline-block mt-6 px-6 py-3 bg-primary text-black text-xs font-black uppercase tracking-widest hover:bg-white transition-colors"
          >
            Browse Manga
          </Link>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          {mangas.map((manga, i) => (
            <motion.div
              key={manga.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <MangaCard manga={manga} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
