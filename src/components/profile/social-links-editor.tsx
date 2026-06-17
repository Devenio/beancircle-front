'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type SocialLink as SocialLinkBase,
  type LinkVisibility,
  type PlatformId,
  SOCIAL_PLATFORMS,
  getPlatform,
  isValidHttpUrl,
} from '@/lib/social-platforms';

type SocialLink = SocialLinkBase & { _tempId?: string };
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface SocialLinksEditorProps {
  /** Current link list (controlled). */
  value: SocialLink[];
  /** Called whenever the list changes (add, remove, reorder, edit). */
  onChange: (links: SocialLink[]) => void;
  /** Visibility applied to newly-added links that don't specify one. */
  defaultVisibility?: LinkVisibility;
  /** True while a save mutation is in-flight. */
  saving?: boolean;
  /** Called to persist. If omitted the component renders only the editor. */
  onSave?: () => void;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function nextOrder(links: SocialLink[]): number {
  return links.reduce((max, l) => Math.max(max, l.order ?? 0), -1) + 1;
}

let _uid = 0;
function tempId() {
  return `__new_${++_uid}_${Date.now()}`;
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function SocialLinksEditor({
  value,
  onChange,
  defaultVisibility = 'everyone',
  saving,
  onSave,
  className,
}: SocialLinksEditorProps) {
  const t = useTranslations('profile');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  /* IDs are stable — use index as the sortable key when no id field. */
  const itemIds = useMemo(() => value.map((_, i) => `link-${i}`), [value]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = itemIds.indexOf(String(active.id));
    const newIdx = itemIds.indexOf(String(over.id));
    const next = arrayMove(value, oldIdx, newIdx).map((l, i) => ({
      ...l,
      order: i,
    }));
    onChange(next);
  }

  function addLink(platform: PlatformId) {
    const link: SocialLink = {
      _tempId: tempId(),
      platform,
      url: '',
      visibility: defaultVisibility,
      order: nextOrder(value),
    };
    onChange([...value, link]);
    setPickerOpen(false);
  }

  function updateLink(index: number, patch: Partial<SocialLink>) {
    const next = value.map((l, i) => (i === index ? { ...l, ...patch } : l));
    onChange(next);
  }

  function removeLink(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  /* Determine which platforms are already added (exclude duplicates). */
  const usedPlatforms = new Set(value.map((l) => l.platform));
  const availablePlatforms = SOCIAL_PLATFORMS.filter(
    (p) => !usedPlatforms.has(p.id),
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* Existing links */}
      {value.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {value.map((link, index) => (
                <SortableLinkRow
                  key={itemIds[index]}
                  id={itemIds[index]}
                  link={link}
                  index={index}
                  onUpdate={(patch) => updateLink(index, patch)}
                  onRemove={() => removeLink(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="py-3 text-center text-sm text-muted-foreground">
          {t('emptyLinks')}
        </p>
      )}

      {/* Add-link picker */}
      {pickerOpen && (
        <PlatformPicker
          platforms={availablePlatforms}
          onSelect={addLink}
          onCustomOpen={() => {
            setCustomOpen(true);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {customOpen && (
        <CustomLinkForm
          defaultVisibility={defaultVisibility}
          onAdd={(link) => {
            onChange([...value, { ...link, order: nextOrder(value), _tempId: tempId() }]);
            setCustomOpen(false);
          }}
          onCancel={() => setCustomOpen(false)}
        />
      )}

      {/* Add button */}
      {(!pickerOpen && !customOpen) && (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={() => setPickerOpen(true)}
          disabled={saving}
        >
          <Plus className="size-4" />
          {t('addLink')}
        </Button>
      )}

      {/* Save button (optional — caller controls the mutation). */}
      {onSave && (
        <Button
          type="button"
          className="w-full"
          disabled={saving}
          onClick={onSave}
        >
          {saving ? t('savingLinks') : t('saveLinks')}
        </Button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sortable Row                                                        */
/* ------------------------------------------------------------------ */

interface SortableLinkRowProps {
  id: string;
  link: SocialLink;
  index: number;
  onUpdate: (patch: Partial<SocialLink>) => void;
  onRemove: () => void;
}

function SortableLinkRow({
  id,
  link,
  index,
  onUpdate,
  onRemove,
}: SortableLinkRowProps) {
  const t = useTranslations('profile');
  const tp = useTranslations('settings');
  const [visOpen, setVisOpen] = useState(false);
  const visRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const meta = getPlatform(link.platform);
  const urlInvalid = link.url.length > 0 && !isValidHttpUrl(link.url);

  const visOptions: { value: LinkVisibility; label: string }[] = [
    { value: 'everyone', label: tp('visibility.everyone') },
    { value: 'contacts', label: tp('visibility.contacts') },
    { value: 'nobody', label: tp('visibility.nobody') },
  ];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-start gap-2 rounded-xl border bg-card p-3',
        isDragging && 'z-10 shadow-lg',
        urlInvalid && 'border-destructive/60',
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="mt-2.5 touch-none text-muted-foreground"
        aria-label={t('reorderHint')}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      {/* Brand icon chip */}
      <span
        className={cn(
          'mt-2 flex size-8 shrink-0 items-center justify-center rounded-lg',
          meta.brand ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        <meta.Glyph className="size-4" />
      </span>

      {/* Input area */}
      <div className="min-w-0 flex-1 space-y-1">
        {/* Custom label row (only for platform === 'custom') */}
        {link.platform === 'custom' && (
          <Input
            value={link.label ?? ''}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder={t('customLabelPlaceholder')}
            className="h-8 text-sm"
            dir="auto"
          />
        )}

        <Input
          value={link.url}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder={t(`placeholders.${meta.placeholderKey}`)}
          className="h-9 text-sm"
          dir="ltr"
          autoFocus={link.url === ''}
        />

        {urlInvalid && (
          <p className="text-xs text-destructive">{t('invalidUrl')}</p>
        )}

        {/* Per-link visibility toggle */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setVisOpen((o) => !o)}
          >
            {link.visibility === 'nobody' ? (
              <EyeOff className="size-3" />
            ) : (
              <Eye className="size-3" />
            )}
            <span>
              {visOptions.find((o) => o.value === link.visibility)?.label ??
                tp('visibility.everyone')}
            </span>
            <ChevronDown
              className={cn(
                'size-3 transition-transform',
                visOpen && 'rotate-180',
              )}
            />
          </button>
        </div>

        {/* Visibility dropdown */}
        {visOpen && (
          <div className="rounded-lg border bg-popover p-1 shadow-md" ref={visRef}>
            {visOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm',
                  link.visibility === opt.value
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/50',
                )}
                onClick={() => {
                  onUpdate({ visibility: opt.value });
                  setVisOpen(false);
                }}
              >
                {opt.value === 'nobody' ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Remove */}
      <button
        type="button"
        className="mt-2 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        aria-label="Remove"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Platform Picker (curated list)                                      */
/* ------------------------------------------------------------------ */

function PlatformPicker({
  platforms,
  onSelect,
  onCustomOpen,
  onClose,
}: {
  platforms: typeof SOCIAL_PLATFORMS;
  onSelect: (id: PlatformId) => void;
  onCustomOpen: () => void;
  onClose: () => void;
}) {
  const t = useTranslations('profile');

  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">{t('addLink')}</span>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {platforms.map((p) => (
          <button
            key={p.id}
            type="button"
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition hover:bg-accent"
            onClick={() => onSelect(p.id)}
          >
            <p.Glyph className="size-4 text-muted-foreground" />
            <span className="truncate">{t(`platforms.${p.labelKey}`)}</span>
          </button>
        ))}

        {/* Custom link option */}
        <button
          type="button"
          className="col-span-2 flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent"
          onClick={onCustomOpen}
        >
          <Plus className="size-4" />
          {t('customLink')}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom Link Inline Form                                             */
/* ------------------------------------------------------------------ */

function CustomLinkForm({
  defaultVisibility,
  onAdd,
  onCancel,
}: {
  defaultVisibility: LinkVisibility;
  onAdd: (link: SocialLink) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('profile');
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');

  function submit() {
    if (!label.trim() || !isValidHttpUrl(url)) return;
    onAdd({ platform: 'custom', url, label: label.trim(), visibility: defaultVisibility });
  }

  return (
    <div className="rounded-xl border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t('customLink')}</span>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={t('customLabelPlaceholder')}
        className="h-9 text-sm"
        dir="auto"
        autoFocus
      />
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={t('placeholders.phUrl')}
        className="h-9 text-sm"
        dir="ltr"
      />
      <Button
        type="button"
        size="sm"
        className="w-full"
        disabled={!label.trim() || !isValidHttpUrl(url)}
        onClick={submit}
      >
        {t('addLink')}
      </Button>
    </div>
  );
}
