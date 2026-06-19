'use client';

import { Button } from '@/components/ui/button';
import { Check, Copy, Download, Printer, QrCode as QrIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QR_DOM_ID = 'menu-qr-svg-root';

/* Rasterise the on-screen QR SVG to a PNG card and trigger a download. */
async function downloadQrPng(filename: string, caption: string) {
  const svgEl = document.getElementById(QR_DOM_ID) as SVGSVGElement | null;
  if (!svgEl) return;

  const qrSize = 480;
  const padding = 48;
  const captionH = 64;
  const W = qrSize + padding * 2;
  const H = qrSize + padding * 2 + captionH;

  const svgStr = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error('qr image load failed'));
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(img, padding, padding, qrSize, qrSize);

  ctx.fillStyle = '#1a0f0a';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(caption, W / 2, qrSize + padding * 2 + 30);

  URL.revokeObjectURL(url);
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/* Open a print-friendly window with just the QR and a caption. */
function printQr(
  caption: string,
  menuUrl: string,
  tagline: string,
  steps: [string, string, string],
) {
  const svgEl = document.getElementById(QR_DOM_ID) as SVGSVGElement | null;
  if (!svgEl) return;
  const svgStr = new XMLSerializer().serializeToString(svgEl);

  const win = window.open('', '_blank', 'width=720,height=900');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${caption}</title>
    <style>
      @page { size: A4; margin: 0; }
      *{margin:0;padding:0;box-sizing:border-box}
      html,body{height:100%}
      body{
        font-family:system-ui,-apple-system,"Segoe UI",sans-serif;
        color:#1a0f0a;
        display:flex;align-items:center;justify-content:center;
        padding:24mm;
        -webkit-print-color-adjust:exact;print-color-adjust:exact;
      }
      .poster{
        width:100%;max-width:150mm;
        border:2px solid #1a0f0a;border-radius:20px;
        padding:18mm 14mm;text-align:center;
        display:flex;flex-direction:column;align-items:center;gap:8mm;
      }
      .name{font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1.1}
      .tagline{font-size:17px;font-weight:600;color:#6b4f3f}
      .qr{
        width:62mm;height:62mm;padding:6mm;
        border-radius:16px;background:#fff;
        box-shadow:0 0 0 2px #efe6df inset;
      }
      .qr svg{width:100%;height:100%;display:block}
      .steps{display:flex;gap:10mm;font-size:13px;color:#6b5a4f}
      .step{display:flex;flex-direction:column;align-items:center;gap:3px;max-width:34mm}
      .step b{font-size:18px;font-weight:800;color:#1a0f0a}
      .url{font-size:11px;color:#9b8a7e;word-break:break-all;max-width:80%}
      .divider{width:40mm;height:1px;background:#e6dbd2}
    </style></head>
    <body>
      <div class="poster">
        <div class="name">${caption}</div>
        <div class="tagline">${tagline}</div>
        <div class="qr">${svgStr}</div>
        <div class="steps">
          <div class="step"><b>1</b><span>${steps[0]}</span></div>
          <div class="step"><b>2</b><span>${steps[1]}</span></div>
          <div class="step"><b>3</b><span>${steps[2]}</span></div>
        </div>
        <div class="divider"></div>
        <div class="url">${menuUrl}</div>
      </div>
      <script>window.onload=function(){window.focus();window.print()}</script>
    </body></html>`);
  win.document.close();
}

interface MenuQrCardProps {
  slug: string | null;
  isPublished: boolean;
  cafeName?: string;
  locale: string;
}

export function MenuQrCard({ slug, isPublished, cafeName, locale }: MenuQrCardProps) {
  const t = useTranslations('cafeOs.menu');
  const [menuUrl, setMenuUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) setMenuUrl(`${window.location.origin}/${locale}/m/${slug}`);
  }, [slug, locale]);

  const caption = cafeName || t('qr.caption');

  if (!isPublished || !slug) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center">
        <QrIcon className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">{t('qr.title')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('qr.unpublishedHint')}</p>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <QrIcon className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">{t('qr.title')}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t('qr.hint')}</p>

      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="rounded-2xl bg-white p-4">
          <QRCodeSVG
            id={QR_DOM_ID}
            value={menuUrl || `${''}`}
            size={200}
            level="H"
            marginSize={1}
            fgColor="#1a0f0a"
            bgColor="#ffffff"
          />
        </div>
        <p className="max-w-full truncate text-xs text-muted-foreground">{menuUrl}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? t('qr.copied') : t('qr.copyLink')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => downloadQrPng(`menu-qr-${slug}.png`, caption)}
        >
          <Download className="h-3.5 w-3.5" />
          {t('qr.download')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="col-span-2"
          onClick={() =>
            printQr(caption, menuUrl, t('qr.tagline'), [
              t('qr.step1'),
              t('qr.step2'),
              t('qr.step3'),
            ])
          }
        >
          <Printer className="h-3.5 w-3.5" />
          {t('qr.print')}
        </Button>
      </div>
    </div>
  );
}
