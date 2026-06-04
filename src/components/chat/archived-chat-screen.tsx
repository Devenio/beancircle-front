'use client';

import { MessagesHub } from '@/components/chat/messages-hub';

/** Standalone archive route — same hub, Archived tab selected. */
export function ArchivedChatScreen({ locale }: { locale: string }) {
  return <MessagesHub locale={locale} initialTab="archived" />;
}
