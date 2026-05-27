import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthService, User } from '../lib/auth';
import { TagService } from '../lib/tags';
import { MangaDexService, Manga } from '../lib/api';
import { Avatar } from '../components/Avatar';
import { MangaCard } from '../components/MangaCard';
import { BookOpen, BookCheck, BookMarked, Tag, Hash, ChevronRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type LibTab = 'reading' | 'already_read' | 'want_to_read' | 'tags';

const TAB_META: { id: LibTab; label: string; icon: React.ReactNode }[] = [
  { id: 'reading',       label: 'Reading',        icon: <BookOpen  className="w-4 h-4" /> },
  { id: 'already_read',  label: 'Already Read',   icon: <BookCheck className="w-4 h-4" /> },
  { id: 'want_to_read',  label: 'Want to Read',   icon: <BookMarked className="w-4 h-4" /> },
  { id: 'tags',          label: 'Tags',           icon: <Tag       className="w-4 h-4" /> },
];

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [activeTab, setActiveTab] = useState<LibTab>('reading');
  const [loadingLib, setLoadingLib] = useState(false);
  const [readingMangas, setReadingMangas] = useState<Manga[]>([]);
  const [alreadyReadMangas, setAlreadyReadMangas] = useState<Manga[]>([]);
  const [wantMangas, setWantMangas] = useState<Manga[]>([]);
  const [userTags, setUserTags] = useState<{ tag: string; count: number }[]>([]);

  useEffect(() => {
    let mounted = true;
    if (id) {
      AuthService.getUserById(id).then(u => {
        if (mounted) {
          setUser(u);
          setLoadingUser(false);
          if (u) loadLibraryData(u.id);
        }
      });
    }
    return () => { mounted = false; };
  }, [id]);

  async function loadLibraryData(userId: string) {
    setLoadingLib(true);
    try {
      const library = await TagService.getUserLibrary(userId);
      const allTagData = { reading: [] as string[], already_read: [] as string[], want_to_read: [] as string[] };
      for (const item of library) {
        if (item.status === 'reading') allTagData.reading.push(item.mangaId);
        else if (item.status === 'already_read') allTagData.already_read.push(item.mangaId);
        else if (item.status === 'want_to_read') allTagData.want_to_read.push(item.mangaId);
      }

      const [readingDetails, alreadyDetails, wantDetails] = await Promise.all([
        fetchMangaDetails(allTagData.reading.slice(0, 12)),
        fetchMangaDetails(allTagData.already_read.slice(0, 12)),
        fetchMangaDetails(allTagData.want_to_read.slice(0, 12)),
      ]);

      setReadingMangas(readingDetails);
      setAlreadyReadMangas(alreadyDetails);
      setWantMangas(wantDetails);

      const userTagsList = await TagService.getUserTags(userId);
      setUserTags(userTagsList.slice(0, 50));
    } catch (e) {
      console.error('Failed to load user library:', e);
    } finally {
      setLoadingLib(false);
    }
  }

  async function fetchMangaDetails(ids: string[]): Promise<Manga[]> {
    if (!ids.length) return [];
    const results = await Promise.allSettled(ids.map(mId => MangaDexService.getMangaDetails(mId)));
    return results
      .filter((r): r is PromiseFulfilledResult<Manga> => r.status === 'fulfilled')
      .map(r => r.value);
  }

  if (loadingUser) {
    return (
      <div className="pt-32 text-center font-mono opacity-50 uppercase tracking-widest text-sm italic">
        LOADING_USER_DATA...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-32 text-center font-mono opacity-50 uppercase tracking-widest text-sm italic">
        UNRECOVERABLE_ERROR: USER_NOT_FOUND
      </div>
    );
  }

  const tabCount: Record<LibTab, number> = {
    reading: readingMangas.length,
    already_read: alreadyReadMangas.length,
    want_to_read: wantMangas.length,
    tags: userTags.length,
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 md:px-6 max-w-6xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-white/10 p-8 flex flex-col md:flex-row items-center md:items-start gap-8 mb-10"
      >
        <Avatar user={user} size="xl" />
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl font-black uppercase italic tracking-widest text-primary mb-2">
            {user.username}
          </h1>
          <p className="text-white/40 font-mono text-sm mb-6">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </p>
          
          <div className="bg-white/5 border border-white/10 p-4 inline-block min-w-[250px] text-left mb-6">
            <p className="text-[10px] uppercase font-black tracking-widest text-primary/80 mb-2">Biography</p>
            <p className="text-sm font-mono text-white/80 whitespace-pre-wrap">
              {user.bio || 'This user has not set a bio yet.'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
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

      {/* Content */}
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
              {activeTab === 'reading' && (
                <MangaGrid mangas={readingMangas} emptyMsg="Belum ada manga yang sedang dibaca." />
              )}
              {activeTab === 'already_read' && (
                <MangaGrid mangas={alreadyReadMangas} emptyMsg="Belum ada manga yang sudah selesai dibaca." />
              )}
              {activeTab === 'want_to_read' && (
                <MangaGrid mangas={wantMangas} emptyMsg="Belum ada manga di daftar ingin baca." />
              )}
              {activeTab === 'tags' && (
                userTags.length === 0 ? (
                  <EmptyState msg="User ini belum membuat tag apa pun." />
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
                  </div>
                )
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

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
