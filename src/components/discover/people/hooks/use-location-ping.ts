'use client';

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api/client';

export function useLocationPing(enabled = true) {
  const { locale } = useParams<{ locale: string }>();
  const sent = useRef(false);

  useEffect(() => {
    if (!enabled || sent.current || typeof navigator === 'undefined') return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sent.current = true;
        void api('/users/location', {
          method: 'POST',
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          locale,
        });
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 },
    );
  }, [enabled, locale]);

  return {};
}
