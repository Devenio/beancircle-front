import type { Area } from 'react-easy-crop';

export type ImageFilterId =
  | 'natural'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'dramatic'
  | 'mono'
  | 'cinematic';

export type ImageQualityId = 'original' | 'high' | 'medium' | 'low';

export type ImageAdjustments = {
  /** -100..100, 0 = neutral */
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  /** 0..100 */
  vignette: number;
};

export type ImageEditState = {
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  filter: ImageFilterId;
  adjustments: ImageAdjustments;
  aspect: number | undefined;
  cropZoom: number;
  cropPosition: { x: number; y: number };
  croppedAreaPixels: Area | null;
};

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  vignette: 0,
};

export const DEFAULT_IMAGE_EDIT: ImageEditState = {
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  filter: 'natural',
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  aspect: undefined,
  cropZoom: 1,
  cropPosition: { x: 0, y: 0 },
  croppedAreaPixels: null,
};

export const IMAGE_FILTERS: { id: ImageFilterId; labelKey: string }[] = [
  { id: 'natural', labelKey: 'filterNatural' },
  { id: 'warm', labelKey: 'filterWarm' },
  { id: 'cool', labelKey: 'filterCool' },
  { id: 'vintage', labelKey: 'filterVintage' },
  { id: 'dramatic', labelKey: 'filterDramatic' },
  { id: 'mono', labelKey: 'filterMono' },
  { id: 'cinematic', labelKey: 'filterCinematic' },
];

export const ASPECT_PRESETS: { id: string; labelKey: string; value: number | undefined }[] = [
  { id: 'free', labelKey: 'aspectFree', value: undefined },
  { id: 'square', labelKey: 'aspectSquare', value: 1 },
  { id: 'story', labelKey: 'aspectStory', value: 9 / 16 },
  { id: 'portrait', labelKey: 'aspectPortrait', value: 4 / 5 },
  { id: 'landscape', labelKey: 'aspectLandscape', value: 16 / 9 },
];

export const IMAGE_QUALITIES: {
  id: ImageQualityId;
  labelKey: string;
  maxDim: number | null;
  jpegQuality: number;
  /** rough output-size multiplier vs original, used only for the estimate label */
  sizeFactor: number;
}[] = [
  { id: 'original', labelKey: 'qualityOriginal', maxDim: null, jpegQuality: 0.92, sizeFactor: 1 },
  { id: 'high', labelKey: 'qualityHigh', maxDim: 2048, jpegQuality: 0.85, sizeFactor: 0.6 },
  { id: 'medium', labelKey: 'qualityMedium', maxDim: 1280, jpegQuality: 0.75, sizeFactor: 0.3 },
  { id: 'low', labelKey: 'qualityLow', maxDim: 720, jpegQuality: 0.6, sizeFactor: 0.12 },
];

const EXPORT_MIME = 'image/jpeg';

function filterBaseCss(filter: ImageFilterId): string {
  switch (filter) {
    case 'warm':
      return 'sepia(0.3) saturate(1.2) brightness(1.03)';
    case 'cool':
      return 'hue-rotate(12deg) saturate(0.92) brightness(1.02)';
    case 'vintage':
      return 'sepia(0.45) contrast(0.95) brightness(1.05) saturate(0.85)';
    case 'dramatic':
      return 'contrast(1.25) brightness(0.95) saturate(1.1)';
    case 'mono':
      return 'grayscale(1) contrast(1.08)';
    case 'cinematic':
      return 'contrast(1.18) saturate(1.25) brightness(0.96) sepia(0.12)';
    default:
      return '';
  }
}

function adjustmentsCss(adj: ImageAdjustments): string {
  const parts: string[] = [];
  if (adj.brightness !== 0) parts.push(`brightness(${1 + adj.brightness / 150})`);
  if (adj.contrast !== 0) parts.push(`contrast(${1 + adj.contrast / 150})`);
  if (adj.saturation !== 0) parts.push(`saturate(${1 + adj.saturation / 120})`);
  if (adj.warmth > 0) parts.push(`sepia(${adj.warmth / 220})`);
  if (adj.warmth < 0) parts.push(`hue-rotate(${(adj.warmth / 100) * 18}deg)`);
  return parts.join(' ');
}

/** Combined CSS filter string for live previews (vignette is rendered as an overlay). */
export function getFilterCss(filter: ImageFilterId, adjustments?: ImageAdjustments): string {
  const combined = [filterBaseCss(filter), adjustments ? adjustmentsCss(adjustments) : '']
    .filter(Boolean)
    .join(' ');
  return combined || 'none';
}

