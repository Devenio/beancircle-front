'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  ClipboardList,
  Coffee,
  FileClock,
  LayoutGrid,
  Lightbulb,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Route,
  ScrollText,
  Search,
  ShieldCheck,
  ToggleRight,
  Users,
} from 'lucide-react';
import { CommandPalette } from '@/components/admin/command-palette';
import { Link, useRouter, usePathname } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  superOnly: boolean;
};

const NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: BarChart3, superOnly: true },
  { href: '/admin/users', label: 'Users', icon: Users, superOnly: true },
  { href: '/admin/cafes', label: 'Cafes', icon: Coffee, superOnly: true },
  { href: '/admin/suggestions', label: 'Suggestions', icon: Lightbulb, superOnly: true },
  { href: '/admin/claims', label: 'Ownership Claims', icon: ShieldCheck, superOnly: true },
  {
    href: '/admin/feature-flags',
    label: 'Feature Flags',
    icon: ToggleRight,
    superOnly: true,
  },
  { href: '/admin/menus', label: 'Menu Builder', icon: LayoutGrid, superOnly: true },
  { href: '/admin/designs', label: 'Designs', icon: Palette, superOnly: true },
  {
    href: '/admin/onboarding-flow',
    label: 'User Flow',
    icon: Route,
    superOnly: true,
  },
  {
    href: '/admin/moderation',
    label: 'Moderation',
    icon: ClipboardList,
    superOnly: false,
  },
  { href: '/admin/audit', label: 'Audit Log', icon: FileClock, superOnly: true },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();

  // Sidebar collapse, persisted across visits. The whole admin shell only
  // renders client-side (it returns null until the auth store hydrates), so
  // reading localStorage in the initializer is safe from hydration mismatch.
  const [collapsed, setCollapsed] = useState(
    () =>
      typeof window !== 'undefined' &&
      localStorage.getItem('admin-sidebar-collapsed') === '1',
  );
  const toggleSidebar = () =>
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem('admin-sidebar-collapsed', next ? '1' : '0');
      return next;
    });

  const isSuper = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || isSuper;
  const onModeration = pathname.startsWith('/admin/moderation');

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      router.replace('/feed');
      return;
    }
    if (!isSuper && !onModeration) router.replace('/admin/moderation');
  }, [user, isAdmin, isSuper, onModeration, router]);

  if (!user || !isAdmin) return null;

  // Keyboard shortcuts for quick navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;

      const shortcuts: Record<string, string> = {
        '1': '/admin',
        '2': '/admin/users',
        '3': '/admin/cafes',
        '4': '/admin/suggestions',
        '5': '/admin/claims',
        '6': '/admin/feature-flags',
        '7': '/admin/menus',
        '8': '/admin/designs',
        '9': '/admin/audit',
      };

      if (shortcuts[e.key]) {
        e.preventDefault();
        router.push(shortcuts[e.key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);

  const visible = NAV.filter((n) => isSuper || !n.superOnly);
  const current = NAV.find((n) =>
    n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href),
  );

  return (
    <div className="fixed inset-0 z-50 flex bg-background text-foreground">
      <CommandPalette />
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200',
          collapsed ? 'w-[64px]' : 'w-64',
        )}
      >
        <div
          className={cn(
            'flex h-14 items-center gap-2.5 border-b border-sidebar-border',
            collapsed ? 'px-3' : 'px-5',
          )}
        >
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-4.5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight">
                BeanCircle
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                Super Admin
              </div>
            </div>
          )}
        </div>

        <nav
          className={cn(
            'flex-1 space-y-1 overflow-y-auto',
            collapsed ? 'p-2' : 'p-3',
          )}
        >
          {visible.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  'group flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors',
                  collapsed ? 'px-2.5' : 'px-3',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                {!collapsed && (
                  <span className="flex-1">{item.label}</span>
                )}
                {!collapsed && (
                  <kbd className="hidden rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground/50 group-hover:inline">
                    {NAV.indexOf(item) + 1}
                  </kbd>
                )}
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            'border-t border-sidebar-border',
            collapsed ? 'p-2' : 'p-3',
          )}
        >
          <Link
            href="/feed"
            className={cn(
              'flex items-center gap-3 rounded-lg py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              collapsed ? 'px-2.5' : 'px-3',
            )}
          >
            <ScrollText className="size-[18px] shrink-0" />
            {!collapsed && <span>Back to app</span>}
          </Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-8">
          <button
            type="button"
            onClick={toggleSidebar}
            title={collapsed ? 'Expand menu' : 'Collapse menu'}
            aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
            className="-ml-1 grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-[18px]" />
            ) : (
              <PanelLeftClose className="size-[18px]" />
            )}
          </button>
          <h2 className="text-sm font-medium text-muted-foreground">
            {current?.label ?? 'Admin'}
          </h2>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
            className="ml-4 hidden items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted sm:flex"
          >
            <Search className="size-3.5" />
            <span>Search…</span>
            <kbd className="ml-2 rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden text-muted-foreground sm:block">
              {user.name ?? user.username}
            </span>
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {isSuper ? 'SUPER_ADMIN' : 'ADMIN'}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
