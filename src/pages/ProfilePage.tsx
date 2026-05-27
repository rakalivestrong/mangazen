import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera, Pencil, Check, X, Tag, BookOpen, BookCheck, BookMarked,
  Clock, LogOut, Star, Hash, ChevronRight, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/Avatar';
import { MangaCard } from '../components/MangaCard';
import { StorageService, ReadingHistory, Bookmark } from '../lib/storage';
import { TagService } from '../lib/tags';
import { MangaDexService, Manga } from '../lib/api';

type LibTab = 'reading' | 'already_read' | 'want_to_read' | 'history' | 'tags';

const TAB_META: { id: LibTab; label: string; icon: React.ReactNode }[] = [
  { id: 'reading',       label: 'Reading',        icon: <BookOpen  className="w-4 h-4" /> },
  { id: 'already_read',  label: 'Already Read',   icon: <BookCheck className="w-4 h-4" /> },
  { id: 'want_to_read',  label: 'Want to Read',   icon: <BookMarked className="w-4 h-4" /> },
  { id: 'history',       label: 'History',        icon: <Clock     className="w-4 h-4" /> },
  { id: 'tags',          label: 'My Tags',        icon: <Tag       className="w-4 h-4" /> },
];

/* ─────────────────────── Helpers ───────────────────────────────── */
function timeAgo(ts: number) {
  const d = Date.now() - ts;
  const mins = Math.floor(d / 60000);
  if (mins < 60) return `${mins || 1}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─────────────────────── Profile Page ─────────────────────────── */
export default function ProfilePage() {
  const { user, isLoggedIn, logout, updateAvatarPhoto, removeAvatarPhoto, updateBio, updateUsername } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<LibTab>('reading');

  // Edit states
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [editError, setEditError] = useState('');

  // Library data
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const [readingMangas, setReadingMangas] = useState<Manga[]>([]);
  const [alreadyReadMangas, setAlreadyReadMangas] = useState<Manga[]>([]);
  const [wantMangas, setWantMangas] = useState<Manga[]>([]);
  const [userTags, setUserTags] = useState<{ tag: string; count: number }[]>([]);
  const [loadingLib, setLoadingLib] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) navigate('/auth');
  }, [isLoggedIn]);

  // Load library data
  useEffect(() => {
    if (!user) return;
    loadLibraryData();
  }, [user]);

  async function loadLibraryData() {
    setLoadingLib(true);
    try {
      // History from StorageService (already has manga data)
      const h = Object.values(StorageService.getReadingHistory())
        .sort((a, b) => b.timestamp - a.timestamp);
      setHistory(h);

      // Old bookmark system
      const bookmarks = Object.values(StorageService.getBookmarks())
        .sort((a, b) => b.addedAt - a.addedAt);

      // New tag system — reading status
      // Collect all mangaIds with statuses
      const allTagData = getAllStatusMangas();

      // Fetch manga details for each status group (limit 12 each)
      const [readingDetails, alreadyDetails, wantDetails] = await Promise.all([
        fetchMangaDetails(allTagData.reading.slice(0, 12)),
        fetchMangaDetails(allTagData.already_read.slice(0, 12)),
        fetchMangaDetails(allTagData.want_to_read.slice(0, 12)),
      ]);

      setReadingMangas(readingDetails);
      setAlreadyReadMangas(alreadyDetails);
      setWantMangas(wantDetails);

      // Tags
      const topTags = TagService.getTopTags(50);
      setUserTags(topTags);
    } catch (e) {
      console.error('Profile load error:', e);
    } finally {
      setLoadingLib(false);
    }
  }

  function getAllStatusMangas() {
    // Read from the tag status storage directly
    const data = localStorage.getItem('mangazen_read_status');
    if (!data) return { reading: [], already_read: [], want_to_read: [] };
    const store: Record<string, string> = JSON.parse(data);
    const result = { reading: [] as string[], already_read: [] as string[], want_to_read: [] as string[] };
    for (const [mangaId, status] of Object.entries(store)) {
      if (status === 'reading') result.reading.push(mangaId);
      else if (status === 'already_read') result.already_read.push(mangaId);
      else if (status === 'want_to_read') result.want_to_read.push(mangaId);
    }
    return result;
  }

  async function fetchMangaDetails(ids: string[]): Promise<Manga[]> {
    if (!ids.length) return [];
    const results = await Promise.allSettled(ids.map(id => MangaDexService.getMangaDetails(id)));
    return results
      .filter((r): r is PromiseFulfilledResult<Manga> => r.status === 'fulfilled')
      .map(r => r.value);
  }

  /* ── Avatar upload ─────────────────────────────────────────────── */
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran foto maksimal 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateAvatarPhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  /* ── Username edit ──────────────────────────────────────────────── */
  const startEditUsername = () => {
    setUsernameInput(user?.username || '');
    setEditError('');
    setEditingUsername(true);
  };

  const saveUsername = () => {
    const result = updateUsername(usernameInput.trim());
    if (!result.success) {
      setEditError(result.error || 'Gagal update username');
    } else {
      setEditingUsername(false);
      setEditError('');
    }
  };

  /* ── Bio edit ───────────────────────────────────────────────────── */
  const startEditBio = () => {
    setBioInput(user?.bio || '');
    setEditError('');
    setEditingBio(true);
  };

  const saveBio = () => {
    updateBio(bioInput);
    setEditingBio(false);
    setEditError('');
  };

  if (!user) return null;

  const joinDate = new Date(user.createdAt).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const tabCount: Record<LibTab, number> = {
    reading: readingMangas.length,
    already_read: alreadyReadMangas.length,
    want_to_read: wantMangas.length,
    history: history.length,
    tags: userTags.length,
  };

  return (
    <div className="min-h-screen pt-24 pb-24">
      {/* ── Hero banner ───────────────────────────────────────────── */}
      <div className="relative h-40 md:h-56 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-canvas to-canvas" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              #BCFF00 0px, #BCFF00 1px,
              transparent 1px, transparent 40px
            )`,
          }}
        />
        {/* Logout button top-right */}
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-red-400/70 hover:text-red-400 transition-colors border border-red-400/20 hover:border-red-400/50 px-3 py-1.5"
        >
          <LogOut className="w-3 h-3" />
          Logout
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* ── Profile card ──────────────────────────────────────── */}
        <div className="relative -mt-16 md:-mt-20 mb-10">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            {/* Avatar with camera button */}
            <div className="relative shrink-0 w-fit">
              <Avatar user={user} size="xl" className="border-4 border-canvas shadow-xl" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                title="Ganti foto profil"
              >
                <Camera className="w-4 h-4" />
              </button>
              {user.avatarPhoto && (
                <button
                  onClick={() => removeAvatarPhoto()}
                  className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg text-[10px]"
                  title="Hapus foto"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {/* User info */}
            <div className="flex-1 pb-1 space-y-2">
              {/* Username */}
              {editingUsername ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    autoFocus
                    value={usernameInput}
                    onChange={e => setUsernameInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveUsername()}
                    className="bg-white/5 border border-primary/50 px-3 py-1.5 text-2xl font-black uppercase italic tracking-tight outline-none w-48"
                  />
                  <button onClick={saveUsername} className="p-1.5 bg-primary text-black hover:bg-white transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditingUsername(false); setEditError(''); }} className="p-1.5 border border-white/20 hover:border-white/50 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  {editError && <p className="text-xs text-red-400 w-full">{editError}</p>}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tight leading-none">
                    {user.username}
                  </h1>
                  <button onClick={startEditUsername} className="text-white/30 hover:text-primary transition-colors mt-1">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Email */}
              <p className="text-xs text-white/30 font-mono">{user.email}</p>

              {/* Bio */}
              {editingBio ? (
                <div className="space-y-1">
                  <textarea
                    autoFocus
                    value={bioInput}
                    onChange={e => setBioInput(e.target.value)}
                    maxLength={200}
                    rows={2}
                    placeholder="Tulis bio singkat kamu..."
                    className="w-full max-w-md bg-white/5 border border-primary/50 px-3 py-2 text-sm font-mono resize-none outline-none placeholder:text-white/20"
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={saveBio} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-black text-xs font-black uppercase tracking-widest hover:bg-white transition-colors">
                      <Check className="w-3 h-3" /> Save
                    </button>
                    <button onClick={() => setEditingBio(false)} className="px-3 py-1.5 border border-white/20 text-xs font-black uppercase tracking-widest hover:border-white/50 transition-colors">
                      Cancel
                    </button>
                    <span className="text-[10px] text-white/20 font-mono">{bioInput.length}/200</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p className="text-sm text-white/50 max-w-md">
                    {user.bio || <span className="italic text-white/20">No bio yet...</span>}
                  </p>
                  <button onClick={startEditBio} className="text-white/20 hover:text-primary transition-colors shrink-0 mt-0.5">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <p className="text-[10px] text-white/20 font-mono">Member sejak {joinDate}</p>
            </div>
          </div>
        </div>

        {/* ── Stats strip ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10 mb-10">
          {[
            { label: 'Reading',     val: tabCount.reading },
            { label: 'Completed',   val: tabCount.already_read },
            { label: 'Want to Read',val: tabCount.want_to_read },
            { label: 'My Tags',     val: tabCount.tags },
          ].map(s => (
            <div key={s.label} className="bg-surface p-4 text-center">
              <p className="text-2xl md:text-3xl font-black text-primary">{s.val}</p>
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 font-black mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tab nav ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-px bg-white/5 border border-white/10 mb-8 overflow-hidden">
          {TAB_META.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-wider transition-all flex-1 min-w-fit justify-center ${
                activeTab === tab.id
                  ? 'bg-primary text-black'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tabCount[tab.id] > 0 && (
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-black/20' : 'bg-white/10'
                }`}>
                  {tabCount[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ───────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {loadingLib ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-surface animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <>
                {/* ── READING ── */}
                {activeTab === 'reading' && (
                  <MangaGrid mangas={readingMangas} emptyMsg="Belum ada manga yang sedang dibaca." />
                )}

                {/* ── ALREADY READ ── */}
                {activeTab === 'already_read' && (
                  <MangaGrid mangas={alreadyReadMangas} emptyMsg="Belum ada manga yang sudah selesai dibaca." />
                )}

                {/* ── WANT TO READ ── */}
                {activeTab === 'want_to_read' && (
                  <MangaGrid mangas={wantMangas} emptyMsg="Belum ada manga di daftar ingin baca." />
                )}

                {/* ── HISTORY ── */}
                {activeTab === 'history' && (
                  history.length === 0 ? (
                    <EmptyState msg="Belum ada riwayat baca." />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {history.map(item => (
                        <div key={item.manga.id} className="relative group">
                          <MangaCard manga={item.manga} />
                          <Link
                            to={`/read/${item.lastChapterId}`}
                            className="absolute top-2 left-2 right-2 bg-black/90 border border-primary px-2 py-1.5 text-center text-[9px] font-black uppercase font-mono text-primary shadow-[0_0_10px_rgba(188,255,0,0.4)] hover:bg-primary hover:text-black transition-colors z-20 opacity-0 group-hover:opacity-100"
                          >
                            RESUME CH.{item.lastChapterNum}
                          </Link>
                          <p className="mt-1 text-[9px] font-mono text-white/30 text-center">
                            {timeAgo(item.timestamp)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* ── MY TAGS ── */}
                {activeTab === 'tags' && (
                  userTags.length === 0 ? (
                    <EmptyState msg="Belum ada tag yang dibuat. Tambahkan tag di halaman detail manga." />
                  ) : (
                    <div>
                      <div className="flex flex-wrap gap-3">
                        {userTags.map(({ tag, count }) => (
                          <Link
                            key={tag}
                            to={`/tag/${encodeURIComponent(tag)}`}
                            className="group flex items-center gap-2 px-4 py-2.5 border border-white/10 bg-white/[0.03] hover:border-primary/50 hover:bg-primary/5 transition-all"
                          >
                            <Hash className="w-3.5 h-3.5 text-primary/50 group-hover:text-primary transition-colors" />
                            <span className="text-sm font-mono text-white/70 group-hover:text-white transition-colors">{tag}</span>
                            <span className="text-[10px] font-mono text-white/20 bg-white/5 px-1.5 py-0.5">{count}</span>
                            <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-primary transition-colors ml-1" />
                          </Link>
                        ))}
                      </div>
                      <p className="mt-6 text-[10px] text-white/20 font-mono">
                        Klik tag untuk lihat semua manga dengan tag tersebut.
                      </p>
                    </div>
                  )
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─────────────────────── Sub-components ────────────────────────── */
function MangaGrid({ mangas, emptyMsg }: { mangas: Manga[]; emptyMsg: string }) {
  if (mangas.length === 0) return <EmptyState msg={emptyMsg} />;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {mangas.map((manga, i) => (
        <motion.div
          key={manga.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <MangaCard manga={manga} />
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="py-24 text-center">
      <AlertCircle className="w-10 h-10 text-white/10 mx-auto mb-4" />
      <p className="text-sm font-mono text-white/30 uppercase tracking-widest">{msg}</p>
    </div>
  );
}
