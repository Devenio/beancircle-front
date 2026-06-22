/**
 * Curated social-platform catalogue for the profile social-links feature.
 *
 * lucide-react v1 dropped its brand icons (Instagram, Twitter, …), so each
 * platform carries a small inline SVG glyph component here instead. Keeping
 * the glyphs in one place lets the editor and the public profile render the
 * same icon for a given platform id.
 */

export type PlatformId =
  | 'instagram'
  | 'x'
  | 'telegram'
  | 'tiktok'
  | 'youtube'
  | 'github'
  | 'linkedin'
  | 'facebook'
  | 'whatsapp'
  | 'threads'
  | 'discord'
  | 'website'
  | 'custom';

export interface SocialPlatformMeta {
  id: PlatformId;
  /** i18n key under the `profile.platforms` namespace. */
  labelKey: string;
  /** Inline glyph (inherits `currentColor` / `size-*`). */
  Glyph: React.ComponentType<{ className?: string }>;
  /** Hint shown inside the editor input, e.g. "@username" or "https://…". */
  placeholderKey: string;
  /** Whether a brand colour wash is applied to the icon chip. */
  brand?: boolean;
}

type GlyphProps = { className?: string };

function svg(
  paths: React.ReactNode,
  viewBox = '0 0 24 24',
): React.ComponentType<GlyphProps> {
  return function Glyph({ className }: GlyphProps) {
    return (
      <svg
        viewBox={viewBox}
        className={className}
        fill="currentColor"
        aria-hidden="true"
      >
        {paths}
      </svg>
    );
  };
}

/* Simple Brand Glyphs (single-colour, inherit currentColor) */
const InstagramGlyph = svg(
  <>
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.62c-3.15 0-3.5.01-4.74.07-.9.04-1.38.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.33-.28.81-.32 1.71-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.04.9.19 1.38.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.33.13.81.28 1.71.32 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c.9-.04 1.38-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.33.28-.81.32-1.71.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.04-.9-.19-1.38-.32-1.71a2.85 2.85 0 0 0-.69-1.06 2.85 2.85 0 0 0-1.06-.69c-.33-.13-.81-.28-1.71-.32-1.24-.06-1.59-.07-4.74-.07Zm0 2.76a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6Zm0 1.62a3.68 3.68 0 1 0 0 7.36 3.68 3.68 0 0 0 0-7.36Zm5.48-2.9a1.24 1.24 0 1 1 0 2.48 1.24 1.24 0 0 1 0-2.48Z" />
  </>,
);

const XGlyph = svg(
  <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.97 6.82H1.66l7.73-8.84L1.24 2.25h6.83l4.71 6.23 5.46-6.23Zm-1.16 17.52h1.83L7.01 4.21H5.04l12.04 15.56Z" />,
);

const TelegramGlyph = svg(
  <path d="M21.94 4.6 18.6 20.3c-.25 1.1-.9 1.38-1.83.86l-5.05-3.72-2.44 2.35c-.27.27-.5.5-1.01.5l.36-5.13 9.34-8.44c.4-.36-.09-.56-.63-.2L5.62 13.25.7 11.71c-1.07-.34-1.1-1.08.23-1.6L20.54 3.1c.9-.33 1.68.2 1.4 1.5Z" />,
);

const TiktokGlyph = svg(
  <path d="M16.6 5.82a4.28 4.28 0 0 1-1.01-2.82h-3.3v13.4a2.59 2.59 0 0 1-2.59 2.55 2.59 2.59 0 0 1 0-5.18c.26 0 .52.04.76.12v-3.34a5.93 5.93 0 0 0-.76-.05 5.92 5.92 0 1 0 5.92 5.92V9.4a7.55 7.55 0 0 0 4.4 1.4V7.5a4.28 4.28 0 0 1-3.42-1.68Z" />,
);

const YoutubeGlyph = svg(
  <path d="M23.5 6.5a3.02 3.02 0 0 0-2.12-2.14C19.5 3.85 12 3.85 12 3.85s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.5C0 8.39 0 12 0 12s0 3.61.5 5.5a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.61 24 12 24 12s0-3.61-.5-5.5ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />,
);

