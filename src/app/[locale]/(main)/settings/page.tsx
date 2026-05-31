'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import { Link } from '@/i18n/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuthStore();

  async function handleLogout() {
    try {
      await api('/auth/logout', { method: 'POST', locale });
    } catch {
      /* ignore */
    }
    logout();
    router.replace('/login');
  }

  function switchLocale(newLocale: string) {
    const path = pathname.replace(`/${locale}`, `/${newLocale}`);
    window.location.href = path || `/${newLocale}/settings`;
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-lg font-bold">{t('title')}</h1>
      <div>
        <p className="mb-2 text-sm font-medium">{t('theme')}</p>
        <ThemeToggle />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">{t('language')}</p>
        <div className="flex gap-2">
          <Button
            variant={locale === 'fa' ? 'default' : 'outline'}
            onClick={() => switchLocale('fa')}
          >
            فارسی
          </Button>
          <Button
            variant={locale === 'en' ? 'default' : 'outline'}
            onClick={() => switchLocale('en')}
          >
            English
          </Button>
        </div>
      </div>
      {user?.role === 'ADMIN' && (
        <Link href="/admin" className="block text-primary">
          Admin panel
        </Link>
      )}
      <Link href="/gift" className="block text-primary">
        Gift coffee
      </Link>
      <Link href="/notifications" className="block text-primary">
        Notifications
      </Link>
      <Button variant="outline" onClick={handleLogout} className="w-full">
        {t('logout')}
      </Button>
    </div>
  );
}
