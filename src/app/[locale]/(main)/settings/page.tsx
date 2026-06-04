'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { SettingsProfileHeader, SettingsHubSkeleton } from '@/components/settings/settings-profile-header';
import { SettingsSearch } from '@/components/settings/settings-search';
import { SettingsSectionNav } from '@/components/settings/settings-section-nav';
import { ReferralPanel } from '@/components/growth/referral-panel';
import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import { useRouter } from '@/i18n/navigation';
import { Gift, LayoutDashboard, Shield } from 'lucide-react';
import { SettingsGroup, SettingsRow } from '@/components/settings/settings-row';

function SettingsHubContent() {
  const t = useTranslations('settings');
  const { locale } = useParams<{ locale: string }>();
  const { logout, user } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    try {
      await api('/auth/logout', { method: 'POST', locale });
    } catch {
      /* ignore */
    }
    logout();
    router.replace('/login');
  }

  return (
    <div className="min-h-dvh pb-24 md:pb-8">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-md md:static md:border-0 md:bg-transparent md:px-6 md:pt-6">
        <h1 className="text-xl font-bold md:text-2xl">{t('title')}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground md:block">{t('hubSubtitle')}</p>
        <div className="mt-3 md:max-w-xl">
          <SettingsSearch />
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 p-4 md:px-6">
        <SettingsProfileHeader locale={locale} />

        <div>
          <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t('browseSections')}
          </h2>
          <SettingsSectionNav />
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'OWNER') && (
          <SettingsGroup title={t('quickLinks')}>
            {user?.role === 'ADMIN' ? (
              <SettingsRow
                icon={<Shield className="size-5" />}
                label="Admin panel"
                href="/admin"
              />
            ) : null}
            <SettingsRow
              icon={<LayoutDashboard className="size-5" />}
              label={t('ownerDashboard')}
              href="/owner"
            />
          </SettingsGroup>
        )}

        <ReferralPanel locale={locale} />

        <SettingsGroup>
          <SettingsRow
            icon={<Gift className="size-5" />}
            label={t('giftCoffee')}
            href="/gift"
          />
        </SettingsGroup>

        <Button variant="destructive" className="min-h-12 w-full" onClick={handleLogout}>
          {t('logout')}
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsHubSkeleton />}>
      <SettingsHubContent />
    </Suspense>
  );
}
