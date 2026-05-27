import { User } from '../lib/auth';

interface AvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

export function Avatar({ user, size = 'md', className = '' }: AvatarProps) {
  const sizeClass = SIZES[size];

  if (user.avatarPhoto) {
    return (
      <div
        className={`${sizeClass} rounded-full overflow-hidden shrink-0 ${className}`}
      >
        <img
          src={user.avatarPhoto}
          alt={user.username}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center shrink-0 font-black text-black ${className}`}
      style={{ backgroundColor: user.avatar }}
    >
      {user.username[0].toUpperCase()}
    </div>
  );
}
