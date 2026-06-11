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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  cafeOsApi,
  type LoyaltyKind,
  type LoyaltyProgram,
} from '@/lib/api/cafe-os';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Cake, Coffee, Crown, Footprints, Gift, Plus, Stamp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const KIND_ICONS: Record<LoyaltyKind, typeof Stamp> = {
  STAMP_CARD: Stamp,
  VISIT_COUNT: Footprints,
  BIRTHDAY: Cake,
  VIP: Crown,
};

const KINDS: LoyaltyKind[] = ['STAMP_CARD', 'VISIT_COUNT', 'BIRTHDAY', 'VIP'];

type FormState = {
  kind: LoyaltyKind;
  title: string;
  description: string;
  goal: string;
  rewardLabel: string;
  isActive: boolean;
};

const EMPTY: FormState = {
  kind: 'STAMP_CARD',
  title: '',
  description: '',
  goal: '5',
  rewardLabel: '',
  isActive: true,
};

export default function LoyaltyPage() {
  const t = useTranslations('cafeOs.loyalty');
  const { cafeId } = useParams<{ cafeId: string }>();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<LoyaltyProgram | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const programsKey = ['cafe-loyalty', cafeId];
  const { data: programs, isLoading } = useQuery({
    queryKey: programsKey,
    queryFn: () => cafeOsApi.loyaltyPrograms(cafeId),
  });

  const open = creating || !!editing;

  useEffect(() => {
    if (editing) {
      setForm({
        kind: editing.kind,
        title: editing.title,
        description: editing.description ?? '',
        goal: String(editing.goal),
        rewardLabel: editing.rewardLabel,
        isActive: editing.isActive,
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
      const body = {
        kind: form.kind,
        title: form.title.trim(),
        description: form.description.trim() || null,
        goal: Number(form.goal) || 1,
        rewardLabel: form.rewardLabel.trim(),
        isActive: form.isActive,
      };
      return editing
        ? cafeOsApi.updateLoyalty(cafeId, editing.id, body)
        : cafeOsApi.createLoyalty(cafeId, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: programsKey });
      close();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cafeOsApi.deleteLoyalty(cafeId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: programsKey });
      close();
    },
  });

  const needsGoal = form.kind === 'STAMP_CARD' || form.kind === 'VISIT_COUNT';

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          {t('newProgram')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : !programs?.length ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <Gift className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {programs.map((program) => {
            const Icon = KIND_ICONS[program.kind] ?? Stamp;
            return (
              <button
                key={program.id}
                type="button"
                onClick={() => setEditing(program)}
                className="w-full rounded-2xl border border-border bg-card p-4 text-start transition hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{program.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(`kinds.${program.kind}`)} · {t('reward')}: {program.rewardLabel}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      program.isActive
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {program.isActive ? t('active') : t('inactive')}
                  </span>
                </div>
                {program.kind === 'STAMP_CARD' ? (
                  <StampPreview goal={program.goal} filled={Math.ceil(program.goal / 2)} />
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('participants', { count: program._count?.progress ?? 0 })}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Builder sheet */}
      <Sheet open={open} onOpenChange={(o) => !o && close()}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[92dvh] max-w-[430px] overflow-y-auto rounded-t-2xl"
        >
          <SheetHeader>
            <SheetTitle>{editing ? t('editProgram') : t('newProgram')}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-8">
            {!editing ? (
              <div className="grid grid-cols-2 gap-2">
                {KINDS.map((kind) => {
                  const Icon = KIND_ICONS[kind];
                  return (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, kind }))}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition ${
                        form.kind === kind
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {t(`kinds.${kind}`)}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">{t('programTitle')}</span>
              <Input
                value={form.title}
                placeholder={t(`titlePlaceholders.${form.kind}`)}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">{t('description')}</span>
              <Textarea
                value={form.description}
                rows={2}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>

            {needsGoal ? (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">{t('goal')}</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={form.goal}
                  onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                />
              </label>
            ) : null}

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">{t('rewardLabel')}</span>
              <Input
                value={form.rewardLabel}
                placeholder={t('rewardPlaceholder')}
                onChange={(e) => setForm((f) => ({ ...f, rewardLabel: e.target.value }))}
              />
            </label>

            {form.kind === 'STAMP_CARD' && Number(form.goal) > 0 ? (
              <div className="rounded-xl border border-border p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">{t('cardPreview')}</p>
                <StampPreview goal={Number(form.goal)} filled={0} />
              </div>
            ) : null}

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-sm font-medium">{t('active')}</span>
              <Switch
                checked={form.isActive}
                onCheckedChange={(c) => setForm((f) => ({ ...f, isActive: c }))}
              />
            </div>

            <div className="flex gap-2">
              {editing ? (
                <Button
                  variant="outline"
                  className="text-destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm(t('deleteConfirm'))) deleteMutation.mutate(editing.id);
                  }}
                >
                  {t('delete')}
                </Button>
              ) : null}
              <Button
                className="flex-1"
                disabled={
                  !form.title.trim() || !form.rewardLabel.trim() || saveMutation.isPending
                }
                onClick={() => saveMutation.mutate()}
              >
                {t('save')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function StampPreview({ goal, filled }: { goal: number; filled: number }) {
  const stamps = Math.min(goal, 12);
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {Array.from({ length: stamps }).map((_, i) => (
        <div
          key={i}
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
            i < filled
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-dashed border-border text-muted-foreground'
          }`}
        >
          <Coffee className="h-3.5 w-3.5" />
        </div>
      ))}
    </div>
  );
}
