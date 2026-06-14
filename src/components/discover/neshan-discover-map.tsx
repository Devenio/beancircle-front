'use client';

/**
 * Neshan Discover Map — shows cafes + location-sharing people.
 * ssr: false required — uses browser APIs and the Neshan SDK window global.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Bell, Coffee, MapPin, Navigation, RefreshCw, Users, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { ProfileAvatar } from '@/components/chat/user-avatar';
import { FriendActionButton } from '@/components/discover/people/friend-action-button';
import { FriendRequestsSheet } from '@/components/discover/people/friend-requests-sheet';
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
type NL = any;
declare global { interface Window { nmp_L?: NL } }

// Fardis, Alborz Province, Iran
const FARDIS_CENTER: [number, number] = [35.7333, 50.9833];
const FARDIS_ZOOM = 13;

const NESHAN_KEY = process.env.NEXT_PUBLIC_NESHAN_API_KEY ?? '';
const IS_PLACEHOLDER = !NESHAN_KEY || NESHAN_KEY.includes('your-key');
const SDK_SCRIPT = 'https://static.neshan.org/sdk/leaflet/v2.1.1/neshan-sdk.js';
const SDK_CSS = 'https://static.neshan.org/sdk/leaflet/v2.1.1/neshan-sdk.css';

// ─── SDK loader (onload + fallback poll) ──────────────────────────────────────

function useNeshanSdk() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (IS_PLACEHOLDER) return;

    // Inject CSS first
    if (!document.querySelector(`link[href="${SDK_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = SDK_CSS;
      document.head.appendChild(link);
    }

    // Already loaded
    if (window.nmp_L) { setReady(true); return; }

    // Inject script
    let script = document.querySelector<HTMLScriptElement>(`script[src="${SDK_SCRIPT}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = SDK_SCRIPT;
      script.async = true;
      document.head.appendChild(script);
    }

    const onLoad = () => { if (window.nmp_L) setReady(true); };
    script.addEventListener('load', onLoad);

    // Polling fallback (handles case where script was mid-load before we added listener)
    let tries = 0;
    const poll = setInterval(() => {
      if (window.nmp_L) { clearInterval(poll); setReady(true); }
      else if (++tries > 100) clearInterval(poll);
    }, 100);

    return () => {
      script?.removeEventListener('load', onLoad);
      clearInterval(poll);
    };
  }, []);

  return ready;
}

// ─── Pin HTML builders ────────────────────────────────────────────────────────

const cafePin = () =>
  `<div style="background:#7c3aed;color:#fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
  width:36px;height:36px;display:flex;align-items:center;justify-content:center;
  box-shadow:0 2px 10px rgba(124,58,237,.5);border:2.5px solid #fff">
    <span style="transform:rotate(45deg);font-size:16px">☕</span>
  </div>`;

const personPin = (avatarUrl?: string | null, name?: string | null, online = false) => {
  const initials = (name ?? '?').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const ring = online ? '#22c55e' : '#94a3b8';
  return avatarUrl
    ? `<div style="width:42px;height:42px;border-radius:50%;border:3px solid ${ring};overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.3)"><img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover"/></div>`
    : `<div style="width:42px;height:42px;border-radius:50%;background:#3b82f6;border:3px solid ${ring};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;box-shadow:0 2px 10px rgba(59,130,246,.45)">${initials}</div>`;
};

const selfPin = () =>
  `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 5px rgba(59,130,246,.25)"></div>`;

// ─── Component ────────────────────────────────────────────────────────────────

export function NeshanDiscoverMap() {
  const locale = useLocale();
  const params = useParams<{ locale: string }>();
  const sdkReady = useNeshanSdk();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NL | null>(null);
  const markersRef = useRef<NL[]>([]);

  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [showCafes, setShowCafes] = useState(true);
  const [showPeople, setShowPeople] = useState(true);
  const [selected, setSelected] = useState<SelectedPin | null>(null);
  const [requestsOpen, setRequestsOpen] = useState(false);

  // ── GPS (non-blocking — map loads with Fardis center regardless) ───────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords([pos.coords.latitude, pos.coords.longitude]),
      () => { /* silently fail — Fardis remains center */ },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 12_000 },
    );
  }, []);

  // ── Share / stop sharing ──────────────────────────────────────────────────
  useEffect(() => {
    if (!sharingLocation || !userCoords) return;
    void api('/users/location', {
      method: 'POST',
      body: JSON.stringify({ lat: userCoords[0], lng: userCoords[1] }),
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
  const cafes = (cafesRaw ?? []).filter((c) => c.lat != null && c.lng != null);

  // ── Fetch nearby location-sharing people ──────────────────────────────────
  const center = userCoords ?? FARDIS_CENTER;
  const { data: peopleData, refetch: refetchPeople } = useQuery({
    queryKey: ['discover-map-people', center[0], center[1], locale],
    queryFn: () =>
      api<{ pins: MapPerson[] }>(
        `/discover/map?lat=${center[0]}&lng=${center[1]}&radiusKm=10`,
        { locale },
      ),
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
  const people = peopleData?.pins ?? [];

  const { data: requestCount } = useQuery({
    queryKey: ['friends', 'requests-count', locale],
    queryFn: async () => {
      const res = await api<{ incoming: unknown[] }>('/friends/requests', { locale });
      return res.incoming.length;
    },
  });

  // ── Init Neshan map — fires as soon as SDK is ready, no GPS required ───────
  useEffect(() => {
    if (!sdkReady || !containerRef.current || mapRef.current) return;
    const nmp_L = window.nmp_L;
    if (!nmp_L) return;

    const isDark = document.documentElement.classList.contains('dark');
    const map = new nmp_L.Map(containerRef.current, {
      key: NESHAN_KEY,
      maptype: isDark ? 'standard-night' : 'dreamy',
      poi: false,
      traffic: false,
      center: FARDIS_CENTER,
      zoom: FARDIS_ZOOM,
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [sdkReady]);

  // ── Fly to user location when GPS arrives ─────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userCoords) return;
    map.flyTo(userCoords, 14, { animate: true, duration: 0.8 });

    // Add self dot
    const nmp_L = window.nmp_L;
    if (!nmp_L) return;
    const icon = nmp_L.divIcon({ className: '', html: selfPin(), iconSize: [16, 16], iconAnchor: [8, 8] });
    nmp_L.marker(userCoords, { icon, zIndexOffset: 1000 }).addTo(map);
  }, [userCoords]);

  // ── Re-render pins when data or toggle changes ────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const nmp_L = window.nmp_L;
    if (!map || !nmp_L) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (showCafes) {
      const icon = nmp_L.divIcon({ className: '', html: cafePin(), iconSize: [36, 36], iconAnchor: [18, 36] });
      for (const cafe of cafes) {
        const m = nmp_L.marker([cafe.lat!, cafe.lng!], { icon })
          .addTo(map)
          .on('click', () => setSelected({ kind: 'cafe', data: cafe }));
        markersRef.current.push(m);
      }
    }

    if (showPeople) {
      for (const person of people) {
        const html = personPin(person.avatarUrl, person.name, person.lastActive === 'online');
        const icon = nmp_L.divIcon({ className: '', html, iconSize: [42, 42], iconAnchor: [21, 21] });
        const m = nmp_L.marker([person.lat, person.lng], { icon, zIndexOffset: 500 })
          .addTo(map)
          .on('click', () => setSelected({ kind: 'person', data: person }));
        markersRef.current.push(m);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafes, people, showCafes, showPeople, sdkReady]);

  const flyToUser = () => {
    const map = mapRef.current;
    if (!map) return;
    if (userCoords) map.flyTo(userCoords, 15, { animate: true, duration: 0.6 });
    else map.flyTo(FARDIS_CENTER, FARDIS_ZOOM, { animate: true, duration: 0.6 });
  };

  // ── No API key ─────────────────────────────────────────────────────────────
  if (IS_PLACEHOLDER) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <MapPin className="size-8 text-primary" />
        <p className="font-semibold">Neshan API key not set</p>
        <p className="text-sm text-muted-foreground">
          Get a free key at{' '}
          <span className="font-mono text-primary">platform.neshan.org</span>{' '}
          and add it to <span className="font-mono">.env.local</span>:
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
        {/* Map container — always in DOM so ref is available for SDK init */}
        <div ref={containerRef} className="h-full w-full" />

        {/* SDK loading overlay */}
        {!sdkReady && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading map…
            </div>
          </div>
        )}

        {/* Top-left: layer toggles */}
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

        {/* Top-right: refresh + friend requests */}
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          <button
            type="button"
            onClick={() => { void refetchCafes(); void refetchPeople(); }}
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

        {/* Bottom-right actions */}
        <div className="absolute bottom-4 right-3 z-10 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => (sharingLocation ? stopSharing() : setSharingLocation(true))}
            className={cn(
              'flex size-11 items-center justify-center rounded-full shadow-md transition-all active:scale-90',
              sharingLocation
                ? 'bg-green-500 text-white shadow-green-500/30'
                : 'bg-background/90 text-muted-foreground backdrop-blur-md',
            )}
            title={sharingLocation ? 'Stop sharing location' : 'Share my location'}
          >
            <MapPin className="size-5" />
          </button>
          <button
            type="button"
            onClick={flyToUser}
            className="flex size-11 items-center justify-center rounded-full bg-background/90 text-foreground shadow backdrop-blur-md transition-all active:scale-90"
            title="Center on Fardis"
          >
            <Navigation className="size-5" />
          </button>
        </div>

        {/* Sharing badge */}
        {sharingLocation && (
          <div className="absolute bottom-4 left-3 z-10 flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-600 shadow backdrop-blur-md ring-1 ring-green-500/20">
            <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
            Sharing location
          </div>
        )}

        {/* Bottom card */}
        {selected && (
          <div className="absolute inset-x-3 bottom-20 z-20 rounded-2xl border border-border bg-background shadow-xl">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <X className="size-4" />
            </button>
            {selected.kind === 'cafe'
              ? <CafeCard cafe={selected.data} locale={locale} />
              : <PersonCard person={selected.data} />}
          </div>
        )}
    </div>
    <FriendRequestsSheet open={requestsOpen} onClose={() => setRequestsOpen(false)} />
    </>
  );
}

// ─── Bottom cards ─────────────────────────────────────────────────────────────

function CafeCard({ cafe, locale }: { cafe: MapCafe; locale: string }) {
  const photo = cafe.photos?.[0]?.url;
  return (
    <div className="overflow-hidden rounded-2xl">
      {photo && <img src={photo} alt={cafe.name} className="h-28 w-full object-cover" />}
      <div className="flex items-center gap-3 p-4 pr-10">
        {!photo && (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl">☕</div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{cafe.name}</p>
          <p className="truncate text-sm text-muted-foreground">{cafe.address}</p>
          <p className="text-sm text-amber-500">★ {cafe.avgRating.toFixed(1)}</p>
        </div>
      </div>
      <div className="border-t border-border px-4 pb-4">
        <Link
          href={`/cafe/${cafe.id}`}
          className="block w-full rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          View cafe →
        </Link>
      </div>
    </div>
  );
}

function PersonCard({ person }: { person: MapPerson }) {
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
        <div className="min-w-0">
          <p className="font-semibold">{person.name ?? person.username}</p>
          {person.distanceLabel && <p className="text-sm text-primary">{person.distanceLabel}</p>}
          {person.sharedInterests.length > 0 && (
            <p className="truncate text-xs text-muted-foreground">
              {person.sharedInterests.slice(0, 3).join(' · ')}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3">
        <FriendActionButton person={person} compact />
      </div>
    </div>
  );
}
