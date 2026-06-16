'use client';

import { Suspense, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Check,
  Download,
  FileJson,
  GripVertical,
  Layers,
  Palette,
  Plus,
  RefreshCw,
  Search,
  Store,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MENU_THEME_PRESETS,
  type MenuThemeConfig,
} from '@/components/cafe-menu/themes';
import type { MenuTheme } from '@/components/cafe-menu/types';
import {
  adminApplyTemplate,
  adminAssignTemplate,
  adminCreateTemplate,
  adminDeleteTemplate,
  adminGetTemplate,
  adminImportAllFileTemplates,
  adminImportFileTemplate,
  adminListCafes,
  adminListFileTemplates,
  adminListTemplates,
  adminTemplateAssignments,
  adminUnassignTemplate,
  adminUpdateTemplate,
  type MenuTemplate,
  type TemplateCategory,
} from '@/lib/api/admin';
import { Card, PageHeader, StatusPill } from '@/components/admin/primitives';
import { TemplatePreview } from '@/components/admin/template-preview';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Draft = {
  id?: string;
  name: string;
  description: string;
  welcomeTitle: string;
  welcomeMessage: string;
  theme: MenuTheme;
  custom: Partial<MenuThemeConfig>;
  accentColor: string;
  categories: TemplateCategory[];
};

const PRESETS: { id: MenuTheme; label: string }[] = [
  { id: 'MINIMAL', label: 'Minimal' },
  { id: 'MODERN', label: 'Modern' },
  { id: 'LUXURY', label: 'Luxury' },
  { id: 'DARK', label: 'Dark' },
  { id: 'VINTAGE', label: 'Vintage' },
  { id: 'NEON', label: 'Neon' },
  { id: 'CUSTOM', label: 'Custom' },
];

const emptyDraft = (): Draft => ({
  name: 'New template',
  description: '',
  welcomeTitle: '',
  welcomeMessage: '',
  theme: 'MINIMAL',
  custom: { ...MENU_THEME_PRESETS.MINIMAL },
  accentColor: MENU_THEME_PRESETS.MINIMAL.accent,
  categories: [],
});

const COLOR_FIELDS: { key: keyof MenuThemeConfig; label: string }[] = [
  { key: 'bg', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'text', label: 'Text' },
  { key: 'muted', label: 'Muted' },
  { key: 'accent', label: 'Accent' },
  { key: 'onAccent', label: 'On accent' },
  { key: 'chip', label: 'Chip' },
];

type Tab = 'design' | 'content' | 'assign';

