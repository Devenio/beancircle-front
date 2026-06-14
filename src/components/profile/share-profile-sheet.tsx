'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Copy, Download, ScanQrCode, X, Check } from 'lucide-react';
import { QrScanner } from './qr-scanner';

/* ── App palette (mirrors the dark theme from globals.css / favicon) ── */
const PALETTE = {
  bg0: '#0a0704',
  bg1: '#140b07',
  bg2: '#2a1a12',
  amber: '#c87f43',
  amberLight: '#f5b878',
  amberDark: '#7a4a25',
  text: '#f5ede6',
  muted: '#8a6650',
};

/* ── Floating ghost bean logo ── */
function FloatingLogo({
  x, y, size, duration, delay, rotate,
}: {
  x: string; y: string; size: number; duration: number; delay: number; rotate: number;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ left: x, top: y, width: size, height: size, opacity: 0 }}
      animate={{
        opacity: [0, 0.09, 0.13, 0.06, 0],
        y: [0, -28, -8, -36, 0],
        rotate: [rotate, rotate + 14, rotate - 9, rotate + 5, rotate],
        scale: [0.9, 1.06, 0.94, 1.1, 0.9],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <ellipse cx="100" cy="100" rx="38" ry="52" fill="white" transform="rotate(32 100 100)" />
        <path
          d="M100 52 C86 74, 114 126, 100 148"
          fill="none"
          stroke={PALETTE.bg0}
          strokeWidth="9"
          strokeLinecap="round"
          transform="rotate(32 100 100)"
        />
      </svg>
    </motion.div>
  );
}

/* ── QR code with gently rounded module corners ── */
function RoundedQR({ value, size }: { value: string; size: number }) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const roundRects = useCallback(() => {
    const svg = wrapperRef.current?.querySelector('svg');
    if (!svg) return;
    const rects = [...svg.querySelectorAll('rect')];
    // Module size = smallest positive rect width
    const widths = rects.map(r => parseFloat(r.getAttribute('width') ?? '0')).filter(w => w > 0);
    const module = Math.min(...widths);
    const rx = String(Math.round(module * 0.18));
    rects.forEach(r => {
      const w = parseFloat(r.getAttribute('width') ?? '0');
      // Skip large background rect; round data/finder module rects
      if (w <= module * 8) {
        r.setAttribute('rx', rx);
        r.setAttribute('ry', rx);
      }
    });
  }, []);

  // Round on mount and whenever value changes
  useEffect(() => {
    // SVG renders synchronously in the same frame, so one rAF is enough
    const id = requestAnimationFrame(roundRects);
    return () => cancelAnimationFrame(id);
  }, [value, roundRects]);

  return (
    <div ref={wrapperRef}>
      <QRCodeSVG
        id="qr-svg-root"
        value={value}
        size={size}
        level="H"
        marginSize={1}
        fgColor={PALETTE.bg0}
        bgColor="transparent"
        imageSettings={{
          src: '/logo-bw.svg',
          height: 52,
          width: 52,
          excavate: true,
        }}
      />
    </div>
  );
}

