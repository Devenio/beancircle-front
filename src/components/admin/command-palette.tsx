'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Coffee,
  FileClock,
  LayoutGrid,
  Lightbulb,
  Palette,
  Route,
  Search,
  ShieldCheck,
  ToggleRight,
  Users,
  ClipboardList,
} from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type CommandItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  keywords: string[];
  shortcut?: string;
};

const COMMANDS: CommandItem[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3, href: '/admin', keywords: ['dashboard', 'stats', 'analytics'] },
  { id: 'users', label: 'Users', icon: Users, href: '/admin/users', keywords: ['people', 'accounts', 'roles'] },
  { id: 'cafes', label: 'Cafes', icon: Coffee, href: '/admin/cafes', keywords: ['shops', 'stores', 'partners'] },
  { id: 'suggestions', label: 'Suggestions', icon: Lightbulb, href: '/admin/suggestions', keywords: ['ideas', 'submissions'] },
  { id: 'claims', label: 'Ownership Claims', icon: ShieldCheck, href: '/admin/claims', keywords: ['verify', 'ownership'] },
  { id: 'flags', label: 'Feature Flags', icon: ToggleRight, href: '/admin/feature-flags', keywords: ['toggles', 'features', 'switches'] },
  { id: 'menus', label: 'Menu Builder', icon: LayoutGrid, href: '/admin/menus', keywords: ['templates', 'design'] },
  { id: 'designs', label: 'Designs', icon: Palette, href: '/admin/designs', keywords: ['themes', 'whitelist'] },
  { id: 'flow', label: 'User Flow', icon: Route, href: '/admin/onboarding-flow', keywords: ['onboarding', 'steps'] },
  { id: 'moderation', label: 'Moderation', icon: ClipboardList, href: '/admin/moderation', keywords: ['reports', 'content'] },
  { id: 'audit', label: 'Audit Log', icon: FileClock, href: '/admin/audit', keywords: ['history', 'logs', 'actions'] },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const filtered = useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const term = query.toLowerCase();
    return COMMANDS.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(term) ||
        cmd.keywords.some((k) => k.includes(term)),
    );
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        router.push(filtered[selectedIndex].href);
        setOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, selectedIndex, router]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={() => {
          setOpen(false);
          setQuery('');
        }}
      />

      {/* Palette */}
      <div className="fixed inset-x-0 top-[15vh] z-[61] mx-auto w-full max-w-lg px-4">
        <div className="overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[300px] overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No commands found.
              </p>
            ) : (
              filtered.map((cmd, i) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      router.push(cmd.href);
                      setOpen(false);
                      setQuery('');
                    }}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                      i === selectedIndex
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 font-medium">{cmd.label}</span>
                    <span className="text-xs text-muted-foreground/60">
                      {cmd.keywords[0]}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
            <span>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">↑↓</kbd>{' '}
              navigate
            </span>
            <span>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">↵</kbd>{' '}
              select
            </span>
            <span>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">esc</kbd>{' '}
              close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/** Hook that triggers the command palette open from parent */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return open;
}
