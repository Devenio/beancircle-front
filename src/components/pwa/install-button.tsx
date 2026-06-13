'use client';

import { useTranslations } from 'next-intl';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { useInstallState } from '@/hooks/use-pwa';
import { trackPwaEvent } from '@/lib/pwa/analytics';
import { haptic } from '@/lib/mobile/haptics';
import { cn } from '@/lib/utils';

type ButtonProps = React.ComponentProps<typeof Button>;

interface InstallButtonProps {
  /** Where this CTA lives — recorded in analytics. */
  source: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
  label?: string;
  withIcon?: boolean;
  /** Render even when the app is already installed (default hides it). */
  showWhenInstalled?: boolean;
}

/**
 * One-click install affordance. On Chromium it triggers the native prompt; on
 * iOS / unsupported browsers it routes to the /install page with platform
 * instructions. Hides itself once the app is installed.
 */
export function InstallButton({
  source,
  variant = 'default',
  size = 'lg',
  className,
  label,
  withIcon = true,
  showWhenInstalled = false,
}: InstallButtonProps) {
  const t = useTranslations('pwa');
  const router = useRouter();
  const { canPrompt, isInstalled, mounted, promptInstall } = useInstallState();

  if (!mounted) return null;
  if (isInstalled && !showWhenInstalled) return null;

  async function handleClick() {
    haptic('light');
    trackPwaEvent('install_button_click', { source });
    if (canPrompt) {
      const outcome = await promptInstall();
      if (outcome !== 'unavailable') return;
    }
    // No native prompt (iOS / desktop menu / unsupported) → show instructions.
    router.push('/install');
  }

  return (
    <Button variant={variant} size={size} className={cn(className)} onClick={handleClick}>
      {withIcon ? <Download /> : null}
      {label ?? t('install')}
    </Button>
  );
}