/* ── Download: rasterises the QR SVG to a PNG card ── */
async function downloadQR(username: string) {
  const svgEl = document.querySelector('#qr-svg-root') as SVGSVGElement | null;
  if (!svgEl) return;

  const svgSize = 240;
  const padding = 32;
  const labelH = 52;
  const W = svgSize + padding * 2;
  const H = svgSize + padding * 2 + labelH;

  const svgStr = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((res) => { img.onload = () => res(); img.src = url; });

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // White rounded card
  ctx.fillStyle = '#ffffff';
  const r = 24;
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.lineTo(W - r, 0); ctx.quadraticCurveTo(W, 0, W, r);
  ctx.lineTo(W, H - r); ctx.quadraticCurveTo(W, H, W - r, H);
  ctx.lineTo(r, H); ctx.quadraticCurveTo(0, H, 0, H - r);
  ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath(); ctx.fill();

  ctx.drawImage(img, padding, padding, svgSize, svgSize);
  ctx.fillStyle = PALETTE.bg0;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`@${username}`, W / 2, svgSize + padding * 2 + 22);

  URL.revokeObjectURL(url);
  const link = document.createElement('a');
  link.download = `${username}-beancircle.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/* ── Main component ── */
interface ShareProfileSheetProps {
  username: string;
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareProfileSheet({ username, locale, open, onOpenChange }: ShareProfileSheetProps) {
  const [copied, setCopied] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');

  useEffect(() => {
    if (open) setProfileUrl(`${window.location.origin}/${locale}/profile/${username}`);
  }, [open, username, locale]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `@${username} on BeanCircle`, url: profileUrl }); }
      catch { /* dismissed */ }
    } else {
      handleCopyLink();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex flex-col overflow-hidden"
          style={{ zIndex: 200 }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 340 }}
        >
          {/* Deep dark background */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(160deg, ${PALETTE.bg2} 0%, ${PALETTE.bg1} 40%, ${PALETTE.bg0} 100%)`,
            }}
          />
          {/* Warm radial glow from below */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 80% 50% at 50% 115%, ${PALETTE.amberDark}66 0%, transparent 65%)`,
            }}
          />

          {/* Floating ghost logos */}
          <FloatingLogo x="4%"  y="7%"  size={88}  duration={9}  delay={0}   rotate={-15} />
          <FloatingLogo x="70%" y="4%"  size={68}  duration={11} delay={1.5} rotate={22}  />
          <FloatingLogo x="78%" y="52%" size={96}  duration={13} delay={0.7} rotate={-8}  />
          <FloatingLogo x="1%"  y="63%" size={72}  duration={10} delay={2.1} rotate={34}  />
          <FloatingLogo x="38%" y="76%" size={58}  duration={8}  delay={1}   rotate={10}  />
          <FloatingLogo x="55%" y="18%" size={48}  duration={12} delay={3}   rotate={-24} />

          {/* Content */}
          <div className="relative flex flex-1 flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 pt-14 pb-4">
              <motion.button
                type="button"
                onClick={() => onOpenChange(false)}
                whileTap={{ scale: 0.86 }}
                className="rounded-full p-2.5"
                style={{ background: 'rgba(245,184,120,0.13)' }}
              >
                <X className="size-5" style={{ color: PALETTE.amberLight }} />
              </motion.button>
              <span className="text-base font-bold tracking-wide" style={{ color: PALETTE.text }}>
                Share Profile
              </span>
              <motion.button
                type="button"
                onClick={() => setScannerOpen(true)}
                whileTap={{ scale: 0.86 }}
                className="rounded-full p-2.5"
                style={{ background: 'rgba(245,184,120,0.13)' }}
              >
                <ScanQrCode className="size-5" style={{ color: PALETTE.amberLight }} />
              </motion.button>
            </div>

            {/* QR card */}
            <div className="flex flex-1 items-center justify-center px-6">
              <motion.div
                id="qr-card"
                initial={{ scale: 0.78, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: 'spring', damping: 22, stiffness: 260 }}
                className="flex flex-col items-center rounded-3xl px-8 pt-7 pb-6 shadow-2xl"
                style={{ background: '#ffffff' }}
              >
                {profileUrl ? (
                  <RoundedQR value={profileUrl} size={240} />
                ) : (
                  <div
                    className="animate-pulse rounded-2xl"
                    style={{ width: 240, height: 240, background: '#f0e8e0' }}
                  />
                )}

                {/* Username */}
                <p className="mt-4 text-xl font-bold tracking-tight" style={{ color: PALETTE.bg0 }}>
                  @{username}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: PALETTE.muted }}>
                  Scan to visit my BeanCircle
                </p>
              </motion.div>
            </div>

            {/* Action buttons */}
            <div className="flex items-start justify-around px-8 pb-28 pt-8">
              <ActionBtn icon={<Share2 className="size-6" />} label="Share" onClick={handleShare} />
              <ActionBtn
                icon={copied ? <Check className="size-6" /> : <Copy className="size-6" />}
                label={copied ? 'Copied!' : 'Copy Link'}
                onClick={handleCopyLink}
                active={copied}
              />
              <ActionBtn
                icon={<Download className="size-6" />}
                label="Download"
                onClick={() => downloadQR(username)}
              />
            </div>
          </div>

          {/* QR Scanner overlay */}
          <AnimatePresence>
            {scannerOpen && (
              <motion.div
                className="absolute inset-0"
                style={{ zIndex: 10 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <QrScanner onClose={() => setScannerOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ActionBtn({
  icon, label, onClick, active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      className="flex flex-col items-center gap-2"
    >
      <span
        className="flex size-16 items-center justify-center rounded-2xl transition-colors"
        style={{
          background: active ? `${PALETTE.amber}cc` : 'rgba(245,184,120,0.16)',
          color: active ? '#ffffff' : PALETTE.amberLight,
        }}
      >
        {icon}
      </span>
      <span className="text-xs font-medium" style={{ color: PALETTE.text }}>
        {label}
      </span>
    </motion.button>
  );
}
