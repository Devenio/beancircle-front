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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Camera, Check, Coffee, Loader2, MapPin, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRef, useState } from 'react';

export default function NewCafePage() {
  const t = useTranslations('cafeOs');
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const switchToCafe = useIdentityStore((s) => s.switchToCafe);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cityId, setCityId] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: () =>
      api<{ id: string; name: string }[]>('/users/cities', { locale }),
  });

  const create = useMutation({
    mutationFn: () =>
      cafeOsApi.createCafe({
        name: name.trim(),
        address: address.trim(),
        cityId,
        description: description.trim() || undefined,
        logoUrl: logoUrl ?? undefined,
      }),
    onSuccess: async (cafe) => {
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

  const steps = [
    { icon: Coffee, valid: name.trim().length >= 2 },
    { icon: MapPin, valid: !!cityId && address.trim().length >= 4 },
    { icon: Sparkles, valid: true },
  ];

  const fieldClass =
    'h-12 rounded-2xl border-white/10 bg-white/[0.07] px-4 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] placeholder:text-white/35 focus-visible:border-amber-300/50 focus-visible:ring-amber-300/20';
  const mediumButtonClass =
    'inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50';
  const primaryButtonClass =
    'bg-gradient-to-r from-[#f5c882] via-[#e8a85c] to-[#c87f43] text-[#1a0f0a] shadow-[0_8px_28px_rgba(200,127,67,0.34)] hover:brightness-105 active:scale-[0.98]';

  return (
    <div className="relative flex min-h-dvh w-full overflow-hidden text-white">
      <AuthBackground />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.9rem,env(safe-area-inset-top))] sm:px-6">
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
                  {i < step ? (
                    <Check className="size-4" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </span>
                {i < steps.length - 1 ? (
                  <span
                    className={cn(
                      'h-px flex-1 rounded-full transition-colors',
                      i < step ? 'bg-amber-200/50' : 'bg-white/10',
                    )}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center py-8">
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

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
                className="min-h-[260px] space-y-4"
              >
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

                {step === 1 && (
                  <>
                    <select
                      className={cn(
                        fieldClass,
                        'w-full appearance-none outline-none [&_option]:bg-[#1a100c] [&_option]:text-white',
                      )}
                      value={cityId}
                      onChange={(e) => setCityId(e.target.value)}
                    >
                      <option value="">{t('wizard.city')}</option>
                      {cities?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={t('wizard.addressPlaceholder')}
                      className={fieldClass}
                    />
                  </>
                )}

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
                          <img
                            src={logoUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
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
                    {create.isError ? (
                      <p className="text-sm text-red-300">
                        {(create.error as Error).message}
                      </p>
                    ) : null}
                  </>
                )}
              </motion.div>
            </AnimatePresence>

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
  );
}
