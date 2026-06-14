'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface QrScannerProps {
  onClose: () => void;
}

export function QrScanner({ onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let animationId: number;
    let stream: MediaStream | null = null;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setScanning(true);

        if (!('BarcodeDetector' in window)) {
          setError('QR scanning is not supported on this browser. Try Chrome on Android.');
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });

        const scan = async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const codes: any[] = await detector.detect(videoRef.current);
              if (codes.length > 0) {
                const value: string = codes[0].rawValue;
                // Navigate to scanned URL if it looks like a profile URL
                try {
                  const url = new URL(value);
                  window.location.href = url.pathname;
                } catch {
                  window.location.href = value;
                }
                return;
              }
            } catch {
              // detection error on a frame — keep scanning
            }
          }
          animationId = requestAnimationFrame(scan);
        };

        animationId = requestAnimationFrame(scan);
      } catch {
        setError('Camera access was denied. Please allow camera permissions and try again.');
      }
    };

    start();

    return () => {
      cancelAnimationFrame(animationId);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="absolute inset-0 z-10 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
      />

      {/* Scanning frame overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative size-64">
          {/* Dark overlay outside the frame */}
          <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] rounded-2xl" />
          {/* Corner accents */}
          <span className="absolute top-0 left-0 h-8 w-8 rounded-tl-2xl border-t-4 border-l-4 border-white" />
          <span className="absolute top-0 right-0 h-8 w-8 rounded-tr-2xl border-t-4 border-r-4 border-white" />
          <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-white" />
          <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-white" />
          {scanning && !error && (
            <motion.div
              className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent"
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
            />
          )}
        </div>
      </div>

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-12 pb-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-black/40 p-2.5 backdrop-blur-sm"
        >
          <X className="size-5 text-white" />
        </button>
        <span className="font-semibold text-white drop-shadow">Scan QR Code</span>
        <div className="size-10" />
      </div>

      <p className="absolute inset-x-0 top-1/2 mt-44 text-center text-sm text-white/70">
        Point at a BeanCircle profile QR code
      </p>

      {error && (
        <div className="absolute inset-x-4 bottom-20 rounded-2xl bg-red-500/90 px-4 py-3 text-center text-sm text-white backdrop-blur-sm">
          {error}
        </div>
      )}

    </div>
  );
}
