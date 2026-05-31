import { Plus_Jakarta_Sans, Vazirmatn } from 'next/font/google';

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
});

export const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  display: 'swap',
});

export function getLocaleFontClass(locale: string) {
  return locale === 'fa' ? vazirmatn.className : plusJakartaSans.className;
}
