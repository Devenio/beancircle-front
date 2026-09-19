'use client';

import { IdentitySwitcher } from '@/components/cafe-os/identity-switcher';
import { useSocket } from '@/hooks/use-socket';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from '@/i18n/navigation';
import { useEffect } from 'react';

export default function CafeGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  useSocket();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token && !user) {
      router.replace('/login');
    }
  }, [user, router]);

  return (
    <>
      <main className="min-h-full">{children}</main>
      <IdentitySwitcher />
    </>
  );
}
