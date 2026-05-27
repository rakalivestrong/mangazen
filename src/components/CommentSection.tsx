import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Trash2, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CommentService, Comment } from '../lib/comments';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';

interface Props {
  chapterId: string;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  return `${days} hari lalu`;
}

export function CommentSection({ chapterId }: Props) {
  const { user, isLoggedIn } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setComments(CommentService.getComments(chapterId));
  }, [chapterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setSubmitting(true);

    await new Promise(r => setTimeout(r, 200));

    const newComment = CommentService.addComment(
      chapterId,
      user.id,
      user.username,
      user.avatar,
      text
    );

    setComments(prev => [newComment, ...prev]);
    setText('');
    setSubmitting(false);
  };

  const handleDelete = (commentId: string) => {
    if (!user) return;
    const ok = CommentService.deleteComment(chapterId, commentId, user.id);
    if (ok) setComments(prev => prev.filter(c => c.id !== commentId));
  };

  return (
    <section className="w-full max-w-3xl mx-auto px-4 md:px-6 py-16 border-t border-white/10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-ink/80">
          Komentar
        </h3>
        <span className="text-[10px] font-mono text-white/30 bg-white/5 border border-white/10 px-2 py-0.5">
          {comments.length}
        </span>
      </div>

      {/* Input area */}
      {isLoggedIn && user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex items-start gap-3">
            <Avatar user={user} size="sm" className="mt-0.5" />
            <div className="flex-1">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Tulis komentar kamu..."
                rows={3}
                maxLength={500}
                className="w-full bg-white/5 border border-white/10 focus:border-primary/40 px-4 py-3 text-sm font-mono resize-none transition-colors placeholder:text-white/20 outline-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-white/20 font-mono">{text.length}/500</span>
                <button
                  type="submit"
                  disabled={!text.trim() || submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-xs font-black uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  Kirim
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-white/5 border border-white/10 flex items-center justify-between">
          <p className="text-sm text-white/40 font-mono">
            Login untuk meninggalkan komentar
          </p>
          <Link
            to="/auth"
            className="flex items-center gap-2 px-4 py-2 border border-primary text-primary text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-colors"
          >
            <LogIn className="w-3 h-3" />
            Sign In
          </Link>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {comments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-white/20 font-mono text-xs uppercase tracking-widest"
            >
              Belum ada komentar. Jadilah yang pertama!
            </motion.div>
          ) : (
            comments.map(comment => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-3 group"
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-black font-black text-sm"
                  style={{ backgroundColor: comment.avatarColor }}
                >
                  {comment.username[0].toUpperCase()}
                </div>

                <div className="flex-1 bg-white/[0.03] border border-white/5 px-4 py-3 group-hover:border-white/10 transition-colors">
                  <div className="flex items-baseline justify-between mb-1.5 gap-2 flex-wrap">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-black text-ink">{comment.username}</span>
                      <span className="text-[9px] font-mono text-white/30">{timeAgo(comment.createdAt)}</span>
                    </div>
                    {user?.id === comment.userId && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="Hapus komentar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed break-words whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
