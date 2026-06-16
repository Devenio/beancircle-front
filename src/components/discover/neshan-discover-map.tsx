'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Bell, Check, Coffee, ExternalLink, Loader2, MapPin, Maximize2, Navigation, Plus, RefreshCw, Route, Store, Users, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Marker } from '@neshan-maps-platform/mapbox-gl';
import { MapComponent, MapTypes } from '@neshan-maps-platform/mapbox-gl-react';
import '@neshan-maps-platform/mapbox-gl-react/dist/style.css';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { ProfileAvatar } from '@/components/chat/user-avatar';
import { FriendActionButton } from '@/components/discover/people/friend-action-button';
import { FriendRequestsSheet } from '@/components/discover/people/friend-requests-sheet';
import { useAuthStore } from '@/stores/auth-store';
import type { DiscoverPerson } from '@/components/discover/people/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MapCafe = {
  id: string;
  name: string;
  address: string;
  avgRating: number;
  lat?: number | null;
  lng?: number | null;
  photos?: { url: string }[];
};

type MapPerson = DiscoverPerson & { lat: number; lng: number };
type SelectedPin = { kind: 'cafe'; data: MapCafe } | { kind: 'person'; data: MapPerson };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapInstance = any;

// Fardis, Alborz — Mapbox GL uses [lng, lat] order
const FARDIS: [number, number] = [50.9833, 35.7333];
const NESHAN_KEY = process.env.NEXT_PUBLIC_NESHAN_API_KEY ?? '';
const IS_PLACEHOLDER = !NESHAN_KEY || NESHAN_KEY.includes('your-key');

// ─── Location picker helpers ──────────────────────────────────────────────────

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fa`,
      { headers: { 'User-Agent': 'beancircle-app/1.0' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};
    const road = a.road ?? a.pedestrian ?? a.path ?? '';
    const neighbourhood = a.neighbourhood ?? a.suburb ?? '';
    const parts = [road, neighbourhood].filter(Boolean);
    return parts.join('، ') || (data.display_name ?? null);
  } catch {
    return null;
  }
}

function dropPickerPin(map: MapInstance, lng: number, lat: number) {
  if (map._pickerMarker) map._pickerMarker.remove();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map._pickerMarker = new (Marker as any)({ color: '#7c3aed' }).setLngLat([lng, lat]).addTo(map);
}

// ─── Custom marker element builders ──────────────────────────────────────────

function createCafeMarkerEl(name?: string | null): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText =
    'cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;';

  // Pin shape with coffee cup SVG
  const pin = document.createElement('div');
  pin.style.cssText =
    'width:40px;height:40px;background:linear-gradient(135deg,#7c3aed,#a855f7);' +
    'border-radius:50% 50% 50% 0;transform:rotate(-45deg);' +
    'display:flex;align-items:center;justify-content:center;' +
    'box-shadow:0 4px 16px rgba(124,58,237,.5);border:2.5px solid #fff;flex-shrink:0;';

  const iconWrap = document.createElement('div');
  iconWrap.style.cssText = 'transform:rotate(45deg);display:flex;align-items:center;justify-content:center;';
  iconWrap.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>`;
  pin.appendChild(iconWrap);
  el.appendChild(pin);

  // Name label below pin
  if (name) {
    const label = document.createElement('div');
    // textContent is XSS-safe — no innerHTML
    label.textContent = name.length > 16 ? name.slice(0, 15) + '…' : name;
    label.style.cssText =
      'max-width:96px;padding:2px 6px;background:rgba(255,255,255,0.92);' +
      'backdrop-filter:blur(4px);border-radius:6px;font-size:10px;font-weight:600;' +
      'color:#18181b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' +
      'box-shadow:0 1px 4px rgba(0,0,0,.15);';
    el.appendChild(label);
  }

  return el;
}

/** Only allow http(s) image URLs so attacker-controlled values can't smuggle
 *  javascript:/data: payloads into the marker. */
function safeImageUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

