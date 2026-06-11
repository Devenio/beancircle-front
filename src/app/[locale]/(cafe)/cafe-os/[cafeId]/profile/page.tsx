'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cafeOsApi, type OpeningHours } from '@/lib/api/cafe-os';
import { presignAndUpload } from '@/lib/api/uploads';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Check, Loader2, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const SOCIALS = ['instagram', 'telegram', 'x', 'tiktok'] as const;

export default function CafeProfilePage() {
  const t = useTranslations('cafeOs');
  const { cafeId } = useParams<{ cafeId: string }>();
  const queryClient = useQueryClient();
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const { data: cafe, isLoading } = useQuery({
    queryKey: ['cafe-os', cafeId],
    queryFn: () => cafeOsApi.getCafe(cafeId),
  });

  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const [hours, setHours] = useState<OpeningHours>({});
  const [gallery, setGallery] = useState<string[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (cafe && !form) {
      setForm({
        name: cafe.name,
        description: cafe.description ?? '',
        address: cafe.address,
        phone: cafe.phone ?? '',
        email: cafe.email ?? '',
        website: cafe.website ?? '',
        wifiName: cafe.wifiName ?? '',
        wifiPassword: cafe.wifiPassword ?? '',
        logoUrl: cafe.logoUrl,
        coverUrl: cafe.coverUrl,
        socialLinks: cafe.socialLinks ?? {},
      });
      setHours(cafe.openingHours ?? {});
      setGallery(
        cafe.photos.filter((p) => p.kind === 'GALLERY').map((p) => p.url),
      );
    }
  }, [cafe, form]);

  const save = useMutation({
    mutationFn: () => {
      const f = form!;
      return cafeOsApi.updateCafe(cafeId, {
        name: f.name,
        description: (f.description as string) || undefined,
        address: f.address,
        phone: (f.phone as string) || undefined,
        email: (f.email as string) || undefined,
        website: (f.website as string) || undefined,
        wifiName: (f.wifiName as string) || undefined,
        wifiPassword: (f.wifiPassword as string) || undefined,
        logoUrl: f.logoUrl ?? undefined,
        coverUrl: f.coverUrl ?? undefined,
        socialLinks: f.socialLinks,
        openingHours: hours,
        gallery,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cafe-os', cafeId] });
      void queryClient.invalidateQueries({ queryKey: ['my-cafes'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  async function upload(kind: 'logo' | 'cover' | 'gallery', file: File) {
    setUploading(kind);
    try {
      const url = await presignAndUpload(file, 'cafes');
      if (kind === 'logo') setForm((f) => ({ ...f!, logoUrl: url }));
      else if (kind === 'cover') setForm((f) => ({ ...f!, coverUrl: url }));
      else setGallery((g) => [...g, url]);
    } finally {
      setUploading(null);
    }
  }

  if (isLoading || !form) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const set = (key: string, value: unknown) =>
    setForm((f) => ({ ...f!, [key]: value }));

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-bold">{t('profile.title')}</h1>

      {/* Cover + logo */}
      <div className="relative">
        <button
          type="button"
          onClick={() => coverRef.current?.click()}
          className="relative block h-36 w-full overflow-hidden rounded-2xl border border-border bg-muted"
        >
          {form.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.coverUrl as string}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
            {uploading === 'cover' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={() => logoRef.current?.click()}
          className="absolute -bottom-6 start-4 h-16 w-16 overflow-hidden rounded-2xl border-4 border-background bg-muted shadow"
        >
          {form.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.logoUrl as string}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted-foreground">
              {uploading === 'logo' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </span>
          )}
        </button>
        <input
          ref={coverRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => e.target.files?.[0] && upload('cover', e.target.files[0])}
        />
        <input
          ref={logoRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => e.target.files?.[0] && upload('logo', e.target.files[0])}
        />
      </div>

      <div className="space-y-3 pt-4">
        <Input
          value={form.name as string}
          onChange={(e) => set('name', e.target.value)}
          placeholder={t('profile.name')}
        />
        <Textarea
          value={form.description as string}
          onChange={(e) => set('description', e.target.value)}
          placeholder={t('profile.description')}
          rows={3}
        />
        <Input
          value={form.address as string}
          onChange={(e) => set('address', e.target.value)}
          placeholder={t('profile.address')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={form.phone as string}
            onChange={(e) => set('phone', e.target.value)}
            placeholder={t('profile.phone')}
            dir="ltr"
          />
          <Input
            value={form.email as string}
            onChange={(e) => set('email', e.target.value)}
            placeholder={t('profile.email')}
            dir="ltr"
          />
        </div>
        <Input
          value={form.website as string}
          onChange={(e) => set('website', e.target.value)}
          placeholder={t('profile.website')}
          dir="ltr"
        />
      </div>

      {/* Socials */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">{t('profile.socials')}</h2>
        {SOCIALS.map((s) => (
          <Input
            key={s}
            value={((form.socialLinks as Record<string, string>)[s] ?? '') as string}
            onChange={(e) =>
              set('socialLinks', {
                ...(form.socialLinks as Record<string, string>),
                [s]: e.target.value,
              })
            }
            placeholder={s}
            dir="ltr"
          />
        ))}
      </section>

      {/* WiFi */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">{t('profile.wifi')}</h2>
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={form.wifiName as string}
            onChange={(e) => set('wifiName', e.target.value)}
            placeholder={t('profile.wifiName')}
            dir="ltr"
          />
          <Input
            value={form.wifiPassword as string}
            onChange={(e) => set('wifiPassword', e.target.value)}
            placeholder={t('profile.wifiPassword')}
            dir="ltr"
          />
        </div>
      </section>

      {/* Opening hours */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">{t('profile.hours')}</h2>
        <div className="space-y-1.5 rounded-2xl border border-border bg-card p-3">
          {DAYS.map((day) => {
            const h = hours[day] ?? { open: '08:00', close: '22:00', closed: false };
            return (
              <div key={day} className="flex items-center gap-2">
                <span className="w-10 text-xs font-medium uppercase text-muted-foreground">
                  {t(`profile.days.${day}`)}
                </span>
                <Switch
                  checked={!h.closed}
                  onCheckedChange={(open: boolean) =>
                    setHours({ ...hours, [day]: { ...h, closed: !open } })
                  }
                />
                {!h.closed ? (
                  <div className="flex flex-1 items-center gap-1.5" dir="ltr">
                    <input
                      type="time"
                      value={h.open}
                      onChange={(e) =>
                        setHours({ ...hours, [day]: { ...h, open: e.target.value } })
                      }
                      className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">–</span>
                    <input
                      type="time"
                      value={h.close}
                      onChange={(e) =>
                        setHours({ ...hours, [day]: { ...h, close: e.target.value } })
                      }
                      className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs"
                    />
                  </div>
                ) : (
                  <span className="flex-1 text-xs text-muted-foreground">
                    {t('profile.closed')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Gallery */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">{t('profile.gallery')}</h2>
        <div className="grid grid-cols-3 gap-2">
          {gallery.map((url, i) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setGallery(gallery.filter((_, j) => j !== i))}
                className="absolute end-1 top-1 rounded-full bg-black/60 p-1 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground"
          >
            {uploading === 'gallery' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </button>
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) =>
              e.target.files?.[0] && upload('gallery', e.target.files[0])
            }
          />
        </div>
      </section>

      {save.isError ? (
        <p className="text-sm text-red-600">{(save.error as Error).message}</p>
      ) : null}

      <Button
        className="w-full"
        disabled={save.isPending || !!uploading}
        onClick={() => save.mutate()}
      >
        {save.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <Check className="h-4 w-4" />
        ) : (
          t('profile.save')
        )}
      </Button>
    </div>
  );
}
