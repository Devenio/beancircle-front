import { Link } from '@/i18n/navigation';
import { Map } from 'lucide-react';

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative px-2 pt-2">
      {children}
      <Link
        href="/discover/map"
        className="fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105 active:scale-95"
        aria-label="Open cafe map"
      >
        <Map className="h-5 w-5" />
      </Link>
    </div>
  );
}
