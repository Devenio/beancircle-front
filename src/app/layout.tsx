import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import './globals.css';
import { fontVariables } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'Bean Circle',
  description: 'Cafe-focused social network',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const dir = locale === 'fa' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} className={fontVariables} suppressHydrationWarning>
      <body
        className="min-h-screen bg-background antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
