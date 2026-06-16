'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  PointerSensor,
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
import { GripVertical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  adminListFlowSteps,
  adminReorderFlowSteps,
  adminSetFlowStep,
  type AdminFlowStep,
} from '@/lib/api/admin';
import { Card, EmptyState, PageHeader } from '@/components/admin/primitives';

export default function OnboardingFlowPage() {
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();

  const queryKey = ['admin-flow', locale];
  const { data } = useQuery({
    queryKey,
    queryFn: () => adminListFlowSteps(locale),
  });
  const steps = data ?? [];

  const toggle = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      adminSetFlowStep(key, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-flow'] }),
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => adminReorderFlowSteps(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-flow'] }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = steps.findIndex((s) => s.key === active.id);
    const newIndex = steps.findIndex((s) => s.key === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(steps, oldIndex, newIndex);
    // Optimistic: reflect the new order immediately, then persist.
    qc.setQueryData(queryKey, next);
    reorder.mutate(next.map((s) => s.key));
  };

  const enabledCount = steps.filter((s) => s.enabled).length;

  return (
    <div>
      <PageHeader
        title="User Flow"
        subtitle={`Control the onboarding activation steps new users go through. Drag to reorder, toggle to enable. ${enabledCount}/${steps.length} active.`}
      />

      {steps.length === 0 ? (
        <Card>
          <EmptyState>No onboarding steps configured.</EmptyState>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={steps.map((s) => s.key)}
            strategy={verticalListSortingStrategy}
          >
            <Card className="divide-y divide-border">
              {steps.map((step, i) => (
                <StepRow
                  key={step.key}
                  step={step}
                  index={i}
                  onToggle={(enabled) =>
                    toggle.mutate({ key: step.key, enabled })
                  }
                />
              ))}
            </Card>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function StepRow({
  step,
  index,
  onToggle,
}: {
  step: AdminFlowStep;
  index: number;
  onToggle: (enabled: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.key });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 bg-card p-4',
        isDragging && 'relative z-10 shadow-lg',
        !step.enabled && 'opacity-60',
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-xs font-medium tabular-nums text-muted-foreground">
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{step.label}</span>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            {step.key}
          </code>
        </div>
        {step.description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {step.description}
          </p>
        ) : null}
      </div>

      <Switch
        checked={step.enabled}
        onCheckedChange={(enabled) => onToggle(enabled)}
      />
    </div>
  );
}
