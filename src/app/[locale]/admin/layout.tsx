'use client';

import { useEffect } from 'react';
import {
  BarChart3,
  ClipboardList,
  Coffee,
  FileClock,
  LayoutGrid,
  ScrollText,
  ShieldCheck,
  ToggleRight,
  Users,
} from 'lucide-react';
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
  {
    href: '/admin/feature-flags',
    label: 'Feature Flags',
    icon: ToggleRight,
    superOnly: true,
  },
  { href: '/admin/menus', label: 'Menu Builder', icon: LayoutGrid, superOnly: true },
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

  const visible = NAV.filter((n) => isSuper || !n.superOnly);
  const current = NAV.find((n) =>
    n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href),
  );

  return (
    <div className="fixed inset-0 z-50 flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="flex w-[64px] flex-col border-r border-sidebar-border bg-sidebar lg:w-64">
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-3 lg:px-5">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-4.5" />
          </div>
          <div className="hidden min-w-0 lg:block">
            <div className="truncate text-sm font-semibold leading-tight">
              BeanCircle
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              Super Admin
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2 lg:p-3">
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
                  'group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors lg:px-3',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-2 lg:p-3">
          <Link
            href="/feed"
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground lg:px-3"
          >
            <ScrollText className="size-[18px] shrink-0" />
            <span className="hidden lg:block">Back to app</span>
          </Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-8">
          <h2 className="text-sm font-medium text-muted-foreground">
            {current?.label ?? 'Admin'}
          </h2>
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
