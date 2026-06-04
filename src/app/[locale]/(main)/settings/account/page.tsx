'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { AtSign, Globe, Mail, Phone, Plug } from 'lucide-react';
import { api } from '@/lib/api/client';
import { SettingsPageWrap } from '@/components/settings/settings-shell';
import { SettingsGroup, SettingsRow } from '@/components/settings/settings-row';
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });

  function switchLocale(newLocale: string) {
    const path = pathname.replace(`/${locale}`, `/${newLocale}`);
    window.location.href = path || `/${newLocale}/settings/account`;
  }

  return (
    <SettingsPageWrap title={t('sections.account')} description={t('sections.accountDesc')}>
      <SettingsGroup title={t('items.profile')}>
        <div className="space-y-3 p-3">
          <label className="text-xs font-medium text-muted-foreground">{t('displayName')}</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-12"
            disabled={isLoading}
          />
          <label className="text-xs font-medium text-muted-foreground">{t('items.username')}</label>
          <div className="relative">
            <AtSign className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="min-h-12 ps-9"
              disabled={isLoading}
            />
          </div>
          <label className="text-xs font-medium text-muted-foreground">{t('bio')}</label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} disabled={isLoading} />
          <Button
            className="min-h-12 w-full"
            disabled={saveMutation.isPending || isLoading}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? t('saving') : t('saveChanges')}
          </Button>
        </div>
      </SettingsGroup>

      <SettingsGroup title={t('contactInfo')}>
        <SettingsRow
          icon={<Mail className="size-5" />}
          label={t('items.email')}
          description={me?.email ?? t('notSet')}
        />
        <SettingsRow
          icon={<Phone className="size-5" />}
          label={t('items.phone')}
          description={me?.phone ?? t('notSet')}
        />
      </SettingsGroup>

      <SettingsGroup title={t('items.connectedAccounts')}>
        <Empty className="border-0 bg-transparent py-6">
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
      </SettingsGroup>

      <SettingsGroup title={t('language')}>
        <div className="flex gap-2 p-3">
          <Button
            variant={locale === 'fa' ? 'default' : 'outline'}
            className="min-h-12 flex-1"
            onClick={() => switchLocale('fa')}
          >
            <Globe className="size-4" />
            فارسی
          </Button>
          <Button
            variant={locale === 'en' ? 'default' : 'outline'}
            className="min-h-12 flex-1"
            onClick={() => switchLocale('en')}
          >
            <Globe className="size-4" />
            English
          </Button>
        </div>
      </SettingsGroup>
    </SettingsPageWrap>
  );
}
