'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter, Link } from '@/i18n/navigation';
import { useEffect } from 'react';

type Tab = 'users' | 'cafes' | 'reviews' | 'reports' | 'checkins' | 'gifts';

export default function AdminPage() {
  const t = useTranslations('admin');
  const { locale } = useParams<{ locale: string }>();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const tab: Tab = 'users';

  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.replace('/feed');
  }, [user, router]);

  const enabled = user?.role === 'ADMIN';

  const { data: users } = useQuery({
    queryKey: ['admin-users', locale],
    queryFn: () => api<unknown[]>('/admin/users', { locale }),
    enabled,
  });

  const { data: cafes } = useQuery({
    queryKey: ['admin-cafes', locale],
    queryFn: () => api<unknown[]>('/admin/cafes', { locale }),
    enabled,
  });

  const { data: reviews } = useQuery({
    queryKey: ['admin-reviews', locale],
    queryFn: () => api<unknown[]>('/admin/reviews', { locale }),
    enabled,
  });

  const { data: reports } = useQuery({
    queryKey: ['admin-reports', locale],
    queryFn: () => api<unknown[]>('/admin/reports', { locale }),
    enabled,
  });

  const { data: checkins } = useQuery({
    queryKey: ['admin-checkins', locale],
    queryFn: () => api<unknown[]>('/admin/checkins', { locale }),
    enabled,
  });

  const { data: gifts } = useQuery({
    queryKey: ['admin-gifts', locale],
    queryFn: () => api<unknown[]>('/admin/gifts', { locale }),
    enabled,
  });

  if (user?.role !== 'ADMIN') return null;

  const sections: { key: Tab; label: string; data: unknown }[] = [
    { key: 'users', label: t('users'), data: users },
    { key: 'cafes', label: t('cafes'), data: cafes },
    { key: 'reviews', label: t('reviews'), data: reviews },
    { key: 'reports', label: t('reports'), data: reports },
    { key: 'checkins', label: t('checkins'), data: checkins },
    { key: 'gifts', label: t('gifts'), data: gifts },
  ];

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">{t('title')}</h1>
        <Link href="/feed" className="text-sm text-blue-600">
          ← Home
        </Link>
      </div>
      {sections.map(({ key, label, data }) => (
        <section key={key} className="mb-6">
          <h2 className="font-semibold">{label}</h2>
          <pre className="mt-2 max-h-48 overflow-auto rounded bg-neutral-100 p-2 text-xs">
            {JSON.stringify(data ?? [], null, 2)}
          </pre>
        </section>
      ))}
    </div>
  );
}
