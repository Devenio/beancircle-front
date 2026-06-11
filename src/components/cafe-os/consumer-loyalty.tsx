'use client';

import { cafeConsumerApi } from '@/lib/api/cafe-os';
import { useQuery } from '@tanstack/react-query';
import { Cake, Check, Coffee, Crown, Footprints, Stamp } from 'lucide-react';
import { useTranslations } from 'next-intl';

const KIND_ICONS = {
  STAMP_CARD: Stamp,
  VISIT_COUNT: Footprints,
  BIRTHDAY: Cake,
  VIP: Crown,
} as const;

/** Consumer-facing loyalty cards for a cafe (stamp card progress etc.). */
export function ConsumerLoyaltyCards({ cafeId }: { cafeId: string }) {
  const t = useTranslations('cafeOs.consumerLoyalty');

  const { data: programs } = useQuery({
    queryKey: ['consumer-loyalty', cafeId],
    queryFn: () => cafeConsumerApi.loyalty(cafeId),
  });

  if (!programs?.length) return null;

  return (
    <div className="space-y-3">
      {programs.map((program) => {
        const Icon = KIND_ICONS[program.kind] ?? Stamp;
        const my = program.my;
        const hasProgress = 'progress' in my;
        const completed = hasProgress && my.completed;

        return (
          <div
            key={program.id}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="flex items-center gap-3 p-4 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{program.title}</p>
                <p className="text-xs text-muted-foreground">
                  {t('rewardLine', { reward: program.rewardLabel })}
                </p>
              </div>
              {completed ? (
                <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-600">
                  <Check className="h-3 w-3" />
                  {t('completed')}
                </span>
              ) : null}
            </div>

            {hasProgress && (program.kind === 'STAMP_CARD' || program.kind === 'VISIT_COUNT') ? (
              <div className="px-4 pb-4">
                {program.kind === 'STAMP_CARD' && program.goal <= 12 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: program.goal }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                          i < my.progress
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-dashed border-border text-muted-foreground'
                        }`}
                      >
                        <Coffee className="h-4 w-4" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="h-2 overflow-hidden rounded-full bg-accent">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${Math.min(100, (my.progress / program.goal) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {t('progressLine', { progress: my.progress, goal: program.goal })}
                    </p>
                  </>
                )}
                {completed ? (
                  <p className="mt-2 text-xs font-medium text-green-600">
                    {t('showStaff')}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
