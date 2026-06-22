'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
  AnimatePresence,
} from 'framer-motion';
import {
  Camera,
  User,
  Heart,
  Coffee,
  BookOpen,
  UserPlus,
  Bell,
  Sparkles,
  ChevronRight,
  Check,
  PartyPopper,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from '@/i18n/navigation';
import { Confetti } from '@/components/onboarding/confetti';

type ChecklistItem = {
  id: string;
  icon: React.ReactNode;
  labelKey: string;
  rewardLabel: string;
  href: string;
  completed: boolean;
};

function ProgressRing({ percent, size = 80, stroke = 6 }: { percent: number; size?: number; stroke?: number }) {
  const reduce = useReducedMotion();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-muted/50"
      />
      <m.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#ring-gradient)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={reduce ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={reduce ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
      <defs>
        <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="#f0b860" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function OnboardingChecklist({
  profileData,
  locale,
}: {
  profileData: {
    avatarUrl?: string;
    name?: string;
    bio?: string;
    postsCount: number;
    followersCount: number;
  };
  locale: string;
}) {
  const t = useTranslations('profile');
  const router = useRouter();
  const reduce = useReducedMotion();
  const [expanded, setExpanded] = useState(true);

  const items: ChecklistItem[] = useMemo(
    () => [
      {
        id: 'photo',
        icon: <Camera className="size-4" />,
        labelKey: 'checklistPhoto',
        rewardLabel: '+10 ☕',
        href: '/settings/account',
        completed: !!profileData.avatarUrl,
      },
      {
        id: 'name',
        icon: <User className="size-4" />,
        labelKey: 'checklistName',
        rewardLabel: '+10 ☕',
        href: '/settings/account',
        completed: !!profileData.name && profileData.name.length > 1,
      },
      {
        id: 'bio',
        icon: <BookOpen className="size-4" />,
        labelKey: 'checklistBio',
        rewardLabel: '+15 ☕',
        href: '/settings/account',
        completed: !!profileData.bio && profileData.bio.length > 5,
      },
      {
        id: 'interests',
        icon: <Heart className="size-4" />,
        labelKey: 'checklistInterests',
        rewardLabel: '+20 ☕',
        href: '/onboarding?step=interests',
        completed: false,
      },
      {
        id: 'firstBean',
        icon: <Coffee className="size-4" />,
        labelKey: 'checklistFirstBean',
        rewardLabel: '+25 ☕',
        href: '/create',
        completed: profileData.postsCount > 0,
      },
      {
        id: 'follow',
        icon: <UserPlus className="size-4" />,
        labelKey: 'checklistFollow',
        rewardLabel: '+15 ☕',
        href: '/discover',
        completed: profileData.followersCount > 0,
      },
      {
        id: 'notifications',
        icon: <Bell className="size-4" />,
        labelKey: 'checklistNotifications',
        rewardLabel: '+10 ☕',
        href: '/settings',
        completed: false,
      },
      {
        id: 'explore',
        icon: <Sparkles className="size-4" />,
        labelKey: 'checklistExplore',
        rewardLabel: '+5 ☕',
        href: '/feed',
        completed: false,
      },
    ],
    [profileData],
  );

  const completedCount = items.filter((i) => i.completed).length;
  const total = items.length;
  const percent = Math.round((completedCount / total) * 100);
  const allDone = completedCount === total;

  const handleTap = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router],
  );

  if (allDone) {
    return (
      <m.div
        initial={reduce ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mx-4 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-amber-500/10 p-5"
      >
        <Confetti count={60} />
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25">
            <PartyPopper className="size-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{t('checklistComplete')}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('checklistCompleteDesc')}</p>
          </div>
        </div>
      </m.div>
    );
  }

  return (
    <m.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-4 overflow-hidden rounded-2xl border border-border bg-card"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-4 p-4 text-left"
      >
        <div className="relative">
          <ProgressRing percent={percent} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold leading-none">{completedCount}</span>
            <span className="text-[10px] text-muted-foreground">/{total}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{t('checklistTitle')}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('checklistSubtitle')}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <m.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-amber-500"
              initial={reduce ? { width: `${percent}%` } : { width: '0%' }}
              animate={{ width: `${percent}%` }}
              transition={reduce ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
        <ChevronRight
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
            expanded && 'rotate-90',
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <m.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 pb-3">
              {items.map((item, i) => (
                <m.button
                  key={item.id}
                  type="button"
                  onClick={() => handleTap(item.href)}
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors active:bg-muted/50',
                    item.completed && 'opacity-60',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full transition-colors',
                      item.completed
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {item.completed ? (
                      <Check className="size-4" strokeWidth={2.5} />
                    ) : (
                      item.icon
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        item.completed && 'line-through text-muted-foreground',
                      )}
                    >
                      {t(item.labelKey as keyof typeof t)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    {item.rewardLabel}
                  </span>
                </m.button>
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}
