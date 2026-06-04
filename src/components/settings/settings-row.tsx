'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

/** Shared label + one-line hint stack for settings rows */
export function SettingsFieldText({
  label,
  description,
  destructive,
  className,
}: {
  label: string;
  description?: string;
  destructive?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('min-w-0 flex-1 text-start', className)}>
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
  );
}

/** Section header above a control group (visibility picker, theme, etc.) */
export function SettingsFieldHeader({
  label,
  description,
  icon,
  learnMore,
  className,
}: {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  learnMore?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-3 px-4 py-3', className)}>
      {icon ? (
        <span className="flex size-6 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-5">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <SettingsFieldText label={label} description={description} />
        {learnMore ? <div className="mt-2">{learnMore}</div> : null}
      </div>
    </div>
  );
}

/** Collapsible deeper explanation for complex settings */
export function SettingsLearnMore({
  label,
  children,
  defaultOpen = false,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-primary active:opacity-70"
        aria-expanded={open}
      >
        {label}
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open ? <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{children}</p> : null}
    </div>
  );
}

/** Single selectable option with title + hint */
export function SettingsOptionRow({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-start active:bg-muted/80',
        selected && 'bg-muted/30',
      )}
    >
      <SettingsFieldText
        label={label}
        description={description}
        className={cn(selected && '[&>span:first-child]:font-semibold [&>span:first-child]:text-primary')}
      />
      {selected ? <Check className="size-5 shrink-0 text-primary" strokeWidth={2.5} /> : null}
    </button>
  );
}

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
      <SettingsFieldText label={label} description={description} destructive={destructive} />
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
  icon,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  learnMore,
}: {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  learnMore?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[52px] items-start gap-3 px-4 py-3">
      {icon ? <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center [&_svg]:size-5">{icon}</span> : null}
      <span className="min-w-0 flex-1 text-start">
        <SettingsFieldText label={label} description={description} />
        {learnMore ? <div className="mt-2">{learnMore}</div> : null}
      </span>
      <Switch
        className="mt-1 shrink-0"
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={label}
      />
    </div>
  );
}
