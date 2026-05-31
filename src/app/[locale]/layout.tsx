import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getLocaleFontClass } from '@/lib/fonts';
import { QueryProvider } from '@/providers/query-provider';

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
    <html lang={locale} dir={dir}>
      <body className={`min-h-screen bg-neutral-50 antialiased ${fontClass}`}>
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <div className="mx-auto min-h-screen max-w-[430px] bg-white shadow-sm">
              {children}
            </div>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
