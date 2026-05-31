import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bean Circle',
  description: 'Cafe-focused social network',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
