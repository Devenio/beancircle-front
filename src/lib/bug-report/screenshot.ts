/**
 * Screenshot capture for the bug reporter.
 *
 * Uses `html2canvas-pro` (the maintained fork that understands Tailwind v4's
 * `oklch()` colors). The dependency is loaded lazily and optionally: if it
 * isn't installed, capture returns `null` and the report flow continues without
 * a screenshot. To enable screenshots:  `pnpm add html2canvas-pro`
 */

export type Screenshot = {
  dataUrl: string;
  width: number;
  height: number;
};

let warned = false;

export async function captureScreenshot(): Promise<Screenshot | null> {
  if (typeof document === 'undefined') return null;
  try {
    // Optional dependency — resolved at runtime, tolerated if absent. The
    // specifier is held in a variable so the bundler treats it as optional
    // (a missing package disables screenshots instead of breaking the build).
    const spec = 'html2canvas-pro';
    const mod = await import(/* webpackIgnore: true */ spec).catch(() => null);
    const html2canvas = (mod as { default?: unknown } | null)?.default as
      | ((el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>)
      | undefined;
    if (!html2canvas) {
      if (!warned) {
        warned = true;
        console.info(
          '[bug-report] html2canvas-pro not installed — screenshots disabled. Run: pnpm add html2canvas-pro',
        );
      }
      return null;
    }

    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = await html2canvas(document.body, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: getComputedStyle(document.body).backgroundColor || '#000',
      // Don't capture the reporter UI itself.
      ignoreElements: (el: Element) =>
        el instanceof HTMLElement && el.dataset.bugReportIgnore === 'true',
    });

    return {
      dataUrl: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
    };
  } catch (err) {
    console.warn('[bug-report] screenshot capture failed', err);
    return null;
  }
}

/** Convert a data URL (annotated screenshot) into a File for upload. */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',');
  const mime = /data:(.*?);/.exec(header)?.[1] ?? 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}
