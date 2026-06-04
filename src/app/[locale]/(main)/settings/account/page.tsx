'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { AtSign, Globe } from 'lucide-react';
import { api } from '@/lib/api/client';
import { SettingsScreen } from '@/components/settings/settings-shell';
import { SettingsList, SettingsRow, SettingsSectionLabel } from '@/components/settings/settings-row';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePathname } from '@/i18n/navigation';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Plug } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Me = {
  username?: string | null;
  name?: string | null;
  bio?: string | null;
  email?: string | null;
  phone?: string | null;
};

export default function SettingsAccountPage() {
  const t = useTranslations('settings');
  const { locale } = useParams<{ locale: string }>();
  const pathname = usePathname();
  const qc = useQueryClient();

  const { data: me, isLoading } = useQuery({
    queryKey: ['me', locale, 'account'],
    queryFn: () => api<Me>('/users/me', { locale }),
  });

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (!me) return;
    setName(me.name ?? '');
    setUsername(me.username ?? '');
    setBio(me.bio ?? '');
  }, [me]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ name, username, bio }),
        locale,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });

  function switchLocale(newLocale: string) {
    const path = pathname.replace(`/${locale}`, `/${newLocale}`);
    window.location.href = path || `/${newLocale}/settings/account`;
  }

  if (isLoading) {
    return (
      <SettingsScreen title={t('sections.account')}>
        <Skeleton className="h-64 w-full" />
      </SettingsScreen>
    );
  }

  return (
    <SettingsScreen title={t('sections.account')}>
      <SettingsSectionLabel>{t('items.profile')}</SettingsSectionLabel>
      <div className="space-y-3 border-y border-border/80 bg-card px-4 py-4">
        <div>
          <label className="text-xs text-muted-foreground">{t('displayName')}</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 min-h-11" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t('items.username')}</label>
          <div className="relative mt-1">
            <AtSign className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={username} onChange={(e) => setUsername(e.target.value)} className="min-h-11 ps-9" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t('bio')}</label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="mt-1" />
        </div>
        <Button className="min-h-11 w-full" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending ? t('saving') : t('saveChanges')}
        </Button>
      </div>

      <SettingsSectionLabel>{t('contactInfo')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsRow label={t('items.email')} value={me?.email ?? t('notSet')} showChevron={false} />
        <SettingsRow label={t('items.phone')} value={me?.phone ?? t('notSet')} showChevron={false} />
      </SettingsList>

      <SettingsSectionLabel>{t('items.connectedAccounts')}</SettingsSectionLabel>
      <div className="border-y border-border/80 bg-card px-4 py-6">
        <Empty className="border-0 bg-transparent p-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Plug className="size-5" />
            </EmptyMedia>
            <EmptyTitle>{t('empty.connectedTitle')}</EmptyTitle>
            <EmptyDescription>{t('empty.connectedBody')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" className="min-h-11" disabled>
              {t('connectGoogle')}
            </Button>
          </EmptyContent>
        </Empty>
      </div>

      <SettingsSectionLabel>{t('language')}</SettingsSectionLabel>
      <SettingsList>
        <button
          type="button"
          onClick={() => switchLocale('fa')}
          className="flex min-h-[52px] w-full items-center gap-2 px-4 text-[15px] active:bg-muted/80"
        >
          <Globe className="size-5" />
          فارسی
          {locale === 'fa' ? <span className="ms-auto text-primary">✓</span> : null}
        </button>
        <button
          type="button"
          onClick={() => switchLocale('en')}
          className="flex min-h-[52px] w-full items-center gap-2 px-4 text-[15px] active:bg-muted/80"
        >
          <Globe className="size-5" />
          English
          {locale === 'en' ? <span className="ms-auto text-primary">✓</span> : null}
        </button>
      </SettingsList>
    </SettingsScreen>
  );
}
