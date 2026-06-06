'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import maplibregl from 'maplibre-gl';
import Supercluster from 'supercluster';
import 'maplibre-gl/dist/maplibre-gl.css';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/chat/user-avatar';
import { FriendActionButton } from '@/components/discover/people/friend-action-button';
import { useLocationPing } from '@/components/discover/people/hooks/use-location-ping';
import type { DiscoverPerson } from '@/components/discover/people/types';

type MapPin = DiscoverPerson & { lat: number; lng: number };

export function DiscoverMapView() {
  const t = useTranslations('discover.people');
  const { locale } = useParams<{ locale: string }>();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selected, setSelected] = useState<MapPin | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  useLocationPing(true);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, []);

  const { data } = useQuery({
    queryKey: ['discover', 'map', coords, locale],
    queryFn: () =>
      api<{ pins: MapPin[] }>(
        `/discover/map?lat=${coords!.lat}&lng=${coords!.lng}&radiusKm=5`,
        { locale },
      ),
    enabled: !!coords,
  });

  useEffect(() => {
    if (!mapContainer.current || !coords || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [coords.lng, coords.lat],
      zoom: 13,
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [coords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data?.pins.length) return;

    const index = new Supercluster<{ cluster: boolean; person?: MapPin; point_count?: number }>({
      radius: 50,
      maxZoom: 16,
    });
    index.load(
      data.pins.map((p) => ({
        type: 'Feature' as const,
        properties: { cluster: false, person: p },
        geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
      })),
    );

    const markers: maplibregl.Marker[] = [];

    function render() {
      if (!map) return;
      markers.forEach((m) => m.remove());
      markers.length = 0;
      const bounds = map.getBounds();
      const zoom = Math.floor(map.getZoom());
      const clusters = index.getClusters(
        [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        zoom,
      );
      for (const feature of clusters) {
        const [lng, lat] = feature.geometry.coordinates;
        const el = document.createElement('button');
        el.className =
          'flex size-10 items-center justify-center rounded-full border-2 border-primary bg-background text-xs font-bold shadow-md';
        if (feature.properties.cluster) {
          el.textContent = String(feature.properties.point_count);
        } else {
          el.textContent = '•';
          el.onclick = () => {
            const person = feature.properties.person;
            if (person) setSelected(person);
          };
        }
        markers.push(new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map));
      }
    }

    map.on('moveend', render);
    render();
    return () => {
      map.off('moveend', render);
      markers.forEach((m) => m.remove());
    };
  }, [data, coords]);

  return (
    <div className="relative -mx-4 -mt-2 flex h-[calc(100dvh-8rem)] flex-col">
      <div className="absolute start-4 top-4 z-10">
        <Button size="sm" variant="secondary" render={<Link href="/discover/people" />}>
          {t('listView')}
        </Button>
      </div>
      <div ref={mapContainer} className="h-full w-full" />
      {!coords ? (
        <p className="absolute inset-0 flex items-center justify-center bg-background/80 text-sm">
          {t('locationRequired')}
        </p>
      ) : null}
      {selected ? (
        <div className="absolute inset-x-4 bottom-4 z-10 rounded-2xl border bg-background p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <ProfileAvatar src={selected.avatarUrl} name={selected.name} className="size-12" />
            <div>
              <p className="font-semibold">{selected.name ?? selected.username}</p>
              {selected.distanceLabel ? (
                <p className="text-sm text-primary">{selected.distanceLabel}</p>
              ) : null}
            </div>
          </div>
          <FriendActionButton person={selected} compact />
          <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setSelected(null)}>
            {t('close')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
