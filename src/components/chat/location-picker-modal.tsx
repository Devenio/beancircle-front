'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { Loader2, MapPin, Navigation, Radio, Search, SendHorizontal, X, Square } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Marker } from '@neshan-maps-platform/mapbox-gl';
import { MapComponent, MapTypes } from '@neshan-maps-platform/mapbox-gl-react';
import '@neshan-maps-platform/mapbox-gl-react/dist/style.css';
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

type NeshanSearchItem = {
  title: string;
  address: string;
  location: { x: number; y: number };
  type: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapInstance = any;

const NESHAN_KEY = process.env.NEXT_PUBLIC_NESHAN_API_KEY ?? '';
const TEHRAN: [number, number] = [51.389, 35.6892];

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
      { headers: { 'User-Agent': 'beancircle-app/1.0' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};
    const road = a.road ?? a.pedestrian ?? a.path ?? '';
    const neighbourhood = a.neighbourhood ?? a.suburb ?? '';
    const parts = [road, neighbourhood].filter(Boolean);
    return parts.join(', ') || (data.display_name ?? null);
  } catch {
    return null;
  }
}

export function LocationPickerModal({ open, onOpenChange, onSend }: LocationPickerModalProps) {
  const t = useTranslations('messages');
  const locale = useLocale();
  const coarse = useCoarsePointer();

  const mapRef = useRef<MapInstance | null>(null);
  const markerRef = useRef<InstanceType<typeof Marker> | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NeshanSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<LocationResult | null>(null);
  const [liveSharing, setLiveSharing] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const isDark = useMemo(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
    [],
  );

  const mapOpts = useMemo(
    () => ({
      mapKey: NESHAN_KEY,
      mapType: isDark ? MapTypes.neshanVectorNight : MapTypes.neshanVector,
      poi: false,
      traffic: false,
      center: TEHRAN,
      zoom: 14,
      mapTypeControllerOptions: { show: false },
      attributionControl: false,
    }),
    [isDark],
  );

  // Clean up on close
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSelected(null);
      setLiveSharing(false);
      setMapReady(false);
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }
  }, [open]);

  // Search places via Neshan API
  const searchPlaces = useCallback(async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({ term: q });
      if (selected) {
        params.set('lat', String(selected.lat));
        params.set('lng', String(selected.lng));
      }
      const res = await fetch(`https://api.neshan.org/v1/search?${params}`, {
        headers: { 'Api-Key': NESHAN_KEY },
      });
      const data = await res.json();
      const items: NeshanSearchItem[] = data.items ?? data.data ?? [];
      setResults(items.slice(0, 6));
    } catch {
      // Fallback to Nominatim if Neshan search fails
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
          { headers: { 'Accept-Language': 'en' } },
        );
        const data = await res.json();
        setResults(
          data.map((r: { lat: string; lon: string; display_name: string }) => ({
            title: r.display_name.split(',')[0] ?? r.display_name,
            address: r.display_name,
            location: { x: Number(r.lon), y: Number(r.lat) },
            type: 'place',
          })),
        );
      } catch {
        setResults([]);
      }
    } finally {
      setSearching(false);
    }
  }, [query, selected]);

  // Drop pin on map
  const dropPin = useCallback(
    (map: MapInstance, lng: number, lat: number) => {
      if (markerRef.current) markerRef.current.remove();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      markerRef.current = new (Marker as any)({ color: '#7c3aed' })
        .setLngLat([lng, lat])
        .addTo(map);
    },
    [],
  );

  // Handle map click to drop pin
  const handleMapReady = useCallback(
    (map: MapInstance) => {
      mapRef.current = map;
      setMapReady(true);

      map.on('click', async (e: { lngLat: { lat: number; lng: number } }) => {
        const { lat, lng } = e.lngLat;
        dropPin(map, lng, lat);
        const label = await reverseGeocode(lat, lng);
        setSelected({ lat, lng, label: label ?? t('droppedPin') });
      });
    },
    [dropPin, t],
  );

  // Fly map to location
  const flyTo = useCallback(
    (lat: number, lng: number) => {
      const map = mapRef.current;
      if (!map) return;
      map.flyTo({ center: [lng, lat], zoom: 16, duration: 800 });
      dropPin(map, lng, lat);
    },
    [dropPin],
  );

  // Select a search result
  const selectResult = useCallback(
    (item: NeshanSearchItem) => {
      const lat = item.location.y;
      const lng = item.location.x;
      setSelected({ lat, lng, label: item.title });
      flyTo(lat, lng);
      setResults([]);
      setQuery(item.title);
    },
    [flyTo],
  );

  // Use current GPS location
  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLoadingCurrent(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setSelected({ lat, lng, label: t('currentLocation') });
        flyTo(lat, lng);
        setLoadingCurrent(false);
      },
      () => setLoadingCurrent(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [flyTo, t]);

  // Send location
  const handleSend = () => {
    if (!selected) return;
    onSend(selected, liveSharing);
    onOpenChange(false);
  };

  // Start live location tracking
  useEffect(() => {
    if (!liveSharing || !open) return;

    const sendUpdate = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setSelected((prev) => (prev ? { ...prev, lat, lng } : { lat, lng, label: t('currentLocation') }));
      if (mapRef.current) {
        dropPin(mapRef.current, lng, lat);
        mapRef.current.panTo([lng, lat], { duration: 500 });
      }
    };

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(sendUpdate, () => {}, {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      });
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [liveSharing, open, dropPin, t]);

  const pickerBody = (
    <div className="flex flex-col">
      {/* Search bar */}
      <div className="flex gap-2 px-4 pt-3">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlace')}
            onKeyDown={(e) => e.key === 'Enter' && void searchPlaces()}
            aria-label={t('searchPlace')}
            className="h-9 pe-8"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); }}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Button type="button" size="icon" variant="secondary" onClick={() => void searchPlaces()} aria-label={t('searchPlace')}>
          {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
        </Button>
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div className="mx-4 mt-2 max-h-40 overflow-y-auto rounded-xl border border-border">
          {results.map((item, i) => (
            <button
              key={`${item.location.x}-${item.location.y}-${i}`}
              type="button"
              className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
              onClick={() => selectResult(item)}
            >
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate font-medium">{item.title}</p>
                {item.address && item.address !== item.title && (
                  <p className="truncate text-xs text-muted-foreground">{item.address}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Map */}
      <div className="relative mx-4 mt-3 aspect-[4/3] overflow-hidden rounded-xl border border-border">
        <MapComponent options={mapOpts} mapSetter={handleMapReady} style={{ width: '100%', height: '100%' }} />

        {/* Center crosshair when no pin */}
        {!selected && mapReady && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="size-6 -translate-x-1/2 -translate-y-1/2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary drop-shadow">
                <circle cx="12" cy="12" r="4" />
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
              </svg>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3 px-4 pb-4 pt-3">
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
            {liveSharing ? (
              <Radio className="size-4 animate-pulse" />
            ) : (
              <Radio className="size-4" />
            )}
            {t('liveLocation')}
          </Button>
        </div>

        {liveSharing && selected && (
          <p className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
            {t('liveLocationActive')}
          </p>
        )}

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
          {liveSharing ? (
            <>
              <Radio className="size-4 animate-pulse" />
              {t('shareLiveLocation')}
            </>
          ) : (
            <>
              <SendHorizontal className="size-4" />
              {t('shareStaticLocation')}
            </>
          )}
        </Button>
      </div>
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
