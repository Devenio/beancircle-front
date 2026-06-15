'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Coffee,
  ImagePlus,
  Loader2,
  MapPin,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  createBean,
  type Bean,
  type CreateBeanInput,
} from '@/lib/api/beans';
import { presignAndUpload } from '@/lib/api/uploads';
import { BeanBody } from './bean-body';
import { MentionTextarea, type CafeMention } from './mention-textarea';

const PROMPT_KEYS = [
  'brewing',
  'thought',
  'working',
  'cafeToday',
  'conversation',
] as const;

export type BeanComposerContext = {
  cafeId?: string;
  squadId?: string;
  eventId?: string;
  label?: string;
};

type MediaDraft = {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'GIF';
};

export function BeanComposer({
  locale,
  context,
  parentId,
  quotedBean,
  onPosted,
  compact = false,
}: {
  locale: string;
  context?: BeanComposerContext;
  parentId?: string;
  quotedBean?: Bean | null;
  onPosted?: () => void;
  compact?: boolean;
}) {
  const t = useTranslations('beans');
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const [body, setBody] = useState('');
  const [media, setMedia] = useState<MediaDraft[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [showLocation, setShowLocation] = useState(false);
  const [locationLabel, setLocationLabel] = useState('');
  const [taggedCafe, setTaggedCafe] = useState<CafeMention | null>(null);

  const effectiveCafeId = taggedCafe?.id ?? context?.cafeId;

  const promptKey = useMemo(
    () =>
      parentId
        ? null
        : PROMPT_KEYS[Math.floor(Math.random() * PROMPT_KEYS.length)],
    [parentId],
  );

  const mutation = useMutation({
    mutationFn: () => {
      const validPollOptions = pollOptions
        .map((o) => o.trim())
        .filter(Boolean);
      const input: CreateBeanInput = {
        body: body.trim() || undefined,
        parentId,
        quotedBeanId: quotedBean?.id,
        cafeId: effectiveCafeId,
        squadId: context?.squadId,
        eventId: context?.eventId,
        locationLabel:
          showLocation && locationLabel.trim()
            ? locationLabel.trim()
            : undefined,
        media: media.length ? media : undefined,
        poll:
          showPoll && validPollOptions.length >= 2
            ? { options: validPollOptions }
            : undefined,
      };
      return createBean(input, locale);
    },
    onSuccess: () => {
      setBody('');
      setMedia([]);
      setShowPoll(false);
      setPollOptions(['', '']);
      setShowLocation(false);
      setLocationLabel('');
      setTaggedCafe(null);
      qc.invalidateQueries({ queryKey: ['beans'] });
      if (parentId) qc.invalidateQueries({ queryKey: ['bean', parentId] });
      onPosted?.();
    },
  });

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 4 - media.length)) {
        const url = await presignAndUpload(file, 'beans');
        const type: MediaDraft['type'] = file.type.startsWith('video/')
          ? 'VIDEO'
          : file.type === 'image/gif'
            ? 'GIF'
            : 'IMAGE';
        setMedia((prev) =>
          prev.length < 4 ? [...prev, { url, type }] : prev,
        );
      }
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  const hasPoll =
    showPoll && pollOptions.filter((o) => o.trim()).length >= 2;
  const canPost =
    !mutation.isPending &&
    !uploading &&
    (body.trim().length > 0 || media.length > 0 || hasPoll);

  return (
    <div className="space-y-3">
      {quotedBean ? (
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs font-semibold">
            {quotedBean.author.name || quotedBean.author.username}
          </p>
          <BeanBody
            body={quotedBean.body}
            className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground"
          />
        </div>
      ) : null}

      {context?.label ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          ☕ {context.label}
        </span>
      ) : null}

      {taggedCafe ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
          <Coffee className="size-3" />
          {taggedCafe.name}
          <button
            type="button"
            onClick={() => setTaggedCafe(null)}
            className="ms-0.5 rounded-full hover:opacity-70"
            aria-label={t('composer.removeCafe')}
          >
            <X className="size-3" />
          </button>
        </span>
      ) : null}

      <MentionTextarea
        locale={locale}
        value={body}
        onChange={setBody}
        onCafeMention={(cafe) => setTaggedCafe(cafe)}
        placeholder={
          parentId
            ? t('composer.replyPlaceholder')
            : t(`composer.prompts.${promptKey ?? 'brewing'}`)
        }
        maxLength={2000}
        className={cn(
          'resize-none border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0',
          compact ? 'min-h-16' : 'min-h-28',
        )}
      />

      {media.length ? (
        <div className="grid grid-cols-2 gap-2">
          {media.map((m, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl">
              {m.type === 'VIDEO' ? (
                <video src={m.url} className="aspect-square w-full bg-black object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" className="aspect-square w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => setMedia((prev) => prev.filter((_, j) => j !== i))}
                className="absolute end-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {showPoll ? (
        <div className="space-y-1.5 rounded-xl border border-border p-3">
          {pollOptions.map((option, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Input
                value={option}
                maxLength={60}
                onChange={(e) =>
                  setPollOptions((prev) =>
                    prev.map((o, j) => (j === i ? e.target.value : o)),
                  )
                }
                placeholder={t('composer.pollOption', { n: i + 1 })}
              />
              {pollOptions.length > 2 ? (
                <button
                  type="button"
                  className="text-muted-foreground"
                  onClick={() =>
                    setPollOptions((prev) => prev.filter((_, j) => j !== i))
                  }
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          ))}
          {pollOptions.length < 4 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPollOptions((prev) => [...prev, ''])}
            >
              {t('composer.addOption')}
            </Button>
          ) : null}
        </div>
      ) : null}

      {showLocation ? (
        <Input
          value={locationLabel}
          maxLength={120}
          onChange={(e) => setLocationLabel(e.target.value)}
          placeholder={t('composer.locationPlaceholder')}
        />
      ) : null}

      <div className="flex items-center gap-1.5">
        <input
          ref={fileInput}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={uploading || media.length >= 4}
          onClick={() => fileInput.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-4.5 animate-spin" />
          ) : (
            <ImagePlus className="size-4.5" />
          )}
        </Button>
        {!parentId ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(showPoll && 'bg-primary/10 text-primary')}
              onClick={() => setShowPoll((v) => !v)}
            >
              <BarChart3 className="size-4.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(showLocation && 'bg-primary/10 text-primary')}
              onClick={() => setShowLocation((v) => !v)}
            >
              <MapPin className="size-4.5" />
            </Button>
          </>
        ) : null}
        <span className="ms-auto text-xs text-muted-foreground">
          {body.length > 0 ? `${body.length}/2000` : ''}
        </span>
        <Button
          type="button"
          disabled={!canPost}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending
            ? '…'
            : parentId
              ? t('composer.reply')
              : t('composer.share')}
        </Button>
      </div>
    </div>
  );
}
