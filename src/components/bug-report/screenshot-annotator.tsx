'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pen,
  ArrowUpRight,
  Highlighter,
  Eye,
  Undo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/mobile/haptics';

type Tool = 'pen' | 'arrow' | 'highlight' | 'blur';
type Point = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };

type Shape =
  | { tool: 'pen'; points: Point[] }
  | { tool: 'arrow'; from: Point; to: Point }
  | { tool: 'highlight'; rect: Rect }
  | { tool: 'blur'; rect: Rect };

const STROKE = '#ff3b30';
const HIGHLIGHT = 'rgba(255, 214, 10, 0.4)';

const TOOLS: { id: Tool; icon: typeof Pen; label: string }[] = [
  { id: 'pen', icon: Pen, label: 'Draw' },
  { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
  { id: 'highlight', icon: Highlighter, label: 'Highlight' },
  { id: 'blur', icon: Eye, label: 'Blur' },
];

export function ScreenshotAnnotator({
  src,
  onChange,
}: {
  src: string;
  /** Called with the flattened (image + annotations) PNG data URL. */
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const shapesRef = useRef<Shape[]>([]);
  const draftRef = useRef<Shape | null>(null);
  const drawingRef = useRef(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [ready, setReady] = useState(false);

  const drawArrow = (ctx: CanvasRenderingContext2D, from: Point, to: Point) => {
    const head = Math.max(12, ctx.lineWidth * 4);
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - head * Math.cos(angle - Math.PI / 6),
      to.y - head * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(
      to.x - head * Math.cos(angle + Math.PI / 6),
      to.y - head * Math.sin(angle + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fill();
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const all = draftRef.current
      ? [...shapesRef.current, draftRef.current]
      : shapesRef.current;

    const lineW = Math.max(3, canvas.width / 250);

    for (const s of all) {
      if (s.tool === 'blur') {
        const { x, y, w, h } = s.rect;
        if (Math.abs(w) < 2 || Math.abs(h) < 2) continue;
        ctx.save();
        ctx.filter = `blur(${Math.max(6, canvas.width / 90)}px)`;
        // Re-draw the underlying image region blurred onto the rect.
        ctx.drawImage(img, x, y, w, h, x, y, w, h);
        ctx.restore();
        // subtle border so the user sees the masked area
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
        continue;
      }
      ctx.save();
      ctx.lineWidth = lineW;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = STROKE;
      ctx.fillStyle = STROKE;
      if (s.tool === 'pen') {
        ctx.beginPath();
        s.points.forEach((p, i) =>
          i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y),
        );
        ctx.stroke();
      } else if (s.tool === 'arrow') {
        drawArrow(ctx, s.from, s.to);
      } else if (s.tool === 'highlight') {
        ctx.fillStyle = HIGHLIGHT;
        ctx.fillRect(s.rect.x, s.rect.y, s.rect.w, s.rect.h);
      }
      ctx.restore();
    }
  }, []);

  const commit = useCallback(() => {
    render();
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL('image/png'));
  }, [onChange, render]);

  // Load the source image once, then paint it.
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }
      setReady(true);
      render();
    };
    img.src = src;
  }, [src, render]);

  // Map a pointer event to image-space coordinates.
  const toImage = (e: React.PointerEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!ready) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const p = toImage(e);
    draftRef.current =
      tool === 'pen'
        ? { tool: 'pen', points: [p] }
        : tool === 'arrow'
          ? { tool: 'arrow', from: p, to: p }
          : { tool, rect: { x: p.x, y: p.y, w: 0, h: 0 } };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || !draftRef.current) return;
    const p = toImage(e);
    const d = draftRef.current;
    if (d.tool === 'pen') d.points.push(p);
    else if (d.tool === 'arrow') d.to = p;
    else d.rect = { x: d.rect.x, y: d.rect.y, w: p.x - d.rect.x, h: p.y - d.rect.y };
    render();
  };

  const onPointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const d = draftRef.current;
    draftRef.current = null;
    if (d) {
      // Normalise negative rects so blur/highlight always have positive w/h.
      if (d.tool === 'blur' || d.tool === 'highlight') {
        const r = d.rect;
        if (r.w < 0) {
          r.x += r.w;
          r.w = -r.w;
        }
        if (r.h < 0) {
          r.y += r.h;
          r.h = -r.h;
        }
        if (r.w < 4 || r.h < 4) {
          commit();
          return;
        }
      }
      shapesRef.current.push(d);
      haptic('selection');
    }
    commit();
  };

  const undo = () => {
    shapesRef.current.pop();
    haptic('light');
    commit();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        {TOOLS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-pressed={tool === id}
            onClick={() => {
              setTool(id);
              haptic('selection');
            }}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl border transition',
              tool === id
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-border/60 bg-background/40 text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          aria-label="Undo"
          onClick={undo}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/40 text-muted-foreground hover:text-foreground"
        >
          <Undo2 className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-black/20">
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="block w-full touch-none"
          style={{ maxHeight: '40vh', objectFit: 'contain' }}
        />
      </div>
    </div>
  );
}