const GithubGlyph = svg(
  <path d="M12 1.5A10.5 10.5 0 0 0 1.5 12c0 4.64 3.01 8.57 7.18 9.96.53.1.72-.23.72-.51l-.01-1.8c-2.92.63-3.54-1.25-3.54-1.25-.48-1.21-1.17-1.54-1.17-1.54-.96-.65.07-.64.07-.64 1.06.07 1.62 1.09 1.62 1.09.94 1.62 2.47 1.15 3.07.88.1-.68.37-1.15.67-1.41-2.33-.27-4.78-1.17-4.78-5.18 0-1.15.41-2.08 1.08-2.82-.11-.27-.47-1.34.1-2.79 0 0 .88-.28 2.88 1.07a9.96 9.96 0 0 1 5.24 0c2-1.35 2.88-1.07 2.88-1.07.57 1.45.21 2.52.1 2.79.67.74 1.08 1.67 1.08 2.82 0 4.02-2.46 4.91-4.8 5.17.38.33.71.97.71 1.96l-.01 2.9c0 .28.19.62.73.51A10.5 10.5 0 0 0 22.5 12 10.5 10.5 0 0 0 12 1.5Z" />,
);

const LinkedinGlyph = svg(
  <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />,
);

const FacebookGlyph = svg(
  <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.08 24 18.09 24 12.07Z" />,
);

const WhatsappGlyph = svg(
  <path d="M.06 24l1.68-6.16a11.87 11.87 0 0 1-1.6-5.95C.15 5.32 5.5 0 12.06 0a11.8 11.8 0 0 1 8.4 3.49 11.76 11.76 0 0 1 3.48 8.4c0 6.56-5.34 11.9-11.9 11.9a11.97 11.97 0 0 1-5.7-1.45L.06 24Zm6.6-3.8c1.68.99 3.28 1.58 5.4 1.58 5.45 0 9.9-4.43 9.9-9.88a9.83 9.83 0 0 0-2.9-7 9.78 9.78 0 0 0-6.99-2.9c-5.46 0-9.9 4.44-9.9 9.89 0 2.23.65 3.9 1.75 5.65l-1 3.64 3.74-.98Zm11.39-5.55c-.07-.12-.27-.2-.57-.35-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42Z" />,
);

const ThreadsGlyph = svg(
  <path d="M17.9 11.2c-.08-.04-.16-.08-.25-.12-.15-2.66-1.59-4.19-4.03-4.21h-.03c-1.46 0-2.67.62-3.42 1.76l1.34.92c.56-.85 1.43-1.03 2.08-1.03h.02c.85.01 1.49.25 1.9.73.3.35.51.84.61 1.46a13.6 13.6 0 0 0-2.46-.13c-2.48.14-4.08 1.59-3.97 3.6.05 1.02.57 1.9 1.45 2.48.75.49 1.71.73 2.72.68 1.32-.07 2.36-.58 3.08-1.5.55-.7.9-1.6 1.06-2.76.64.39 1.11.9 1.39 1.51.45 1 .48 2.65-.88 4.01-1.2 1.2-2.64 1.71-4.82 1.73-2.41-.02-4.24-.79-5.42-2.3C8.06 15.55 7.5 13.7 7.47 11.5c.03-2.2.59-4.05 1.68-5.49 1.18-1.51 3.01-2.28 5.42-2.3 2.42.02 4.28.79 5.52 2.29.61.74 1.07 1.68 1.38 2.79l1.71-.46c-.37-1.38-.96-2.55-1.76-3.51C20.66 1.94 18.39.97 15.57.95h-.01c-2.82.02-5.06.99-6.65 2.88C7.59 5.52 6.91 7.74 6.88 10.5v1c.03 2.76.71 4.98 2.03 6.67 1.59 1.89 3.83 2.86 6.65 2.88h.01c2.66-.02 4.47-.73 5.99-2.25 1.99-1.99 1.93-4.48 1.27-6.01-.47-1.09-1.37-1.97-2.6-2.59Zm-4.34 4.91c-1.11.06-2.26-.44-2.32-1.51-.04-.79.56-1.67 2.35-1.77.2-.01.4-.02.6-.02.66 0 1.27.06 1.83.19-.21 2.62-1.45 3.05-2.46 3.11Z" />,
);

const DiscordGlyph = svg(
  <path d="M20.32 4.37A19.8 19.8 0 0 0 15.45 2.9a.07.07 0 0 0-.08.04c-.21.37-.44.86-.6 1.25a18.3 18.3 0 0 0-5.54 0c-.16-.4-.4-.88-.61-1.25a.08.08 0 0 0-.08-.04c-1.7.29-3.33.74-4.86 1.47a.07.07 0 0 0-.04.03C.53 9.06-.32 13.58.1 18.06a.08.08 0 0 0 .03.05 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.22-2a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1-.01-.13l.37-.29a.07.07 0 0 1 .08-.01 14.2 14.2 0 0 0 12.06 0 .07.07 0 0 1 .08 0l.37.3a.08.08 0 0 1 0 .13c-.6.35-1.22.65-1.87.89a.08.08 0 0 0-.04.11c.36.7.78 1.36 1.22 2a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.66-3.54-13.66a.06.06 0 0 0-.04-.03ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Z" />,
);

