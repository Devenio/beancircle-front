'use client';

import { AuthBackground } from '@/components/auth/auth-background';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { cafeOsApi } from '@/lib/api/cafe-os';
import { presignAndUpload } from '@/lib/api/uploads';
import { cn } from '@/lib/utils';
import { useIdentityStore } from '@/stores/identity-store';
import { Marker } from '@neshan-maps-platform/mapbox-gl';
import { MapComponent, MapTypes } from '@neshan-maps-platform/mapbox-gl-react';
import '@neshan-maps-platform/mapbox-gl-react/dist/style.css';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  Check,
  Coffee,
  Loader2,
  MapPin,
  Maximize2,
  Sparkles,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const NESHAN_API_KEY = 'web.7a63ce8b57fc4dcaa9933f16cba33ba0';
const DEFAULT_CENTER: [number, number] = [50.9731, 35.7181]; // Fardis, Karaj
const DRAFT_KEY = 'cafe-create-draft';

const MAP_OPTIONS = {
  mapKey: NESHAN_API_KEY,
  mapType: MapTypes.neshanVectorNight,
  center: DEFAULT_CENTER,
  zoom: 14,
  mapTypeControllerOptions: { show: false },
} as const;

// ─── Stable map wrapper (module-level = never remounts due to parent re-render)

interface NeshanMapProps {
  onMapReady: (map: MapInstance) => void;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapInstance = any;

const NeshanMap = memo(function NeshanMap({ onMapReady }: NeshanMapProps) {
  return (
    <MapComponent
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options={MAP_OPTIONS as any}
      mapSetter={onMapReady}
      style={{ width: '100%', height: '100%' }}
    />
  );
});

// ─── Reverse geocode (Nominatim, no API key needed) ───────────────────────────

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ address: string; city: string } | null> {
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
    const formatted = parts.join('، ') || (data.display_name ?? '');
    const city = a.city ?? a.town ?? a.county ?? '';
    return { address: formatted, city };
  } catch {
    return null;
  }
}