function createPersonMarkerEl(
  avatarUrl?: string | null,
  name?: string | null,
  online = false,
): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = 'cursor:pointer;position:relative;width:44px;height:44px;';
  const ring = online ? '#22c55e' : '#94a3b8';
  const initials = (name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  // Build nodes via the DOM (textContent / .src) rather than innerHTML so
  // user-controlled `name` and `avatarUrl` can never be parsed as markup.
  const safeAvatar = safeImageUrl(avatarUrl);
  const circle = document.createElement('div');
  if (safeAvatar) {
    circle.style.cssText = `width:44px;height:44px;border-radius:50%;border:3px solid ${ring};overflow:hidden;box-shadow:0 3px 12px rgba(0,0,0,.3)`;
    const img = document.createElement('img');
    img.src = safeAvatar;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover';
    circle.appendChild(img);
  } else {
    circle.style.cssText = `width:44px;height:44px;border-radius:50%;background:#3b82f6;border:3px solid ${ring};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;box-shadow:0 3px 12px rgba(59,130,246,.45)`;
    circle.textContent = initials;
  }
  el.appendChild(circle);

  if (online) {
    const dot = document.createElement('span');
    dot.style.cssText =
      'position:absolute;bottom:0;right:0;width:12px;height:12px;background:#22c55e;border-radius:50%;border:2px solid #fff;z-index:1';
    el.appendChild(dot);
  }

  return el;
}

function createSelfMarkerEl(): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText =
    'width:18px;height:18px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 6px rgba(59,130,246,.2);';
  return el;
}

// ─── Route helpers (GeoJSON source + dashed line layer) ───────────────────────

const ROUTE_SOURCE = 'discover-route';
const ROUTE_LAYER = 'discover-route-line';

function drawRoute(map: MapInstance, from: [number, number], to: [number, number]) {
  const geojson = {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: [from, to] },
    properties: {},
  };
  if (map.getSource(ROUTE_SOURCE)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (map.getSource(ROUTE_SOURCE) as any).setData(geojson);
  } else {
    map.addSource(ROUTE_SOURCE, { type: 'geojson', data: geojson });
    map.addLayer({
      id: ROUTE_LAYER,
      type: 'line',
      source: ROUTE_SOURCE,
      paint: {
        'line-color': '#7c3aed',
        'line-width': 3,
        'line-dasharray': [2, 3],
        'line-opacity': 0.75,
      },
    });
  }
}

function eraseRoute(map: MapInstance) {
  if (map.getLayer(ROUTE_LAYER)) map.removeLayer(ROUTE_LAYER);
  if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE);
}

// ─── Stable map wrapper ───────────────────────────────────────────────────────
// memo prevents map from remounting whenever parent state changes

interface StableMapProps {
  opts: object;
  onReady: (map: MapInstance) => void;
}

const StableMap = memo(function StableMap({ opts, onReady }: StableMapProps) {
  return (
    <MapComponent
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options={opts as any}
      mapSetter={onReady}
      style={{ width: '100%', height: '100%' }}
    />
  );
});

// ─── Main component ───────────────────────────────────────────────────────────

