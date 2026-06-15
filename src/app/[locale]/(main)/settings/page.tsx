'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { Gift, LayoutDashboard } from 'lucide-react';
import { SettingsAccountRow } from '@/components/settings/settings-account-row';
import { SettingsHubMenu } from '@/components/settings/settings-hub-menu';
import { SettingsHubHeader } from '@/components/settings/settings-shell';
import { SettingsSearch } from '@/components/settings/settings-search';
import { SettingsHubSkeleton } from '@/components/settings/settings-profile-header';
import { SettingsList, SettingsRow, SettingsSectionLabel } from '@/components/settings/settings-row';
import { ReferralPanel } from '@/components/growth/referral-panel';
import { OnboardingResumeRow } from '@/components/onboarding/onboarding-resume-row';
import { InstallCtaRow } from '@/components/pwa/install-cta-row';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api/client';
import { useRouter } from '@/i18n/navigation';

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
    <div className="flex min-h-dvh flex-col">
      <SettingsHubHeader>
        <SettingsSearch />
      </SettingsHubHeader>

      <SettingsAccountRow locale={locale} />
      <OnboardingResumeRow locale={locale} />
      <SettingsHubMenu />

      {(user?.role === 'ADMIN' ||
        user?.role === 'SUPER_ADMIN' ||
        user?.role === 'OWNER') && (
        <>
          <SettingsSectionLabel>{t('quickLinks')}</SettingsSectionLabel>
          <SettingsList>
            {user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? (
              <SettingsRow
                label={t('adminPanel')}
                description={t('adminPanelDesc')}
                href="/admin"
                icon={<LayoutDashboard className="size-5" />}
              />
            ) : null}
            <SettingsRow
              label={t('ownerDashboard')}
              description={t('ownerDashboardDesc')}
              href="/owner"
              icon={<LayoutDashboard className="size-5" />}
            />
          </SettingsList>
        </>
      )}

      <div className="px-4 py-4">
        <ReferralPanel locale={locale} />
      </div>

      <SettingsList className="mt-2">
        <InstallCtaRow source="settings" />
        <SettingsRow
          label={t('giftCoffee')}
          description={t('giftCoffeeDesc')}
          href="/gift"
          icon={<Gift className="size-5" />}
        />
      </SettingsList>

      <div className="mt-6 px-4 pb-8">
        <button
          type="button"
          onClick={handleLogout}
          className="min-h-[52px] w-full text-start active:opacity-70"
        >
          <span className="block text-[15px] font-medium text-destructive">{t('logout')}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{t('logoutHint')}</span>
        </button>
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
