'use client';

import { PublicMenuView } from '@/components/cafe-menu/public-menu-view';
import type { CafeMenuData, MenuCategory, MenuItem } from '@/components/cafe-menu/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { Link } from '@/i18n/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, ExternalLink, Plus, QrCode, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

const SAMPLE_ITEMS: Omit<MenuItem, 'id'>[] = [
  {
    name: 'Flat White',
    description: 'Velvety microfoam over a double ristretto',
    price: 185000,
    imageUrl:
      'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&q=80',
    order: 0,
    isAvailable: true,
  },
  {
    name: 'Pour Over',
    description: 'Single-origin Ethiopia, bright & floral',
    price: 165000,
    imageUrl:
      'https://images.unsplash.com/photo-1497935586761-b10b1e4c4c7a?w=600&q=80',
    order: 1,
    isAvailable: true,
  },
  {
    name: 'Avocado Toast',
    description: 'Sourdough, smashed avo, chili flakes, feta',
    price: 245000,
    imageUrl:
      'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=600&q=80',
    order: 0,
    isAvailable: true,
  },
];

function newId() {
  return `tmp-${Math.random().toString(36).slice(2, 9)}`;
}

export default function OwnerMenuPage() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const t = useTranslations('cafeMenu');
  const qc = useQueryClient();
  const [form, setForm] = useState<CafeMenuData | null>(null);
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['owner-menu', id, locale],
    queryFn: () => api<CafeMenuData>(`/owner/cafes/${id}/menu`, { locale }),
    retry: 1,
  });

  const { data: qr } = useQuery({
    queryKey: ['owner-menu-qr', id, locale],
    queryFn: () =>
      api<{ menuUrl: string; qrDataUrl: string; isPublished: boolean }>(
        `/owner/cafes/${id}/menu/qr`,
        { locale },
      ),
    enabled: !!data?.id,
    retry: false,
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (body: CafeMenuData) =>
      api<CafeMenuData>(`/owner/cafes/${id}/menu`, {
        method: 'PUT',
        body: JSON.stringify({
          slug: body.slug,
          welcomeTitle: body.welcomeTitle,
          welcomeMessage: body.welcomeMessage,
          welcomeImageUrl: body.welcomeImageUrl,
          accentColor: body.accentColor,
          isPublished: body.isPublished,
          categories: body.categories.map((c, ci) => ({
            name: c.name,
            order: ci,
            items: c.items.map((item, ii) => ({
              name: item.name,
              description: item.description,
              price: item.price,
              imageUrl: item.imageUrl,
              order: ii,
              isAvailable: item.isAvailable,
            })),
          })),
        }),
        locale,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-menu', id, locale] });
      qc.invalidateQueries({ queryKey: ['owner-menu-qr', id, locale] });
    },
  });

  function loadSample() {
    if (!form) return;
    setForm({
      ...form,
      welcomeTitle: form.cafe.name,
      welcomeMessage: t('sampleWelcome'),
      welcomeImageUrl:
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80',
      accentColor: '#2C1810',
      categories: [
        {
          id: newId(),
          name: t('sampleCoffee'),
          order: 0,
          items: SAMPLE_ITEMS.slice(0, 2).map((item) => ({
            ...item,
            id: newId(),
          })),
        },
        {
          id: newId(),
          name: t('sampleFood'),
          order: 1,
          items: [
            {
              ...SAMPLE_ITEMS[2],
              id: newId(),
            },
          ],
        },
      ],
    });
  }

  function addCategory() {
    if (!form) return;
    setForm({
      ...form,
      categories: [
        ...form.categories,
        { id: newId(), name: t('newCategory'), order: form.categories.length, items: [] },
      ],
    });
  }

  function updateCategory(catId: string, patch: Partial<MenuCategory>) {
    if (!form) return;
    setForm({
      ...form,
      categories: form.categories.map((c) =>
        c.id === catId ? { ...c, ...patch } : c,
      ),
    });
  }

  function removeCategory(catId: string) {
    if (!form) return;
    setForm({
      ...form,
      categories: form.categories.filter((c) => c.id !== catId),
    });
  }

  function addItem(catId: string) {
    if (!form) return;
    setForm({
      ...form,
      categories: form.categories.map((c) =>
        c.id === catId
          ? {
              ...c,
              items: [
                ...c.items,
                {
                  id: newId(),
                  name: '',
                  description: '',
                  price: 0,
                  imageUrl: '',
                  order: c.items.length,
                  isAvailable: true,
                },
              ],
            }
          : c,
      ),
    });
  }

  function updateItem(
    catId: string,
    itemId: string,
    patch: Partial<MenuItem>,
  ) {
    if (!form) return;
    setForm({
      ...form,
      categories: form.categories.map((c) =>
        c.id === catId
          ? {
              ...c,
              items: c.items.map((item) =>
                item.id === itemId ? { ...item, ...patch } : item,
              ),
            }
          : c,
      ),
    });
  }

  function removeItem(catId: string, itemId: string) {
    if (!form) return;
    setForm({
      ...form,
      categories: form.categories.map((c) =>
        c.id === catId
          ? { ...c, items: c.items.filter((item) => item.id !== itemId) }
          : c,
      ),
    });
  }

  async function copyUrl() {
    if (!qr?.menuUrl) return;
    await navigator.clipboard.writeText(qr.menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  if (isError || !form) {
    return (
      <div className="space-y-3 p-4">
        <p className="text-sm font-medium text-destructive">{t('loadError')}</p>
        <p className="text-xs text-muted-foreground">
          {error instanceof Error ? error.message : t('loadErrorHint')}
        </p>
        <Button type="button" size="sm" variant="outline" onClick={() => refetch()}>
          {t('retry')}
        </Button>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="relative">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="fixed right-4 top-4 z-50 shadow-md"
          onClick={() => setPreview(false)}
        >
          {t('exitPreview')}
        </Button>
        <PublicMenuView
          menu={{ ...form, isPublished: true }}
          locale={locale}
          labels={{
            viewMenu: t('viewMenu'),
            scrollHint: t('scrollHint'),
            unavailable: t('unavailable'),
            poweredBy: t('poweredBy'),
          }}
        />
      </div>
    );
  }

  const menuPath = `/m/${form.slug}`;

  return (
    <div className="space-y-6 p-4 pb-24">
      <header className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/owner/${id}`}
            className="text-xs text-muted-foreground hover:underline"
          >
            ← {t('backToCafe')}
          </Link>
          <h1 className="mt-1 text-xl font-bold">{t('editorTitle')}</h1>
          <p className="text-sm text-muted-foreground">{form.cafe.name}</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setPreview(true)}>
          {t('preview')}
        </Button>
      </header>

      <section className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold">{t('welcomeSection')}</h2>
        <label className="block text-xs text-muted-foreground">{t('menuPath')}</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/m/</span>
          <Input
            value={form.slug}
            onChange={(e) =>
              setForm({
                ...form,
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
              })
            }
            className="font-mono"
            placeholder="my-cafe"
          />
        </div>
        <Input
          placeholder={t('welcomeTitle')}
          value={form.welcomeTitle ?? ''}
          onChange={(e) => setForm({ ...form, welcomeTitle: e.target.value })}
        />
        <textarea
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          rows={3}
          placeholder={t('welcomeMessage')}
          value={form.welcomeMessage ?? ''}
          onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
        />
        <Input
          placeholder={t('welcomeImage')}
          value={form.welcomeImageUrl ?? ''}
          onChange={(e) => setForm({ ...form, welcomeImageUrl: e.target.value })}
        />
        <div className="flex items-center gap-3">
          <label className="text-sm">{t('accentColor')}</label>
          <input
            type="color"
            value={form.accentColor}
            onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
            className="h-9 w-12 cursor-pointer rounded border"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
          />
          {t('publish')}
        </label>
      </section>

      <section className="rounded-xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{t('categories')}</h2>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={loadSample}>
              {t('loadSample')}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={addCategory}>
              <Plus className="mr-1 h-4 w-4" />
              {t('addCategory')}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {form.categories.map((cat) => (
            <div key={cat.id} className="rounded-lg border bg-muted/30 p-3">
              <div className="mb-2 flex gap-2">
                <Input
                  value={cat.name}
                  onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                  placeholder={t('categoryName')}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeCategory(cat.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {cat.items.map((item) => (
                  <div key={item.id} className="rounded-md border bg-background p-2 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={item.name}
                        onChange={(e) =>
                          updateItem(cat.id, item.id, { name: e.target.value })
                        }
                        placeholder={t('itemName')}
                      />
                      <Input
                        type="number"
                        value={item.price || ''}
                        onChange={(e) =>
                          updateItem(cat.id, item.id, {
                            price: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        placeholder={t('price')}
                        className="w-28"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(cat.id, item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={item.description ?? ''}
                      onChange={(e) =>
                        updateItem(cat.id, item.id, { description: e.target.value })
                      }
                      placeholder={t('itemDescription')}
                    />
                    <Input
                      value={item.imageUrl ?? ''}
                      onChange={(e) =>
                        updateItem(cat.id, item.id, { imageUrl: e.target.value })
                      }
                      placeholder={t('itemImage')}
                    />
                  </div>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={() => addItem(cat.id)}
              >
                <Plus className="mr-1 h-3 w-3" />
                {t('addItem')}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {qr ? (
        <section className="rounded-xl border p-4 text-center">
          <h2 className="mb-3 flex items-center justify-center gap-2 font-semibold">
            <QrCode className="h-5 w-5" />
            {t('qrTitle')}
          </h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr.qrDataUrl} alt="Menu QR" className="mx-auto w-48 rounded-lg" />
          <p className="mt-3 break-all font-mono text-xs text-muted-foreground">
            {qr.menuUrl}
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={copyUrl}>
              <Copy className="mr-1 h-4 w-4" />
              {copied ? t('copied') : t('copyLink')}
            </Button>
            {form.isPublished ? (
              <Link href={menuPath} target="_blank">
                <Button type="button" size="sm" variant="outline">
                  <ExternalLink className="mr-1 h-4 w-4" />
                  {t('openMenu')}
                </Button>
              </Link>
            ) : null}
          </div>
          {!qr.isPublished ? (
            <p className="mt-2 text-xs text-amber-600">{t('publishForQr')}</p>
          ) : null}
        </section>
      ) : null}

      <Button
        type="button"
        className="w-full"
        disabled={saveMutation.isPending}
        onClick={() => form && saveMutation.mutate(form)}
      >
        {saveMutation.isPending ? t('saving') : t('save')}
      </Button>
    </div>
  );
}
