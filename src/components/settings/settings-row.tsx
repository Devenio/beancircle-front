'use client';

import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type SettingsRowProps = {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  destructive?: boolean;
  className?: string;
};

export function SettingsRow({
  icon,
  label,
  description,
  href,
  onClick,
  trailing,
  destructive,
  className,
}: SettingsRowProps) {
  const content = (
    <>
      {icon ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground [&_svg]:size-5">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 text-start">
        <span
          className={cn(
            'block text-sm font-medium leading-snug',
            destructive && 'text-destructive',
          )}
        >
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      {trailing ?? (href || onClick ? <ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" /> : null)}
    </>
  );

  const rowClass = cn(
    'flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 transition-colors',
    'hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    className,
  );

  if (href) {
    const external = href.startsWith('http') || href.startsWith('mailto:');
    if (external) {
      return (
        <a href={href} className={rowClass} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={rowClass}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(rowClass, 'text-start')}>
      {content}
    </button>
  );
}

export function SettingsGroup({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-1', className)}>
      {title ? (
        <h2 className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </h2>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/50 divide-y divide-border/50">
        {children}
      </div>
    </section>
  );
}

export function SettingsToggleRow({
  icon,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-h-12 items-center gap-3 px-3 py-3">
      {icon ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted [&_svg]:size-5">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 text-start">
        <span className="block text-sm font-medium">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        ) : null}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} aria-label={label} />
    </div>
  );
}