/** CSS background for the vignette overlay div in previews. */
export function getVignetteCss(vignette: number): string | undefined {
  if (vignette <= 0) return undefined;
  const strength = Math.min(0.85, vignette / 110);
  return `radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,${strength}) 130%)`;
}

export function hasAdjustments(adj: ImageAdjustments): boolean {
  return (
    adj.brightness !== 0 ||
    adj.contrast !== 0 ||
    adj.saturation !== 0 ||
    adj.warmth !== 0 ||
    adj.vignette !== 0
  );
}

export function hasImageEdits(state: ImageEditState): boolean {
  return (
    state.rotation !== 0 ||
    state.flipHorizontal ||
    state.flipVertical ||
    state.filter !== 'natural' ||
    hasAdjustments(state.adjustments) ||
    state.croppedAreaPixels !== null
  );
}

export function estimateExportSize(originalBytes: number, quality: ImageQualityId): number {
  const preset = IMAGE_QUALITIES.find((q) => q.id === quality) ?? IMAGE_QUALITIES[0];
  return Math.max(24 * 1024, Math.round(originalBytes * preset.sizeFactor));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Could not load image')));
    if (!src.startsWith('blob:')) {
      image.crossOrigin = 'anonymous';
    }
    image.src = src;
  });
}

function getRadianAngle(degree: number) {
  return (degree * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rot = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rot) * width) + Math.abs(Math.sin(rot) * height),
    height: Math.abs(Math.sin(rot) * width) + Math.abs(Math.cos(rot) * height),
  };
}

function drawRotated(
  image: HTMLImageElement,
  rotation: number,
  flipHorizontal: boolean,
  flipVertical: boolean,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const { width: boxWidth, height: boxHeight } = rotateSize(
    image.width,
    image.height,
    rotation,
  );

  canvas.width = boxWidth;
  canvas.height = boxHeight;

  ctx.translate(boxWidth / 2, boxHeight / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  return canvas;
}

function applyVignette(ctx: CanvasRenderingContext2D, width: number, height: number, vignette: number) {
  if (vignette <= 0) return;
  const strength = Math.min(0.85, vignette / 110);
  const outerRadius = Math.sqrt(width * width + height * height) / 2;
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    outerRadius * 0.45,
    width / 2,
    height / 2,
    outerRadius,
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function canvasToFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  jpegQuality: number,
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not export image'));
          return;
        }
        const baseName = fileName.replace(/\.[^.]+$/, '') || 'photo';
        resolve(
          new File([blob], `${baseName}.jpg`, {
            type: EXPORT_MIME,
            lastModified: Date.now(),
          }),
        );
      },
      EXPORT_MIME,
      jpegQuality,
    );
  });
}

export async function exportEditedImage(
  file: File,
  state: ImageEditState,
  quality: ImageQualityId = 'original',
): Promise<File> {
  const preset = IMAGE_QUALITIES.find((q) => q.id === quality) ?? IMAGE_QUALITIES[0];
  const needsRecode = hasImageEdits(state) || quality !== 'original';
  if (!needsRecode) return file;

  const src = URL.createObjectURL(file);
  try {
    const image = await loadImage(src);
    const rotated = drawRotated(image, state.rotation, state.flipHorizontal, state.flipVertical);

    const crop =
      state.croppedAreaPixels &&
      state.croppedAreaPixels.width > 0 &&
      state.croppedAreaPixels.height > 0
        ? state.croppedAreaPixels
        : { x: 0, y: 0, width: rotated.width, height: rotated.height };

    let outWidth = Math.max(1, Math.round(crop.width));
    let outHeight = Math.max(1, Math.round(crop.height));
    if (preset.maxDim) {
      const scale = Math.min(1, preset.maxDim / Math.max(outWidth, outHeight));
      outWidth = Math.max(1, Math.round(outWidth * scale));
      outHeight = Math.max(1, Math.round(outHeight * scale));
    }

    const out = document.createElement('canvas');
    out.width = outWidth;
    out.height = outHeight;
    const outCtx = out.getContext('2d');
    if (!outCtx) throw new Error('Canvas not supported');

    outCtx.filter = getFilterCss(state.filter, state.adjustments);
    outCtx.drawImage(rotated, crop.x, crop.y, crop.width, crop.height, 0, 0, outWidth, outHeight);
    outCtx.filter = 'none';
    applyVignette(outCtx, outWidth, outHeight, state.adjustments.vignette);

    return await canvasToFile(out, file.name, preset.jpegQuality);
  } finally {
    URL.revokeObjectURL(src);
  }
}