export function NeshanDiscoverMap() {
  const locale = useLocale();
  const params = useParams<{ locale: string }>();
  const user = useAuthStore((s) => s.user);

  const mapRef = useRef<MapInstance | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selfMarkerRef = useRef<any>(null);

  const [isDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );

  // Mapbox GL coordinate order: [lng, lat]
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [showCafes, setShowCafes] = useState(true);
  const [showPeople, setShowPeople] = useState(true);
  const [selected, setSelected] = useState<SelectedPin | null>(null);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  // Derived: route is only active when a pin is selected
  const activeRoute = showRoute && selected !== null;

  // Stable options reference — changes only when isDark changes (once)
  const mapOpts = useMemo(
    () => ({
      mapKey: NESHAN_KEY,
      mapType: isDark ? MapTypes.neshanVectorNight : MapTypes.neshanVector,
      poi: false,
      traffic: false,
      center: FARDIS,
      zoom: 13,
      mapTypeControllerOptions: { show: false },
      attributionControl: false,
    }),
    [isDark],
  );

  // ── GPS ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords([pos.coords.longitude, pos.coords.latitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 12_000 },
    );
  }, []);

  // ── Location sharing ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!sharingLocation || !userCoords) return;
    void api('/users/location', {
      method: 'POST',
      body: JSON.stringify({ lat: userCoords[1], lng: userCoords[0] }),
      locale: params.locale,
    });
  }, [sharingLocation, userCoords, params.locale]);

  const stopSharing = useCallback(() => {
    setSharingLocation(false);
    void api('/users/location', { method: 'DELETE', locale: params.locale });
  }, [params.locale]);

  // ── Fetch cafes ────────────────────────────────────────────────────────────
  const { data: cafesRaw, refetch: refetchCafes } = useQuery({
    queryKey: ['cafes-map', locale],
    queryFn: () => api<MapCafe[]>('/discover?limit=100', { locale }),
    staleTime: 60_000,
  });
  const cafes = useMemo(
    () => (cafesRaw ?? []).filter((c) => c.lat != null && c.lng != null),
    [cafesRaw],
  );

  // ── Fetch nearby people ────────────────────────────────────────────────────
  // API expects lat/lng in normal order; only our state uses Mapbox [lng,lat]
  const center = userCoords ?? FARDIS;
  const { data: peopleData, refetch: refetchPeople } = useQuery({
    queryKey: ['discover-map-people', center[0], center[1], locale],
    queryFn: () =>
      api<{ pins: MapPerson[] }>(
        `/discover/map?lat=${center[1]}&lng=${center[0]}&radiusKm=10`,
        { locale },
      ),
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
  const people = useMemo(() => peopleData?.pins ?? [], [peopleData]);

  const { data: requestCount } = useQuery({
    queryKey: ['friends', 'requests-count', locale],
    queryFn: async () => {
      const res = await api<{ incoming: unknown[] }>('/friends/requests', { locale });
      return res.incoming.length;
    },
  });

  // ── Map ready callback ────────────────────────────────────────────────────
  const onMapReady = useCallback((map: MapInstance) => {
    mapRef.current = map;
    if (map.isStyleLoaded()) {
      setMapLoaded(true);
    } else {
      map.once('load', () => setMapLoaded(true));
    }
  }, []);

  // ── Fly to user + self dot ────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !userCoords) return;
    map.flyTo({ center: userCoords, zoom: 14, duration: 800 });
    selfMarkerRef.current?.remove();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selfMarkerRef.current = new (Marker as any)({ element: createSelfMarkerEl(), anchor: 'center' })
      .setLngLat(userCoords)
      .addTo(map);
  }, [userCoords, mapLoaded]);

  // ── Render pins ───────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (showCafes) {
      for (const cafe of cafes) {
        const el = createCafeMarkerEl(cafe.name);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const marker = new (Marker as any)({ element: el, anchor: 'bottom' })
          .setLngLat([cafe.lng!, cafe.lat!])
          .addTo(map);
        el.addEventListener('click', () => {
          setSelected({ kind: 'cafe', data: cafe });
          setShowRoute(false);
        });
        markersRef.current.push(marker);
      }
    }

    if (showPeople) {
      for (const person of people) {
        const el = createPersonMarkerEl(
          person.avatarUrl,
          person.name,
          person.lastActive === 'online',
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const marker = new (Marker as any)({ element: el, anchor: 'center' })
          .setLngLat([person.lng, person.lat])
          .addTo(map);
        el.addEventListener('click', () => {
          setSelected({ kind: 'person', data: person });
          setShowRoute(false);
        });
        markersRef.current.push(marker);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafes, people, showCafes, showPeople, mapLoaded]);

  // ── Route line ────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (!activeRoute || !userCoords) {
      eraseRoute(map);
      return;
    }
    const dest: [number, number] =
      selected!.kind === 'cafe'
        ? [selected!.data.lng!, selected!.data.lat!]
        : [selected!.data.lng, selected!.data.lat];
    drawRoute(map, userCoords, dest);
  }, [activeRoute, selected, userCoords, mapLoaded]);

  // ── Google Maps directions ────────────────────────────────────────────────
  const openDirections = useCallback(() => {
    if (!selected || !userCoords) return;
    const dLat = selected.kind === 'cafe' ? selected.data.lat! : selected.data.lat;
    const dLng = selected.kind === 'cafe' ? selected.data.lng! : selected.data.lng;
    window.open(
      `https://www.google.com/maps/dir/${userCoords[1]},${userCoords[0]}/${dLat},${dLng}`,
      '_blank',
      'noopener',
    );
  }, [selected, userCoords]);

  const flyToUser = () => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: userCoords ?? FARDIS, zoom: userCoords ? 15 : 13, duration: 600 });
  };

  // ── No key placeholder ────────────────────────────────────────────────────
  if (IS_PLACEHOLDER) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <MapPin className="size-8 text-primary" />
        <p className="font-semibold">Neshan API key not set</p>
        <p className="text-sm text-muted-foreground">
          Add it to <span className="font-mono">.env.local</span>:
        </p>
        <code className="rounded-lg bg-muted px-3 py-2 text-xs">
          NEXT_PUBLIC_NESHAN_API_KEY=web.xxxxxxxx
        </code>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-full w-full">
        {/* Map — StableMap is memo'd so pin/UI state never causes remount */}
        <StableMap opts={mapOpts} onReady={onMapReady} />

        {/* Loading overlay */}
        {!mapLoaded && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading map…
            </div>
          </div>
        )}

        {/* Layer toggles */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-xl bg-background/90 p-1.5 shadow backdrop-blur-md">
          <button
            type="button"
            onClick={() => setShowCafes((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
              showCafes ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <Coffee className="size-3.5" />
            Cafes{cafes.length > 0 ? ` (${cafes.length})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setShowPeople((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
              showPeople ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <Users className="size-3.5" />
            People{people.length > 0 ? ` (${people.length})` : ''}
          </button>
        </div>

        {/* Refresh + friend requests */}
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          <button
            type="button"
            onClick={() => {
              void refetchCafes();
              void refetchPeople();
            }}
            className="flex size-9 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow backdrop-blur-md transition active:scale-90 hover:text-foreground"
          >
            <RefreshCw className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setRequestsOpen(true)}
            className="relative flex size-9 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow backdrop-blur-md transition active:scale-90 hover:text-foreground"
          >
            <Bell className="size-4" />
            {(requestCount ?? 0) > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {requestCount}
              </span>
            )}
          </button>
        </div>

        {/* Share location + center */}
        <div className="absolute bottom-4 right-3 z-10 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => (sharingLocation ? stopSharing() : setSharingLocation(true))}
            title={sharingLocation ? 'Stop sharing' : 'Share my location'}
            className={cn(
              'flex size-11 items-center justify-center rounded-full shadow-md transition-all active:scale-90',
              sharingLocation
                ? 'bg-green-500 text-white shadow-green-500/30'
                : 'bg-background/90 text-muted-foreground backdrop-blur-md',
            )}
          >
            <MapPin className="size-5" />
          </button>
          <button
            type="button"
            onClick={flyToUser}
            title="Center map"
            className="flex size-11 items-center justify-center rounded-full bg-background/90 text-foreground shadow backdrop-blur-md transition-all active:scale-90"
          >
            <Navigation className="size-5" />
          </button>
        </div>

        {/* Suggest cafe button */}
        <div className="absolute bottom-4 left-3 z-10 flex flex-col gap-2">
          {!sharingLocation && (
            <button
              type="button"
              onClick={() => setSuggestOpen(true)}
              title="Suggest a cafe"
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-md transition-all active:scale-95 hover:opacity-90"
            >
              <Plus className="size-3.5" />
              Suggest a cafe
            </button>
          )}
          {sharingLocation && (
            <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-600 shadow backdrop-blur-md ring-1 ring-green-500/20">
              <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
              Sharing location
            </div>
          )}
        </div>

        {/* Popup card */}
        {selected && (
          <div className="absolute inset-x-3 bottom-20 z-20 rounded-2xl border border-border bg-background shadow-xl">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <X className="size-4" />
            </button>
            {selected.kind === 'cafe' ? (
              <CafeCard
                cafe={selected.data}
                hasLocation={!!userCoords}
                showRoute={showRoute}
                onToggleRoute={() => setShowRoute((v) => !v)}
                onDirections={openDirections}
              />
            ) : (
              <PersonCard
                person={selected.data}
                hasLocation={!!userCoords}
                showRoute={showRoute}
                onToggleRoute={() => setShowRoute((v) => !v)}
                onDirections={openDirections}
              />
            )}
          </div>
        )}
      </div>

      <FriendRequestsSheet open={requestsOpen} onClose={() => setRequestsOpen(false)} />
      <SuggestCafeSheet
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        isCafeOwner={!!user?.isCafeOwner}
        locale={params.locale}
      />
    </>
  );
}

// ─── Shared routing action buttons ────────────────────────────────────────────

function RoutingActions({
  hasLocation,
  showRoute,
  onToggleRoute,
  onDirections,
}: {
  hasLocation: boolean;
  showRoute: boolean;
  onToggleRoute: () => void;
  onDirections: () => void;
}) {
  if (!hasLocation) return null;
  return (
    <>
      <button
        type="button"
        onClick={onToggleRoute}
        title={showRoute ? 'Hide route' : 'Show route on map'}
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl border transition',
          showRoute
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border text-muted-foreground hover:bg-muted',
        )}
      >
        <Route className="size-4" />
      </button>
      <button
        type="button"
        onClick={onDirections}
        title="Open in Google Maps"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:bg-muted"
      >
        <ExternalLink className="size-4" />
      </button>
    </>
  );
}

// ─── Popup cards ──────────────────────────────────────────────────────────────

function CafeCard({
  cafe,
  hasLocation,
  showRoute,
  onToggleRoute,
  onDirections,
}: {
  cafe: MapCafe;
  hasLocation: boolean;
  showRoute: boolean;
  onToggleRoute: () => void;
  onDirections: () => void;
}) {
  const photo = cafe.photos?.[0]?.url;
  return (
    <div className="overflow-hidden rounded-2xl">
      {photo && <img src={photo} alt={cafe.name} className="h-28 w-full object-cover" />}
      <div className="flex items-center gap-3 p-4 pr-10">
        {!photo && (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl">
            ☕
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{cafe.name}</p>
          <p className="truncate text-sm text-muted-foreground">{cafe.address}</p>
          <p className="text-sm text-amber-500">★ {cafe.avgRating.toFixed(1)}</p>
        </div>
      </div>
      <div className="flex gap-2 border-t border-border px-4 pb-4 pt-3">
        <Link
          href={`/cafe/${cafe.id}`}
          className="flex-1 rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          View profile →
        </Link>
        <RoutingActions
          hasLocation={hasLocation}
          showRoute={showRoute}
          onToggleRoute={onToggleRoute}
          onDirections={onDirections}
        />
      </div>
    </div>
  );
}

function PersonCard({
  person,
  hasLocation,
  showRoute,
  onToggleRoute,
  onDirections,
}: {
  person: MapPerson;
  hasLocation: boolean;
  showRoute: boolean;
  onToggleRoute: () => void;
  onDirections: () => void;
}) {
  const isOnline = person.lastActive === 'online';
  return (
    <div className="p-4 pr-10">
      <div className="flex items-center gap-3">
        <div className="relative">
          <ProfileAvatar src={person.avatarUrl} name={person.name} className="size-12" />
          {isOnline && (
            <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-green-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{person.name ?? person.username}</p>
          {person.distanceLabel && (
            <p className="text-sm text-primary">{person.distanceLabel}</p>
          )}
          {(person.sharedInterests?.length ?? 0) > 0 && (
            <p className="truncate text-xs text-muted-foreground">
              {person.sharedInterests.slice(0, 3).join(' · ')}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <div className="flex-1">
          <FriendActionButton person={person} compact />
        </div>
        <RoutingActions
          hasLocation={hasLocation}
          showRoute={showRoute}
          onToggleRoute={onToggleRoute}
          onDirections={onDirections}
        />
      </div>
    </div>
  );
}

// ─── Suggest cafe sheet ────────────────────────────────────────────────────────

const PICKER_MAP_OPTS = {
  mapKey: NESHAN_KEY,
  mapType: MapTypes.neshanVector,
  center: FARDIS,
  zoom: 13,
  mapTypeControllerOptions: { show: false },
  attributionControl: false,
} as const;

const PickerMap = memo(function PickerMap({ onReady }: { onReady: (m: MapInstance) => void }) {
  return (
    <MapComponent
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options={PICKER_MAP_OPTS as any}
      mapSetter={onReady}
      style={{ width: '100%', height: '100%' }}
    />
  );
});

function SuggestCafeSheet({
  open,
  onClose,
  isCafeOwner,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  isCafeOwner: boolean;
  locale: string;
}) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [fullscreenMap, setFullscreenMap] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const inlineMapRef = useRef<MapInstance>(null);
  const fullscreenMapRef = useRef<MapInstance>(null);
  const latRef = useRef<number | null>(null);
  const lngRef = useRef<number | null>(null);
  latRef.current = lat;
  lngRef.current = lng;

  const onPickRef = useRef<((clickLat: number, clickLng: number, src: MapInstance) => void) | undefined>(undefined);
  onPickRef.current = async (clickLat: number, clickLng: number, src: MapInstance) => {
    setLat(clickLat);
    setLng(clickLng);
    latRef.current = clickLat;
    lngRef.current = clickLng;
    setGeocoding(true);
    dropPickerPin(src, clickLng, clickLat);
    const other = src === inlineMapRef.current ? fullscreenMapRef.current : inlineMapRef.current;
    if (other) {
      dropPickerPin(other, clickLng, clickLat);
      other.flyTo({ center: [clickLng, clickLat], zoom: 16 });
    }
    const result = await reverseGeocode(clickLat, clickLng);
    setGeocoding(false);
    if (result) setAddress(result);
  };

  const makeMapReady = useCallback(
    (mapRef: typeof inlineMapRef) => (map: MapInstance) => {
      mapRef.current = map;
      const clat = latRef.current;
      const clng = lngRef.current;
      if (clat !== null && clng !== null) {
        dropPickerPin(map, clng, clat);
        map.flyTo({ center: [clng, clat], zoom: 16 });
      }
      map.on('click', (e: { lngLat: { lat: number; lng: number } }) => {
        onPickRef.current?.(e.lngLat.lat, e.lngLat.lng, map);
      });
    },
    [],
  );

  const onInlineReady = useCallback((m: MapInstance) => makeMapReady(inlineMapRef)(m), [makeMapReady]);
  const onFullscreenReady = useCallback((m: MapInstance) => makeMapReady(fullscreenMapRef)(m), [makeMapReady]);

  const mutation = useMutation({
    mutationFn: () =>
      api('/cafes/suggest', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          lat: lat ?? undefined,
          lng: lng ?? undefined,
          notes: notes.trim() || undefined,
        }),
        locale,
      }),
    onSuccess: () => setSubmitted(true),
  });

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setName('');
      setAddress('');
      setNotes('');
      setLat(null);
      setLng(null);
      setGeocoding(false);
      setFullscreenMap(false);
      setSubmitted(false);
      mutation.reset();
    }, 300);
  };

  if (!open) return null;

  return (
    <>
      {/* Fullscreen map picker */}
      {fullscreenMap && (
        <div className="absolute inset-0 z-50 bg-black">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-2 bg-gradient-to-b from-black/70 to-transparent px-4 pb-8 pt-4">
            <button
              type="button"
              onClick={() => setFullscreenMap(false)}
              className="pointer-events-auto flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black/60 text-white backdrop-blur-xl transition active:scale-95"
            >
              <X className="size-4" />
            </button>
            <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-black/60 px-4 py-2.5 backdrop-blur-xl">
              {geocoding ? (
                <>
                  <Loader2 className="size-4 shrink-0 animate-spin text-white/60" />
                  <span className="truncate text-sm text-white/60">Locating…</span>
                </>
              ) : address ? (
                <span className="truncate text-sm text-white">{address}</span>
              ) : (
                <span className="truncate text-sm text-white/40">Tap the map to pin location</span>
              )}
            </div>
          </div>

          <PickerMap onReady={onFullscreenReady} />

          {lat !== null && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex bg-gradient-to-t from-black/80 to-transparent px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-14">
              <button
                type="button"
                onClick={() => setFullscreenMap(false)}
                className="pointer-events-auto flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition active:scale-[0.98]"
              >
                <Check className="size-4" />
                Confirm location
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Sheet */}
      <div className="absolute inset-x-0 bottom-0 z-40 max-h-[90%] overflow-y-auto rounded-t-3xl bg-background shadow-2xl">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/30" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <Coffee className="size-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Suggest a Cafe</p>
              <p className="text-xs text-muted-foreground">Help the community discover new spots</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 pb-8">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-green-500/10">
                <Coffee className="size-6 text-green-600" />
              </div>
              <p className="font-semibold text-green-700 dark:text-green-400">
                Thanks for the suggestion!
              </p>
              <p className="text-sm text-muted-foreground">
                Our team will review it and add it to the map soon.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {isCafeOwner && (
                <div className="flex items-start gap-3 rounded-xl bg-primary/[0.08] p-3">
                  <Store className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-xs text-primary">
                    You&apos;re a cafe owner — manage your own cafe from{' '}
                    <Link href="/cafe-os" className="font-semibold underline" onClick={handleClose}>
                      Cafe OS
                    </Link>
                    . Use this form only to suggest cafes you don&apos;t own.
                  </p>
                </div>
              )}

              {/* Cafe name */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Cafe name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. The Cozy Bean"
                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Location picker */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Location <span className="text-muted-foreground/50">(tap map to pin)</span>
                </label>
                {/* Inline map */}
                <div className="relative overflow-hidden rounded-xl" style={{ height: 180 }}>
                  <PickerMap onReady={onInlineReady} />
                  <button
                    type="button"
                    onClick={() => setFullscreenMap(true)}
                    className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-lg border border-white/20 bg-black/50 text-white backdrop-blur-md transition active:scale-95"
                    title="Expand map"
                  >
                    <Maximize2 className="size-3.5" />
                  </button>
                  {geocoding && (
                    <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs text-white/70 backdrop-blur-md">
                      <Loader2 className="size-3 animate-spin" />
                      Locating…
                    </div>
                  )}
                  {lat !== null && !geocoding && (
                    <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs text-primary backdrop-blur-md">
                      <MapPin className="size-3" />
                      Location pinned
                    </div>
                  )}
                </div>

                {/* Address — auto-filled, editable */}
                <div className="relative mt-2">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Address (auto-filled from map or type manually)"
                    className={cn(
                      'w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary',
                      geocoding && 'pr-10',
                    )}
                  />
                  {geocoding && (
                    <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Why do you love it? Any tips?"
                  rows={2}
                  className="w-full resize-none rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {mutation.isError && (
                <p className="text-xs text-destructive">Something went wrong. Please try again.</p>
              )}

              <button
                type="button"
                disabled={!name.trim() || !address.trim() || mutation.isPending}
                onClick={() => mutation.mutate()}
                className="mt-1 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition disabled:opacity-50 active:scale-[0.98]"
              >
                {mutation.isPending ? 'Submitting…' : 'Submit Suggestion'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

