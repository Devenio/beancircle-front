'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { MenuItem } from '@/components/cafe-menu/types';
import { cafeOsApi } from '@/lib/api/cafe-os';
import { presignAndUpload } from '@/lib/api/uploads';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Loader2, Trash2, Video, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

type Props = {
  cafeId: string;
  categoryId: string;
  /** null = creating a new item */
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
};

type FormState = {
  name: string;
  description: string;
  price: string;
  discountPrice: string;
  calories: string;
  prepTimeMin: string;
  ingredients: string[];
  allergens: string[];
  images: string[];
  videoUrl: string;
  isAvailable: boolean;
};

const EMPTY: FormState = {
  name: '',
  description: '',
  price: '',
  discountPrice: '',
  calories: '',
  prepTimeMin: '',
  ingredients: [],
  allergens: [],
  images: [],
  videoUrl: '',
  isAvailable: true,
};

function fromItem(item: MenuItem | null): FormState {
  if (!item) return EMPTY;
  return {
    name: item.name,
    description: item.description ?? '',
    price: String(item.price || ''),
    discountPrice: item.discountPrice ? String(item.discountPrice) : '',
    calories: item.calories ? String(item.calories) : '',
    prepTimeMin: item.prepTimeMin ? String(item.prepTimeMin) : '',
    ingredients: item.ingredients ?? [],
    allergens: item.allergens ?? [],
    images: [
      ...(item.imageUrl ? [item.imageUrl] : []),
      ...(item.images ?? []).filter((u) => u !== item.imageUrl),
    ],
    videoUrl: item.videoUrl ?? '',
    isAvailable: item.isAvailable,
  };
}

export function ItemEditorSheet({ cafeId, categoryId, item, open, onClose }: Props) {
  const t = useTranslations('cafeOs.menu');
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setForm(fromItem(item));
  }, [open, item]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function buildBody() {
    return {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price) || 0,
      discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
      calories: form.calories ? Number(form.calories) : null,
      prepTimeMin: form.prepTimeMin ? Number(form.prepTimeMin) : null,
      ingredients: form.ingredients,
      allergens: form.allergens,
      imageUrl: form.images[0] ?? null,
      images: form.images,
      videoUrl: form.videoUrl || null,
      isAvailable: form.isAvailable,
    };
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      item
        ? cafeOsApi.updateMenuItem(cafeId, item.id, buildBody())
        : cafeOsApi.createMenuItem(cafeId, categoryId, buildBody()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cafe-menu', cafeId] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => cafeOsApi.deleteMenuItem(cafeId, item!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cafe-menu', cafeId] });
      onClose();
    },
  });

  async function handleImages(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).map((f) => presignAndUpload(f, 'menus')),
      );
      set('images', [...form.images, ...urls]);
    } finally {
      setUploading(false);
    }
  }

  async function handleVideo(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      set('videoUrl', await presignAndUpload(files[0], 'menus'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] max-w-[430px] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{item ? t('editItem') : t('newItem')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-8">
          {/* Media */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {form.images.map((url) => (
              <div key={url} className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-20 w-20 rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => set('images', form.images.filter((u) => u !== url))}
                  className="absolute -end-1.5 -top-1.5 rounded-full bg-black/70 p-1 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => imageInput.current?.click()}
              disabled={uploading}
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
              <span className="text-[10px]">{t('addPhoto')}</span>
            </button>
            <button
              type="button"
              onClick={() => videoInput.current?.click()}
              disabled={uploading}
              className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-muted-foreground ${
                form.videoUrl ? 'border-primary text-primary' : 'border-border'
              }`}
            >
              <Video className="h-5 w-5" />
              <span className="text-[10px]">{form.videoUrl ? t('videoSet') : t('addVideo')}</span>
            </button>
            <input
              ref={imageInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => handleImages(e.target.files)}
            />
            <input
              ref={videoInput}
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => handleVideo(e.target.files)}
            />
          </div>

          <Field label={t('itemName')}>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label={t('itemDescription')}>
            <Textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('price')}>
              <Input
                type="number"
                inputMode="numeric"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
              />
            </Field>
            <Field label={t('discountPrice')}>
              <Input
                type="number"
                inputMode="numeric"
                value={form.discountPrice}
                onChange={(e) => set('discountPrice', e.target.value)}
              />
            </Field>
            <Field label={t('calories')}>
              <Input
                type="number"
                inputMode="numeric"
                value={form.calories}
                onChange={(e) => set('calories', e.target.value)}
              />
            </Field>
            <Field label={t('prepTime')}>
              <Input
                type="number"
                inputMode="numeric"
                value={form.prepTimeMin}
                onChange={(e) => set('prepTimeMin', e.target.value)}
              />
            </Field>
          </div>

          <TagInput
            label={t('ingredients')}
            placeholder={t('ingredientsHint')}
            values={form.ingredients}
            onChange={(v) => set('ingredients', v)}
          />
          <TagInput
            label={t('allergens')}
            placeholder={t('allergensHint')}
            values={form.allergens}
            onChange={(v) => set('allergens', v)}
          />

          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <span className="text-sm font-medium">{t('available')}</span>
            <Switch
              checked={form.isAvailable}
              onCheckedChange={(c) => set('isAvailable', c)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            {item ? (
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 text-destructive"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              className="flex-1"
              disabled={!form.name.trim() || !form.price || saveMutation.isPending || uploading}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('save')
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function TagInput({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  function commit() {
    const parts = draft
      .split(/[,،]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !values.includes(s));
    if (parts.length) onChange([...values, ...parts]);
    setDraft('');
  }

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {values.length ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs"
            >
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <Input
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
      />
    </div>
  );
}
