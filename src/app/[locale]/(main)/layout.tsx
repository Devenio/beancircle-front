'use client';

import { BottomNav } from '@/components/layout/bottom-nav';
import { PageTransition } from '@/components/layout/page-transition';
import { useSocket } from '@/hooks/use-socket';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from '@/i18n/navigation';
import { useEffect } from 'react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
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
      <main className="pb-20">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
    </>
  );
}
