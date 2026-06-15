'use client';

import { Suspense, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  adminApplyTemplate,
  adminCreateTemplate,
  adminDeleteTemplate,
  adminGetTemplate,
  adminListTemplates,
  adminUpdateTemplate,
  type TemplateCategory,
} from '@/lib/api/admin';
import { Card, PageHeader } from '@/components/admin/primitives';
import { cn } from '@/lib/utils';

type Draft = {
  id?: string;
  name: string;
  description: string;
  accentColor: string;
  categories: TemplateCategory[];
};

const emptyDraft = (): Draft => ({
  name: 'New menu',
  description: '',
  accentColor: '#2C1810',
  categories: [],
});

function MenusInner() {
  const { locale } = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const presetCafeId = searchParams.get('cafeId') ?? '';
  const qc = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [cafeId, setCafeId] = useState(presetCafeId);
  const [publish, setPublish] = useState(true);

  useEffect(() => {
    if (presetCafeId) setCafeId(presetCafeId);
  }, [presetCafeId]);

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
    if (full) {
      setDraft({
        id: full.id,
        name: full.name,
        description: full.description ?? '',
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
    }
  }, [full]);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['admin-templates'] });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: draft.name,
        description: draft.description,
        accentColor: draft.accentColor,
        categories: draft.categories,
      };
      return draft.id
        ? adminUpdateTemplate(draft.id, payload)
        : adminCreateTemplate(payload);
    },
    onSuccess: (tpl) => {
      invalidate();
      if (tpl && typeof tpl === 'object' && 'id' in tpl) {
        setSelectedId((tpl as { id: string }).id);
      }
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
  const apply = useMutation({
    mutationFn: () => adminApplyTemplate(cafeId.trim(), draft.id!, { publish }),
  });

  const startNew = () => {
    setSelectedId(null);
    setDraft(emptyDraft());
  };

  const itemCount = draft.categories.reduce(
    (s, c) => s + (c.items?.length ?? 0),
    0,
  );

  // draft helpers
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

  return (
    <div>
      <PageHeader
        title="Menu Builder"
        subtitle="Design reusable menu templates and assign them to any cafe."
        actions={
          <Button onClick={startNew}>
            <Plus className="size-4" /> New template
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        {/* Template list */}
        <div className="space-y-1.5">
          {(templates ?? []).map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                selectedId === t.id
                  ? 'border-foreground/30 bg-muted'
                  : 'border-border hover:bg-muted/50',
              )}
            >
              <span className="min-w-0 truncate font-medium">{t.name}</span>
              <span className="ml-2 shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {t._count?.categories ?? 0}
              </span>
            </button>
          ))}
          {templates && templates.length === 0 ? (
            <p className="px-1 py-2 text-sm text-muted-foreground">
              No templates yet. Create one to get started.
            </p>
          ) : null}
        </div>

        {/* Editor */}
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Input
                value={draft.name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, name: e.target.value }))
                }
                placeholder="Template name"
                className="flex-1 text-base font-medium"
              />
              <label className="relative inline-flex size-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border">
                <input
                  type="color"
                  value={draft.accentColor}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, accentColor: e.target.value }))
                  }
                  className="absolute inset-0 size-12 cursor-pointer border-none p-0"
                />
              </label>
            </div>
            <textarea
              value={draft.description}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
              placeholder="Internal description (optional)"
              rows={2}
              className="mt-3 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {draft.categories.length} categories · {itemCount} items
            </p>
          </Card>

          {/* Categories */}
          <div className="space-y-3">
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
                        onChange={(e) =>
                          updateItem(ci, ii, { name: e.target.value })
                        }
                        placeholder="Item name"
                        className="h-8 flex-1"
                      />
                      <Input
                        value={item.price}
                        onChange={(e) =>
                          updateItem(ci, ii, {
                            price: Number(e.target.value) || 0,
                          })
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

          <div className="flex items-center gap-2">
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
            ) : null}
          </div>

          {/* Assign */}
          {draft.id ? (
            <Card className="p-5">
              <h3 className="text-sm font-semibold">Assign to a cafe</h3>
              <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
                Clones this template onto the cafe&apos;s live menu, replacing
                its current categories.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  value={cafeId}
                  onChange={(e) => setCafeId(e.target.value)}
                  placeholder="Cafe ID"
                  className="flex-1"
                />
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={publish}
                    onChange={(e) => setPublish(e.target.checked)}
                    className="size-4 accent-foreground"
                  />
                  Publish
                </label>
                <Button
                  onClick={() => apply.mutate()}
                  disabled={!cafeId.trim() || apply.isPending}
                >
                  {apply.isPending ? 'Applying…' : 'Apply template'}
                </Button>
              </div>
              {apply.isSuccess ? (
                <p className="mt-2 text-xs text-emerald-600">
                  Applied to cafe successfully.
                </p>
              ) : null}
              {apply.isError ? (
                <p className="mt-2 text-xs text-destructive">
                  {(apply.error as Error).message}
                </p>
              ) : null}
            </Card>
          ) : (
            <p className="text-xs text-muted-foreground">
              Save the template before assigning it to a cafe.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MenusPage() {
  return (
    <Suspense fallback={null}>
      <MenusInner />
    </Suspense>
  );
}
