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
import { Skeleton } from '@/components/ui/skeleton';
import { cafeOsApi, type CafeTable } from '@/lib/api/cafe-os';
import { Link } from '@/i18n/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GripVertical, Pencil, Plus, QrCode, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function TablesPage() {
  const t = useTranslations('cafeOs.tables');
  const { cafeId } = useParams<{ cafeId: string }>();
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);

  const tablesKey = ['cafe-tables', cafeId];
  const { data: tables, isLoading } = useQuery({
    queryKey: tablesKey,
    queryFn: () => cafeOsApi.tables(cafeId),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const createMutation = useMutation({
    mutationFn: (name: string) => cafeOsApi.createTable(cafeId, name),
    onSuccess: () => {
      setNewName('');
      qc.invalidateQueries({ queryKey: tablesKey });
      qc.invalidateQueries({ queryKey: ['cafe-qr', cafeId] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      cafeOsApi.renameTable(cafeId, id, name),
    onSuccess: () => {
      setRenaming(null);
      qc.invalidateQueries({ queryKey: tablesKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cafeOsApi.deleteTable(cafeId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tablesKey });
      qc.invalidateQueries({ queryKey: ['cafe-qr', cafeId] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => cafeOsApi.reorderTables(cafeId, ids),
    onError: () => qc.invalidateQueries({ queryKey: tablesKey }),
  });

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !tables) return;
    const ids = tables.map((tb) => tb.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    qc.setQueryData<CafeTable[]>(tablesKey, (prev) =>
      prev ? next.map((id) => prev.find((tb) => tb.id === id)!).filter(Boolean) : prev,
    );
    reorderMutation.mutate(next);
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">{t('title')}</h1>
      <p className="text-sm text-muted-foreground">{t('hint')}</p>

      <div className="flex gap-2">
        <Input
          value={newName}
          placeholder={t('namePlaceholder')}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newName.trim()) createMutation.mutate(newName.trim());
          }}
        />
        <Button
          disabled={!newName.trim() || createMutation.isPending}
          onClick={() => createMutation.mutate(newName.trim())}
        >
          <Plus className="h-4 w-4" />
          {t('add')}
        </Button>
      </div>

      {!tables?.length ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={tables.map((tb) => tb.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {tables.map((table) => (
                <SortableTable
                  key={table.id}
                  table={table}
                  cafeId={cafeId}
                  scansLabel={t('scans', { count: table.qrCode?.scanCount ?? 0 })}
                  renaming={renaming?.id === table.id ? renaming : null}
                  onRenameStart={() => setRenaming({ id: table.id, name: table.name })}
                  onRenameChange={(name) => setRenaming({ id: table.id, name })}
                  onRenameCommit={() => {
                    if (renaming?.name.trim()) {
                      renameMutation.mutate({ id: renaming.id, name: renaming.name.trim() });
                    } else {
                      setRenaming(null);
                    }
                  }}
                  onDelete={() => {
                    if (window.confirm(t('deleteConfirm'))) deleteMutation.mutate(table.id);
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableTable({
  table,
  cafeId,
  scansLabel,
  renaming,
  onRenameStart,
  onRenameChange,
  onRenameCommit,
  onDelete,
}: {
  table: CafeTable;
  cafeId: string;
  scansLabel: string;
  renaming: { id: string; name: string } | null;
  onRenameStart: () => void;
  onRenameChange: (name: string) => void;
  onRenameCommit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: table.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-2xl border border-border bg-card p-3 ${
        isDragging ? 'z-10 shadow-lg' : ''
      }`}
    >
      <button type="button" className="touch-none p-1 text-muted-foreground" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        {renaming ? (
          <Input
            autoFocus
            value={renaming.name}
            className="h-8"
            onChange={(e) => onRenameChange(e.target.value)}
            onBlur={onRenameCommit}
            onKeyDown={(e) => e.key === 'Enter' && onRenameCommit()}
          />
        ) : (
          <>
            <p className="text-sm font-semibold">{table.name}</p>
            <p className="text-xs text-muted-foreground">{scansLabel}</p>
          </>
        )}
      </div>

      {table.qrCode ? (
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href={`/cafe-os/${cafeId}/qr/poster/${table.qrCode.id}`} />}
        >
          <QrCode className="h-4 w-4" />
        </Button>
      ) : null}
      <Button variant="ghost" size="icon-sm" onClick={onRenameStart}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={onDelete}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
