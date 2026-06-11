'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { cafeOsApi } from '@/lib/api/cafe-os';
import { presignAndUpload } from '@/lib/api/uploads';
import { useIdentityStore } from '@/stores/identity-store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Camera, Coffee, Loader2 } from 'lucide-react';
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
    { valid: name.trim().length >= 2 },
    { valid: !!cityId && address.trim().length >= 4 },
    { valid: true },
  ];

  return (
    <div className="flex min-h-dvh flex-col px-5 py-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (step > 0 ? setStep(step - 1) : router.back())}
          className="rounded-full p-2 transition hover:bg-accent"
          aria-label="back"
        >
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </button>
        <div className="flex flex-1 gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="mt-8 flex-1 space-y-5"
        >
          {step === 0 && (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <Coffee className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t('wizard.nameTitle')}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('wizard.nameHint')}
                </p>
              </div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('wizard.namePlaceholder')}
                autoFocus
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('wizard.descriptionPlaceholder')}
                rows={3}
              />
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <h1 className="text-2xl font-bold">{t('wizard.locationTitle')}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('wizard.locationHint')}
                </p>
              </div>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
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
              />
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h1 className="text-2xl font-bold">{t('wizard.logoTitle')}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('wizard.logoHint')}
                </p>
              </div>
              <div className="flex justify-center py-6">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-border bg-card transition active:scale-95"
                >
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : uploading ? (
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                  ) : (
                    <Camera className="h-7 w-7 text-muted-foreground" />
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
                <p className="text-sm text-red-600">
                  {(create.error as Error).message}
                </p>
              ) : null}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="pb-[env(safe-area-inset-bottom)] pt-4">
        {step < 2 ? (
          <Button
            className="w-full"
            disabled={!steps[step].valid}
            onClick={() => setStep(step + 1)}
          >
            {t('wizard.next')}
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={create.isPending || uploading}
            onClick={() => create.mutate()}
          >
            {create.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t('wizard.create')
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