function MenusInner() {
  const { locale } = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const presetCafeId = searchParams.get('cafeId') ?? '';
  const qc = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [tab, setTab] = useState<Tab>('design');

  const { data: templates } = useQuery({
    queryKey: ['admin-templates', locale],
    queryFn: () => adminListTemplates(locale),
  });

  const { data: full } = useQuery({
    queryKey: ['admin-template', selectedId, locale],
    queryFn: () => adminGetTemplate(selectedId!, locale),
    enabled: !!selectedId,
  });
  useEffect(() => {
    if (!full) return;
    const themeName = (full.theme ?? 'MINIMAL') as MenuTheme;
    setDraft({
      id: full.id,
      name: full.name,
      description: full.description ?? '',
      welcomeTitle: full.welcomeTitle ?? '',
      welcomeMessage: full.welcomeMessage ?? '',
      theme: themeName,
      custom: {
        ...MENU_THEME_PRESETS.MINIMAL,
        accent: full.accentColor,
        ...((full.themeConfig ?? {}) as Partial<MenuThemeConfig>),
      },
      accentColor: full.accentColor,
      categories: (full.categories ?? []).map((c) => ({
        name: c.name,
        items: (c.items ?? []).map((i) => ({
          name: i.name,
          price: i.price,
          description: i.description ?? '',
        })),
      })),
    });
  }, [full]);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['admin-templates'] });

  const isCustom = draft.theme === 'CUSTOM';
  const effThemeConfig = isCustom
    ? (draft.custom as Record<string, unknown>)
    : null;
  const effAccent = isCustom
    ? (draft.custom.accent ?? draft.accentColor)
    : (MENU_THEME_PRESETS[draft.theme as Exclude<MenuTheme, 'CUSTOM'>]?.accent ??
      draft.accentColor);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: draft.name,
        description: draft.description,
        welcomeTitle: draft.welcomeTitle,
        welcomeMessage: draft.welcomeMessage,
        theme: draft.theme,
        themeConfig: effThemeConfig,
        accentColor: effAccent,
        categories: draft.categories,
      };
      return draft.id
        ? adminUpdateTemplate(draft.id, payload)
        : adminCreateTemplate(payload);
    },
    onSuccess: (tpl) => {
      invalidate();
      if (tpl && typeof tpl === 'object' && 'id' in tpl)
        setSelectedId((tpl as { id: string }).id);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteTemplate(id),
    onSuccess: () => {
      invalidate();
      setSelectedId(null);
      setDraft(emptyDraft());
    },
  });

  const startNew = () => {
    setSelectedId(null);
    setDraft(emptyDraft());
    setTab('design');
  };

  const setTheme = (theme: MenuTheme) =>
    setDraft((d) => {
      if (theme === 'CUSTOM') {
        const base =
          MENU_THEME_PRESETS[d.theme as Exclude<MenuTheme, 'CUSTOM'>] ??
          MENU_THEME_PRESETS.MINIMAL;
        return { ...d, theme, custom: { ...base, ...d.custom } };
      }
      return { ...d, theme, accentColor: MENU_THEME_PRESETS[theme].accent };
    });
  const setCustom = (patch: Partial<MenuThemeConfig>) =>
    setDraft((d) => ({ ...d, custom: { ...d.custom, ...patch } }));

  // content helpers
  const addCategory = () =>
    setDraft((d) => ({
      ...d,
      categories: [...d.categories, { name: 'New category', items: [] }],
    }));
  const updateCategory = (ci: number, name: string) =>
    setDraft((d) => {
      const categories = [...d.categories];
      categories[ci] = { ...categories[ci], name };
      return { ...d, categories };
    });
  const removeCategory = (ci: number) =>
    setDraft((d) => ({
      ...d,
      categories: d.categories.filter((_, i) => i !== ci),
    }));
  const addItem = (ci: number) =>
    setDraft((d) => {
      const categories = [...d.categories];
      categories[ci] = {
        ...categories[ci],
        items: [...(categories[ci].items ?? []), { name: '', price: 0 }],
      };
      return { ...d, categories };
    });
  const updateItem = (
    ci: number,
    ii: number,
    patch: { name?: string; price?: number },
  ) =>
    setDraft((d) => {
      const categories = [...d.categories];
      const items = [...(categories[ci].items ?? [])];
      items[ii] = { ...items[ii], ...patch };
      categories[ci] = { ...categories[ci], items };
      return { ...d, categories };
    });
  const removeItem = (ci: number, ii: number) =>
    setDraft((d) => {
      const categories = [...d.categories];
      categories[ci] = {
        ...categories[ci],
        items: (categories[ci].items ?? []).filter((_, i) => i !== ii),
      };
      return { ...d, categories };
    });

  const itemCount = draft.categories.reduce(
    (s, c) => s + (c.items?.length ?? 0),
    0,
  );

  return (
    <div>
      <PageHeader
        title="Menu Templates"
        subtitle="Design reusable menu themes, then assign them to cafes to use."
        actions={
          <Button onClick={startNew}>
            <Plus className="size-4" /> New template
          </Button>
        }
      />

      <FileTemplatesPanel
        locale={locale}
        onImported={(tpl, gotoAssign) => {
          invalidate();
          qc.invalidateQueries({ queryKey: ['admin-file-templates'] });
          if (tpl) {
            setSelectedId(tpl.id);
            setTab(gotoAssign ? 'assign' : 'design');
          }
        }}
      />

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        {/* Library */}
        <div className="space-y-1.5">
          {(templates ?? []).map((tpl) => {
            const swatch =
              tpl.theme === 'CUSTOM'
                ? ((tpl.themeConfig as Partial<MenuThemeConfig> | null)?.accent ??
                  tpl.accentColor)
                : MENU_THEME_PRESETS[tpl.theme as Exclude<MenuTheme, 'CUSTOM'>]
                    ?.accent;
            const bg =
              tpl.theme === 'CUSTOM'
                ? ((tpl.themeConfig as Partial<MenuThemeConfig> | null)?.bg ??
                  '#fff')
                : MENU_THEME_PRESETS[tpl.theme as Exclude<MenuTheme, 'CUSTOM'>]
                    ?.bg;
            return (
              <button
                key={tpl.id}
                onClick={() => {
                  setSelectedId(tpl.id);
                  setTab('design');
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                  selectedId === tpl.id
                    ? 'border-foreground/30 bg-muted'
                    : 'border-border hover:bg-muted/50',
                )}
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-md border border-border"
                  style={{ backgroundColor: bg }}
                >
                  <span
                    className="size-3.5 rounded-full"
                    style={{ backgroundColor: swatch }}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {tpl.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {tpl.theme.toLowerCase()} ·{' '}
                    {tpl._count?.assignments ?? 0} cafes
                  </span>
                </span>
              </button>
            );
          })}
          {templates && templates.length === 0 ? (
            <p className="px-1 py-2 text-sm text-muted-foreground">
              No templates yet. Create one to get started.
            </p>
          ) : null}
        </div>

        {/* Editor */}
        <div className="space-y-5">
          <Card className="p-4">
            <Input
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value }))
              }
              placeholder="Template name"
              className="text-base font-medium"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {draft.theme.toLowerCase()} theme · {draft.categories.length}{' '}
              categories · {itemCount} items
            </p>
          </Card>

          {/* Tabs */}
          <div className="inline-flex gap-1 rounded-lg bg-muted p-1">
            {(
              [
                ['design', 'Design', Palette],
                ['content', 'Content', Layers],
                ['assign', 'Assign', Store],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                disabled={key === 'assign' && !draft.id}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40',
                  tab === key
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          {tab === 'design' ? (
            <DesignTab
              draft={draft}
              setDraft={setDraft}
              setTheme={setTheme}
              setCustom={setCustom}
              isCustom={isCustom}
              effThemeConfig={effThemeConfig}
              effAccent={effAccent}
            />
          ) : null}

          {tab === 'content' ? (
            <ContentTab
              draft={draft}
              addCategory={addCategory}
              updateCategory={updateCategory}
              removeCategory={removeCategory}
              addItem={addItem}
              updateItem={updateItem}
              removeItem={removeItem}
            />
          ) : null}

          {tab === 'assign' && draft.id ? (
            <AssignTab templateId={draft.id} locale={locale} presetCafeId={presetCafeId} />
          ) : null}

          {/* Save bar */}
          <div className="flex items-center gap-2 border-t border-border pt-4">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save template'}
            </Button>
            {draft.id ? (
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm('Delete this template?')) remove.mutate(draft.id!);
                }}
              >
                <Trash2 className="size-4" /> Delete
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">
                Save to enable assigning to cafes.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Design tab ----------------

function DesignTab({
  draft,
  setDraft,
  setTheme,
  setCustom,
  isCustom,
  effThemeConfig,
  effAccent,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  setTheme: (t: MenuTheme) => void;
  setCustom: (p: Partial<MenuThemeConfig>) => void;
  isCustom: boolean;
  effThemeConfig: Record<string, unknown> | null;
  effAccent: string;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        {/* Theme presets */}
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Theme</h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {PRESETS.map(({ id, label }) => {
              const preset =
                id === 'CUSTOM' ? null : MENU_THEME_PRESETS[id];
              const active = draft.theme === id;
              return (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  className={cn(
                    'relative overflow-hidden rounded-lg border-2 p-0 text-left transition-colors',
                    active ? 'border-foreground' : 'border-border',
                  )}
                >
                  <div
                    className="flex h-12 items-center gap-1 px-2"
                    style={{ backgroundColor: preset?.bg ?? 'var(--muted)' }}
                  >
                    {preset ? (
                      <>
                        <span
                          className="size-4 rounded-full"
                          style={{ backgroundColor: preset.accent }}
                        />
                        <span
                          className="h-4 flex-1 rounded"
                          style={{ backgroundColor: preset.surface }}
                        />
                      </>
                    ) : (
                      <Palette className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-xs font-medium">{label}</span>
                    {active ? <Check className="size-3.5" /> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Custom controls */}
        {isCustom ? (
          <Card className="space-y-4 p-4">
            <h3 className="text-sm font-semibold">Custom design</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {COLOR_FIELDS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="color"
                    value={String(draft.custom[key] ?? '#000000')}
                    onChange={(e) => setCustom({ [key]: e.target.value })}
                    className="size-7 shrink-0 cursor-pointer rounded border border-border"
                  />
                  <span className="truncate text-xs text-muted-foreground">
                    {label}
                  </span>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">
                  Heading font
                </span>
                <Select
                  value={draft.custom.headingFont ?? 'sans'}
                  onValueChange={(v) =>
                    setCustom({ headingFont: v as MenuThemeConfig['headingFont'] })
                  }
                >
                  <SelectTrigger className="h-8 w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans">Sans</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="mono">Mono</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">
                  Card style
                </span>
                <Select
                  value={draft.custom.cardStyle ?? 'elevated'}
                  onValueChange={(v) =>
                    setCustom({ cardStyle: v as MenuThemeConfig['cardStyle'] })
                  }
                >
                  <SelectTrigger className="h-8 w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elevated">Elevated</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        ) : null}

        {/* Welcome */}
        <Card className="space-y-3 p-4">
          <h3 className="text-sm font-semibold">Welcome screen</h3>
          <Input
            value={draft.welcomeTitle}
            onChange={(e) =>
              setDraft((d) => ({ ...d, welcomeTitle: e.target.value }))
            }
            placeholder="Welcome title (e.g. cafe name)"
          />
          <textarea
            value={draft.welcomeMessage}
            onChange={(e) =>
              setDraft((d) => ({ ...d, welcomeMessage: e.target.value }))
            }
            placeholder="Welcome message"
            rows={2}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </Card>
      </div>

      {/* Live preview */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Live preview
        </p>
        <div className="overflow-hidden rounded-xl border border-border shadow-sm">
          <TemplatePreview
            theme={draft.theme}
            themeConfig={effThemeConfig}
            accentColor={effAccent}
            welcomeTitle={draft.welcomeTitle || draft.name}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------- Content tab ----------------

function ContentTab({
  draft,
  addCategory,
  updateCategory,
  removeCategory,
  addItem,
  updateItem,
  removeItem,
}: {
  draft: Draft;
  addCategory: () => void;
  updateCategory: (ci: number, name: string) => void;
  removeCategory: (ci: number) => void;
  addItem: (ci: number) => void;
  updateItem: (ci: number, ii: number, patch: { name?: string; price?: number }) => void;
  removeItem: (ci: number, ii: number) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Optional starter items cloned onto the cafe when you apply this template
        with content.
      </p>
      {draft.categories.map((cat, ci) => (
        <Card key={ci} className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <GripVertical className="size-4 shrink-0 text-muted-foreground/50" />
            <Input
              value={cat.name}
              onChange={(e) => updateCategory(ci, e.target.value)}
              className="h-8 flex-1 font-medium"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeCategory(ci)}
            >
              <Trash2 className="size-4 text-muted-foreground" />
            </Button>
          </div>
          <div className="space-y-2 pl-6">
            {(cat.items ?? []).map((item, ii) => (
              <div key={ii} className="flex items-center gap-2">
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(ci, ii, { name: e.target.value })}
                  placeholder="Item name"
                  className="h-8 flex-1"
                />
                <Input
                  value={item.price}
                  onChange={(e) =>
                    updateItem(ci, ii, { price: Number(e.target.value) || 0 })
                  }
                  type="number"
                  placeholder="Price"
                  className="h-8 w-28"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeItem(ci, ii)}
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addItem(ci)}
              className="text-muted-foreground"
            >
              <Plus className="size-3.5" /> Add item
            </Button>
          </div>
        </Card>
      ))}
      <Button
        variant="outline"
        onClick={addCategory}
        className="w-full border-dashed"
      >
        <Plus className="size-4" /> Add category
      </Button>
    </div>
  );
}

// ---------------- Assign tab ----------------

function AssignTab({
  templateId,
  locale,
  presetCafeId,
}: {
  templateId: string;
  locale: string;
  presetCafeId: string;
}) {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<string[]>(
    presetCafeId ? [presetCafeId] : [],
  );
  const [includeContent, setIncludeContent] = useState(true);
  const [publish, setPublish] = useState(true);

  const { data: assignments } = useQuery({
    queryKey: ['admin-template-assignments', templateId, locale],
    queryFn: () => adminTemplateAssignments(templateId, locale),
  });
  const { data: cafeResults } = useQuery({
    queryKey: ['admin-assign-cafes', search, locale],
    queryFn: () => adminListCafes({ q: search, locale }),
    enabled: search.length > 0,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-template-assignments', templateId] });
    qc.invalidateQueries({ queryKey: ['admin-templates'] });
  };

  const assign = useMutation({
    mutationFn: (cafeIds: string[]) => adminAssignTemplate(templateId, cafeIds),
    onSuccess: () => {
      setPicked([]);
      invalidate();
    },
  });
  const unassign = useMutation({
    mutationFn: (cafeId: string) => adminUnassignTemplate(templateId, cafeId),
    onSuccess: invalidate,
  });
  const apply = useMutation({
    mutationFn: (cafeId: string) =>
      adminApplyTemplate(cafeId, templateId, { includeContent, publish }),
    onSuccess: invalidate,
  });

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="space-y-5">
      {/* Find & assign */}
      <Card className="p-4">
        <h3 className="mb-1 text-sm font-semibold">Assign to cafes</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Search cafes and assign this template to make it available to them.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(q.trim());
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search cafes…"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        {cafeResults && cafeResults.data.length > 0 ? (
          <div className="mt-3 max-h-60 space-y-1 overflow-auto">
            {cafeResults.data.map((c) => {
              const checked = picked.includes(c.id);
              return (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(c.id)}
                    className="size-4 accent-foreground"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {c.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.city?.name ?? c.address}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        ) : null}

        {picked.length > 0 ? (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {picked.length} selected
            </span>
            <Button
              onClick={() => assign.mutate(picked)}
              disabled={assign.isPending}
            >
              {assign.isPending ? 'Assigning…' : `Assign ${picked.length}`}
            </Button>
          </div>
        ) : null}
      </Card>

      {/* Apply options */}
      <Card className="p-4">
        <h3 className="mb-2 text-sm font-semibold">Apply options</h3>
        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeContent}
              onChange={(e) => setIncludeContent(e.target.checked)}
              className="size-4 accent-foreground"
            />
            Include starter content
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
              className="size-4 accent-foreground"
            />
            Publish menu
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          “Apply” sets this template as the cafe&apos;s active menu design
          {includeContent ? ' and replaces its items with the starter content' : ''}.
        </p>
      </Card>

      {/* Assigned list */}
      <Card className="p-0">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">
            Assigned cafes ({assignments?.length ?? 0})
          </h3>
        </div>
        {assignments && assignments.length > 0 ? (
          <div className="divide-y divide-border">
            {assignments.map((a) => (
              <div
                key={a.cafeId}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {a.name}
                    </span>
                    {a.active ? (
                      <StatusPill tone="green">Active</StatusPill>
                    ) : null}
                    {a.published ? (
                      <StatusPill tone="muted">Published</StatusPill>
                    ) : null}
                  </div>
                  <span className="block truncate text-xs text-muted-foreground">
                    {a.cafeId}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => apply.mutate(a.cafeId)}
                  disabled={apply.isPending}
                >
                  {a.active ? 'Re-apply' : 'Apply'}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    if (confirm(`Unassign from ${a.name}?`))
                      unassign.mutate(a.cafeId);
                  }}
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Not assigned to any cafe yet.
          </p>
        )}
      </Card>
    </div>
  );
}

// ---------------- File templates (drop-in folder) ----------------

function FileTemplatesPanel({
  locale,
  onImported,
}: {
  locale: string;
  onImported: (tpl: MenuTemplate | null, gotoAssign: boolean) => void;
}) {
  const qc = useQueryClient();
  const {
    data: files,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-file-templates', locale],
    queryFn: () => adminListFileTemplates(locale),
  });

  const importOne = useMutation({
    mutationFn: ({ key }: { key: string; gotoAssign: boolean }) =>
      adminImportFileTemplate(key),
    onSuccess: (tpl, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-file-templates'] });
      onImported(tpl, vars.gotoAssign);
    },
  });
  const importAll = useMutation({
    mutationFn: () => adminImportAllFileTemplates(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-file-templates'] });
      onImported(null, false);
    },
  });

  const pendingKey = importOne.isPending ? importOne.variables?.key : null;
  const list = files ?? [];
  const importable = list.filter((f) => f.valid).length;

  return (
    <Card className="mb-6 p-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <FileJson className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">From project files</h3>
          <p className="truncate text-xs text-muted-foreground">
            Drop a <code className="font-mono">.json</code> file in{' '}
            <code className="font-mono">beancircle-api/menu-templates/</code>,
            then import it here to make it available or assign it to cafes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn('size-4', isFetching && 'animate-spin')}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => importAll.mutate()}
            disabled={importAll.isPending || importable === 0}
          >
            <Download className="size-4" />
            {importAll.isPending ? 'Importing…' : `Import all (${importable})`}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Scanning folder…</p>
      ) : list.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          No template files found. Add a{' '}
          <code className="font-mono">.json</code> file to{' '}
          <code className="font-mono">beancircle-api/menu-templates/</code> and
          click Refresh.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {list.map((f) => {
            const busy = pendingKey === f.key;
            const tone = !f.valid
              ? 'red'
              : !f.imported
                ? 'muted'
                : f.stale
                  ? 'amber'
                  : 'green';
            const status = !f.valid
              ? 'Invalid'
              : !f.imported
                ? 'New'
                : f.stale
                  ? 'Update available'
                  : 'Imported';
            return (
              <div key={f.key} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-md border border-border"
                  style={{ backgroundColor: f.accentColor ?? 'var(--muted)' }}
                >
                  {f.valid ? null : (
                    <AlertTriangle className="size-4 text-red-100" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {f.name ?? f.file}
                    </span>
                    <StatusPill tone={tone}>{status}</StatusPill>
                  </div>
                  <span className="block truncate text-xs text-muted-foreground">
                    {f.valid
                      ? `${f.file} · ${(f.theme ?? '').toLowerCase()} · ${f.categoryCount} categories · ${f.itemCount} items`
                      : `${f.file} · ${f.error ?? 'parse error'}`}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!f.valid || busy}
                    onClick={() =>
                      importOne.mutate({ key: f.key, gotoAssign: false })
                    }
                  >
                    {busy
                      ? 'Importing…'
                      : f.imported
                        ? 'Re-import'
                        : 'Import'}
                  </Button>
                  <Button
                    size="sm"
                    disabled={!f.valid || busy}
                    onClick={() =>
                      importOne.mutate({ key: f.key, gotoAssign: true })
                    }
                  >
                    <Store className="size-3.5" />
                    Assign
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default function MenusPage() {
  return (
    <Suspense fallback={null}>
      <MenusInner />
    </Suspense>
  );
}