function dropPin(map: MapInstance, lng: number, lat: number) {
  if (map._pickerMarker) map._pickerMarker.remove();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map._pickerMarker = new (Marker as any)({ color: '#f5c882' })
    .setLngLat([lng, lat])
    .addTo(map);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewCafePage() {
  const t = useTranslations('cafeOs');
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const switchToCafe = useIdentityStore((s) => s.switchToCafe);

  // Form state
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cityId, setCityId] = useState(''); // auto-filled, hidden from user
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Keep latest lat/lng accessible inside stable callbacks without recreating them
  const latRef = useRef<number | null>(null);
  const lngRef = useRef<number | null>(null);
  latRef.current = lat;
  lngRef.current = lng;

  // Map instances (both may be null if not yet mounted)
  const inlineMapRef = useRef<MapInstance>(null);
  const fullscreenMapRef = useRef<MapInstance>(null);

  // Latest cities list accessible in stable callback
  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: () => api<{ id: string; name: string }[]>('/users/cities', { locale }),
  });
  const citiesRef = useRef(cities);
  citiesRef.current = cities;

  // ── Persist draft to sessionStorage ────────────────────────────────────────

  // Load draft once on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (typeof d.step === 'number') setStep(d.step);
      if (d.name) setName(d.name);
      if (d.description) setDescription(d.description);
      if (d.address) setAddress(d.address);
      if (d.lat !== null && d.lat !== undefined) {
        setLat(d.lat);
        setLng(d.lng);
        latRef.current = d.lat;
        lngRef.current = d.lng;
      }
      if (d.cityId) setCityId(d.cityId);
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save on every relevant change
  useEffect(() => {
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ step, name, description, address, lat, lng, cityId }),
      );
    } catch { /* ignore */ }
  }, [step, name, description, address, lat, lng, cityId]);

  // ── Stable click handler ref ────────────────────────────────────────────────

  // Updated every render so it sees fresh state/setters, called from stable callbacks
  const onPickRef = useRef<(clickLat: number, clickLng: number, src: MapInstance) => void>();
  onPickRef.current = async (clickLat, clickLng, src) => {
    setLat(clickLat);
    setLng(clickLng);
    latRef.current = clickLat;
    lngRef.current = clickLng;
    setGeocoding(true);

    dropPin(src, clickLng, clickLat);

    // Mirror on the other instance
    const other = src === inlineMapRef.current ? fullscreenMapRef.current : inlineMapRef.current;
    if (other) {
      dropPin(other, clickLng, clickLat);
      other.flyTo({ center: [clickLng, clickLat], zoom: 16 });
    }

    const result = await reverseGeocode(clickLat, clickLng);
    setGeocoding(false);
    if (result?.address) setAddress(result.address);
    if (result?.city) {
      const cs = citiesRef.current;
      if (cs) {
        const match = cs.find(
          (c) => c.name.includes(result.city) || result.city.includes(c.name),
        );
        if (match) setCityId(match.id);
        else if (!cityId && cs[0]) setCityId(cs[0].id);
      }
    }
  };

  // Stable map-ready handler factory — created once, uses latRef/lngRef for initial pin
  const makeMapSetter = useCallback(
    (mapRef: typeof inlineMapRef) =>
      (map: MapInstance) => {
        mapRef.current = map;
        // Restore existing pin (e.g. after fullscreen open or step re-enter)
        const clat = latRef.current;
        const clng = lngRef.current;
        if (clat !== null && clng !== null) {
          dropPin(map, clng, clat);
          map.flyTo({ center: [clng, clat], zoom: 16 });
        }
        map.on('click', (e: { lngLat: { lat: number; lng: number } }) => {
          onPickRef.current?.(e.lngLat.lat, e.lngLat.lng, map);
        });
      },
    [],
  );

  // Stable setters for each map slot, created once
  const onInlineMapReady = useCallback(
    (map: MapInstance) => makeMapSetter(inlineMapRef)(map),
    [makeMapSetter],
  );
  const onFullscreenMapReady = useCallback(
    (map: MapInstance) => makeMapSetter(fullscreenMapRef)(map),
    [makeMapSetter],
  );

  // ── API mutation ────────────────────────────────────────────────────────────

  const create = useMutation({
    mutationFn: () =>
      cafeOsApi.createCafe({
        name: name.trim(),
        address: address.trim(),
        cityId: cityId || (cities?.[0]?.id ?? ''),
        description: description.trim() || undefined,
        logoUrl: logoUrl ?? undefined,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
      }),
    onSuccess: async (cafe) => {
      sessionStorage.removeItem(DRAFT_KEY);
      await queryClient.invalidateQueries({ queryKey: ['my-cafes'] });
      switchToCafe(cafe.id);
      router.replace(`/cafe-os/${cafe.id}`);
    },
  });

  async function onLogoPick(file: File) {
    setUploading(true);
    try {
      const url = await presignAndUpload(file, 'cafes');
      setLogoUrl(url);
    } finally {
      setUploading(false);
    }
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

  const steps = [
    { icon: Coffee, valid: name.trim().length >= 2 },
    { icon: MapPin, valid: address.trim().length >= 4 && lat !== null },
    { icon: Sparkles, valid: true },
  ];

  const fieldClass =
    'h-12 rounded-2xl border-white/10 bg-white/[0.07] px-4 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] placeholder:text-white/35 focus-visible:border-amber-300/50 focus-visible:ring-amber-300/20';
  const mediumButtonClass =
    'inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50';
  const primaryButtonClass =
    'bg-gradient-to-r from-[#f5c882] via-[#e8a85c] to-[#c87f43] text-[#1a0f0a] shadow-[0_8px_28px_rgba(200,127,67,0.34)] hover:brightness-105 active:scale-[0.98]';

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Fullscreen map overlay ──────────────────────────────────────────── */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            key="fs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black"
          >
            {/* Top bar */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-2 bg-gradient-to-b from-black/75 to-transparent px-4 pb-10 pt-4">
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="pointer-events-auto flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black/60 text-white backdrop-blur-xl transition hover:bg-white/10 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-black/60 px-4 py-2.5 backdrop-blur-xl">
                {geocoding ? (
                  <>
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-200/70" />
                    <span className="truncate text-sm text-white/60">{t('wizard.locating')}</span>
                  </>
                ) : address ? (
                  <span className="truncate text-sm text-white">{address}</span>
                ) : (
                  <span className="truncate text-sm text-white/35">{t('wizard.tapToPin')}</span>
                )}
              </div>
            </div>

            {/* Map fills the whole screen */}
            <NeshanMap onMapReady={onFullscreenMapReady} />

            {/* Bottom confirm */}
            <AnimatePresence>
              {lat !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.2 }}
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex bg-gradient-to-t from-black/80 to-transparent px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-14"
                >
                  <button
                    type="button"
                    onClick={() => setFullscreen(false)}
                    className={cn(mediumButtonClass, primaryButtonClass, 'pointer-events-auto flex-1')}
                  >
                    <Check className="h-4 w-4" />
                    {t('wizard.confirmLocation')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main wizard ────────────────────────────────────────────────────── */}
      <div className="relative flex min-h-dvh w-full overflow-hidden text-white">
        <AuthBackground />

        <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.9rem,env(safe-area-inset-top))] sm:px-6">
          {/* Step indicator */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => (step > 0 ? setStep(step - 1) : router.back())}
              className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/80 shadow-[0_10px_28px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:bg-white/[0.1] hover:text-white active:scale-95"
              aria-label="back"
            >
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <div className="flex flex-1 items-center gap-2">
              {steps.map(({ icon: Icon }, i) => (
                <div key={i} className="contents">
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full border text-xs transition-colors',
                      i <= step
                        ? 'border-amber-200/40 bg-amber-200/18 text-amber-100'
                        : 'border-white/10 bg-white/[0.05] text-white/35',
                    )}
                  >
                    {i < step ? <Check className="size-4" /> : <Icon className="size-4" />}
                  </span>
                  {i < steps.length - 1 && (
                    <span
                      className={cn(
                        'h-px flex-1 rounded-full transition-colors',
                        i < step ? 'bg-amber-200/50' : 'bg-white/10',
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center py-8">
            {/* Header */}
            <div className="mb-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl border border-amber-200/20 bg-amber-200/12 text-amber-100 shadow-[0_18px_42px_rgba(0,0,0,0.24)]">
                <Coffee className="h-7 w-7" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-100/60">
                Cafe OS
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                {step === 0
                  ? t('wizard.nameTitle')
                  : step === 1
                    ? t('wizard.locationTitle')
                    : t('wizard.logoTitle')}
              </h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/52">
                {step === 0
                  ? t('wizard.nameHint')
                  : step === 1
                    ? t('wizard.locationHint')
                    : t('wizard.logoHint')}
              </p>
            </div>

            {/* Card */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {/* ── Step 0: Name ──────────────────────────────────────── */}
                  {step === 0 && (
                    <>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('wizard.namePlaceholder')}
                        autoFocus
                        className={fieldClass}
                      />
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('wizard.descriptionPlaceholder')}
                        rows={4}
                        className={cn(fieldClass, 'min-h-28 resize-none py-3')}
                      />
                    </>
                  )}

                  {/* ── Step 1: Location ──────────────────────────────────── */}
                  {step === 1 && (
                    <>
                      {/* Map */}
                      <div className="relative overflow-hidden rounded-2xl" style={{ height: 220 }}>
                        <NeshanMap onMapReady={onInlineMapReady} />

                        {/* Expand button */}
                        <button
                          type="button"
                          onClick={() => setFullscreen(true)}
                          className="absolute right-2 top-2 z-10 flex size-9 items-center justify-center rounded-xl border border-white/15 bg-black/55 text-white backdrop-blur-md transition hover:bg-white/10 active:scale-95"
                          title={t('wizard.fullscreenMap')}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </button>

                        {/* Geocoding chip */}
                        {geocoding && (
                          <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white/70 backdrop-blur-md">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {t('wizard.locating')}
                          </div>
                        )}

                        {/* Pin indicator once set */}
                        {lat !== null && !geocoding && (
                          <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-xl border border-amber-200/20 bg-black/60 px-3 py-1.5 text-xs text-amber-100/80 backdrop-blur-md">
                            <MapPin className="h-3 w-3" />
                            {t('wizard.locationPinned')}
                          </div>
                        )}
                      </div>

                      {/* Address input — auto-filled, editable */}
                      <div className="relative">
                        <Input
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder={t('wizard.addressPlaceholder')}
                          className={cn(fieldClass, geocoding && 'pr-10')}
                        />
                        {geocoding && (
                          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-amber-200/60" />
                        )}
                      </div>
                    </>
                  )}

                  {/* ── Step 2: Logo ──────────────────────────────────────── */}
                  {step === 2 && (
                    <>
                      <div className="flex justify-center py-4">
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-amber-100/22 bg-white/[0.07] text-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-amber-100/38 hover:bg-white/[0.1] active:scale-95"
                        >
                          {logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                          ) : uploading ? (
                            <Loader2 className="h-7 w-7 animate-spin text-amber-100/70" />
                          ) : (
                            <Camera className="h-7 w-7" />
                          )}
                        </button>
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void onLogoPick(f);
                          }}
                        />
                      </div>
                      {create.isError && (
                        <p className="text-sm text-red-300">
                          {(create.error as Error).message}
                        </p>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Footer actions */}
              <div className="mt-5 flex items-center justify-end border-t border-white/10 pt-5">
                {step < 2 ? (
                  <button
                    type="button"
                    className={cn(mediumButtonClass, primaryButtonClass, 'min-w-32')}
                    disabled={!steps[step].valid}
                    onClick={() => setStep(step + 1)}
                  >
                    {t('wizard.next')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={cn(mediumButtonClass, primaryButtonClass, 'min-w-36')}
                    disabled={create.isPending || uploading}
                    onClick={() => create.mutate()}
                  >
                    {create.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t('wizard.create')
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
