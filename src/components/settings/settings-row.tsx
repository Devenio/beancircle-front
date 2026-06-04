'use client';

import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type SettingsRowProps = {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  value?: string;
  href?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  destructive?: boolean;
  showChevron?: boolean;
  className?: string;
};

export function SettingsRow({
  icon,
  label,
  description,
  value,
  href,
  onClick,
  trailing,
  destructive,
  showChevron = true,
  className,
}: SettingsRowProps) {
  const navigable = Boolean(href || onClick);
  const content = (
    <>
      {icon ? <span className="flex size-6 shrink-0 items-center justify-center [&_svg]:size-5">{icon}</span> : null}
      <span className="min-w-0 flex-1 text-start">
        <span
          className={cn(
            'block text-[15px] leading-snug',
            destructive ? 'font-medium text-destructive' : 'text-foreground',
          )}
        >
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{description}</span>
        ) : null}
      </span>
      {value ? <span className="max-w-[40%] truncate text-sm text-muted-foreground">{value}</span> : null}
      {trailing ??
        (navigable && showChevron ? (
          <ChevronRight className="size-[18px] shrink-0 text-muted-foreground/80 rtl:rotate-180" strokeWidth={2} />
        ) : null)}
    </>
  );

  const rowClass = cn(
    'flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-start transition-colors',
    'active:bg-muted/80',
    navigable && 'cursor-pointer',
    className,
  );

  if (href) {
    const external = href.startsWith('http') || href.startsWith('mailto:');
    if (external) {
      return (
        <a
          href={href}
          className={rowClass}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel="noopener noreferrer"
        >
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

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={rowClass}>
        {content}
      </button>
    );
  }

  return <div className={rowClass}>{content}</div>;
}

export function SettingsSectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn('px-4 pt-5 pb-1.5 text-[13px] font-semibold text-muted-foreground', className)}>
      {children}
    </h2>
  );
}

export function SettingsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('border-y border-border/80 bg-card', className)}>
      <div className="divide-y divide-border/80">{children}</div>
    </div>
  );
}

/** @deprecated Use SettingsList + SettingsSectionLabel for Instagram-style layout */
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
    <section className={className}>
      {title ? <SettingsSectionLabel>{title}</SettingsSectionLabel> : null}
      <SettingsList>{children}</SettingsList>
    </section>
  );
}

export function SettingsToggleRow({
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
    <div className="flex min-h-[52px] items-center gap-3 px-4 py-3">
      <span className="min-w-0 flex-1 text-start">
        <span className="block text-[15px] text-foreground">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        ) : null}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} aria-label={label} />
    </div>
  );
}
