'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Coffee } from 'lucide-react';
import { UserAvatar } from '@/components/chat/user-avatar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { searchMentions, type MentionResult } from '@/lib/api/search';

function getMentionAtCursor(text: string, cursor: number) {
  const before = text.slice(0, cursor);
  const match = before.match(/@([\w.]*)$/);
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
  const ref = useRef<HTMLTextAreaElement>(null);
  const [cursor, setCursor] = useState(0);
  const [results, setResults] = useState<MentionResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const mention = getMentionAtCursor(value, cursor);

  const search = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!q) {
        setResults([]);
        setOpen(false);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        try {
          const data = await searchMentions(q, locale);
          setResults(data.slice(0, 6));
          setOpen(data.length > 0);
          setActiveIdx(0);
        } catch {
          setResults([]);
          setOpen(false);
        }
      }, 200);
    },
    [locale],
  );

  useEffect(() => {
    if (mention) {
      search(mention.query);
    } else {
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mention?.query, !!mention]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
    const pos = e.target.selectionStart ?? 0;
    setCursor(pos);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!open || !results.length) return;
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      selectResult(results[activeIdx]);
    }
  }

  function selectResult(result: MentionResult) {
    if (!mention) return;

    if (result.type === 'cafe') {
      // For cafes: remove the @query text from the composer and pass the cafe up
      const before = value.slice(0, mention.start);
      const after = value.slice(cursor);
      onChange((before + after).replace(/\s+$/, '') + (after.startsWith(' ') ? '' : ''));
      onCafeMention?.({ id: result.id, name: result.name, slug: result.slug, logoUrl: result.logoUrl });
    } else {
      // For users: insert @username into text
      const handle = result.username ?? result.name ?? '';
      const before = value.slice(0, mention.start);
      const after = value.slice(cursor);
      const newValue = `${before}@${handle} ${after}`;
      onChange(newValue);
      setTimeout(() => {
        if (ref.current) {
          const pos = mention.start + handle.length + 2;
          ref.current.focus();
          ref.current.setSelectionRange(pos, pos);
          setCursor(pos);
        }
      }, 0);
    }
    setOpen(false);
    setResults([]);
  }

  return (
    <div className="relative">
      <Textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={(e) => setCursor(e.currentTarget.selectionStart ?? 0)}
        onClick={(e) => setCursor(e.currentTarget.selectionStart ?? 0)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={className}
      />
      {open && results.length > 0 ? (
        <div className="absolute bottom-full left-0 z-50 mb-1 max-h-52 w-full overflow-y-auto rounded-xl border border-border bg-popover shadow-xl">
          {results.map((r, i) => (
            <button
              key={r.id}
              type="button"
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                i === activeIdx ? 'bg-muted' : 'hover:bg-muted/60',
              )}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => selectResult(r)}
            >
              {r.type === 'user' ? (
                <UserAvatar src={r.avatarUrl} name={r.name} size="sm" />
              ) : (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Coffee className="size-3.5 text-amber-600" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {r.type === 'user' ? (r.name ?? r.username) : r.name}
                </p>
                {r.type === 'user' && r.username ? (
                  <p className="text-xs text-muted-foreground">@{r.username}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Café</p>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
