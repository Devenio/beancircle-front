'use client';

import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

type Section = {
  heading: string;
  body: string[];
};

/**
 * Renders a long-form legal document (Terms, Privacy Policy) from a translation
 * namespace. Content lives in `messages/{locale}.json` under `legal.{docKey}`
 * so both documents stay fully localized and RTL-aware.
 */
export function LegalPage({ docKey }: { docKey: 'terms' | 'privacy' }) {
  const t = useTranslations('legal');
  const router = useRouter();

  const title = t(`${docKey}.title`);
  const sections = t.raw(`${docKey}.sections`) as Section[];

  function goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/login');
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 grid h-12 shrink-0 grid-cols-[3rem_1fr_3rem] items-center border-b border-border/80 bg-background/95 backdrop-blur-md">
        <button
          type="button"
          onClick={goBack}
          className="flex size-12 items-center justify-center text-foreground active:opacity-60"
          aria-label={t('back')}
        >
          <ChevronLeft className="size-6 rtl:rotate-180" strokeWidth={1.75} />
        </button>
        <h1 className="truncate text-center text-[16px] font-semibold tracking-tight">
          {title}
        </h1>
        <span aria-hidden className="size-12" />
      </header>

      <article className="flex-1 px-5 py-6">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(`${docKey}.effective`)}
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-foreground/90">
          {t(`${docKey}.intro`)}
        </p>

        <div className="mt-6 space-y-6">
          {sections.map((section, i) => (
            <section key={i}>
              <h3 className="text-base font-semibold">{`${i + 1}. ${section.heading}`}</h3>
              <div className="mt-2 space-y-2">
                {section.body.map((paragraph, j) => (
                  <p
                    key={j}
                    className="text-[15px] leading-relaxed text-foreground/80"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          {t('contact')}{' '}
          <a
            href={`mailto:${t('contactEmail')}`}
            className="font-medium text-foreground underline underline-offset-2"
          >
            {t('contactEmail')}
          </a>
        </p>
      </article>
    </div>
  );
}
