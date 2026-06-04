'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { AtSign, Globe, Mail, Phone, Plug } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';

type Me = {
  username?: string | null;
  name?: string | null;
  bio?: string | null;
  email?: string | null;
  phone?: string | null;
};

function FieldLabel({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="mb-1">
      <span className="block text-[15px] text-foreground">{label}</span>
      <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}

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
      <p className="px-4 pb-2 text-xs text-muted-foreground">{t('items.profileDesc')}</p>
      <div className="space-y-4 border-y border-border/80 bg-card px-4 py-4">
        <div>
          <FieldLabel label={t('displayName')} hint={t('items.profileDesc')} />
          <Input value={name} onChange={(e) => setName(e.target.value)} className="min-h-11" />
        </div>
        <div>
          <FieldLabel label={t('items.username')} hint={t('items.usernameDesc')} />
          <div className="relative">
            <AtSign className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={username} onChange={(e) => setUsername(e.target.value)} className="min-h-11 ps-9" />
          </div>
        </div>
        <div>
          <FieldLabel label={t('bio')} hint={t('items.profileDesc')} />
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
        </div>
        <Button className="min-h-11 w-full" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending ? t('saving') : t('saveChanges')}
        </Button>
      </div>

      <SettingsSectionLabel>{t('contactInfo')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsRow
          icon={<Mail className="size-5" />}
          label={t('items.email')}
          description={t('items.emailDesc')}
          value={me?.email ?? t('notSet')}
          showChevron={false}
        />
        <SettingsRow
          icon={<Phone className="size-5" />}
          label={t('items.phone')}
          description={t('items.phoneDesc')}
          value={me?.phone ?? t('notSet')}
          showChevron={false}
        />
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
            <p className="mb-3 text-center text-xs text-muted-foreground">{t('hints.connectGoogleSoon')}</p>
            <Button variant="outline" className="min-h-11" disabled>
              {t('connectGoogle')}
            </Button>
          </EmptyContent>
        </Empty>
      </div>

      <SettingsSectionLabel>{t('language')}</SettingsSectionLabel>
      <p className="px-4 pb-1 text-xs text-muted-foreground">{t('items.languageDesc')}</p>
      <SettingsList>
        <button
          type="button"
          onClick={() => switchLocale('fa')}
          className="flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-start active:bg-muted/80"
        >
          <Globe className="size-5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block text-[15px]">فارسی</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{t('languageFaDesc')}</span>
          </span>
          {locale === 'fa' ? <span className="text-primary">✓</span> : null}
        </button>
        <button
          type="button"
          onClick={() => switchLocale('en')}
          className="flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-start active:bg-muted/80"
        >
          <Globe className="size-5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block text-[15px]">English</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{t('languageEnDesc')}</span>
          </span>
          {locale === 'en' ? <span className="text-primary">✓</span> : null}
        </button>
      </SettingsList>
    </SettingsScreen>
  );
}
