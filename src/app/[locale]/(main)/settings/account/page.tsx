'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import {
  AtSign,
  Camera,
  CheckCircle2,
  Globe,
  Loader2,
  Mail,
  Monitor,
  Phone,
  Plug,
  Smartphone,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { presignAndUpload } from '@/lib/api/uploads';
import { useUsernameCheck } from '@/hooks/use-username-check';
import { useSettingsApi } from '@/hooks/use-settings-api';
import { SettingsScreen } from '@/components/settings/settings-shell';
import { SettingsList, SettingsRow, SettingsSectionLabel } from '@/components/settings/settings-row';
import { SocialLinksEditor } from '@/components/profile/social-links-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { SocialLink } from '@/lib/social-platforms';

type Me = {
  username?: string | null;
  name?: string | null;
  bio?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  cityId?: string | null;
  city?: { id: string; name: string } | null;
  socialLinks?: SocialLink[] | null;
};

type City = { id: string; name: string };

type SessionRow = {
  id: string;
  deviceName?: string | null;
  browser?: string | null;
  os?: string | null;
  location?: string | null;
  loginAt: string;
  lastUsedAt: string;
  current: boolean;
};

function initials(me?: Me | null) {
  const source = me?.name || me?.username || '';
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

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
  const { settings } = useSettingsApi();

  const { data: me, isLoading } = useQuery({
    queryKey: ['me', locale, 'account'],
    queryFn: () => api<Me>('/users/me', { locale }),
  });

  const { data: cities } = useQuery({
    queryKey: ['cities', locale],
    queryFn: () => api<City[]>('/users/cities', { locale }),
  });

  const { data: sessions } = useQuery({
    queryKey: ['sessions', locale],
    queryFn: () =>
      api<SessionRow[]>('/settings/sessions?currentSessionId=', { locale }),
  });

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [cityId, setCityId] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const usernameStatus = useUsernameCheck(username, locale, me?.username ?? undefined);
  const usernameSaveOk = usernameStatus === 'available' || usernameStatus === 'idle';

  useEffect(() => {
    if (!me) return;
    setName(me.name ?? '');
    setUsername(me.username ?? '');
    setBio(me.bio ?? '');
    setCityId(me.cityId ?? '');
    setSocialLinks(me.socialLinks ?? []);
  }, [me]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          username,
          bio,
          socialLinks: socialLinks
            .filter((l) => l.url && /^https?:\/\/.+/.test(l.url))
            .map(({ _tempId: _, ...link }) => link),
        }),
        locale,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });

  const cityMutation = useMutation({
    mutationFn: (newCityId: string) =>
      api('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ cityId: newCityId }),
        locale,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) =>
      api(`/settings/sessions/${sessionId}`, { method: 'DELETE', locale }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions', locale] }),
  });

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarError(false);
    setAvatarUploading(true);
    try {
      const url = await presignAndUpload(file, 'avatars');
      await api('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ avatarUrl: url }),
        locale,
      });
      qc.invalidateQueries({ queryKey: ['me'] });
    } catch {
      setAvatarError(true);
    } finally {
      setAvatarUploading(false);
    }
  }

  function handleCityChange(newCityId: string) {
    setCityId(newCityId);
    cityMutation.mutate(newCityId);
  }

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
      {/* Avatar — header display + upload control */}
      <SettingsSectionLabel>{t('profilePhoto')}</SettingsSectionLabel>
      <div className="flex flex-col items-center gap-2 border-y border-border/80 bg-card px-4 py-5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={avatarUploading}
          className="relative size-20 rounded-full"
          aria-label={t('changePhoto')}
        >
          {me?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={me.avatarUrl}
              alt=""
              className="size-20 rounded-full object-cover"
            />
          ) : (
            <span className="grid size-20 place-items-center rounded-full bg-muted text-xl font-semibold text-muted-foreground">
              {initials(me)}
            </span>
          )}
          <span className="absolute bottom-0 end-0 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-card">
            <Camera className="size-3.5" />
          </span>
          {avatarUploading ? (
            <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40">
              <Loader2 className="size-6 animate-spin text-white" />
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={avatarUploading}
          className="text-sm font-medium text-primary disabled:opacity-60"
        >
          {t('changePhoto')}
        </button>
        {avatarError ? (
          <p className="text-xs text-destructive">{t('photoError')}</p>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

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
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="min-h-11 ps-9 pe-10"
              dir="ltr"
            />
            <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2">
              {usernameStatus === 'checking' && (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              )}
              {usernameStatus === 'available' && (
                <CheckCircle2 className="size-4 text-emerald-500" />
              )}
              {usernameStatus === 'taken' && (
                <XCircle className="size-4 text-destructive" />
              )}
            </span>
          </div>
          {usernameStatus === 'available' && (
            <p className="mt-1 text-xs text-emerald-500">{t('usernameAvailable')}</p>
          )}
          {usernameStatus === 'taken' && (
            <p className="mt-1 text-xs text-destructive">{t('usernameTaken')}</p>
          )}
        </div>
        <div>
          <FieldLabel label={t('bio')} hint={t('items.profileDesc')} />
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
        </div>
        <div>
          <FieldLabel label={t('cityLabel')} hint={t('cityDesc')} />
          <Select
            value={cityId || undefined}
            onValueChange={(v) => v && handleCityChange(v)}
            disabled={cityMutation.isPending}
          >
            <SelectTrigger className="min-h-11 w-full">
              <SelectValue placeholder={t('selectCity')} />
            </SelectTrigger>
            <SelectContent>
              {cities?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {cityMutation.isError ? (
            <p className="mt-1 text-xs text-destructive">{t('cityError')}</p>
          ) : null}
        </div>
        <Button
          className="min-h-11 w-full"
          disabled={saveMutation.isPending || !usernameSaveOk || usernameStatus === 'checking'}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? t('saving') : t('saveChanges')}
        </Button>
      </div>

      <SettingsSectionLabel>{t('items.socialLinks')}</SettingsSectionLabel>
      <p className="px-4 pb-2 text-xs text-muted-foreground">{t('items.socialLinksDesc')}</p>
      <div className="border-y border-border/80 bg-card px-4 py-4">
        <SocialLinksEditor
          value={socialLinks}
          onChange={setSocialLinks}
          defaultVisibility={settings?.socialLinksDefaultVisibility}
          saving={saveMutation.isPending}
          onSave={() => saveMutation.mutate()}
        />
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

      <SettingsSectionLabel>{t('activeSessions')}</SettingsSectionLabel>
      <p className="px-4 pb-1 text-xs text-muted-foreground">{t('activeSessionsDesc')}</p>
      <SettingsList>
        {sessions && sessions.length > 0 ? (
          sessions.map((s) => {
            const mobile = /iphone|android|mobile|ios|ipad/i.test(
              `${s.os ?? ''} ${s.deviceName ?? ''}`,
            );
            const DeviceIcon = mobile ? Smartphone : Monitor;
            const meta = [
              s.location,
              new Date(s.lastUsedAt).toLocaleDateString(locale),
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <DeviceIcon className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px]">
                    {s.deviceName || s.browser || s.os || '—'}
                    {s.os && s.deviceName ? ` · ${s.os}` : ''}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{meta}</p>
                </div>
                {s.current ? (
                  <span className="shrink-0 text-xs font-medium text-primary">
                    {t('currentSession')}
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={revokeMutation.isPending}
                    onClick={() => revokeMutation.mutate(s.id)}
                  >
                    {t('signOutSession')}
                  </Button>
                )}
              </div>
            );
          })
        ) : (
          <p className="px-4 py-3 text-sm text-muted-foreground">{t('noSessions')}</p>
        )}
      </SettingsList>
      {revokeMutation.isError ? (
        <p className="px-4 pt-2 text-xs text-destructive">{t('signOutSessionError')}</p>
      ) : null}
    </SettingsScreen>
  );
}
