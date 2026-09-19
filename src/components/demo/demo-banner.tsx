import { getTranslations } from 'next-intl/server';

/** Persistent demo notice for the live mock-SMS environment. */
export async function DemoBanner() {
  const t = await getTranslations('demo');

  return (
    <div
      role="status"
      data-testid="demo-banner"
      className="shrink-0 border-b border-amber-950/20 bg-amber-400 px-3 py-1.5 pt-[max(0.375rem,env(safe-area-inset-top))] text-center text-[12px] leading-snug text-amber-950"
    >
      <span className="me-1.5 inline-flex items-center rounded-full bg-amber-950 px-1.5 py-px text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200">
        {t('label')}
      </span>
      <span>{t('message')}</span>
    </div>
  );
}
