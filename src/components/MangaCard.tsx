import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Manga } from '../lib/api';
import { cn } from '../lib/utils';

interface MangaCardProps {
  manga: Manga;
  className?: string;
}

function getOriginBadge(lang?: string): { label: string; color: string } | null {
  if (!lang) return null;
  if (lang === 'zh' || lang === 'zh-hk') return { label: '🇨🇳 Manhua', color: 'bg-red-500/80 text-white' };
  if (lang === 'ko') return { label: '🇰🇷 Manhwa', color: 'bg-blue-500/80 text-white' };
  if (lang === 'ja') return { label: '🇯🇵 Manga', color: 'bg-pink-500/80 text-white' };
  return null;
}

export function MangaCard({ manga, className }: MangaCardProps) {
  const badge = getOriginBadge(manga.originalLanguage);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("group relative border border-white/5 bg-surface overflow-hidden", className)}
    >
      <Link to={`/manga/${manga.id}`}>
        <div className="aspect-[3/4] relative overflow-hidden bg-neutral-900">
          {manga.coverArt ? (
            <img
              src={manga.coverArt}
              alt={manga.title}
              className="w-full h-full object-cover transition-all duration-700 scale-100 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-white/10 uppercase tracking-tighter italic text-xs">
              NO_VIRTUAL_ASSET
            </div>
          )}
          
          {/* Neon Overlay on hover */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left z-20" />
          
          {/* Origin Badge */}
          {badge && (
            <div className={`absolute top-2 left-2 ${badge.color} backdrop-blur-md px-2 py-0.5 text-[8px] font-black uppercase tracking-widest z-10`}>
              {badge.label}
            </div>
          )}

          {/* Year Badge */}
          {manga.year && (
            <div className="absolute top-2 right-2 bg-canvas/80 backdrop-blur-md px-2 py-0.5 text-[8px] font-mono font-bold text-primary border border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity">
              {manga.year}
            </div>
          )}
        </div>

        <div className="p-4 relative">
          <h3 className="font-bold text-sm tracking-tight leading-tight uppercase italic group-hover:text-primary transition-colors line-clamp-1">
            {manga.title}
          </h3>
          <div className="flex flex-wrap gap-2 mt-3">
            {manga.tags.slice(0, 1).map((tag) => (
              <span key={tag} className="text-[9px] font-mono uppercase tracking-[0.1em] text-white/30 group-hover:text-white/60">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
