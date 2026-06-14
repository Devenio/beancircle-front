'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Section, Container } from './primitives/section';
import { BrandMark } from './brand-mark';

export function MarketingFooter() {
  const t = useTranslations('marketing.footer');
  const columns = ['product', 'company', 'legal'] as const;
  const year = new Date().getFullYear();

  return (
    <Section className="border-t border-[var(--bc-line)] pb-10 pt-16">
      <Container size="wide">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="flex flex-col gap-4">
            <BrandMark />
            <p className="max-w-xs text-sm leading-relaxed text-[var(--bc-muted)]">
              {t('tagline')}
            </p>
          </div>

          {columns.map((col) => {
            const links = t.raw(`columns.${col}.links`) as string[];
            return (
              <div key={col} className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bc-faint)]">
                  {t(`columns.${col}.title`)}
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {links.map((label) => {
                    const href =
                      col === 'legal'
                        ? label.toLowerCase().includes('priv') || label.includes('حریم')
                          ? '/privacy'
                          : '/terms'
                        : '/login';
                    return (
                      <li key={label}>
                        <Link
                          href={href}
                          className="text-sm text-[var(--bc-muted)] transition-colors hover:text-[var(--bc-cream)]"
                        >
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--bc-line)] pt-6 text-sm text-[var(--bc-faint)] sm:flex-row">
          <p>© {year} Bean Circle. {t('rights')}</p>
          <p className="font-medium">Made for coffee people ☕</p>
        </div>
      </Container>
    </Section>
  );
}
