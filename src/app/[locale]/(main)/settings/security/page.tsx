'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { SettingsScreen } from '@/components/settings/settings-shell';
import { SettingsList, SettingsRow, SettingsSectionLabel } from '@/components/settings/settings-row';
import { useRevokeSession, useSessions } from '@/hooks/use-settings-api';
import { Skeleton } from '@/components/ui/skeleton';

function formatLoginTime(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SettingsSecurityPage() {
  const t = useTranslations('settings');
  const { locale } = useParams<{ locale: string }>();
  const { data: sessions, isLoading } = useSessions();
  const revoke = useRevokeSession();

  return (
    <SettingsScreen title={t('sections.security')}>
      <SettingsSectionLabel>{t('credentials')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsRow label={t('items.password')} value={t('comingSoon')} showChevron={false} />
        <SettingsRow
          label={t('items.twoFactor')}
          value={t('comingSoon')}
          showChevron={false}
        />
      </SettingsList>

      <SettingsSectionLabel>{t('items.sessions')}</SettingsSectionLabel>
      <SettingsList>
        {isLoading ? (
          <Skeleton className="m-4 h-14 rounded-lg" />
        ) : sessions?.length ? (
          sessions.map((session) => (
            <div key={session.id} className="flex min-h-[52px] items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium">
                  {session.deviceName}
                  {session.current ? (
                    <span className="ms-1.5 text-xs font-normal text-muted-foreground">
                      · {t('thisDevice')}
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.browser} · {session.os}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatLoginTime(session.loginAt, locale)}
                </p>
              </div>
              {!session.current ? (
                <button
                  type="button"
                  className="flex size-10 items-center justify-center text-destructive active:opacity-60"
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(session.id)}
                  aria-label={t('revoke')}
                >
                  <LogOut className="size-5" />
                </button>
              ) : null}
            </div>
          ))
        ) : (
          <SettingsRow
            label={t('empty.sessionsTitle')}
            description={t('empty.sessionsBody')}
            showChevron={false}
          />
        )}
      </SettingsList>

      <SettingsSectionLabel>{t('loginHistory')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsRow label={t('recentActivity')} value={t('comingSoon')} showChevron={false} />
      </SettingsList>
    </SettingsScreen>
  );
}
