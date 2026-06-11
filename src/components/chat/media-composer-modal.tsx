'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Reorder } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Crop,
  Eye,
  EyeOff,
  FlipHorizontal,
  FlipVertical,
  Loader2,
  Pencil,
  RotateCcw,
  RotateCw,
  SendHorizontal,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatDuration, formatFileSize } from '@/components/chat/utils';
import { ChatBottomSheet } from '@/components/chat/chat-bottom-sheet';
import { useCoarsePointer } from '@/hooks/use-coarse-pointer';
import {
  ASPECT_PRESETS,
  DEFAULT_ADJUSTMENTS,
  DEFAULT_IMAGE_EDIT,
  estimateExportSize,
  exportEditedImage,
  getFilterCss,
  getVignetteCss,
  hasImageEdits,
  IMAGE_FILTERS,
  IMAGE_QUALITIES,
  type ImageAdjustments,
  type ImageEditState,
  type ImageQualityId,
} from '@/lib/chat/image-edit';

export type MediaComposerItem = {
  file: File;
  type: 'image' | 'video' | 'file';
  previewUrl?: string;
  spoiler?: boolean;
};

type LocalItem = MediaComposerItem & {
  id: string;
  previewUrl: string;
};

type ImageTool = 'crop' | 'filter' | 'adjust';

type MediaComposerModalProps = {
  open: boolean;
  items: MediaComposerItem[];
  onOpenChange: (open: boolean) => void;
  onSend: (items: MediaComposerItem[], caption: string) => Promise<void>;
  uploading?: boolean;
  uploadProgress?: number | null;
};

const CAPTION_MAX = 1024;

const ADJUSTMENT_SLIDERS: {
  key: keyof ImageAdjustments;
  labelKey: string;
  min: number;
  max: number;
}[] = [
  { key: 'brightness', labelKey: 'adjustBrightness', min: -100, max: 100 },
  { key: 'contrast', labelKey: 'adjustContrast', min: -100, max: 100 },
  { key: 'saturation', labelKey: 'adjustSaturation', min: -100, max: 100 },
  { key: 'warmth', labelKey: 'adjustWarmth', min: -100, max: 100 },
  { key: 'vignette', labelKey: 'adjustVignette', min: 0, max: 100 },
];

let itemIdCounter = 0;

