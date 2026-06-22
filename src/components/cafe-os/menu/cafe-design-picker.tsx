'use client';

import {
  cafeAvailableDesigns,
  cafeSetDesignSelection,
  type DesignType,
  type RegisteredDesign,
} from '@/lib/api/designs';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ImageOff } from 'lucide-react';

/**
 * Layer 3 — cafe owner design picker. Shows ONLY the designs the admin has
 * whitelisted for this cafe (plus the always-available default), and lets the
 * owner pick one design for the menu and one for the welcome screen.
 */
export function CafeDesignPicker({ cafeId }: { cafeId: string }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cafe-designs', cafeId],
    queryFn: () => cafeAvailableDesigns(cafeId),
  });

  const select = useMutation({
    mutationFn: (payload: {
      menuDesignKey?: string | null;
      welcomeDesignKey?: string | null;
    }) => cafeSetDesignSelection(cafeId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cafe-designs', cafeId] });
      qc.invalidateQueries({ queryKey: ['cafe-menu', cafeId] });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
    );
  }

  const sel = data.selection;

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-4">
      <div>
        <h2 className="text-sm font-semibold">Page design</h2>
        <p className="text-xs text-muted-foreground">
          Choose a coded layout for your menu and welcome screen.
        </p>
      </div>

      <DesignChoice
        title="Menu design"
        type="menu"
        designs={data.menu}
        selectedKey={sel.selectedMenuDesignKey}
        resolvedKey={sel.resolved.menu.key}
        fellBack={sel.resolved.menu.fellBack}
        onPick={(key) => select.mutate({ menuDesignKey: key })}
      />

      <DesignChoice
        title="Welcome design"
        type="welcome"
        designs={data.welcome}
        selectedKey={sel.selectedWelcomeDesignKey}
        resolvedKey={sel.resolved.welcome.key}
        fellBack={sel.resolved.welcome.fellBack}
        onPick={(key) => select.mutate({ welcomeDesignKey: key })}
      />
    </div>
  );
}

function DesignChoice({
  title,
  type,
  designs,
  selectedKey,
  resolvedKey,
  fellBack,
  onPick,
}: {
  title: string;
  type: DesignType;
  designs: RegisteredDesign[];
  selectedKey: string | null;
  resolvedKey: string;
  fellBack: boolean;
  onPick: (key: string | null) => void;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        {fellBack && selectedKey ? (
          <span className="text-[11px] text-amber-600">
            Your previous choice is no longer available — showing the default.
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {designs.map((d) => {
          // What actually renders is `resolvedKey`; highlight that so the owner
          // sees the real state even after an admin revokes their pick.
          const isActive = d.key === resolvedKey;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onPick(d.key)}
              className={cn(
                'relative overflow-hidden rounded-xl border text-left transition',
                isActive
                  ? 'border-primary ring-1 ring-primary'
                  : 'border-border hover:border-foreground/30',
              )}
            >
              <div className="flex aspect-video items-center justify-center bg-muted">
                {d.previewImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.previewImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageOff className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              {isActive ? (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              ) : null}
              <span className="block truncate px-2 py-1.5 text-xs font-medium">
                {d.name}
              </span>
            </button>
          );
        })}
        {designs.length === 0 ? (
          <p className="col-span-full text-xs text-muted-foreground">
            No {type} designs are available to your cafe yet.
          </p>
        ) : null}
      </div>
    </section>
  );
}
