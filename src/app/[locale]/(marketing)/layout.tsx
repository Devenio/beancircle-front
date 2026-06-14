import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SmoothScroll } from '@/components/marketing/providers/smooth-scroll';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { MarketingFooter } from '@/components/marketing/marketing-footer';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'marketing.meta' });
  const title = t('title');
  const description = t('description');
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: { en: '/en', fa: '/fa' },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}`,
      siteName: 'Bean Circle',
      type: 'website',
      locale: locale === 'fa' ? 'fa_IR' : 'en_US',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="bc-marketing bc-fullbleed relative min-h-screen overflow-x-clip">
      <SmoothScroll>
        <MarketingNav />
        <main>{children}</main>
        <MarketingFooter />
      </SmoothScroll>
    </div>
  );
}
