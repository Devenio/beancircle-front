'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { KeyRound, Laptop, LogOut, ShieldCheck, History } from 'lucide-react';
import { SettingsPageWrap } from '@/components/settings/settings-shell';
import { SettingsGroup, SettingsRow } from '@/components/settings/settings-row';
import { useSettingsStore } from '@/stores/settings-store';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

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
  const store = useSettingsStore();

  return (
    <SettingsPageWrap title={t('sections.security')} description={t('sections.securityDesc')}>
      <SettingsGroup title={t('credentials')}>
        <SettingsRow
          icon={<KeyRound className="size-5" />}
          label={t('items.password')}
          description={t('items.passwordDesc')}
          onClick={() => {}}
        />
        <SettingsRow
          icon={<ShieldCheck className="size-5" />}
          label={t('items.twoFactor')}
          description={t('items.twoFactorDesc')}
          trailing={
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {t('comingSoon')}
            </span>
          }
        />
      </SettingsGroup>

      <SettingsGroup title={t('items.sessions')}>
        {store.sessions.length === 0 ? (
          <Empty className="border-0 py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Laptop className="size-5" />
              </EmptyMedia>
              <EmptyTitle>{t('empty.sessionsTitle')}</EmptyTitle>
              <EmptyDescription>{t('empty.sessionsBody')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          store.sessions.map((session) => (
            <div key={session.id} className="flex min-h-14 items-start gap-3 px-3 py-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Laptop className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {session.deviceName}
                  {session.current ? (
                    <span className="ms-2 text-xs text-primary">({t('thisDevice')})</span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.browser} · {session.os}
                </p>
                {session.location ? (
                  <p className="text-xs text-muted-foreground">{session.location}</p>
                ) : null}
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {formatLoginTime(session.loginAt, locale)}
                </p>
              </div>
              {!session.current ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-9 shrink-0"
                  onClick={() => store.revokeSession(session.id)}
                >
                  <LogOut className="size-3.5" />
                  {t('revoke')}
                </Button>
              ) : null}
            </div>
          ))
        )}
      </SettingsGroup>

      <SettingsGroup title={t('loginHistory')}>
        <SettingsRow
          icon={<History className="size-5" />}
          label={t('recentActivity')}
          description={t('recentActivityDesc')}
          trailing={
            <span className="text-xs text-muted-foreground">{t('comingSoon')}</span>
          }
        />
      </SettingsGroup>
    </SettingsPageWrap>
  );
}