const GlobeGlyph = svg(
  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.93 6h-2.95a15.7 15.7 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8ZM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96ZM4.26 14a7.96 7.96 0 0 1 0-4h3.38a16.5 16.5 0 0 0-.14 2c0 .68.05 1.35.14 2H4.26Zm.81 2h2.95c.32 1.25.78 2.45 1.38 3.56A8.03 8.03 0 0 1 5.07 16Zm2.95-8H5.07a8.03 8.03 0 0 1 4.33-3.56A15.7 15.7 0 0 0 8.02 8ZM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82A13.7 13.7 0 0 1 12 19.96ZM16.34 14H7.66a14.6 14.6 0 0 1-.16-2c0-.68.06-1.35.16-2h8.68c.1.65.16 1.32.16 2 0 .68-.06 1.35-.16 2Zm-.41 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56ZM16.36 14c.09-.65.14-1.32.14-2 0-.68-.05-1.35-.14-2h3.38a7.96 7.96 0 0 1 0 4h-3.38Z" />,
);

const LinkGlyph = svg(
  <path d="M3.6 12a3.4 3.4 0 0 1 3.4-3.4h4V7H7a5 5 0 0 0 0 10h4v-1.6H7A3.4 3.4 0 0 1 3.6 12ZM8 13h8v-2H8v2Zm9-6h-4v1.6h4a3.4 3.4 0 0 1 0 6.8h-4V17h4a5 5 0 0 0 0-10Z" />,
);

export const SOCIAL_PLATFORMS: SocialPlatformMeta[] = [
  { id: 'instagram', labelKey: 'instagram', Glyph: InstagramGlyph, placeholderKey: 'phHandle', brand: true },
  { id: 'x', labelKey: 'x', Glyph: XGlyph, placeholderKey: 'phHandle', brand: true },
  { id: 'telegram', labelKey: 'telegram', Glyph: TelegramGlyph, placeholderKey: 'phHandle', brand: true },
  { id: 'tiktok', labelKey: 'tiktok', Glyph: TiktokGlyph, placeholderKey: 'phHandle', brand: true },
  { id: 'youtube', labelKey: 'youtube', Glyph: YoutubeGlyph, placeholderKey: 'phUrl', brand: true },
  { id: 'github', labelKey: 'github', Glyph: GithubGlyph, placeholderKey: 'phHandle', brand: true },
  { id: 'linkedin', labelKey: 'linkedin', Glyph: LinkedinGlyph, placeholderKey: 'phHandle', brand: true },
  { id: 'facebook', labelKey: 'facebook', Glyph: FacebookGlyph, placeholderKey: 'phHandle', brand: true },
  { id: 'whatsapp', labelKey: 'whatsapp', Glyph: WhatsappGlyph, placeholderKey: 'phNumber', brand: true },
  { id: 'threads', labelKey: 'threads', Glyph: ThreadsGlyph, placeholderKey: 'phHandle', brand: true },
  { id: 'discord', labelKey: 'discord', Glyph: DiscordGlyph, placeholderKey: 'phHandle', brand: true },
  { id: 'website', labelKey: 'website', Glyph: GlobeGlyph, placeholderKey: 'phUrl' },
  { id: 'custom', labelKey: 'custom', Glyph: LinkGlyph, placeholderKey: 'phUrl' },
];

const PLATFORM_INDEX: Record<PlatformId, SocialPlatformMeta> = SOCIAL_PLATFORMS.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<PlatformId, SocialPlatformMeta>,
);

export function getPlatform(id: PlatformId): SocialPlatformMeta {
  return PLATFORM_INDEX[id] ?? PLATFORM_INDEX.custom;
}

export type LinkVisibility = 'everyone' | 'contacts' | 'nobody';

export interface SocialLink {
  platform: PlatformId;
  url: string;
  label?: string;
  visibility?: LinkVisibility;
  order?: number;
}

/** Loose URL check shared by the editor and the profile renderer. */
export function isValidHttpUrl(value: string): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
