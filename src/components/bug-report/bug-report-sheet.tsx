'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Loader2, Heart, WifiOff } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/mobile/haptics';
import { presignAndUpload } from '@/lib/api/uploads';
import {
  createBugReport,
  BUG_CATEGORIES,
  type BugCategory,
  type CreateBugReportInput,
} from '@/lib/api/bug-reports';
import { useBugReportStore } from '@/stores/bug-report-store';
import { useAuthStore } from '@/stores/auth-store';
import { collectContext } from '@/lib/bug-report/collect-context';
import { getReplay } from '@/lib/bug-report/activity-recorder';
import { dataUrlToFile } from '@/lib/bug-report/screenshot';
import { ScreenshotAnnotator } from './screenshot-annotator';

type Phase = 'form' | 'submitting' | 'success' | 'queued';

function newToken() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `br-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function BugReportSheet() {
  const t = useTranslations('bugReport');
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const open = useBugReportStore((s) => s.open);
  const closeSheet = useBugReportStore((s) => s.closeSheet);
  const screenshot = useBugReportStore((s) => s.screenshot);
  const setScreenshot = useBugReportStore((s) => s.setScreenshot);
  const draft = useBugReportStore((s) => s.draft);
  const setDraft = useBugReportStore((s) => s.setDraft);
  const clearDraft = useBugReportStore((s) => s.clearDraft);
  const shakeEnabled = useBugReportStore((s) => s.shakeEnabled);
  const setShakeEnabled = useBugReportStore((s) => s.setShakeEnabled);
  const enqueue = useBugReportStore((s) => s.enqueue);

  const [phase, setPhase] = useState<Phase>('form');
  const [progress, setProgress] = useState(0);
  const [ticket, setTicket] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    draft.title.trim().length >= 3 && draft.description.trim().length >= 3;

  const categoryLabels = useMemo(
    () =>
      Object.fromEntries(
        BUG_CATEGORIES.map((c) => [c, t(`categories.${c}`)]),
      ) as Record<BugCategory, string>,
    [t],
  );

  function resetAndClose() {
    setPhase('form');
    setProgress(0);
    setTicket(null);
    setError(null);
    closeSheet();
  }

  async function buildPayload(): Promise<CreateBugReportInput> {
    const ctx = collectContext({ userId });
    let screenshotUrl: string | undefined;

    if (screenshot) {
      const file = dataUrlToFile(screenshot, `bug-${Date.now()}.png`);
      screenshotUrl = await presignAndUpload(file, 'bug-reports', (f) =>
        setProgress(Math.round(f * 100)),
      );
    }

    return {
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      route: ctx.route,
      screenshotUrl,
      deviceInfo: ctx.deviceInfo,
      appInfo: ctx.appInfo,
      metadata: { ...ctx.metadata, replay: getReplay() },
      logs: ctx.logs,
      clientToken: newToken(),
    };
  }

  async function submit() {
    if (!canSubmit) return;
    setError(null);
    setPhase('submitting');
    haptic('medium');

    try {
      const payload = await buildPayload();

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueue({ clientToken: payload.clientToken!, payload, queuedAt: Date.now(), attempts: 0 });
        clearDraft();
        haptic('success');
        setPhase('queued');
        return;
      }

      const res = await createBugReport(payload);
      setTicket(res.ticketNumber);
      clearDraft();
      haptic('success');
      setPhase('success');
    } catch (e) {
      // Network/transient failure → queue for retry instead of losing the report.
      const message = e instanceof Error ? e.message : String(e);
      const isNetwork = /failed|network|fetch/i.test(message);
      if (isNetwork) {
        try {
          const payload = await buildPayload();
          enqueue({ clientToken: payload.clientToken!, payload, queuedAt: Date.now(), attempts: 0 });
          clearDraft();
          haptic('success');
          setPhase('queued');
          return;
        } catch {
          /* fall through to error */
        }
      }
      setError(message);
      setPhase('form');
      haptic('error');
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && resetAndClose()}>
      <SheetContent
        side="bottom"
        data-bug-report-ignore="true"
        className={cn(
          'mx-auto max-w-[430px] rounded-t-3xl border-white/10',
          'bg-background/75 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60',
          'max-h-[92vh] overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]',
        )}
      >
        {phase === 'success' || phase === 'queued' ? (
          <SuccessView
            queued={phase === 'queued'}
            ticket={ticket}
            t={t}
            onClose={resetAndClose}
          />
        ) : (
          <>
            <SheetHeader className="px-0">
              <SheetTitle className="text-xl">{t('title')}</SheetTitle>
              <SheetDescription>{t('subtitle')}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 py-2">
              {screenshot && (
                <ScreenshotAnnotator src={screenshot} onChange={setScreenshot} />
              )}

              <Input
                value={draft.title}
                onChange={(e) => setDraft({ title: e.target.value })}
                placeholder={t('titlePlaceholder')}
                maxLength={140}
                disabled={phase === 'submitting'}
              />

              <Textarea
                value={draft.description}
                onChange={(e) => setDraft({ description: e.target.value })}
                placeholder={t('descriptionPlaceholder')}
                rows={4}
                maxLength={5000}
                disabled={phase === 'submitting'}
              />

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {t('categoryLabel')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {BUG_CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      disabled={phase === 'submitting'}
                      onClick={() => {
                        setDraft({ category: c });
                        haptic('selection');
                      }}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                        draft.category === c
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border/60 bg-background/40 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {categoryLabels[c]}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between rounded-2xl border border-border/50 bg-background/30 px-4 py-3">
                <span className="text-sm">{t('shakeToggle')}</span>
                <Switch
                  checked={shakeEnabled}
                  onCheckedChange={(v) => {
                    setShakeEnabled(v);
                    haptic('selection');
                  }}
                />
              </label>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              {phase === 'submitting' && progress > 0 && progress < 100 && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              <Button
                onClick={submit}
                disabled={!canSubmit || phase === 'submitting'}
                className="h-12 rounded-2xl text-base"
              >
                {phase === 'submitting' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  t('submit')
                )}
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                {t('privacyNote')}
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SuccessView({
  queued,
  ticket,
  t,
  onClose,
}: {
  queued: boolean;
  ticket: string | null;
  t: ReturnType<typeof useTranslations>;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-2 py-10 text-center">
      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full',
          queued ? 'bg-amber-500/15 text-amber-500' : 'bg-primary/15 text-primary',
        )}
      >
        {queued ? (
          <WifiOff className="h-8 w-8" />
        ) : (
          <CheckCircle2 className="h-8 w-8" />
        )}
      </div>
      <div className="space-y-1">
        <h3 className="flex items-center justify-center gap-1.5 text-lg font-semibold">
          {queued ? t('queuedTitle') : t('successTitle')}
          {!queued && <Heart className="h-4 w-4 fill-red-500 text-red-500" />}
        </h3>
        <p className="text-sm text-muted-foreground">
          {queued ? t('queuedBody') : t('successBody')}
        </p>
      </div>
      {!queued && ticket && (
        <div className="rounded-2xl border border-border/60 bg-background/40 px-5 py-3">
          <p className="text-xs text-muted-foreground">{t('ticketLabel')}</p>
          <p className="font-mono text-lg font-semibold">#{ticket}</p>
        </div>
      )}
      <Button onClick={onClose} variant="secondary" className="mt-2 rounded-2xl">
        {t('done')}
      </Button>
    </div>
  );
}
