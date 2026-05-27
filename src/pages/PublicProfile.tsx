import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthService, User } from '../lib/auth';
import { Avatar } from '../components/Avatar';
import { User as UserIcon, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (id) {
      setUser(AuthService.getUserById(id));
    }
  }, [id]);

  if (!user) {
    return (
      <div className="pt-32 text-center font-mono opacity-50 uppercase tracking-widest text-sm italic">
        UNRECOVERABLE_ERROR: USER_NOT_FOUND
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-white/10 p-8 flex flex-col md:flex-row items-center md:items-start gap-8"
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

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 border border-white/10 p-8 text-center bg-white/[0.02]"
      >
        <BookOpen className="w-8 h-8 text-white/20 mx-auto mb-4" />
        <h2 className="text-xl font-black uppercase italic tracking-widest mb-2">Collection Hidden</h2>
        <p className="text-xs font-mono text-white/40">
          This user's reading lists and tags are currently private or synced locally.
        </p>
      </motion.div>
    </div>
  );
}
