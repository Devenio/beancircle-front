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
  const isSettings = pathname === '/settings' || pathname.startsWith('/settings/');
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
            : isSettings
              ? 'min-h-dvh'
              : 'pb-[calc(5.25rem+env(safe-area-inset-bottom))]'
        }
      >
        <PageTransition>{children}</PageTransition>
      </main>
      {!isChatRoom && !isSettings ? <BottomNav /> : null}
    </>
  );
}
