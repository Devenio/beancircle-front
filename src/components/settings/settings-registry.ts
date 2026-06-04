export type SettingsSectionId =
  | 'account'
  | 'privacy'
  | 'notifications'
  | 'appearance'
  | 'chat'
  | 'security'
  | 'storage'
  | 'support'
  | 'about';

export type SettingsHubItem = {
  id: SettingsSectionId;
  href: string;
  labelKey: string;
};

export type SettingsHubGroup = {
  id: string;
  labelKey: string;
  items: SettingsHubItem[];
};

/** Instagram-style hub: grouped rows, one tap per nested screen */
export const SETTINGS_HUB_GROUPS: SettingsHubGroup[] = [
  {
    id: 'account-center',
    labelKey: 'navGroups.accountCenter',
    items: [
      { id: 'account', href: '/settings/account', labelKey: 'sections.account' },
      { id: 'privacy', href: '/settings/privacy', labelKey: 'sections.privacy' },
      { id: 'security', href: '/settings/security', labelKey: 'sections.security' },
    ],
  },
  {
    id: 'preferences',
    labelKey: 'navGroups.preferences',
    items: [
      { id: 'notifications', href: '/settings/notifications', labelKey: 'sections.notifications' },
      { id: 'appearance', href: '/settings/appearance', labelKey: 'sections.appearance' },
      { id: 'chat', href: '/settings/chat', labelKey: 'sections.chat' },
    ],
  },
  {
    id: 'data',
    labelKey: 'navGroups.data',
    items: [{ id: 'storage', href: '/settings/storage', labelKey: 'sections.storage' }],
  },
  {
    id: 'support',
    labelKey: 'navGroups.support',
    items: [
      { id: 'support', href: '/settings/support', labelKey: 'sections.help' },
      { id: 'about', href: '/settings/about', labelKey: 'sections.about' },
    ],
  },
];

export const SETTINGS_SECTIONS = SETTINGS_HUB_GROUPS.flatMap((g) =>
  g.items.map((item) => ({
    id: item.id,
    href: item.href,
    labelKey: item.labelKey,
    descriptionKey: `${item.labelKey}Desc`,
    icon: 'info',
  })),
);

export type SettingsSearchItem = {
  id: string;
  section: SettingsSectionId;
  href: string;
  labelKey: string;
  descriptionKey: string;
  keywords: string[];
};

export const SETTINGS_SEARCH_INDEX: SettingsSearchItem[] = [
  { id: 'profile', section: 'account', href: '/settings/account', labelKey: 'items.profile', descriptionKey: 'items.profileDesc', keywords: ['profile', 'name', 'bio', 'avatar', 'پروفایل'] },
  { id: 'username', section: 'account', href: '/settings/account', labelKey: 'items.username', descriptionKey: 'items.usernameDesc', keywords: ['username', 'handle', 'نام کاربری'] },
  { id: 'email', section: 'account', href: '/settings/account', labelKey: 'items.email', descriptionKey: 'items.emailDesc', keywords: ['email', 'mail', 'ایمیل'] },
  { id: 'phone', section: 'account', href: '/settings/account', labelKey: 'items.phone', descriptionKey: 'items.phoneDesc', keywords: ['phone', 'mobile', 'تلفن'] },
  { id: 'lastSeen', section: 'privacy', href: '/settings/privacy', labelKey: 'items.lastSeen', descriptionKey: 'items.lastSeenDesc', keywords: ['last seen', 'visibility', 'privacy', 'آخرین بازدید'] },
  { id: 'online', section: 'privacy', href: '/settings/privacy', labelKey: 'items.onlineStatus', descriptionKey: 'items.onlineStatusDesc', keywords: ['online', 'status', 'آنلاین'] },
  { id: 'readReceipts', section: 'privacy', href: '/settings/privacy', labelKey: 'items.readReceipts', descriptionKey: 'items.readReceiptsDesc', keywords: ['read', 'receipts', 'seen', 'خوانده'] },
  { id: 'blocked', section: 'privacy', href: '/settings/privacy', labelKey: 'items.blocked', descriptionKey: 'items.blockedDesc', keywords: ['block', 'blocked', 'مسدود'] },
  { id: 'push', section: 'notifications', href: '/settings/notifications', labelKey: 'items.push', descriptionKey: 'items.pushDesc', keywords: ['push', 'notification', 'اعلان'] },
  { id: 'sound', section: 'notifications', href: '/settings/notifications', labelKey: 'items.sound', descriptionKey: 'items.soundDesc', keywords: ['sound', 'volume', 'صدا'] },
  { id: 'vibration', section: 'notifications', href: '/settings/notifications', labelKey: 'items.vibration', descriptionKey: 'items.vibrationDesc', keywords: ['vibration', 'haptic', 'لرزش'] },
  { id: 'theme', section: 'appearance', href: '/settings/appearance', labelKey: 'theme', descriptionKey: 'sections.appearanceDesc', keywords: ['theme', 'dark', 'light', 'ظاهر', 'تم'] },
  { id: 'accent', section: 'appearance', href: '/settings/appearance', labelKey: 'items.accent', descriptionKey: 'items.accentDesc', keywords: ['accent', 'color', 'رنگ'] },
  { id: 'font', section: 'appearance', href: '/settings/appearance', labelKey: 'items.fontSize', descriptionKey: 'items.fontSizeDesc', keywords: ['font', 'text size', 'فونت'] },
  { id: 'wallpaper', section: 'appearance', href: '/settings/appearance', labelKey: 'items.wallpaper', descriptionKey: 'items.wallpaperDesc', keywords: ['wallpaper', 'background', 'chat', 'پس‌زمینه'] },
  { id: 'password', section: 'security', href: '/settings/security', labelKey: 'items.password', descriptionKey: 'items.passwordDesc', keywords: ['password', 'رمز'] },
  { id: '2fa', section: 'security', href: '/settings/security', labelKey: 'items.twoFactor', descriptionKey: 'items.twoFactorDesc', keywords: ['2fa', 'two factor', 'authentication', 'احراز'] },
  { id: 'sessions', section: 'security', href: '/settings/security', labelKey: 'items.sessions', descriptionKey: 'items.sessionsDesc', keywords: ['session', 'device', 'logout', 'دستگاه'] },
  { id: 'cache', section: 'storage', href: '/settings/storage', labelKey: 'items.cache', descriptionKey: 'items.cacheDesc', keywords: ['cache', 'clear', 'storage', 'کش'] },
  { id: 'language', section: 'account', href: '/settings/account', labelKey: 'language', descriptionKey: 'items.languageDesc', keywords: ['language', 'locale', 'زبان'] },
];

export function filterSettingsSearch(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SETTINGS_SEARCH_INDEX.filter(
    (item) =>
      item.keywords.some((k) => k.toLowerCase().includes(q)) ||
      item.id.includes(q) ||
      item.section.includes(q),
  ).slice(0, 12);
}

export function isSettingsHubPath(pathname: string) {
  const normalized = pathname.replace(/^\/(fa|en)/, '') || pathname;
  return normalized === '/settings' || normalized.endsWith('/settings');
}

export function settingsPathDepth(pathname: string) {
  const normalized = pathname.replace(/^\/(fa|en)/, '') || pathname;
  if (isSettingsHubPath(pathname)) return 0;
  if (normalized.startsWith('/settings/')) return 1;
  return 0;
}
