'use client';

import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMeetNowStore } from '@/stores/meet-now-store';
import { useMeetNowScan } from '../hooks/use-meet-now-scan';
import { DiscoveryCard } from './discovery-card';
import { DiscoveryScorePanel } from './discovery-score-panel';
import { MeetNowEmptyState } from './meet-now-empty-state';
import { ParticleBurst } from './particle-burst';
import { ScanStatusOverlay } from './scan-status-overlay';
import { UserRevealCard } from './user-reveal-card';

const RadarSphereScene = dynamic(
  () => import('./radar-sphere-scene').then((m) => m.RadarSphereScene),
  { ssr: false },
);

const SocialNetworkScene = dynamic(
  () => import('./social-network-scene').then((m) => m.SocialNetworkScene),
  { ssr: false },
);

export function MeetNowFlow() {
  const t = useTranslations('discover.people.meetNow');
  const active = useMeetNowStore((s) => s.active);
  const stage = useMeetNowStore((s) => s.stage);
  const signals = useMeetNowStore((s) => s.signals);
  const revealed = useMeetNowStore((s) => s.revealed);
  const orbits = useMeetNowStore((s) => s.orbits);
  const stats = useMeetNowStore((s) => s.stats);
  const messageIndex = useMeetNowStore((s) => s.messageIndex);
  const latestSignal = useMeetNowStore((s) => s.latestSignal);
  const selected = useMeetNowStore((s) => s.selected);
  const radiusKm = useMeetNowStore((s) => s.radiusKm);
  const close = useMeetNowStore((s) => s.close);
  const setSelected = useMeetNowStore((s) => s.setSelected);
  const setRadiusKm = useMeetNowStore((s) => s.setRadiusKm);

  const { me, cancelScan } = useMeetNowScan();

  const latestReveal = revealed.length > 0 ? revealed[revealed.length - 1]! : null;
  const showNetwork = stage === 'complete';
  const showRadar = !showNetwork && stage !== 'empty';

  async function handleClose() {
    await cancelScan();
    close();
  }

  function handleExpand() {
    const next = Math.min(radiusKm * 2, 50);
    void cancelScan().then(() => {
      useMeetNowStore.getState().open(next);
    });
  }

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          className="fixed inset-0 z-50 bg-[#020617]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            onClick={() => void handleClose()}
            className="absolute end-4 top-4 z-50 rounded-full bg-black/50 p-2.5 text-white/70 backdrop-blur-md"
            aria-label={t('close')}
          >
            <X className="size-5" />
          </button>

          <div className="absolute inset-0">
            {showRadar ? (
              <RadarSphereScene
                stage={stage}
                signals={signals}
                avatarUrl={me?.avatarUrl}
                userName={me?.name}
                revealedCount={revealed.length}
              />
            ) : null}
            {showNetwork ? (
              <SocialNetworkScene
                orbits={orbits}
                selectedId={selected?.id ?? null}
                onSelect={setSelected}
              />
            ) : null}
          </div>

          <ScanStatusOverlay
            stage={stage}
            messageIndex={messageIndex}
            latestSignal={latestSignal}
          />

          <DiscoveryScorePanel
            stats={stats}
            stage={stage}
            revealedCount={revealed.length}
          />

          {stage === 'revealing' ? <UserRevealCard person={latestReveal} /> : null}

          {stage === 'empty' ? (
            <MeetNowEmptyState
              radiusKm={radiusKm}
              onExpand={handleExpand}
              onInvite={() => {
                if (typeof navigator !== 'undefined' && navigator.share) {
                  void navigator.share({
                    title: 'Bean Circle',
                    text: t('shareInvite'),
                    url: window.location.origin,
                  });
                }
              }}
              onNotify={() => {
                /* future: push subscription */
              }}
            />
          ) : null}

          {showNetwork ? (
            <motion.p
              className="absolute inset-x-0 bottom-8 z-30 text-center text-xs text-white/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {t('networkHint')}
            </motion.p>
          ) : null}

          <DiscoveryCard
            person={selected}
            onClose={() => setSelected(null)}
            onFriendAction={() => {}}
          />
          <ParticleBurst active={stage === 'revealing'} key={revealed.length} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
