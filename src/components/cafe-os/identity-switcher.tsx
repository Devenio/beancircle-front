'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useRouter } from '@/i18n/navigation';
import { cafeOsApi } from '@/lib/api/cafe-os';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useIdentityStore } from '@/stores/identity-store';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Plus, Store, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

/** Keeps the identity store in sync with the user's cafes. */
export function useSyncIdentity() {
  const user = useAuthStore((s) => s.user);
  const setCafes = useIdentityStore((s) => s.setCafes);
  const { data } = useQuery({
    queryKey: ['my-cafes'],
    queryFn: cafeOsApi.myCafes,
    enabled: !!user,
    staleTime: 60_000,
  });
  useEffect(() => {
    if (data) {
      setCafes(
        data.map((c) => ({
          cafeId: c.cafe.id,
          name: c.cafe.name,
          logoUrl: c.cafe.logoUrl,
          role: c.role,
        })),
      );
    }
  }, [data, setCafes]);
}

/** Pill showing the active identity; tapping opens the switcher sheet. */
export function IdentityPill({ className }: { className?: string }) {
  const t = useTranslations('cafeOs');
  const user = useAuthStore((s) => s.user);
  const { active, cafes, setSwitcherOpen } = useIdentityStore();
  useSyncIdentity();

  const activeCafe =
    active.type === 'cafe'
      ? cafes.find((c) => c.cafeId === active.cafeId)
      : null;

  return (
    <button
      type="button"
      onClick={() => setSwitcherOpen(true)}
      className={cn(
        'flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium shadow-sm transition active:scale-95',
        className,
      )}
    >
      <Avatar className="h-6 w-6">
        <AvatarImage
          src={(activeCafe ? activeCafe.logoUrl : user?.avatarUrl) ?? undefined}
        />
        <AvatarFallback className="text-[10px]">
          {activeCafe ? <Store className="h-3 w-3" /> : <User className="h-3 w-3" />}
        </AvatarFallback>
      </Avatar>
      <span className="max-w-32 truncate">
        {activeCafe ? activeCafe.name : t('personalMode')}
      </span>
      <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}

/** Instagram-style account switcher bottom sheet. */
export function IdentitySwitcher() {
  const t = useTranslations('cafeOs');
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const {
    active,
    cafes,
    switcherOpen,
    setSwitcherOpen,
    switchToPersonal,
    switchToCafe,
  } = useIdentityStore();

  return (
    <Sheet open={switcherOpen} onOpenChange={setSwitcherOpen}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <SheetHeader>
          <SheetTitle>{t('switchIdentity')}</SheetTitle>
        </SheetHeader>
        <div className="mt-2 space-y-1 px-1">
          <button
            type="button"
            onClick={() => {
              switchToPersonal();
              router.push('/');
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-start transition hover:bg-accent"
          >
            <Avatar className="h-11 w-11">
              <AvatarImage src={user?.avatarUrl ?? undefined} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {user?.name || user?.username || t('personalMode')}
              </p>
              <p className="text-xs text-muted-foreground">{t('personalModeHint')}</p>
            </div>
            {active.type === 'personal' ? (
              <Check className="h-5 w-5 text-primary" />
            ) : null}
          </button>

          {cafes.map((cafe) => (
            <button
              key={cafe.cafeId}
              type="button"
              onClick={() => {
                switchToCafe(cafe.cafeId);
                router.push(`/cafe-os/${cafe.cafeId}`);
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-start transition hover:bg-accent"
            >
              <Avatar className="h-11 w-11">
                <AvatarImage src={cafe.logoUrl ?? undefined} />
                <AvatarFallback>
                  <Store className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{cafe.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t('cafeModeHint')} · {t(`role.${cafe.role}`)}
                </p>
              </div>
              {active.type === 'cafe' && active.cafeId === cafe.cafeId ? (
                <Check className="h-5 w-5 text-primary" />
              ) : null}
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              setSwitcherOpen(false);
              router.push('/cafe-os/new');
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-start text-primary transition hover:bg-accent"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-primary/40">
              <Plus className="h-5 w-5" />
            </span>
            <p className="font-semibold">{t('createCafe')}</p>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
