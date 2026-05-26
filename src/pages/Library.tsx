import { useState, useEffect } from 'react';
import { StorageService, Bookmark, ReadingHistory } from '../lib/storage';
import { MangaCard } from '../components/MangaCard';
import { Link } from 'react-router-dom';

export default function Library() {
  const [activeTab, setActiveTab] = useState<'history' | 'favorite' | 'plan_to_read'>('history');
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const [favorites, setFavorites] = useState<Bookmark[]>([]);
  const [planToRead, setPlanToRead] = useState<Bookmark[]>([]);

  useEffect(() => {
    const h = Object.values(StorageService.getReadingHistory()).sort((a, b) => b.timestamp - a.timestamp);
    setHistory(h);

    const b = Object.values(StorageService.getBookmarks()).sort((a, b) => b.addedAt - a.addedAt);
    setFavorites(b.filter(x => x.status === 'favorite'));
    setPlanToRead(b.filter(x => x.status === 'plan_to_read'));
  }, []);

  return (
    <div className="pt-32 pb-40 px-6 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic mb-12">
        MY LIBRARY
      </h1>

      <div className="flex flex-wrap gap-4 mb-12 border-b border-white/10 pb-4">
        {['history', 'favorite', 'plan_to_read'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2 uppercase font-mono text-xs tracking-widest transition-colors ${
              activeTab === tab ? 'bg-primary text-black font-black' : 'text-white/50 hover:text-white border border-white/10'
            }`}
          >
            {tab.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {activeTab === 'history' && history.length === 0 && (
          <div className="col-span-full py-20 text-center font-mono opacity-50 uppercase text-xs">NO HISTORY FRAGMENTS FOUND.</div>
        )}
        {activeTab === 'history' && history.map((item) => (
          <div key={item.manga.id} className="relative group flex flex-col h-full">
            <div className="flex-1">
              <MangaCard manga={item.manga} />
            </div>
            <Link 
              to={`/read/${item.lastChapterId}`}
              className="absolute top-2 left-2 right-2 bg-black/90 border border-primary p-2 text-center text-[10px] font-black uppercase font-mono text-primary shadow-[0_0_10px_rgba(188,255,0,0.5)] hover:bg-primary hover:text-black transition-colors z-20"
            >
              RESUME CH.{item.lastChapterNum}
            </Link>
          </div>
        ))}

        {activeTab === 'favorite' && favorites.length === 0 && (
          <div className="col-span-full py-20 text-center font-mono opacity-50 uppercase text-xs">NO FAVORITES FOUND.</div>
        )}
        {activeTab === 'favorite' && favorites.map((item) => (
          <MangaCard key={item.manga.id} manga={item.manga} />
        ))}

        {activeTab === 'plan_to_read' && planToRead.length === 0 && (
          <div className="col-span-full py-20 text-center font-mono opacity-50 uppercase text-xs">NO PLAN TO READ FOUND.</div>
        )}
        {activeTab === 'plan_to_read' && planToRead.map((item) => (
          <MangaCard key={item.manga.id} manga={item.manga} />
        ))}
      </div>
    </div>
  );
}
