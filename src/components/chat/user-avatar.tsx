'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type UserAvatarProps = {
  src?: string | null;
  name?: string | null;
  online?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
};

function initials(name?: string | null) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function ProfileAvatar({
  src,
  name,
  className,
}: {
  src?: string | null;
  name?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      {src ? <AvatarImage src={src} alt={name ?? 'User'} /> : null}
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

export function UserAvatar({ src, name, online, size = 'default', className }: UserAvatarProps) {
  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <Avatar size={size}>
        {src ? <AvatarImage src={src} alt={name ?? 'User'} /> : null}
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      {online !== undefined ? (
        <span
          aria-hidden
          className={cn(
            'absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-background transition-colors duration-200',
            online ? 'bg-emerald-500' : 'bg-muted-foreground/40',
          )}
        />
      ) : null}
    </div>
  );
}
