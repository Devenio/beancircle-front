'use client';

import { MessagesHub } from '@/components/chat/messages-hub';

/** Standalone archive route — same hub, archived list view. */
export function ArchivedChatScreen({ locale }: { locale: string }) {
  return <MessagesHub locale={locale} />;
}
