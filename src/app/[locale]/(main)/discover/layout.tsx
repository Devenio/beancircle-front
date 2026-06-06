import { DiscoverTabs } from '@/components/discover/discover-tabs';

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4">
      <DiscoverTabs />
      {children}
    </div>
  );
}
