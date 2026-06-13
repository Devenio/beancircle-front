'use client';

/**
 * Inner map — loaded only client-side (ssr: false). Uses Neshan, Iran's
 * national map service (Leaflet-based SDK exposed as `window.nmp_L`).
 */

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';

export type MapCafe = {
  id: string;
  name: string;
  address: string;
  avgRating: number;
  lat?: number | null;
  lng?: number | null;
  photos?: { url: string }[];
};

type Props = {
  cafes: MapCafe[];
  /** Default center — fallback when no cafes have coordinates */
  defaultCenter?: [number, number];
};

const NESHAN_KEY = process.env.NEXT_PUBLIC_NESHAN_API_KEY ?? '';
const SDK_SCRIPT = 'https://static.neshan.org/sdk/leaflet/v2.1.1/neshan-sdk.js';
const SDK_STYLES = 'https://static.neshan.org/sdk/leaflet/v2.1.1/neshan-sdk.css';

// The Neshan SDK is plain JS; type its globals loosely.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NeshanL = any;
declare global {
  interface Window {
    nmp_L?: NeshanL;
  }
}

export function CafeMapInner({ cafes, defaultCenter = [35.6892, 51.389] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NeshanL | null>(null);
  const locale = useLocale();
  const [ready, setReady] = useState(false);

  // Inject the Neshan SDK script and poll (max 5s) until its global is ready.
  useEffect(() => {
    if (!NESHAN_KEY) return;
    if (!document.querySelector(`script[src="${SDK_SCRIPT}"]`)) {
      const script = document.createElement('script');
      script.src = SDK_SCRIPT;
      script.async = true;
      document.head.appendChild(script);
    }

    if (window.nmp_L) {
      setReady(true);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      if (window.nmp_L) {
        clearInterval(timer);
        setReady(true);
      } else if (Date.now() - start > 5000) {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;
    const nmp_L = window.nmp_L;
    const isDark = document.documentElement.classList.contains('dark');

    const cafesWithCoords = cafes.filter((c) => c.lat != null && c.lng != null);
    const center: [number, number] =
      cafesWithCoords.length > 0
        ? [cafesWithCoords[0]!.lat!, cafesWithCoords[0]!.lng!]
        : defaultCenter;

    const map = new nmp_L.Map(containerRef.current, {
      key: NESHAN_KEY,
      maptype: isDark ? 'standard-night' : 'dreamy',
      poi: true,
      traffic: false,
      center,
      zoom: 14,
    });
    mapRef.current = map;

    // Custom coffee-pin icon (same look as the previous Leaflet build).
    const coffeeIcon = nmp_L.divIcon({
      className: '',
      html: `<div style="
        background: #7c3aed;
        color: white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <span style="transform:rotate(45deg); font-size:16px;">☕</span>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -38],
    });

    cafesWithCoords.forEach((cafe) => {
      const marker = nmp_L
        .marker([cafe.lat!, cafe.lng!], { icon: coffeeIcon })
        .addTo(map);

      const photo = cafe.photos?.[0]?.url;
      const popup = nmp_L.popup({ maxWidth: 220, className: 'cafe-popup' }).setContent(`
        <div style="font-family:system-ui,sans-serif;min-width:180px">
          ${photo ? `<img src="${photo}" alt="" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:8px"/>` : ''}
          <strong style="font-size:14px">${cafe.name}</strong>
          <p style="color:#666;font-size:12px;margin:2px 0 4px">${cafe.address}</p>
          <p style="font-size:12px;margin:0 0 8px">★ ${cafe.avgRating.toFixed(1)}</p>
          <a
            href="/${locale}/cafe/${cafe.id}"
            style="
              display:block;text-align:center;background:#7c3aed;color:#fff;
              border-radius:8px;padding:6px;font-size:12px;font-weight:600;
              text-decoration:none;
            "
          >View cafe →</a>
        </div>
      `);

      marker.bindPopup(popup);
    });

    if (cafesWithCoords.length > 1) {
      const bounds = nmp_L.latLngBounds(
        cafesWithCoords.map((c) => [c.lat!, c.lng!]),
      );
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      mapRef.current?.remove?.();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!NESHAN_KEY) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="rounded-2xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
          Neshan API key not configured. Add NEXT_PUBLIC_NESHAN_API_KEY to
          .env.local
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Neshan SDK styles (the matching script is injected in useEffect). */}
      <link rel="stylesheet" href={SDK_STYLES} />
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </>
  );
}
