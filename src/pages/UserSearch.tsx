import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, User as UserIcon } from 'lucide-react';
import { AuthService, User } from '../lib/auth';
import { Avatar } from '../components/Avatar';
import { motion } from 'motion/react';

export default function UserSearch() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    AuthService.getAllUsersPublic().then(data => {
      if (mounted) setUsers(data);
    });
    return () => { mounted = false; };
  }, []);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black uppercase tracking-widest text-primary italic mb-2">User Search</h1>
        <p className="text-white/40 text-sm font-mono">Find other registered users</p>
      </div>

      <div className="relative mb-12 max-w-xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by username..."
          className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredUsers.map((user, idx) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Link
              to={`/user/${user.id}`}
              className="flex items-center gap-4 p-4 bg-surface border border-white/10 hover:border-primary/50 group transition-all"
            >
              <Avatar user={user} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate group-hover:text-primary transition-colors">{user.username}</p>
                <p className="text-[10px] text-white/40 font-mono truncate">{user.bio || 'No bio'}</p>
              </div>
            </Link>
          </motion.div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="col-span-full py-20 text-center border border-dashed border-white/10 bg-white/[0.02]">
            <UserIcon className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="font-mono text-xs text-white/40 uppercase tracking-widest">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
