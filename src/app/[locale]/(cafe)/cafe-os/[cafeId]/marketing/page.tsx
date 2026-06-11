'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  cafeOsApi,
  type Announcement,
  type AnnouncementKind,
} from '@/lib/api/cafe-os';
import { presignAndUpload } from '@/lib/api/uploads';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgePercent,
  ImagePlus,
  Loader2,
  Megaphone,
  Plus,
  Tag,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const KIND_ICONS: Record<AnnouncementKind, typeof Megaphone> = {
  ANNOUNCEMENT: Megaphone,
  PROMOTION: BadgePercent,
  DISCOUNT: Tag,
};

const KINDS: AnnouncementKind[] = ['ANNOUNCEMENT', 'PROMOTION', 'DISCOUNT'];

type FormState = {
  kind: AnnouncementKind;
  title: string;
  body: string;
  imageUrl: string;
  scheduledAt: string;
  expiresAt: string;
  publishNow: boolean;
};

const EMPTY: FormState = {
  kind: 'ANNOUNCEMENT',
  title: '',
  body: '',
  imageUrl: '',
  scheduledAt: '',
  expiresAt: '',
  publishNow: true,
};

export default function MarketingPage() {
  const t = useTranslations('cafeOs.marketing');
  const format = useFormatter();
  const { cafeId } = useParams<{ cafeId: string }>();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const listKey = ['cafe-announcements', cafeId];
  const { data, isLoading } = useQuery({
    queryKey: listKey,
    queryFn: () => cafeOsApi.announcements(cafeId),
  });

  const open = creating || !!editing;

  useEffect(() => {
    if (editing) {
      setForm({
        kind: editing.kind,
        title: editing.title,
        body: editing.body,
        imageUrl: editing.imageUrl ?? '',
        scheduledAt: editing.scheduledAt ? editing.scheduledAt.slice(0, 16) : '',
        expiresAt: editing.expiresAt ? editing.expiresAt.slice(0, 16) : '',
        publishNow: !editing.scheduledAt && !!editing.publishedAt,
      });
    } else if (creating) {
      setForm(EMPTY);
    }
  }, [editing, creating]);

  function close() {
    setCreating(false);
    setEditing(null);
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {
        kind: form.kind,
        title: form.title.trim(),
        body: form.body.trim(),
        imageUrl: form.imageUrl || null,
        scheduledAt:
          !form.publishNow && form.scheduledAt
            ? new Date(form.scheduledAt).toISOString()
            : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        publishNow: form.publishNow,
      };
      return editing
        ? cafeOsApi.updateAnnouncement(cafeId, editing.id, body)
        : cafeOsApi.createAnnouncement(cafeId, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listKey });
      close();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cafeOsApi.deleteAnnouncement(cafeId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listKey });
      close();
    },
  });

  async function handleImage(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const url = await presignAndUpload(files[0], 'cafes');
      setForm((f) => ({ ...f, imageUrl: url }));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          {t('compose')}
        </Button>
      </div>

      {data ? (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3 text-sm">
          <Users className="h-4 w-4 text-primary" />
          {t('reach', { count: data.reach })}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : !data?.data.length ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.data.map((a) => {
            const Icon = KIND_ICONS[a.kind] ?? Megaphone;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setEditing(a)}
                className="w-full overflow-hidden rounded-2xl border border-border bg-card text-start transition hover:bg-accent"
              >
                {a.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.imageUrl} alt="" className="aspect-[3/1] w-full object-cover" />
                ) : null}
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold">{a.title}</p>
                    <StatusBadge status={a.status} t={t} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    {a.status === 'scheduled' && a.scheduledAt
                      ? t('scheduledFor', {
                          date: format.dateTime(new Date(a.scheduledAt), {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }),
                        })
                      : a.publishedAt
                        ? format.dateTime(new Date(a.publishedAt), {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : format.dateTime(new Date(a.createdAt), { dateStyle: 'medium' })}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Composer sheet */}
      <Sheet open={open} onOpenChange={(o) => !o && close()}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[92dvh] max-w-[430px] overflow-y-auto rounded-t-2xl"
        >
          <SheetHeader>
            <SheetTitle>{editing ? t('edit') : t('compose')}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-8">
            <div className="flex gap-2">
              {KINDS.map((kind) => {
                const Icon = KIND_ICONS[kind];
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, kind }))}
                    className={`flex flex-1 flex-col items-center gap-1 rounded-xl border p-2.5 text-[11px] font-medium transition ${
                      form.kind === kind ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t(`kinds.${kind}`)}
                  </button>
                );
              })}
            </div>

            <Input
              value={form.title}
              placeholder={t('titlePlaceholder')}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <Textarea
              value={form.body}
              rows={4}
              placeholder={t('bodyPlaceholder')}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            />

            {form.imageUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imageUrl}
                  alt=""
                  className="aspect-[3/1] w-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                  className="absolute end-2 top-2 rounded-full bg-black/60 p-1.5 text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
                className="flex h-20 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="h-4 w-4" />
                    {t('addImage')}
                  </>
                )}
              </button>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleImage(e.target.files)}
            />

            {/* Publish timing */}
            <div className="space-y-2 rounded-xl border border-border p-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, publishNow: true }))}
                  className={`flex-1 rounded-lg border py-2 text-xs font-medium transition ${
                    form.publishNow ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  {t('publishNow')}
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, publishNow: false }))}
                  className={`flex-1 rounded-lg border py-2 text-xs font-medium transition ${
                    !form.publishNow ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  {t('schedule')}
                </button>
              </div>
              {!form.publishNow ? (
                <label className="block space-y-1">
                  <span className="text-xs text-muted-foreground">{t('scheduledAt')}</span>
                  <Input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  />
                </label>
              ) : null}
              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">{t('expiresAt')}</span>
                <Input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                />
              </label>
            </div>

            <div className="flex gap-2">
              {editing ? (
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm(t('deleteConfirm'))) deleteMutation.mutate(editing.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
              <Button
                className="flex-1"
                disabled={
                  !form.title.trim() ||
                  !form.body.trim() ||
                  (!form.publishNow && !form.scheduledAt) ||
                  saveMutation.isPending ||
                  uploading
                }
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : form.publishNow ? (
                  t('publish')
                ) : (
                  t('scheduleCta')
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: Announcement['status'];
  t: ReturnType<typeof useTranslations<'cafeOs.marketing'>>;
}) {
  const styles =
    status === 'published'
      ? 'bg-green-500/10 text-green-600'
      : status === 'scheduled'
        ? 'bg-blue-500/10 text-blue-600'
        : 'bg-muted text-muted-foreground';
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles}`}>
      {t(`status.${status}`)}
    </span>
  );
}