export function MediaComposerModal({
  open,
  items,
  onOpenChange,
  onSend,
  uploading,
  uploadProgress,
}: MediaComposerModalProps) {
  const t = useTranslations('messages');
  const coarse = useCoarsePointer();
  const [localItems, setLocalItems] = useState<LocalItem[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [imageTool, setImageTool] = useState<ImageTool>('filter');
  const [editsMap, setEditsMap] = useState<Record<string, ImageEditState>>({});
  const [quality, setQuality] = useState<ImageQualityId>('high');
  const [processing, setProcessing] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [editedPreviewUrls, setEditedPreviewUrls] = useState<Record<string, string>>({});
  const [naturalAspects, setNaturalAspects] = useState<Record<string, number>>({});
  const [videoTrimStart, setVideoTrimStart] = useState(0);
  const [videoTrimEnd, setVideoTrimEnd] = useState(100);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createdUrlsRef = useRef<string[]>([]);

  // Initialize local working copy (stable ids + object URLs) when opening.
  useEffect(() => {
    if (!open) return;
    const next: LocalItem[] = items.map((item) => {
      let url = item.previewUrl;
      if (!url) {
        url = URL.createObjectURL(item.file);
        createdUrlsRef.current.push(url);
      }
      itemIdCounter += 1;
      return { ...item, id: `media-${itemIdCounter}`, previewUrl: url, spoiler: false };
    });
    setLocalItems(next);
    setCurrentId(next[0]?.id ?? null);
    setCaption('');
    setEditsMap({});
    setNaturalAspects({});
    setEditedPreviewUrls((prev) => {
      Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
      return {};
    });
    setSendError(null);
    setEditMode(false);
    setImageTool('filter');
    setQuality('high');
    setVideoTrimStart(0);
    setVideoTrimEnd(100);
  }, [open, items]);

  useEffect(() => {
    if (open) return;
    createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    createdUrlsRef.current = [];
  }, [open]);

  useEffect(() => {
    return () => {
      if (previewRefreshRef.current) clearTimeout(previewRefreshRef.current);
      createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const index = Math.max(
    0,
    localItems.findIndex((item) => item.id === currentId),
  );
  const current = localItems[index];
  const isImage = current?.type === 'image';
  const isVideo = current?.type === 'video';
  const currentEdits = current ? (editsMap[current.id] ?? DEFAULT_IMAGE_EDIT) : DEFAULT_IMAGE_EDIT;
  const previewUrl = current?.previewUrl ?? '';

  const setCurrentEdits = useCallback(
    (patch: Partial<ImageEditState> | ((prev: ImageEditState) => ImageEditState)) => {
      if (!current) return;
      setEditsMap((prev) => {
        const base = prev[current.id] ?? DEFAULT_IMAGE_EDIT;
        const next = typeof patch === 'function' ? patch(base) : { ...base, ...patch };
        return { ...prev, [current.id]: next };
      });
    },
    [current],
  );

  const refreshEditedPreview = useCallback(async () => {
    if (!current || current.type !== 'image') return;
    const edits = editsMap[current.id] ?? DEFAULT_IMAGE_EDIT;
    const key = current.id;

    if (!hasImageEdits(edits)) {
      setEditedPreviewUrls((prev) => {
        if (!prev[key]) return prev;
        URL.revokeObjectURL(prev[key]);
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    const file = await exportEditedImage(current.file, edits);
    const url = URL.createObjectURL(file);
    setEditedPreviewUrls((prev) => {
      if (prev[key]) URL.revokeObjectURL(prev[key]);
      return { ...prev, [key]: url };
    });
  }, [current, editsMap]);

  const schedulePreviewRefresh = useCallback(() => {
    if (previewRefreshRef.current) clearTimeout(previewRefreshRef.current);
    previewRefreshRef.current = setTimeout(() => {
      void refreshEditedPreview().catch(() => undefined);
    }, 250);
  }, [refreshEditedPreview]);

  useEffect(() => {
    if (!editMode || !isImage || imageTool === 'crop') return;
    if (!hasImageEdits(currentEdits)) return;
    schedulePreviewRefresh();
  }, [currentEdits, editMode, imageTool, isImage, schedulePreviewRefresh]);

  const onCropComplete = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      setCurrentEdits({ croppedAreaPixels });
      schedulePreviewRefresh();
    },
    [schedulePreviewRefresh, setCurrentEdits],
  );

  const handleSend = useCallback(async () => {
    setProcessing(true);
    setSendError(null);
    try {
      const processed: MediaComposerItem[] = await Promise.all(
        localItems.map(async (item) => {
          if (item.type !== 'image') {
            return { file: item.file, type: item.type, spoiler: item.spoiler };
          }
          const edits = editsMap[item.id] ?? DEFAULT_IMAGE_EDIT;
          const file = await exportEditedImage(item.file, edits, quality);
          return { file, type: item.type, spoiler: item.spoiler };
        }),
      );
      await onSend(processed, caption.trim());
      onOpenChange(false);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : t('mediaSendFailed'));
    } finally {
      setProcessing(false);
    }
  }, [caption, editsMap, localItems, onOpenChange, onSend, quality, t]);

  const resetCurrentEdits = () => {
    if (!current) return;
    setEditsMap((prev) => ({ ...prev, [current.id]: { ...DEFAULT_IMAGE_EDIT, adjustments: { ...DEFAULT_ADJUSTMENTS } } }));
    setEditedPreviewUrls((prev) => {
      if (!prev[current.id]) return prev;
      URL.revokeObjectURL(prev[current.id]);
      const next = { ...prev };
      delete next[current.id];
      return next;
    });
  };

  const goTo = (i: number) => {
    const target = localItems[i];
    if (!target) return;
    setEditMode(false);
    setCurrentId(target.id);
  };

  const toggleSpoiler = () => {
    if (!current) return;
    setLocalItems((prev) =>
      prev.map((item) =>
        item.id === current.id ? { ...item, spoiler: !item.spoiler } : item,
      ),
    );
  };

  const hasImages = localItems.some((item) => item.type === 'image');
  const estimatedTotal = useMemo(() => {
    return localItems.reduce((sum, item) => {
      if (item.type !== 'image') return sum + item.file.size;
      return sum + estimateExportSize(item.file.size, quality);
    }, 0);
  }, [localItems, quality]);

  const editedPreview = hasImageEdits(currentEdits);
  const displayPreviewUrl = (current && editedPreviewUrls[current.id]) || previewUrl;
  const useCssPreview = displayPreviewUrl === previewUrl && editedPreview;
  const vignetteOverlay = useCssPreview
    ? getVignetteCss(currentEdits.adjustments.vignette)
    : undefined;

  if (!current) return null;

  const busy = uploading || processing;
  const cropAspect =
    currentEdits.aspect ?? naturalAspects[current.id] ?? 4 / 3;

  const imagePreview = (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="relative max-h-[46dvh] overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayPreviewUrl}
          alt=""
          className="max-h-[46dvh] max-w-full object-contain transition-transform duration-200"
          style={
            useCssPreview
              ? {
                  filter: getFilterCss(currentEdits.filter, currentEdits.adjustments),
                  transform: `rotate(${currentEdits.rotation}deg) scaleX(${currentEdits.flipHorizontal ? -1 : 1}) scaleY(${currentEdits.flipVertical ? -1 : 1})`,
                }
              : undefined
          }
        />
        {vignetteOverlay ? (
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: vignetteOverlay }}
            aria-hidden
          />
        ) : null}
        {current.spoiler ? (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
            <EyeOff className="size-3" />
            {t('spoiler')}
          </span>
        ) : null}
      </div>
    </div>
  );

  const cropToolbar = (
    <div className="space-y-2 px-4 pb-3">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {ASPECT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setCurrentEdits({ aspect: preset.value })}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors',
              (currentEdits.aspect ?? undefined) === preset.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted/50',
            )}
          >
            {t(preset.labelKey)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="size-8 rounded-full"
          onClick={() => setCurrentEdits({ rotation: currentEdits.rotation - 90 })}
          aria-label={t('rotateLeft')}
        >
          <RotateCcw className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="size-8 rounded-full"
          onClick={() => setCurrentEdits({ rotation: currentEdits.rotation + 90 })}
          aria-label={t('rotateRight')}
        >
          <RotateCw className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="size-8 rounded-full"
          onClick={() => setCurrentEdits({ flipHorizontal: !currentEdits.flipHorizontal })}
          aria-label={t('flipHorizontal')}
        >
          <FlipHorizontal className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="size-8 rounded-full"
          onClick={() => setCurrentEdits({ flipVertical: !currentEdits.flipVertical })}
          aria-label={t('flipVertical')}
        >
          <FlipVertical className="size-4" />
        </Button>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={currentEdits.cropZoom}
          onChange={(e) => setCurrentEdits({ cropZoom: Number(e.target.value) })}
          className="flex-1"
          aria-label={t('cropZoom')}
        />
      </div>
    </div>
  );

  const imageToolbar = editMode ? (
    <div className="border-t border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <p className="text-xs font-semibold text-muted-foreground">{t('editingPhoto')}</p>
        <div className="flex items-center gap-1">
          <Button type="button" size="sm" variant="ghost" className="h-8 rounded-full text-xs" onClick={resetCurrentEdits}>
            {t('resetEdits')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 rounded-full"
            onClick={() => {
              void refreshEditedPreview().catch(() => undefined);
              setEditMode(false);
            }}
          >
            <X className="mr-1 size-3.5" />
            {t('doneEditing')}
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-around px-2 py-2">
        {(
          [
            { id: 'crop' as const, icon: Crop, label: t('editCrop') },
            { id: 'filter' as const, icon: Sparkles, label: t('editFilters') },
            { id: 'adjust' as const, icon: SlidersHorizontal, label: t('editAdjust') },
          ] as const
        ).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setImageTool(id);
              if (id !== 'crop') schedulePreviewRefresh();
            }}
            className={cn(
              'flex min-w-[72px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium transition-colors',
              imageTool === id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/50',
            )}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </div>

      {imageTool === 'crop' ? cropToolbar : null}

      {imageTool === 'filter' ? (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
          {IMAGE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setCurrentEdits({ filter: filter.id })}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  'block size-14 overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-background',
                  currentEdits.filter === filter.id ? 'ring-primary' : 'ring-transparent',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt=""
                  className="size-full object-cover"
                  style={{ filter: getFilterCss(filter.id) }}
                />
              </span>
              <span
                className={cn(
                  'text-[10px] font-medium',
                  currentEdits.filter === filter.id ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {t(filter.labelKey)}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {imageTool === 'adjust' ? (
        <div className="space-y-2 px-4 pb-3">
          {ADJUSTMENT_SLIDERS.map(({ key, labelKey, min, max }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs text-muted-foreground">{t(labelKey)}</span>
              <input
                type="range"
                min={min}
                max={max}
                step={1}
                value={currentEdits.adjustments[key]}
                onChange={(e) =>
                  setCurrentEdits((prev) => ({
                    ...prev,
                    adjustments: { ...prev.adjustments, [key]: Number(e.target.value) },
                  }))
                }
                className="flex-1"
                aria-label={t(labelKey)}
              />
              <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                {currentEdits.adjustments[key]}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  ) : null;

  const thumbnailStrip =
    localItems.length > 1 ? (
      <Reorder.Group
        axis="x"
        values={localItems}
        onReorder={setLocalItems}
        className="flex gap-2 overflow-x-auto border-t border-border px-4 py-2.5 scrollbar-none"
      >
        {localItems.map((item, i) => (
          <Reorder.Item
            key={item.id}
            value={item}
            className="relative shrink-0 cursor-grab active:cursor-grabbing"
            whileDrag={{ scale: 1.08, zIndex: 10 }}
          >
            <button
              type="button"
              onClick={() => {
                setEditMode(false);
                setCurrentId(item.id);
              }}
              className={cn(
                'block size-14 overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-background transition-all',
                item.id === current.id ? 'ring-primary' : 'ring-transparent opacity-70',
              )}
            >
              {item.type === 'image' ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={editedPreviewUrls[item.id] ?? item.previewUrl}
                  alt=""
                  className="size-full object-cover"
                  draggable={false}
                />
              ) : item.type === 'video' ? (
                <video src={item.previewUrl} muted className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center bg-muted text-[9px] font-medium text-muted-foreground">
                  {item.file.name.split('.').pop()?.toUpperCase() ?? 'FILE'}
                </span>
              )}
            </button>
            <span className="pointer-events-none absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow">
              {i + 1}
            </span>
            {item.spoiler ? (
              <span className="pointer-events-none absolute bottom-0.5 left-0.5 flex size-4 items-center justify-center rounded-full bg-black/60 text-white">
                <EyeOff className="size-2.5" />
              </span>
            ) : null}
          </Reorder.Item>
        ))}
      </Reorder.Group>
    ) : null;

  const progressValue = uploadProgress ?? null;

  const composerBody = (
    <>
      <div className="relative flex min-h-[260px] flex-1 flex-col bg-muted/30">
        {isImage ? (
          editMode && imageTool === 'crop' ? (
            <Cropper
              image={previewUrl}
              crop={currentEdits.cropPosition}
              zoom={currentEdits.cropZoom}
              rotation={currentEdits.rotation}
              aspect={cropAspect}
              onCropChange={(cropPosition) => setCurrentEdits({ cropPosition })}
              onZoomChange={(cropZoom) => setCurrentEdits({ cropZoom })}
              onRotationChange={(rotation) => setCurrentEdits({ rotation })}
              onCropComplete={onCropComplete}
              onMediaLoaded={(mediaSize) =>
                setNaturalAspects((prev) => ({
                  ...prev,
                  [current.id]: mediaSize.naturalWidth / mediaSize.naturalHeight,
                }))
              }
              style={{
                containerStyle: { borderRadius: 0, background: 'hsl(var(--muted) / 0.3)' },
              }}
            />
          ) : (
            imagePreview
          )
        ) : isVideo ? (
          <div className="w-full space-y-3 p-4">
            <video
              ref={videoRef}
              src={previewUrl}
              controls
              className="max-h-[40dvh] w-full rounded-xl bg-black"
            />
            <div className="space-y-1 px-1">
              <label className="text-xs text-muted-foreground">{t('trimVideo')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={videoTrimEnd - 1}
                  value={videoTrimStart}
                  onChange={(e) => setVideoTrimStart(Number(e.target.value))}
                  className="flex-1"
                  aria-label={t('trimStart')}
                />
                <input
                  type="range"
                  min={videoTrimStart + 1}
                  max={100}
                  value={videoTrimEnd}
                  onChange={(e) => setVideoTrimEnd(Number(e.target.value))}
                  className="flex-1"
                  aria-label={t('trimEnd')}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6">
            <p className="text-sm font-medium">{current.file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(current.file.size)}</p>
          </div>
        )}

        {localItems.length > 1 ? (
          <>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full"
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
              aria-label={t('previousMedia')}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full"
              disabled={index === localItems.length - 1}
              onClick={() => goTo(index + 1)}
              aria-label={t('nextMedia')}
            >
              <ChevronRight className="size-4" />
            </Button>
            <span className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-background/80 px-2 py-0.5 text-xs">
              {index + 1} / {localItems.length}
            </span>
          </>
        ) : null}
      </div>

      {thumbnailStrip}

      {isImage ? imageToolbar : null}

      {(isImage || isVideo) && !editMode ? (
        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          {isImage ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => {
                setEditMode(true);
                setImageTool('filter');
              }}
            >
              <Pencil className="size-4" />
              {editedPreview ? t('editPhotoAgain') : t('editPhoto')}
            </Button>
          ) : null}
          <Button
            type="button"
            variant={current.spoiler ? 'default' : 'outline'}
            className={cn('rounded-full', !isImage && 'flex-1')}
            onClick={toggleSpoiler}
          >
            {current.spoiler ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {current.spoiler ? t('spoilerOn') : t('markSpoiler')}
          </Button>
        </div>
      ) : null}

      {hasImages && !editMode ? (
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-border px-4 py-2.5 scrollbar-none">
          {IMAGE_QUALITIES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setQuality(preset.id)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors',
                quality === preset.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted/50',
              )}
            >
              {t(preset.labelKey)}
            </button>
          ))}
          <span className="ms-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">
            ≈ {formatFileSize(estimatedTotal)}
          </span>
        </div>
      ) : null}

      {isVideo && videoRef.current?.duration ? (
        <p className="px-4 text-center text-xs text-muted-foreground">
          {formatDuration(Math.round(videoRef.current.duration))}
        </p>
      ) : null}

      <div className="space-y-3 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {sendError ? (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{sendError}</p>
        ) : null}
        <div className="space-y-1">
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, CAPTION_MAX))}
            placeholder={t('addCaption')}
            rows={2}
            className="resize-none rounded-xl"
          />
          <p className="text-end text-[10px] tabular-nums text-muted-foreground">
            {caption.length} / {CAPTION_MAX}
          </p>
        </div>
        <Button className="relative w-full overflow-hidden rounded-full" disabled={busy} onClick={() => void handleSend()}>
          {busy && progressValue !== null ? (
            <span
              className="absolute inset-y-0 left-0 bg-primary-foreground/20 transition-[width] duration-200"
              style={{ width: `${progressValue}%` }}
              aria-hidden
            />
          ) : null}
          {busy ? (
            <span className="relative flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              {progressValue !== null ? `${progressValue}%` : null}
            </span>
          ) : (
            <>
              <SendHorizontal className="size-4" />
              {localItems.length > 1 ? `${t('send')} (${localItems.length})` : t('send')}
            </>
          )}
        </Button>
      </div>
    </>
  );

  if (coarse) {
    return (
      <ChatBottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t('mediaComposerTitle')}
        description={t('mediaComposerDescription')}
        className="max-h-[95dvh]"
      >
        {composerBody}
      </ChatBottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle>{t('mediaComposerTitle')}</DialogTitle>
          <DialogDescription className="sr-only">{t('mediaComposerDescription')}</DialogDescription>
        </DialogHeader>
        {composerBody}
      </DialogContent>
    </Dialog>
  );
}
