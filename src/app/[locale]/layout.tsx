import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { QueryProvider } from '@/providers/query-provider';
import { FeatureFlagsProvider } from '@/providers/feature-flags-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PushBootstrap } from '@/components/push/push-bootstrap';
import { BugReportLauncher } from '@/components/bug-report/bug-report-launcher';
import { PwaProvider } from '@/providers/pwa-provider';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as 'fa' | 'en')) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider>
        <QueryProvider>
          <FeatureFlagsProvider>
            <TooltipProvider>
              <PushBootstrap />
              <PwaProvider />
              <div className="mx-auto min-h-screen max-w-[430px] bg-background shadow-sm">{children}</div>
              <BugReportLauncher />
            </TooltipProvider>
          </FeatureFlagsProvider>
        </QueryProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
