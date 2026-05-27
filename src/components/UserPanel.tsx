import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Tag, X, Plus, Check, BookOpen, BookMarked, BookCheck } from 'lucide-react';
import { TagService, ReadingStatus } from '../lib/tags';
import { useAuth } from '../context/AuthContext';

interface Props {
  mangaId: string;
  mangaTitle: string;
}

const STATUS_OPTIONS: { value: ReadingStatus; label: string; icon: React.ReactNode }[] = [
  { value: 'already_read', label: 'Already Read', icon: <BookCheck className="w-3.5 h-3.5" /> },
  { value: 'reading', label: 'Reading', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { value: 'want_to_read', label: 'Want to Read', icon: <BookMarked className="w-3.5 h-3.5" /> },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(value === star ? 0 : star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              star <= (hover || value)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-white/20'
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-[10px] font-mono text-white/40 ml-1">{value}/5</span>
      )}
    </div>
  );
}

export function UserPanel({ mangaId, mangaTitle }: Props) {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<ReadingStatus | null>(null);
  const [rating, setRating] = useState(0);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [allUserTags, setAllUserTags] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const tagPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = TagService.getMangaUserData(mangaId);
    setStatus(data.status);
    setRating(data.rating);
    setUserTags(data.tags);
    setAllUserTags(TagService.getAllUserTags());
    setPopularTags(TagService.getPopularTagsForManga(mangaId));
  }, [mangaId]);

  // Close tag panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tagPanelRef.current && !tagPanelRef.current.contains(e.target as Node)) {
        setShowTagPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleStatusChange = (s: ReadingStatus) => {
    const next = status === s ? null : s;
    setStatus(next);
    TagService.setStatus(mangaId, next);
  };

  const handleRatingChange = (r: number) => {
    setRating(r);
    TagService.setRating(mangaId, r);
  };

  const addTag = (tag: string) => {
    const updated = TagService.addTag(mangaId, tag);
    setUserTags(updated);
    setAllUserTags(TagService.getAllUserTags());
    setPopularTags(TagService.getPopularTagsForManga(mangaId));
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    const updated = TagService.removeTag(mangaId, tag);
    setUserTags(updated);
    setAllUserTags(TagService.getAllUserTags());
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().toLowerCase();
      if (val) addTag(val);
    }
    if (e.key === 'Backspace' && !tagInput && userTags.length > 0) {
      removeTag(userTags[userTags.length - 1]);
    }
  };

  const suggestedTags = allUserTags.filter(
    t => !userTags.includes(t) && t.includes(tagInput.toLowerCase())
  );

  if (!isLoggedIn) {
    return (
      <div className="border border-white/10 bg-white/[0.02] p-5 flex items-center justify-between gap-4">
        <p className="text-sm text-white/40 font-mono">Login untuk menambahkan status, rating & tag</p>
        <Link
          to="/auth"
          className="shrink-0 px-4 py-2 bg-primary text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-white/10 bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">My Space</p>
        <p className="text-[9px] font-mono text-white/30">{mangaTitle.slice(0, 30)}{mangaTitle.length > 30 ? '…' : ''}</p>
      </div>

      <div className="p-5 space-y-5">
        {/* Reading status */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">Reading Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider border transition-all ${
                  status === opt.value
                    ? 'bg-primary border-primary text-black'
                    : 'border-white/20 text-white/50 hover:border-white/50 hover:text-white'
                }`}
              >
                {status === opt.value ? <Check className="w-3 h-3" /> : opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Star rating */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">Rating</p>
          <StarRating value={rating} onChange={handleRatingChange} />
        </div>

        {/* Tags */}
        <div ref={tagPanelRef} className="relative">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">My Tags</p>
            <button
              onClick={() => setShowTagPanel(v => !v)}
              className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary/70 hover:text-primary transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Tag
            </button>
          </div>

          {/* Current tags */}
          <div className="flex flex-wrap gap-2 mb-2">
            {userTags.length === 0 && (
              <span className="text-[10px] text-white/20 font-mono italic">No tags yet</span>
            )}
            {userTags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/30 text-primary text-xs font-mono group"
              >
                <Link
                  to={`/tag/${encodeURIComponent(tag)}`}
                  className="hover:underline"
                  onClick={() => setShowTagPanel(false)}
                >
                  {tag}
                </Link>
                <button
                  onClick={() => removeTag(tag)}
                  className="text-primary/40 hover:text-red-400 transition-colors ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Tag input panel */}
          <AnimatePresence>
            {showTagPanel && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="bg-[#12121A] border border-white/15 p-4 mt-2 space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
              >
                {/* Input */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-2">
                    Add Tag <span className="text-white/30 normal-case tracking-normal font-normal">(Enter to add)</span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30" />
                    <input
                      autoFocus
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="e.g. isekai, romance..."
                      className="w-full bg-white/5 border border-white/10 focus:border-primary/50 pl-8 pr-3 py-2 text-xs font-mono transition-colors placeholder:text-white/20 outline-none"
                    />
                  </div>

                  {/* Autocomplete from user's previous tags */}
                  {tagInput && suggestedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {suggestedTags.slice(0, 8).map(t => (
                        <button
                          key={t}
                          onClick={() => addTag(t)}
                          className="px-2 py-0.5 text-[10px] font-mono bg-white/5 border border-white/10 hover:border-primary/40 hover:text-primary text-white/50 transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags I've used before */}
                {allUserTags.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Tags I used before</p>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {allUserTags.map(t => {
                        const isAdded = userTags.includes(t);
                        return (
                          <button
                            key={t}
                            onClick={() => isAdded ? removeTag(t) : addTag(t)}
                            className={`px-2.5 py-1 text-[10px] font-mono border transition-all ${
                              isAdded
                                ? 'bg-primary/20 border-primary/50 text-primary'
                                : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white bg-white/[0.03]'
                            }`}
                          >
                            {isAdded && <Check className="w-2.5 h-2.5 inline mr-1" />}
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Popular tags for this manga */}
                {popularTags.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Popular tags for this manga</p>
                    <div className="flex flex-wrap gap-1.5">
                      {popularTags.filter(t => !userTags.includes(t)).map(t => (
                        <button
                          key={t}
                          onClick={() => addTag(t)}
                          className="px-2.5 py-1 text-[10px] font-mono border border-white/10 text-white/50 hover:border-primary/40 hover:text-primary bg-white/[0.03] transition-colors"
                        >
                          + {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
