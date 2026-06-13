'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Smartphone, Apple, Monitor, Info } from 'lucide-react';
import { InstallButton } from '@/components/pwa/install-button';
import { IosInstallGuide } from '@/components/pwa/ios-install-guide';
import { useInstallState } from '@/hooks/use-pwa';
import { cn } from '@/lib/utils';

type Tab = 'android' | 'ios' | 'desktop';

const TABS: { key: Tab; Icon: typeof Smartphone }[] = [
  { key: 'android', Icon: Smartphone },
  { key: 'ios', Icon: Apple },
  { key: 'desktop', Icon: Monitor },
];

/**
 * Platform-aware install instructions with a manual tab switcher. Auto-selects
 * the detected platform; users can switch to read another platform's steps.
 */
export function PlatformInstructions() {
  const t = useTranslations('install');
  const { info, canPrompt, mounted } = useInstallState();

  // Default to the detected platform; once the user picks a tab, honour it.
  const detected: Tab = info.isIOS ? 'ios' : info.isAndroid ? 'android' : 'desktop';
  const [override, setOverride] = useState<Tab | null>(null);
  const tab = override ?? detected;
  const setTab = setOverride;

  return (
    <section id="instructions" aria-labelledby="instructions-heading">
      <h2 id="instructions-heading" className="px-1 text-[15px] font-semibold">
        {t('steps.heading')}
      </h2>

      {mounted && info.deviceLabel ? (
        <p className="mt-1 px-1 text-xs text-muted-foreground">
          {t('platform.detected', { device: info.deviceLabel })}
        </p>
      ) : null}

      {/* Tab switcher */}
      <div role="tablist" aria-label={t('steps.heading')} className="mt-3 flex gap-1.5 rounded-2xl bg-muted/60 p-1">
        {TABS.map(({ key, Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-medium transition-colors',
              tab === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            <Icon className="size-4" />
            {t(`tabs.${key}`)}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {tab === 'android' && <AndroidPanel canPrompt={canPrompt} />}
        {tab === 'ios' && <IosPanel notSafari={info.isIOS && info.browser !== 'safari' && info.browser !== 'unknown'} />}
        {tab === 'desktop' && <DesktopPanel canPrompt={canPrompt} />}
      </div>
    </section>
  );
}

/* ── Shared bits ──────────────────────────────────────────────────────────── */
function Callout({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-sm leading-relaxed text-foreground">
      <span className="mt-0.5 shrink-0 text-primary">{icon ?? <Info className="size-[18px]" />}</span>
      <p>{children}</p>
    </div>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {i + 1}
          </span>
          <span className="pt-0.5 text-sm leading-relaxed">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      {title ? <h3 className="mb-3 text-[14px] font-semibold">{title}</h3> : null}
      {children}
    </div>
  );
}

/* ── Panels ───────────────────────────────────────────────────────────────── */
function AndroidPanel({ canPrompt }: { canPrompt: boolean }) {
  const t = useTranslations('install');
  return (
    <div className="space-y-3">
      {canPrompt ? (
        <Card title={t('prompt.title')}>
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{t('prompt.body')}</p>
          <InstallButton source="install_page_android" className="w-full" />
        </Card>
      ) : null}
      <Card title={t('android.menu.title')}>
        <StepList steps={[t('android.menu.step1'), t('android.menu.step2'), t('android.menu.step3')]} />
      </Card>
    </div>
  );
}

function IosPanel({ notSafari }: { notSafari: boolean }) {
  const t = useTranslations('install');
  return (
    <div className="space-y-3">
      {notSafari ? <Callout icon={<Apple className="size-[18px]" />}>{t('ios.openInSafari')}</Callout> : null}
      <IosInstallGuide />
    </div>
  );
}

function DesktopPanel({ canPrompt }: { canPrompt: boolean }) {
  const t = useTranslations('install');
  return (
    <div className="space-y-3">
      {canPrompt ? (
        <Card title={t('prompt.title')}>
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{t('desktop.promptBody')}</p>
          <InstallButton source="install_page_desktop" className="w-full" />
        </Card>
      ) : null}
      <Card title={t('desktop.chrome.title')}>
        <StepList steps={[t('desktop.chrome.step1'), t('desktop.chrome.step2'), t('desktop.chrome.step3')]} />
      </Card>
      <Card title={t('desktop.edge.title')}>
        <StepList steps={[t('desktop.edge.step1'), t('desktop.edge.step2'), t('desktop.edge.step3')]} />
      </Card>
    </div>
  );
}
