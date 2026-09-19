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
import { AnalyticsProvider } from '@/providers/analytics-provider';
import { DemoBanner } from '@/components/demo/demo-banner';

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
              <AnalyticsProvider>
                <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
                  <DemoBanner />
                  <div className="app-shell relative flex min-h-0 flex-1 flex-col">
                    <PwaProvider />
                    <div className="mx-auto flex min-h-0 w-full max-w-[430px] flex-1 flex-col overflow-y-auto bg-background shadow-sm">
                      {children}
                    </div>
                  </div>
                </div>
                <BugReportLauncher />
              </AnalyticsProvider>
            </TooltipProvider>
          </FeatureFlagsProvider>
        </QueryProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
