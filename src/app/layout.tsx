import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import './globals.css';
import { Geist } from 'next/font/google';
import { getLocaleFontClass } from '@/lib/fonts';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Bean Circle',
  description: 'Cafe-focused social network',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const dir = locale === 'fa' ? 'rtl' : 'ltr';
  const fontClass = getLocaleFontClass(locale);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={`${geist.variable} min-h-screen bg-background antialiased ${fontClass}`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
