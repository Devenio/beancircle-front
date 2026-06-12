import { Plus_Jakarta_Sans } from 'next/font/google';

// English font — loaded via next/font (self-hosted, optimised)
export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-en',
});

// Vazirmatn is declared in globals.css via @font-face with explicit unicode-range,
// so the browser uses it for Arabic/Persian codepoints on every page and locale
// without competing with next/font's generated fallback stack.
export const fontVariables = plusJakartaSans.variable;
