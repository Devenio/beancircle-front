import type { useTranslations } from 'next-intl';
import type { VisibilityOption } from '@/stores/settings-store';

type T = ReturnType<typeof useTranslations<'settings'>>;

export function visibilityActiveHint(
  t: T,
  field: 'lastSeen' | 'onlineStatus' | 'profileVisibility',
  value: VisibilityOption,
) {
  return t(`visibilityEffects.${field}.${value}`);
}

export function readReceiptsHint(t: T, enabled: boolean) {
  return enabled ? t('items.readReceiptsDesc') : t('hints.readReceiptsOff');
}

export function typingIndicatorsHint(t: T, enabled: boolean) {
  return enabled ? t('items.typingIndicatorsDesc') : t('hints.typingIndicatorsOff');
}

export function pushNotificationsHint(t: T, enabled: boolean) {
  return enabled ? t('items.pushDesc') : t('hints.pushOff');
}

export function marketingHint(t: T, enabled: boolean) {
  return enabled ? t('items.marketingDesc') : t('hints.marketingOff');
}
