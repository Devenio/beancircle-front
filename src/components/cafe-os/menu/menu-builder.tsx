'use client';

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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CafeMenuData, MenuCategory, MenuItem } from '@/components/cafe-menu/types';
import { cafeOsApi } from '@/lib/api/cafe-os';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ItemEditorSheet } from './item-editor-sheet';

function formatPrice(price: number, locale: string) {
  return new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(price);
}

type EditorTarget = { categoryId: string; item: MenuItem | null } | null;

export function MenuBuilder({
  menu,
  cafeId,
  locale,
}: {
  menu: CafeMenuData;
  cafeId: string;
  locale: string;
}) {
  const t = useTranslations('cafeOs.menu');
  const qc = useQueryClient();
  const [editor, setEditor] = useState<EditorTarget>(null);
  const [newCategory, setNewCategory] = useState('');
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const menuKey = ['cafe-menu', cafeId];

  function setLocalCategories(updater: (cats: MenuCategory[]) => MenuCategory[]) {
    qc.setQueryData<CafeMenuData>(menuKey, (prev) =>
      prev ? { ...prev, categories: updater(prev.categories) } : prev,
    );
  }

  const reorderCategoriesMutation = useMutation({
    mutationFn: (ids: string[]) => cafeOsApi.reorderMenuCategories(cafeId, ids),
    onError: () => qc.invalidateQueries({ queryKey: menuKey }),
  });

  const reorderItemsMutation = useMutation({
    mutationFn: ({ categoryId, ids }: { categoryId: string; ids: string[] }) =>
      cafeOsApi.reorderMenuItems(cafeId, categoryId, ids),
    onError: () => qc.invalidateQueries({ queryKey: menuKey }),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => cafeOsApi.createMenuCategory(cafeId, name),
    onSuccess: () => {
      setNewCategory('');
      qc.invalidateQueries({ queryKey: menuKey });
    },
  });

  const renameCategoryMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      cafeOsApi.updateMenuCategory(cafeId, id, name),
    onSuccess: () => {
      setRenaming(null);
      qc.invalidateQueries({ queryKey: menuKey });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => cafeOsApi.deleteMenuCategory(cafeId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKey }),
  });

  function onCategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = menu.categories.map((c) => c.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setLocalCategories((cats) =>
      next.map((id) => cats.find((c) => c.id === id)!).filter(Boolean),
    );
    reorderCategoriesMutation.mutate(next);
  }

  function onItemDragEnd(category: MenuCategory, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = category.items.map((i) => i.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setLocalCategories((cats) =>
      cats.map((c) =>
        c.id === category.id
          ? { ...c, items: next.map((id) => c.items.find((i) => i.id === id)!).filter(Boolean) }
          : c,
      ),
    );
    reorderItemsMutation.mutate({ categoryId: category.id, ids: next });
  }

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onCategoryDragEnd}>
        <SortableContext
          items={menu.categories.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {menu.categories.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
                locale={locale}
                t={t}
                renaming={renaming?.id === category.id ? renaming : null}
                onRenameChange={(name) => setRenaming({ id: category.id, name })}
                onRenameStart={() => setRenaming({ id: category.id, name: category.name })}
                onRenameCommit={() => {
                  if (renaming && renaming.name.trim()) {
                    renameCategoryMutation.mutate({ id: renaming.id, name: renaming.name.trim() });
                  } else {
                    setRenaming(null);
                  }
                }}
                onDelete={() => deleteCategoryMutation.mutate(category.id)}
                onAddItem={() => setEditor({ categoryId: category.id, item: null })}
                onEditItem={(item) => setEditor({ categoryId: category.id, item })}
                onItemDragEnd={(e) => onItemDragEnd(category, e)}
                sensors={sensors}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex gap-2">
        <Input
          value={newCategory}
          placeholder={t('newCategoryPlaceholder')}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newCategory.trim()) {
              createCategoryMutation.mutate(newCategory.trim());
            }
          }}
        />
        <Button
          disabled={!newCategory.trim() || createCategoryMutation.isPending}
          onClick={() => createCategoryMutation.mutate(newCategory.trim())}
        >
          <Plus className="h-4 w-4" />
          {t('addCategory')}
        </Button>
      </div>

      <ItemEditorSheet
        cafeId={cafeId}
        categoryId={editor?.categoryId ?? ''}
        item={editor?.item ?? null}
        open={!!editor}
        onClose={() => setEditor(null)}
      />
    </div>
  );
}

function SortableCategory({
  category,
  locale,
  t,
  renaming,
  onRenameChange,
  onRenameStart,
  onRenameCommit,
  onDelete,
  onAddItem,
  onEditItem,
  onItemDragEnd,
  sensors,
}: {
  category: MenuCategory;
  locale: string;
  t: ReturnType<typeof useTranslations<'cafeOs.menu'>>;
  renaming: { id: string; name: string } | null;
  onRenameChange: (name: string) => void;
  onRenameStart: () => void;
  onRenameCommit: () => void;
  onDelete: () => void;
  onAddItem: () => void;
  onEditItem: (item: MenuItem) => void;
  onItemDragEnd: (event: DragEndEvent) => void;
  sensors: ReturnType<typeof useSensors>;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border border-border bg-card ${isDragging ? 'z-10 shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-1 p-3">
        <button
          type="button"
          className="touch-none p-1 text-muted-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {renaming ? (
          <Input
            autoFocus
            value={renaming.name}
            className="h-8 flex-1"
            onChange={(e) => onRenameChange(e.target.value)}
            onBlur={onRenameCommit}
            onKeyDown={(e) => e.key === 'Enter' && onRenameCommit()}
          />
        ) : (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex flex-1 items-center gap-2 text-start"
          >
            <span className="font-semibold">{category.name}</span>
            <span className="text-xs text-muted-foreground">
              {category.items.length}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition ${collapsed ? '-rotate-90 rtl:rotate-90' : ''}`}
            />
          </button>
        )}

        <Button variant="ghost" size="icon-sm" onClick={onRenameStart}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive"
          onClick={() => {
            if (window.confirm(t('deleteCategoryConfirm'))) onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {!collapsed ? (
        <div className="space-y-1 px-3 pb-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onItemDragEnd}
          >
            <SortableContext
              items={category.items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {category.items.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  locale={locale}
                  unavailableLabel={t('unavailable')}
                  onClick={() => onEditItem(item)}
                />
              ))}
            </SortableContext>
          </DndContext>
          <button
            type="button"
            onClick={onAddItem}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-sm text-muted-foreground transition hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
            {t('addItem')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SortableItem({
  item,
  locale,
  unavailableLabel,
  onClick,
}: {
  item: MenuItem;
  locale: string;
  unavailableLabel: string;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const image = item.imageUrl || item.images?.[0];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-xl bg-background p-2 ${
        isDragging ? 'z-10 shadow-lg ring-1 ring-border' : ''
      }`}
    >
      <button
        type="button"
        className="touch-none p-1 text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3 text-start">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-11 w-11 rounded-lg object-cover" />
        ) : (
          <div className="h-11 w-11 rounded-lg bg-muted" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            {item.discountPrice && item.discountPrice < item.price ? (
              <>
                <span className="line-through">{formatPrice(item.price, locale)}</span>{' '}
                <span className="font-semibold text-primary">
                  {formatPrice(item.discountPrice, locale)}
                </span>
              </>
            ) : (
              formatPrice(item.price, locale)
            )}
          </p>
        </div>
        {!item.isAvailable ? (
          <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
            {unavailableLabel}
          </span>
        ) : null}
      </button>
    </div>
  );
}
