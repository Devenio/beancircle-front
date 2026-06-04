'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, MapPin, Navigation, Radio, Search, SendHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ChatBottomSheet } from '@/components/chat/chat-bottom-sheet';
import { useCoarsePointer } from '@/hooks/use-coarse-pointer';

type LocationResult = {
  lat: number;
  lng: number;
  label: string;
};

type LocationPickerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (location: LocationResult, live: boolean) => void;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

export function LocationPickerModal({ open, onOpenChange, onSend }: LocationPickerModalProps) {
  const t = useTranslations('messages');
  const coarse = useCoarsePointer();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<LocationResult | null>(null);
  const [liveSharing, setLiveSharing] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSelected(null);
      setLiveSharing(false);
    }
  }, [open]);

  const searchPlaces = useCallback(async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
        { headers: { 'Accept-Language': 'en' } },
      );
      const data = (await res.json()) as NominatimResult[];
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [query]);

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLoadingCurrent(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelected({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: t('currentLocation'),
        });
        setLoadingCurrent(false);
      },
      () => setLoadingCurrent(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [t]);

  const handleMapClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const lat = 90 - y * 180;
    const lng = x * 360 - 180;
    setSelected({ lat, lng, label: t('droppedPin') });
  }, [t]);

  const handleSend = () => {
    if (!selected) return;
    onSend(selected, liveSharing);
    onOpenChange(false);
  };

  const mapSrc = selected
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${selected.lng - 0.01}%2C${selected.lat - 0.01}%2C${selected.lng + 0.01}%2C${selected.lat + 0.01}&layer=mapnik&marker=${selected.lat}%2C${selected.lng}`
    : 'https://www.openstreetmap.org/export/embed.html?bbox=-0.01%2C51.49%2C0.01%2C51.51&layer=mapnik';

  const pickerBody = (
    <div className="space-y-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlace')}
              onKeyDown={(e) => e.key === 'Enter' && void searchPlaces()}
              aria-label={t('searchPlace')}
              className="h-9"
            />
            <Button type="button" size="icon" variant="secondary" onClick={() => void searchPlaces()} aria-label={t('searchPlace')}>
              {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            </Button>
          </div>

          {results.length > 0 ? (
            <div className="max-h-28 overflow-y-auto rounded-xl border border-border">
              {results.map((item) => (
                <button
                  key={`${item.lat}-${item.lon}`}
                  type="button"
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() =>
                    setSelected({
                      lat: Number(item.lat),
                      lng: Number(item.lon),
                      label: item.display_name.split(',')[0] ?? item.display_name,
                    })
                  }
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="line-clamp-2">{item.display_name}</span>
                </button>
              ))}
            </div>
          ) : null}

          <div
            className="relative aspect-[4/3] cursor-crosshair overflow-hidden rounded-xl border border-border"
            onClick={handleMapClick}
            role="button"
            tabIndex={0}
            aria-label={t('tapToDropPin')}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}
          >
            <iframe
              title={t('mapPreview')}
              src={mapSrc}
              className="pointer-events-none h-full w-full border-0"
            />
            {selected ? (
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
                <MapPin className="size-8 text-primary drop-shadow" />
              </div>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-full"
              onClick={useCurrentLocation}
              disabled={loadingCurrent}
            >
              {loadingCurrent ? <Loader2 className="size-4 animate-spin" /> : <Navigation className="size-4" />}
              {t('currentLocation')}
            </Button>
            <Button
              type="button"
              variant={liveSharing ? 'default' : 'outline'}
              className="flex-1 rounded-full"
              onClick={() => setLiveSharing((v) => !v)}
            >
              <Radio className={cn('size-4', liveSharing && 'animate-pulse')} />
              {t('liveLocation')}
            </Button>
          </div>

          {selected ? (
            <p className="truncate text-xs text-muted-foreground">
              {selected.label} · {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
            </p>
          ) : null}

          <Button
            className="w-full rounded-full"
            disabled={!selected}
            onClick={handleSend}
          >
            <SendHorizontal className="size-4" />
            {liveSharing ? t('shareLiveLocation') : t('shareStaticLocation')}
          </Button>
        </div>
  );

  if (coarse) {
    return (
      <ChatBottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t('shareLocation')}
        description={t('shareLocationDescription')}
        className="max-h-[95dvh]"
      >
        {pickerBody}
      </ChatBottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle>{t('shareLocation')}</DialogTitle>
          <DialogDescription className="sr-only">{t('shareLocationDescription')}</DialogDescription>
        </DialogHeader>
        {pickerBody}
      </DialogContent>
    </Dialog>
  );
}
