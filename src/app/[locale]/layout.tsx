import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getLocaleFontClass } from '@/lib/fonts';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

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
  const dir = locale === 'fa' ? 'rtl' : 'ltr';
  const fontClass = getLocaleFontClass(locale);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`min-h-screen bg-background antialiased ${fontClass}`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <QueryProvider>
              <TooltipProvider>
                <div className="mx-auto min-h-screen max-w-[430px] bg-background shadow-sm">{children}</div>
              </TooltipProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
