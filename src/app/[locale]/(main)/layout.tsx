'use client';

import { BottomNav } from '@/components/layout/bottom-nav';
import { PageTransition } from '@/components/layout/page-transition';
import { useSocket } from '@/hooks/use-socket';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useEffect } from 'react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();
  const isChatRoom = /^\/messages\/[^/]+$/.test(pathname);
  const isSettingsSubpage = /^\/settings\/.+/.test(pathname);
  useSocket();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token && !user) {
      router.replace('/login');
    } else if (user?.needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [user, router]);

  return (
    <>
      <main
        className={
          isChatRoom
            ? 'h-dvh overflow-hidden'
            : isSettingsSubpage
              ? 'min-h-dvh'
              : 'pb-20'
        }
      >
        <PageTransition>{children}</PageTransition>
      </main>
      {!isChatRoom && !isSettingsSubpage ? <BottomNav /> : null}
    </>
  );
}
