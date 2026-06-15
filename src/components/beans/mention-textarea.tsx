'use client';

import { useEffect, useRef, useState } from 'react';
import { Coffee, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UserAvatar } from '@/components/chat/user-avatar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { searchMentions, type MentionResult } from '@/lib/api/search';

// Unicode-aware so Persian café names can be searched after `@` too.
const MENTION_AT_CURSOR = /@([\p{L}\p{N}_.]*)$/u;

function getMentionAtCursor(text: string, cursor: number) {
  const before = text.slice(0, cursor);
  const match = before.match(MENTION_AT_CURSOR);
  if (!match) return null;
  return { query: match[1], start: cursor - match[0].length };
}

export type CafeMention = { id: string; name: string; slug: string | null; logoUrl: string | null };

type Props = {
  value: string;
  onChange: (v: string) => void;
  onCafeMention?: (cafe: CafeMention) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  locale: string;
};

export function MentionTextarea({ value, onChange, onCafeMention, placeholder, maxLength, className, locale }: Props) {
  const t = useTranslations('beans');
  const ref = useRef<HTMLTextAreaElement>(null);
  const [cursor, setCursor] = useState(0);
  const [results, setResults] = useState<MentionResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const blurRef = useRef<ReturnType<typeof setTimeout>>(null);
  const reqId = useRef(0);

  const mention = getMentionAtCursor(value, cursor);
  const query = mention?.query;

  // All state changes run inside the timeout callback (async) so we never
  // setState synchronously during the effect body.
  useEffect(() => {
    const id = ++reqId.current;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      async () => {
        if (id !== reqId.current) return;
        if (!query) {
          setOpen(false);
          setResults([]);
          setLoading(false);
          return;
        }
        setLoading(true);
        setOpen(true);
        try {
          const data = await searchMentions(query, locale);
          if (id !== reqId.current) return; // drop stale responses
          setResults(data.slice(0, 6));
          setActiveIdx(0);
        } catch {
          if (id === reqId.current) setResults([]);
        } finally {
          if (id === reqId.current) setLoading(false);
        }
      },
      query ? 200 : 0,
    );
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, locale]);

  useEffect(() => {
    return () => {
      if (blurRef.current) clearTimeout(blurRef.current);
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
    setCursor(e.target.selectionStart ?? 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!open || !results.length) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + results.length) % results.length);
      return;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      selectResult(results[activeIdx]);
    }
  }

  function selectResult(result: MentionResult) {
    if (!mention) return;
    const before = value.slice(0, mention.start);
    const after = value.slice(cursor);

    if (result.type === 'cafe') {
      // Café tags live as a chip on the composer, not inline text — drop the typed token.
      const next = `${before}${after}`;
      onChange(next);
      onCafeMention?.({ id: result.id, name: result.name, slug: result.slug, logoUrl: result.logoUrl });
      requestAnimationFrame(() => {
        const pos = before.length;
        ref.current?.focus();
        ref.current?.setSelectionRange(pos, pos);
        setCursor(pos);
      });
    } else {
      const handle = result.username ?? result.name ?? '';
      const spacer = after.startsWith(' ') ? '' : ' ';
      const next = `${before}@${handle}${spacer}${after}`;
      onChange(next);
      requestAnimationFrame(() => {
        const pos = before.length + handle.length + 1 + spacer.length;
        ref.current?.focus();
        ref.current?.setSelectionRange(pos, pos);
        setCursor(pos);
      });
    }
    setOpen(false);
    setResults([]);
  }

  const showPanel = open && (loading || results.length > 0);

  return (
    <div className="relative">
      <Textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={(e) => setCursor(e.currentTarget.selectionStart ?? 0)}
        onClick={(e) => setCursor(e.currentTarget.selectionStart ?? 0)}
        onBlur={() => {
          // Delay so a click on a result registers before the panel unmounts.
          blurRef.current = setTimeout(() => setOpen(false), 120);
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        className={className}
      />
      {showPanel ? (
        <div className="absolute bottom-full inset-x-0 z-50 mb-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-popover shadow-xl">
          {loading && results.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t('composer.searching')}
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.type}-${r.id}`}
                type="button"
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-start text-sm transition-colors',
                  i === activeIdx ? 'bg-muted' : 'hover:bg-muted/60',
                )}
                onMouseEnter={() => setActiveIdx(i)}
                // onMouseDown (not onClick) fires before the textarea blur closes the panel.
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectResult(r);
                }}
              >
                {r.type === 'user' ? (
                  <UserAvatar src={r.avatarUrl} name={r.name} size="sm" />
                ) : (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <Coffee className="size-4 text-amber-600" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {r.type === 'user' ? (r.name ?? r.username) : r.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.type === 'user'
                      ? r.username
                        ? `@${r.username}`
                        : t('composer.mentionUser')
                      : t('composer.mentionCafe')}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
