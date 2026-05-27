/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import Home from './pages/Home';
import MangaDetail from './pages/MangaDetail';
import ReaderPage from './pages/ReaderPage';
import Library from './pages/Library';
import AuthPage from './pages/AuthPage';
import TagPage from './pages/TagPage';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-canvas text-ink">
          <Routes>
            {/* Reader page has no navbar for better immersion */}
            <Route path="/read/:chapterId" element={<ReaderPage />} />
            {/* Auth page — standalone, no navbar */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="*" element={<MainLayout />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

function MainLayout() {
  return (
    <>
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/manga/:id" element={<MangaDetail />} />
          <Route path="/library" element={<Library />} />
          <Route path="/tag/:tagName" element={<TagPage />} />
        </Routes>
      </main>
      
      <footer className="h-10 bg-primary flex items-center px-8 justify-between text-[10px] font-black text-black uppercase tracking-[0.3em]">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-black animate-pulse" />
          <span>Synchronizing with MangaDex Global Cluster</span>
        </div>
        <div className="hidden md:flex gap-8">
          <span>Session: <span className="opacity-50">Active</span></span>
          <span>Region: <span className="opacity-50">SEA-01</span></span>
          <span>Latency: <span className="opacity-50">42ms</span></span>
          <span className="font-mono">V.05.00</span>
        </div>
      </footer>
    </>
  );
}
