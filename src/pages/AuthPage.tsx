import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, User, Mail, Lock, ArrowLeft, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Tab = 'signin' | 'signup';

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, register } = useAuth();

  // Sign in fields
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');

  // Sign up fields
  const [suUsername, setSuUsername] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400)); // fake async feel
    const result = login(siEmail, siPassword);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Login gagal.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const result = register(suUsername, suEmail, suPassword);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Registrasi gagal.');
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      {/* Back button */}
      <Link
        to="/"
        className="fixed top-6 left-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-surface border border-white/10 p-8 md:p-10 relative overflow-hidden">
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" fill="black" />
            </div>
            <span className="font-black text-xl uppercase italic tracking-tight">
              Manga<span className="text-primary font-normal">Zen</span>
            </span>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-px mb-8 bg-white/5 p-0.5">
            {(['signin', 'signup'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                  tab === t
                    ? 'bg-primary text-black'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'signin' ? (
              <motion.form
                key="signin"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignIn}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="email"
                      required
                      value={siEmail}
                      onChange={e => setSiEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-white/5 border border-white/10 focus:border-primary/50 pl-10 pr-4 py-3 text-sm font-mono transition-colors placeholder:text-white/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={siPassword}
                      onChange={e => setSiPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 focus:border-primary/50 pl-10 pr-10 py-3 text-sm font-mono transition-colors placeholder:text-white/20 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 font-mono bg-red-400/10 border border-red-400/20 px-3 py-2"
                  >
                    ⚠ {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-black py-3 font-black uppercase tracking-widest text-xs hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Authenticating...
                    </span>
                  ) : 'Sign In'}
                </button>

                <p className="text-center text-xs text-white/30 pt-2">
                  Belum punya akun?{' '}
                  <button type="button" onClick={() => { setTab('signup'); setError(''); }} className="text-primary hover:underline">
                    Sign Up
                  </button>
                </p>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignUp}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-2">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="text"
                      required
                      value={suUsername}
                      onChange={e => setSuUsername(e.target.value)}
                      placeholder="mangareader99"
                      minLength={3}
                      className="w-full bg-white/5 border border-white/10 focus:border-primary/50 pl-10 pr-4 py-3 text-sm font-mono transition-colors placeholder:text-white/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="email"
                      required
                      value={suEmail}
                      onChange={e => setSuEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-white/5 border border-white/10 focus:border-primary/50 pl-10 pr-4 py-3 text-sm font-mono transition-colors placeholder:text-white/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={suPassword}
                      onChange={e => setSuPassword(e.target.value)}
                      placeholder="min. 6 karakter"
                      minLength={6}
                      className="w-full bg-white/5 border border-white/10 focus:border-primary/50 pl-10 pr-10 py-3 text-sm font-mono transition-colors placeholder:text-white/20 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 font-mono bg-red-400/10 border border-red-400/20 px-3 py-2"
                  >
                    ⚠ {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-black py-3 font-black uppercase tracking-widest text-xs hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Creating Account...
                    </span>
                  ) : 'Create Account'}
                </button>

                <p className="text-center text-xs text-white/30 pt-2">
                  Sudah punya akun?{' '}
                  <button type="button" onClick={() => { setTab('signin'); setError(''); }} className="text-primary hover:underline">
                    Sign In
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center text-[9px] text-white/20 mt-8 font-mono uppercase tracking-widest">
            Data disimpan secara lokal di browser lo
          </p>
        </div>
      </motion.div>
    </div>
  );
}
